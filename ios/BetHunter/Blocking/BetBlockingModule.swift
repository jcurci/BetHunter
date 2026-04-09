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
