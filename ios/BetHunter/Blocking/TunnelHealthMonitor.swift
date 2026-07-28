import Foundation
import NetworkExtension
import UserNotifications
import os

/// Reconcilia o estado real do túnel com a intenção do usuário.
///
/// Análogo dos health workers do Android, mas com muito menos trabalho a fazer:
/// o `isOnDemandEnabled` já faz o iOS religar o túnel sozinho depois de reboot,
/// crash do provider e até de o usuário tocar em "Desconectar" em Ajustes. O que
/// sobra para o monitor é o que o on-demand não cobre: a configuração ter sido
/// **apagada** de Ajustes › VPN, e o disjuntor ter entrado em passthrough.
@available(iOS 16.0, *)
final class TunnelHealthMonitor {

  static let shared = TunnelHealthMonitor()

  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: "TunnelHealth"
  )

  private init() {}

  private var isProtectionIntended: Bool {
    SharedConstants.defaults?.bool(forKey: SharedConstants.Keys.protectionEnabled) ?? false
  }

  /// Chamar em `applicationDidBecomeActive` e via `checkAndSyncBlockingStatus`.
  ///
  /// `completion(true)` significa "a proteção está de pé"; `false` significa que
  /// alguma coisa precisa da atenção do usuário.
  func reconcile(completion: @escaping (Bool) -> Void) {
    guard isProtectionIntended else {
      completion(false)
      return
    }

    // Pausado por assinatura não é defeito — é estado esperado, e quem religa é
    // o SubscriptionEnforcementTask.
    if BlockingManager.shared.isPremiumPaused {
      completion(false)
      return
    }

    TunnelController.shared.configurationExists { [weak self] exists in
      guard let self else { return }

      guard exists else {
        // O usuário apagou o perfil de VPN em Ajustes. É o único caminho de
        // desligamento que o on-demand não consegue reverter sozinho.
        self.log.error("Configuração de VPN foi removida — recriando")
        self.notifyProtectionInterrupted()
        TunnelController.shared.enable { result in
          completion((try? result.get()) != nil)
        }
        return
      }

      TunnelController.shared.currentStatus { status in
        switch status {
        case .connected:
          self.clearInterruptedNotification()
          // O índice pode ter sido reconstruído enquanto o túnel rodava.
          TunnelController.shared.sendMessage("reloadBlocklist")
          completion(true)

        case .invalid:
          self.log.error("Configuração inválida — recriando")
          TunnelController.shared.enable { result in
            completion((try? result.get()) != nil)
          }

        case .disconnected:
          self.log.notice("Túnel desconectado com proteção ativa — religando")
          TunnelController.shared.enable { result in
            completion((try? result.get()) != nil)
          }

        case .connecting, .reasserting:
          completion(true)   // em trânsito, não intervir

        case .disconnecting:
          completion(false)

        @unknown default:
          completion(false)
        }
      }
    }
  }

  /// Avisa o usuário que o disjuntor entrou em passthrough por problema técnico.
  /// Sem isso, uma degradação silenciosa passaria por "o bloqueio parou de pegar".
  func checkDegradedState() {
    guard AppGroupHelper.isTunnelDegraded else { return }
    log.error("Túnel em modo degradado (passthrough)")

    let content = UNMutableNotificationContent()
    content.title = "Proteção reduzida"
    content.body = "O bloqueio de sites foi pausado automaticamente por um problema técnico. "
      + "Abra o BetHunter para verificar."
    content.sound = .default

    UNUserNotificationCenter.current().add(
      UNNotificationRequest(identifier: "bethunter.tunnel.degraded", content: content, trigger: nil)
    )
  }

  private func notifyProtectionInterrupted() {
    let content = UNMutableNotificationContent()
    content.title = "Proteção interrompida"
    content.body = "A configuração de bloqueio foi removida. Toque para reativar."
    content.sound = .default

    UNUserNotificationCenter.current().add(
      UNNotificationRequest(identifier: "bethunter.protection.interrupted", content: content, trigger: nil)
    )
  }

  private func clearInterruptedNotification() {
    UNUserNotificationCenter.current()
      .removeDeliveredNotifications(withIdentifiers: ["bethunter.protection.interrupted"])
  }
}
