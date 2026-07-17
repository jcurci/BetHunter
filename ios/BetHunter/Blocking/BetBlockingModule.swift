import UIKit
import React

@objc(BetBlocking)
class BetBlockingModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

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

  @objc
  func stopBlocking() {
    DispatchQueue.main.async {
      if #available(iOS 16.0, *) {
        BlockingManager.shared.removeBlocking()
        AppGroupHelper.isProtectionEnabled = false
      }
    }
    SubscriptionEnforcementTask.cancel()
  }

  @objc
  func syncAuthSession(_ token: String, apiBaseUrl: String) {
    AuthSessionKeychain.saveToken(token)
    if #available(iOS 16.0, *) {
      AppGroupHelper.apiBaseUrl = apiBaseUrl
      if AppGroupHelper.isProtectionEnabled {
        SubscriptionEnforcementTask.scheduleNext()
      }
    }
  }

  @objc
  func clearAuthSession() {
    AuthSessionKeychain.deleteToken()
  }

  @objc
  func isBlockingEnabled(_ resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      resolve(AppGroupHelper.isProtectionEnabled)
    } else {
      resolve(false)
    }
  }

  private func showUnsupportedAlert() {
    guard let rootVC = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .first?.windows.first(where: { $0.isKeyWindow })?.rootViewController
    else { return }

    let alert = UIAlertController(
      title: "Recurso Indisponível",
      message: "O bloqueio de apps requer iOS 16 ou superior.",
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    rootVC.present(alert, animated: true)
  }
}
