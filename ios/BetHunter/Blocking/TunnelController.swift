import Foundation
import NetworkExtension
import os

/// Gerencia a configuração e o ciclo de vida do `NEPacketTunnelProvider`.
///
/// Substitui o `enableDNSProxy()` anterior, que era fire-and-forget: o erro do
/// `saveToPreferences` só ia para um `print`, e `applyBlocking` já tinha
/// reportado sucesso. Como `dns-proxy` sempre falha em aparelho de consumidor, a
/// UI mostrava "Proteção ativa" com proteção zero.
@available(iOS 16.0, *)
final class TunnelController {

  static let shared = TunnelController()

  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: SharedConstants.logCategoryTunnel
  )

  private init() {}

  enum TunnelError: Error, LocalizedError {
    /// O usuário recusou o alerta "BetHunter Would Like to Add VPN Configurations".
    case permissionDenied
    case configurationInvalid(Error)
    case activationTimeout
    case unavailable(Error)

    var errorDescription: String? {
      switch self {
      case .permissionDenied:
        return "Você precisa permitir a configuração de VPN para o bloqueio de sites funcionar. "
          + "Toque em \"Permitir\" quando o iOS perguntar."
      case .configurationInvalid(let error):
        return "Configuração de VPN inválida: \(error.localizedDescription)"
      case .activationTimeout:
        return "O bloqueio não ficou ativo a tempo. Verifique sua conexão e tente de novo."
      case .unavailable(let error):
        return "Não foi possível configurar o bloqueio: \(error.localizedDescription)"
      }
    }
  }

  private static let activationTimeout: TimeInterval = 15

  // MARK: - Ativação

  /// Configura, salva e inicia o túnel, aguardando o estado `.connected`.
  ///
  /// Só chama `completion(.success)` quando o túnel está realmente conectado —
  /// nunca antes, e nunca com base apenas no sucesso do save.
  func enable(completion: @escaping (Result<Void, TunnelError>) -> Void) {
    loadManager { [weak self] result in
      guard let self else { return }
      switch result {
      case .failure(let error):
        completion(.failure(error))

      case .success(let manager):
        self.configure(manager)
        manager.saveToPreferences { error in
          if let error {
            completion(.failure(self.classify(error)))
            return
          }
          // Re-leitura obrigatória. Depois de um save a NE devolve um manager
          // stale em memória, e startVPNTunnel() lança configurationInvalid.
          manager.loadFromPreferences { error in
            if let error {
              completion(.failure(self.classify(error)))
              return
            }
            self.start(manager, completion: completion)
          }
        }
      }
    }
  }

  private func start(
    _ manager: NETunnelProviderManager,
    completion: @escaping (Result<Void, TunnelError>) -> Void
  ) {
    do {
      try manager.connection.startVPNTunnel()
    } catch {
      completion(.failure(classify(error)))
      return
    }
    waitForConnected(manager.connection, completion: completion)
  }

  /// Observa `NEVPNStatusDidChange` até `.connected` ou timeout.
  private func waitForConnected(
    _ connection: NEVPNConnection,
    completion: @escaping (Result<Void, TunnelError>) -> Void
  ) {
    if connection.status == .connected {
      completion(.success(()))
      return
    }

    var observer: NSObjectProtocol?
    var finished = false

    let finish: (Result<Void, TunnelError>) -> Void = { result in
      guard !finished else { return }
      finished = true
      if let observer { NotificationCenter.default.removeObserver(observer) }
      DispatchQueue.main.async { completion(result) }
    }

    observer = NotificationCenter.default.addObserver(
      forName: .NEVPNStatusDidChange,
      object: connection,
      queue: .main
    ) { [weak self] _ in
      switch connection.status {
      case .connected:
        finish(.success(()))
      case .disconnected, .invalid:
        // Voltar para disconnected logo após um start costuma significar que o
        // usuário recusou a permissão ou que o provider crashou no startup.
        self?.log.error("Túnel voltou para \(String(describing: connection.status), privacy: .public)")
        finish(.failure(.activationTimeout))
      default:
        break
      }
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + Self.activationTimeout) {
      finish(.failure(.activationTimeout))
    }
  }

  // MARK: - Pausa e desativação

  /// Pausa por assinatura expirada, preservando a intenção do usuário.
  ///
  /// A ORDEM importa: `isOnDemandEnabled = false` tem de ser salvo **antes** do
  /// `stopVPNTunnel()`. Com on-demand ligado, o iOS religa o túnel no instante
  /// seguinte e a pausa vira no-op.
  func pause(completion: (() -> Void)? = nil) {
    loadManager { [weak self] result in
      guard let self, case .success(let manager) = result else {
        completion?()
        return
      }
      manager.isOnDemandEnabled = false
      manager.saveToPreferences { _ in
        manager.connection.stopVPNTunnel()
        self.log.notice("Túnel pausado (on-demand desligado antes do stop)")
        completion?()
      }
    }
  }

  func resume(completion: @escaping (Result<Void, TunnelError>) -> Void) {
    enable(completion: completion)
  }

  /// Desativação definitiva.
  ///
  /// Tem de funcionar **sempre**, inclusive com o túnel em estado ruim — nunca
  /// deixar o usuário preso. Se nem o remove funcionar, o chamador leva o usuário
  /// para Ajustes › VPN.
  func disable(completion: (() -> Void)? = nil) {
    loadManager { [weak self] result in
      guard let self, case .success(let manager) = result else {
        completion?()
        return
      }
      manager.isOnDemandEnabled = false
      manager.isEnabled = false
      manager.saveToPreferences { _ in
        manager.connection.stopVPNTunnel()
        manager.removeFromPreferences { error in
          if let error {
            self.log.error("removeFromPreferences falhou: \(error.localizedDescription, privacy: .public)")
          }
          completion?()
        }
      }
    }
  }

  // MARK: - Estado

  func currentStatus(completion: @escaping (NEVPNStatus) -> Void) {
    NETunnelProviderManager.loadAllFromPreferences { managers, _ in
      let manager = managers?.first { Self.isOurs($0) }
      completion(manager?.connection.status ?? .invalid)
    }
  }

  /// `true` se a configuração ainda existe. `false` significa que o usuário
  /// apagou o perfil em Ajustes › VPN.
  func configurationExists(completion: @escaping (Bool) -> Void) {
    NETunnelProviderManager.loadAllFromPreferences { managers, _ in
      completion(managers?.contains { Self.isOurs($0) } ?? false)
    }
  }

  /// Envia um comando ao provider em execução (kill switch, reload de índice).
  func sendMessage(_ command: String, completion: ((String?) -> Void)? = nil) {
    NETunnelProviderManager.loadAllFromPreferences { managers, _ in
      guard let manager = managers?.first(where: { Self.isOurs($0) }),
            let session = manager.connection as? NETunnelProviderSession,
            manager.connection.status == .connected,
            let data = command.data(using: .utf8)
      else {
        completion?(nil)
        return
      }
      try? session.sendProviderMessage(data) { response in
        completion?(response.flatMap { String(data: $0, encoding: .utf8) })
      }
    }
  }

  // MARK: - Configuração

  private func configure(_ manager: NETunnelProviderManager) {
    let proto = NETunnelProviderProtocol()
    proto.providerBundleIdentifier = SharedConstants.tunnelBundleID
    // Exibido em Ajustes › VPN. Não é decorativo: um manager salvo sem
    // localizedDescription/serverAddress produz uma linha em branco em Ajustes e
    // é uma fonte conhecida de falha no save.
    proto.serverAddress = "BetHunter"
    proto.disconnectOnSleep = false
    proto.providerConfiguration = [:]

    manager.protocolConfiguration = proto
    manager.localizedDescription = "BetHunter — Proteção contra apostas"
    manager.isEnabled = true

    // On-demand é o equivalente iOS dos health workers do Android, e é melhor:
    // o próprio sistema levanta o túnel a qualquer atividade de rede — depois de
    // reboot, depois de um crash do provider, e mesmo depois de o usuário tocar
    // em "Desconectar" em Ajustes. Não precisa de BGProcessingTask de polling.
    manager.isOnDemandEnabled = true
    let rule = NEOnDemandRuleConnect()
    rule.interfaceTypeMatch = .any
    manager.onDemandRules = [rule]
  }

  private func loadManager(completion: @escaping (Result<NETunnelProviderManager, TunnelError>) -> Void) {
    NETunnelProviderManager.loadAllFromPreferences { [weak self] managers, error in
      guard let self else { return }
      if let error {
        completion(.failure(self.classify(error)))
        return
      }
      let manager = managers?.first { Self.isOurs($0) } ?? NETunnelProviderManager()
      completion(.success(manager))
    }
  }

  private static func isOurs(_ manager: NETunnelProviderManager) -> Bool {
    (manager.protocolConfiguration as? NETunnelProviderProtocol)?
      .providerBundleIdentifier == SharedConstants.tunnelBundleID
  }

  private func classify(_ error: Error) -> TunnelError {
    let nsError = error as NSError
    guard nsError.domain == NEVPNErrorDomain,
          let code = NEVPNError.Code(rawValue: nsError.code)
    else { return .unavailable(error) }

    switch code {
    case .configurationReadWriteFailed:
      // É o código que a NE devolve quando o usuário recusa o alerta de
      // permissão de VPN — o caso mais comum, e que merece mensagem própria.
      return .permissionDenied
    case .configurationInvalid, .configurationStale:
      return .configurationInvalid(error)
    default:
      return .unavailable(error)
    }
  }
}
