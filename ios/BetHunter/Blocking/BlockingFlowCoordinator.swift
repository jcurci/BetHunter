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
      // Já ativo → tela de gerenciamento (sem desligar). Ainda não ativo →
      // picker de apps para configurar; a tela de controle fica travada depois.
      if AppGroupHelper.isProtectionEnabled {
        presentBlockingControlView()
      } else {
        presentActivityPicker()
      }

    case .notDetermined, .denied:
      do {
        try await center.requestAuthorization(for: .individual)
        if AppGroupHelper.isProtectionEnabled {
          presentBlockingControlView()
        } else {
          presentActivityPicker()
        }
      } catch {
        showDeniedAlert(error)
      }

    @unknown default:
      showDeniedAlert(nil)
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
  private func showDeniedAlert(_ error: Error?) {
    guard let rootVC = Self.topViewController() else { return }

    let alert = UIAlertController(
      title: "Permissão Necessária",
      message: Self.authorizationMessage(for: error),
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "Abrir Ajustes", style: .default) { _ in
      if let url = URL(string: UIApplication.openSettingsURLString) {
        UIApplication.shared.open(url)
      }
    })
    alert.addAction(UIAlertAction(title: "Agora não", style: .cancel))
    rootVC.present(alert, animated: true)
  }

  /// Distingue "usuário recusou" de "este aparelho é gerenciado por um
  /// responsável". No segundo caso `requestAuthorization(for: .individual)`
  /// **sempre** falha, e a mensagem genérica manda o usuário para um lugar que
  /// não resolve nada — cenário real para apostador jovem em Compartilhamento
  /// Familiar.
  private static func authorizationMessage(for error: Error?) -> String {
    let nsError = error as NSError?
    let isChildDevice = nsError?.domain == "FamilyControls.FamilyControlsError"
      && (nsError?.code == 4 || nsError?.code == 5)

    if isChildDevice {
      return "Este iPhone é gerenciado por um responsável no Compartilhamento Familiar. "
        + "Peça a ele para aprovar o acesso ao Tempo de Uso, ou use uma conta própria "
        + "neste aparelho."
    }
    return "Para bloquear apps de apostas, o BetHunter precisa de acesso ao Tempo de Uso. "
      + "Você pode conceder em Ajustes › Tempo de Uso. "
      + "O bloqueio de sites continua funcionando mesmo sem essa permissão."
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
  @State private var isLoading = false
  @State private var errorMessage: String?
  var onDone: () -> Void

  var body: some View {
    ZStack {
      NavigationView {
        FamilyActivityPicker(selection: $selection)
          .navigationTitle("Selecionar Apps")
          .navigationBarTitleDisplayMode(.inline)
          .toolbar {
            ToolbarItem(placement: .confirmationAction) {
              if isLoading {
                ProgressView()
                  .progressViewStyle(CircularProgressViewStyle())
              } else {
                Button("Salvar") {
                  AppGroupHelper.saveFamilyActivitySelection(selection)
                  isLoading = true
                  // O BlockingManager é o único que marca isProtectionEnabled, e
                  // só depois de o túnel estar conectado de verdade. Este caminho
                  // não escreve a flag — antes ele nunca escrevia, e por isso a
                  // Home mostrava "desprotegido" logo após a primeira ativação.
                  BlockingManager.shared.applyBlocking(with: selection) { result in
                    isLoading = false
                    switch result {
                    case .success:
                      onDone()
                    case .failure(let error):
                      errorMessage = error.errorDescription
                    }
                  }
                }
              }
            }
          }
      }

      if isLoading {
        loadingOverlay
      }
    }
    .alert(
      "Não foi possível ativar",
      isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    ) {
      Button("OK", role: .cancel) { errorMessage = nil }
    } message: {
      // Mensagem específica da causa real (lista, índice ou permissão de VPN),
      // em vez do texto genérico de "sem conexão" que aparecia para tudo.
      Text(errorMessage ?? "")
    }
    .onAppear {
      if let saved = AppGroupHelper.loadFamilyActivitySelection() {
        selection = saved
      }
    }
  }

  private var loadingOverlay: some View {
    ZStack {
      Color.black.opacity(0.45)
        .ignoresSafeArea()

      VStack(spacing: 16) {
        ProgressView()
          .progressViewStyle(CircularProgressViewStyle(tint: .white))
          .scaleEffect(1.4)
        Text("Ativando proteção...")
          .foregroundColor(.white)
          .font(.subheadline)
          .fontWeight(.medium)
      }
      .padding(.horizontal, 36)
      .padding(.vertical, 28)
      .background(.ultraThinMaterial)
      .cornerRadius(18)
    }
  }
}
