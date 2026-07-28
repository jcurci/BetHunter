import UIKit
import React
import NetworkExtension

/// Ponte React Native da proteção no iOS.
///
/// ATENÇÃO: todo método `@objc` daqui precisa de um `RCT_EXTERN_METHOD`
/// correspondente em `BetBlockingModule.m`, senão ele não existe para o JS.
@objc(BetBlocking)
class BetBlockingModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // MARK: - Fluxo de ativação

  @objc
  func openBlockingFlow() {
    DispatchQueue.main.async {
      if #available(iOS 16.0, *) {
        BlockingFlowCoordinator.shared.start()
      } else {
        self.showUnsupportedAlert()
      }
    }
  }

  /// Autoexclusão: desativação pelo usuário não é permitida (no-op).
  /// Use `pauseBlocking` quando a assinatura expirar.
  @objc
  func stopBlocking() {
    // Intencionalmente vazio — a proteção não pode ser desligada pelo app.
  }

  /// Pausa por assinatura expirada. Preserva a intenção do usuário para religar
  /// sozinho na renovação — por isso é diferente de `stopBlocking`.
  @objc
  func pauseBlocking() {
    DispatchQueue.main.async {
      if #available(iOS 16.0, *) {
        BlockingManager.shared.pauseForExpiredSubscription()
      }
    }
  }

  @objc
  func resumeBlocking() {
    DispatchQueue.main.async {
      if #available(iOS 16.0, *) {
        BlockingManager.shared.resumeAfterSubscriptionRenewed()
      }
    }
  }

  /// No-op deliberado: a licença de premium que o túnel confere sozinho é, por
  /// ora, só do Android. O JS chama isto em todo boot/foreground e o contrato
  /// tipado (`blockerModule.ts`) exige o método existir nas duas plataformas —
  /// um método ausente falharia em silêncio pelo optional chaining, que é
  /// exatamente como `syncAuthSession` ficou morto no iOS por vários commits.
  @objc
  func renewPremiumLease(_ untilMs: NSNumber) {
    // Enforcement no iOS segue via SubscriptionEnforcementTask.
  }

  /// Escotilha de emergência: leva o usuário direto a Ajustes › VPN, para o caso
  /// de a remoção programática falhar. Nunca deixar o usuário preso.
  ///
  /// NOTA: `App-Prefs:` é um esquema de URL não documentado. Usá-lo é um gatilho
  /// conhecido da diretriz 2.5.1 (Software Requirements) na App Review, e a Apple
  /// vem desativando esses deep links ao longo das versões do iOS — por isso o
  /// `canOpenURL` com fallback para a API pública. Mantido por decisão de produto.
  @objc
  func openVpnSettings() {
    DispatchQueue.main.async {
      guard let url = URL(string: "App-Prefs:root=General&path=VPN"),
            UIApplication.shared.canOpenURL(url)
      else {
        if let settings = URL(string: UIApplication.openSettingsURLString) {
          UIApplication.shared.open(settings)
        }
        return
      }
      UIApplication.shared.open(url)
    }
  }

  // MARK: - Sessão de auth

  @objc
  func syncAuthSession(_ token: String, apiBaseUrl: String) {
    AuthSessionKeychain.saveToken(token)
    if #available(iOS 16.0, *) {
      AppGroupHelper.apiBaseUrl = apiBaseUrl
      if AppGroupHelper.isProtectionEnabled {
        SubscriptionEnforcementTask.scheduleNext()
        BlocklistRefreshTask.scheduleNext()
      }
    }
  }

  @objc
  func clearAuthSession() {
    AuthSessionKeychain.deleteToken()
  }

  // MARK: - Kill switch remoto

  /// Desliga a filtragem sem desinstalar o túnel. É o que permite estancar um bug
  /// em campo sem esperar review da Apple.
  @objc
  func setTunnelEnabled(_ enabled: Bool) {
    guard #available(iOS 16.0, *) else { return }
    if enabled {
      TunnelController.shared.sendMessage("passthroughOff")
    } else {
      TunnelController.shared.sendMessage("passthroughOn")
    }
  }

  // MARK: - Estado

  @objc
  func isBlockingEnabled(_ resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.0, *) else {
      resolve(false)
      return
    }
    resolve(AppGroupHelper.isProtectionEnabled)
  }

  /// Estado detalhado, para a UI poder distinguir "ativo", "pausado por
  /// assinatura" e "degradado pelo disjuntor" — que o booleano não distingue.
  @objc
  func getProtectionStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.0, *) else {
      resolve(["supported": false])
      return
    }
    TunnelController.shared.currentStatus { status in
      resolve([
        "supported": true,
        "enabled": AppGroupHelper.isProtectionEnabled,
        "paused": BlockingManager.shared.isPremiumPaused,
        "degraded": AppGroupHelper.isTunnelDegraded,
        "tunnelStatus": Self.statusName(status),
        "blockedDomains": BlocklistStore.count,
        "strictMode": BlockingManager.shared.isStrictModeEnabled,
      ])
    }
  }

  /// Reconcilia o estado real com a intenção do usuário e conserta o que dá.
  /// Espelha `checkAndSyncBlockingStatus` do Android; chamado no foreground.
  @objc
  func checkAndSyncBlockingStatus(_ resolve: @escaping RCTPromiseResolveBlock,
                                  reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.0, *) else {
      resolve(false)
      return
    }
    TunnelHealthMonitor.shared.reconcile { isProtected in
      resolve(isProtected)
    }
  }

  @objc
  func refreshBlockedDomains(_ resolve: @escaping RCTPromiseResolveBlock,
                             reject: @escaping RCTPromiseRejectBlock) {
    guard #available(iOS 16.0, *) else {
      resolve(0)
      return
    }
    BlocklistSyncService.shared.refreshIfNeeded { result in
      switch result {
      case .success(let count):
        TunnelController.shared.sendMessage("reloadBlocklist")
        resolve(count)
      case .failure:
        resolve(BlocklistStore.count)
      }
    }
  }

  // MARK: - Helpers

  @available(iOS 16.0, *)
  private static func statusName(_ status: NEVPNStatus) -> String {
    switch status {
    case .invalid: return "invalid"
    case .disconnected: return "disconnected"
    case .connecting: return "connecting"
    case .connected: return "connected"
    case .reasserting: return "reasserting"
    case .disconnecting: return "disconnecting"
    @unknown default: return "unknown"
    }
  }

  private func showUnsupportedAlert() {
    guard let rootVC = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .first?.windows.first(where: { $0.isKeyWindow })?.rootViewController
    else { return }

    let alert = UIAlertController(
      title: "Recurso Indisponível",
      message: "O bloqueio de apostas requer iOS 16 ou superior.",
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    rootVC.present(alert, animated: true)
  }
}
