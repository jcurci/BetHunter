import Foundation
import ManagedSettings
import FamilyControls
import NetworkExtension
import UserNotifications
import os

/// Orquestra as duas camadas de bloqueio: o shield de apps (ManagedSettings) e o
/// túnel de DNS (NEPacketTunnelProvider).
///
/// A versão anterior chamava `completion?(true)` assim que a blocklist baixava,
/// **antes** de o `enableDNSProxy()` sequer tentar salvar, e o erro do save só ia
/// para um `print`. Como `dns-proxy` sempre falha em aparelho de consumidor, toda
/// ativação reportava sucesso com proteção zero. Aqui o resultado é um
/// `Result` que só vira `.success` depois de o túnel estar de fato conectado.
@available(iOS 16.0, *)
class BlockingManager {
  static let shared = BlockingManager()

  private let store = ManagedSettingsStore()
  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: "BlockingManager"
  )

  private init() {}

  enum BlockingError: Error, LocalizedError {
    case noBlocklist
    case indexWriteFailed(BlocklistStore.StoreError)
    case tunnel(TunnelController.TunnelError)

    var errorDescription: String? {
      switch self {
      case .noBlocklist:
        return "Não foi possível obter a lista de sites de apostas. "
          + "Verifique sua conexão e tente novamente."
      case .indexWriteFailed(let error):
        return error.errorDescription
      case .tunnel(let error):
        return error.errorDescription
      }
    }
  }

  // MARK: - Ativação

  /// Ativa a proteção completa.
  ///
  /// Ordem, e o porquê dela:
  ///   1. blocklist    — sem lista não há o que bloquear
  ///   2. índice       — a extensão precisa dele em disco antes de subir
  ///   3. shields      — barato e reversível
  ///   4. túnel        — o passo que pode falhar por permissão do usuário
  ///   5. confirmação  — só aqui a proteção é dada como ativa
  func applyBlocking(
    with selection: FamilyActivitySelection,
    completion: @escaping (Result<Void, BlockingError>) -> Void
  ) {
    BlocklistSyncService.shared.refreshIfNeeded { [weak self] syncResult in
      guard let self else { return }

      switch syncResult {
      case .failure(let error):
        self.log.error("Sincronização da blocklist falhou: \(error.localizedDescription, privacy: .public)")
        DispatchQueue.main.async { completion(.failure(self.mapSyncError(error))) }

      case .success:
        DispatchQueue.main.async {
          self.installShields(selection)

          TunnelController.shared.enable { result in
            switch result {
            case .failure(let error):
              // Reverte os shields: proteção parcial com a UI dizendo "ativo"
              // é pior que falha explícita.
              self.clearShields()
              self.log.error("Ativação do túnel falhou: \(error.localizedDescription, privacy: .public)")
              completion(.failure(.tunnel(error)))

            case .success:
              // ÚNICO lugar do código que marca a proteção como ativa. Antes
              // isso era escrito em três lugares diferentes, um deles antes de
              // saber se tinha funcionado.
              SharedConstants.defaults?.set(true, forKey: SharedConstants.Keys.protectionEnabled)
              SharedConstants.defaults?.set(false, forKey: SharedConstants.Keys.premiumPaused)
              if AppGroupHelper.apiBaseUrl != nil {
                SubscriptionEnforcementTask.scheduleNext()
              }
              BlocklistRefreshTask.scheduleNext()
              self.log.notice("Proteção ativada")
              completion(.success(()))
            }
          }
        }
      }
    }
  }

  // MARK: - Pausa por assinatura

  /// Pausa temporária: derruba o túnel e os shields, mas **preserva**
  /// `protectionEnabled` (a intenção do usuário), para poder religar sozinho
  /// quando a assinatura voltar.
  ///
  /// Paridade com os commits 99f718b2 / 2f7ac372 do Android.
  func pauseForExpiredSubscription() {
    guard !isPremiumPaused else { return }
    SharedConstants.defaults?.set(true, forKey: SharedConstants.Keys.premiumPaused)
    clearShields()
    TunnelController.shared.pause()
    log.notice("Proteção pausada por assinatura expirada")
    notifyPaused()
  }

  /// Retoma após a assinatura voltar a ficar ativa.
  func resumeAfterSubscriptionRenewed(completion: ((Bool) -> Void)? = nil) {
    guard isPremiumPaused else {
      completion?(true)
      return
    }
    let selection = AppGroupHelper.loadFamilyActivitySelection() ?? FamilyActivitySelection()

    TunnelController.shared.resume { [weak self] result in
      guard let self else { return }
      switch result {
      case .success:
        SharedConstants.defaults?.set(false, forKey: SharedConstants.Keys.premiumPaused)
        self.installShields(selection)
        self.clearPausedNotification()
        self.log.notice("Proteção retomada")
        completion?(true)
      case .failure(let error):
        self.log.error("Falha ao retomar: \(error.localizedDescription, privacy: .public)")
        completion?(false)
      }
    }
  }

  var isPremiumPaused: Bool {
    SharedConstants.defaults?.bool(forKey: SharedConstants.Keys.premiumPaused) ?? false
  }

  // MARK: - Desativação

  /// Autoexclusão: desativação explícita pelo usuário não é permitida.
  /// Assinatura expirada usa `pauseForExpiredSubscription` (preserva a intenção).
  func removeBlocking(completion: (() -> Void)? = nil) {
    log.notice("removeBlocking ignorado — desativação pelo usuário não é permitida")
    completion?()
  }

  // MARK: - Shields

  private func installShields(_ selection: FamilyActivitySelection) {
    let appTokens = selection.applicationTokens
    let categoryTokens = selection.categoryTokens
    let webTokens = selection.webDomainTokens

    store.shield.applications = appTokens.isEmpty ? nil : appTokens
    store.shield.applicationCategories = categoryTokens.isEmpty
      ? nil
      : ShieldSettings.ActivityCategoryPolicy.specific(categoryTokens)
    // Camada extra só de Safari/WKWebView. Não substitui o túnel: WebDomainToken
    // só pode vir do picker (não há API para construir um a partir de string),
    // então isto cobre os poucos sites que o usuário escolheu a dedo, não os
    // 300 mil da lista. O valor é sobreviver ao túnel desligado e ficar atrás do
    // passcode do Tempo de Uso.
    store.shield.webDomains = webTokens.isEmpty ? nil : webTokens
  }

  private func clearShields() {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
    store.application.denyAppRemoval = nil
  }

  /// "Modo Rígido": impede desinstalar apps — inclusive o BetHunter, o que torna
  /// o compromisso real. É uma configuração **global** (nenhum app pode ser
  /// removido enquanto ligada), então só entra com confirmação explícita.
  func setStrictMode(_ enabled: Bool) {
    store.application.denyAppRemoval = enabled ? true : nil
    log.notice("Modo rígido: \(enabled)")
  }

  var isStrictModeEnabled: Bool {
    store.application.denyAppRemoval == true
  }

  // MARK: - Notificações

  private func notifyPaused() {
    let content = UNMutableNotificationContent()
    content.title = "Bloqueio pausado"
    content.body = "Sua assinatura não está ativa. Renove para voltar a bloquear as apostas."
    content.sound = .default

    let request = UNNotificationRequest(
      identifier: "bethunter.protection.paused",
      content: content,
      trigger: nil
    )
    UNUserNotificationCenter.current().add(request)
  }

  private func clearPausedNotification() {
    UNUserNotificationCenter.current()
      .removeDeliveredNotifications(withIdentifiers: ["bethunter.protection.paused"])
  }

  private func mapSyncError(_ error: BlocklistSyncService.SyncError) -> BlockingError {
    switch error {
    case .store(let storeError): return .indexWriteFailed(storeError)
    case .download, .noCache: return .noBlocklist
    }
  }
}
