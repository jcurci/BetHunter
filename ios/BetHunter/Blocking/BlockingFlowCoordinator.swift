import UIKit
import SwiftUI
import FamilyControls

@available(iOS 16.0, *)
class BlockingFlowCoordinator {
  static let shared = BlockingFlowCoordinator()

  private init() {}

  /// Ponto de entrada: verifica autorização e apresenta a tela adequada
  func start() {
    Task { @MainActor in
      await checkAuthorizationAndPresent()
    }
  }

  @MainActor
  private func checkAuthorizationAndPresent() async {
    let center = AuthorizationCenter.shared

    switch center.authorizationStatus {
    case .approved:
      presentBlockingControlView()

    case .notDetermined, .denied:
      do {
        try await center.requestAuthorization(for: .individual)
        presentActivityPicker()
      } catch {
        showDeniedAlert()
      }

    @unknown default:
      showDeniedAlert()
    }
  }

  // MARK: - Apresentação de telas

  @MainActor
  private func presentBlockingControlView() {
    guard let rootVC = Self.topViewController() else { return }
    let view = BlockingControlView()
    let host = UIHostingController(rootView: view)
    host.modalPresentationStyle = .pageSheet
    rootVC.present(host, animated: true)
  }

  @MainActor
  private func presentActivityPicker() {
    guard let rootVC = Self.topViewController() else { return }
    let view = ActivityPickerWrapper {
      rootVC.dismiss(animated: true) {
        self.presentBlockingControlView()
      }
    }
    let host = UIHostingController(rootView: view)
    host.modalPresentationStyle = .pageSheet
    rootVC.present(host, animated: true)
  }

  @MainActor
  private func showDeniedAlert() {
    guard let rootVC = Self.topViewController() else { return }
    let alert = UIAlertController(
      title: "Permissão Necessária",
      message: "Para bloquear apps de apostas, é necessário permitir o acesso ao Tempo de Uso (Screen Time). Vá em Ajustes > Tempo de Uso para ativar.",
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    rootVC.present(alert, animated: true)
  }

  // MARK: - Helpers

  private static func topViewController() -> UIViewController? {
    guard let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene }).first,
      let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
    else { return nil }

    var top = root
    while let presented = top.presentedViewController {
      top = presented
    }
    return top
  }
}

// MARK: - Wrapper do FamilyActivityPicker (primeira seleção)

@available(iOS 16.0, *)
struct ActivityPickerWrapper: View {
  @State private var selection = FamilyActivitySelection()
  var onDone: () -> Void

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Selecionar Apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .confirmationAction) {
            Button("Salvar") {
              AppGroupHelper.saveFamilyActivitySelection(selection)
              BlockingManager.shared.applyBlocking(with: selection)
              onDone()
            }
          }
        }
    }
    .onAppear {
      if let saved = AppGroupHelper.loadFamilyActivitySelection() {
        selection = saved
      }
    }
  }
}
