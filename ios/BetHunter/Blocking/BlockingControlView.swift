import SwiftUI
import FamilyControls

@available(iOS 16.0, *)
struct BlockingControlView: View {
  @State private var protectionEnabled = AppGroupHelper.isProtectionEnabled
  @State private var selection: FamilyActivitySelection = AppGroupHelper.loadFamilyActivitySelection() ?? FamilyActivitySelection()
  @State private var showActivityPicker = false
  @State private var isLoading = false
  @State private var showError = false

  private var blockedAppsCount: Int {
    selection.applicationTokens.count + selection.categoryTokens.count
  }

  private var blockedDomainsCount: Int {
    let dynamic = AppGroupHelper.loadBlockedDomains()
    return dynamic.isEmpty ? BlockedDomains.all.count : dynamic.count
  }

  var body: some View {
    ZStack {
      NavigationView {
        List {
          statusSection
          appsSection
          sitesSection
          disableAllSection
        }
        .navigationTitle("Bloquear Apostas")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Fechar") { dismiss() }
              .disabled(isLoading)
          }
        }
      }

      if isLoading {
        loadingOverlay
      }
    }
    .alert("Não foi possível ativar", isPresented: $showError) {
      Button("OK", role: .cancel) {}
    } message: {
      Text("Não foi possível obter a lista de sites de apostas. Verifique sua conexão e tente mais tarde.")
    }
  }

  // MARK: - Overlay de carregamento

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

  // MARK: - Seções

  private var statusSection: some View {
    Section {
      HStack {
        Circle()
          .fill(protectionEnabled ? Color.green : Color.gray)
          .frame(width: 12, height: 12)
        Text(protectionEnabled ? "Proteção ativa" : "Proteção inativa")
          .font(.headline)
        Spacer()
        Toggle("", isOn: $protectionEnabled)
          .labelsHidden()
          .disabled(isLoading)
          .onChange(of: protectionEnabled) { newValue in
            AppGroupHelper.isProtectionEnabled = newValue
            if newValue {
              activateBlocking(with: selection)
            } else {
              BlockingManager.shared.removeBlocking()
            }
          }
      }
    }
  }

  private var appsSection: some View {
    Section(header: Text("Apps Bloqueados")) {
      HStack {
        Image(systemName: "app.badge.fill")
          .foregroundColor(.blue)
        Text("\(blockedAppsCount) app(s) selecionado(s)")
      }

      Button {
        showActivityPicker = true
      } label: {
        HStack {
          Image(systemName: "pencil.circle.fill")
            .foregroundColor(.orange)
          Text("Alterar seleção de apps")
        }
      }
      .disabled(isLoading)
      .familyActivityPicker(
        isPresented: $showActivityPicker,
        selection: $selection
      )
      .onChange(of: selection) { newValue in
        AppGroupHelper.saveFamilyActivitySelection(newValue)
        if protectionEnabled {
          activateBlocking(with: newValue)
        }
      }
    }
  }

  private var sitesSection: some View {
    Section(header: Text("Sites Bloqueados")) {
      HStack {
        Image(systemName: "globe")
          .foregroundColor(.red)
        Text("\(blockedDomainsCount) domínio(s) bloqueado(s)")
      }
    }
  }

  private var disableAllSection: some View {
    Section {
      Button(role: .destructive) {
        protectionEnabled = false
        AppGroupHelper.isProtectionEnabled = false
        BlockingManager.shared.removeBlocking()
        selection = FamilyActivitySelection()
        AppGroupHelper.saveFamilyActivitySelection(selection)
      } label: {
        HStack {
          Spacer()
          Text("Desativar Tudo")
            .fontWeight(.semibold)
          Spacer()
        }
      }
      .disabled(isLoading)
    }
  }

  // MARK: - Ativação com feedback

  private func activateBlocking(with sel: FamilyActivitySelection) {
    isLoading = true
    BlockingManager.shared.applyBlocking(with: sel) { success in
      isLoading = false
      if !success {
        protectionEnabled = false
        AppGroupHelper.isProtectionEnabled = false
        showError = true
      }
    }
  }

  // MARK: - Helpers

  private func dismiss() {
    guard let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene }).first,
      let root = scene.windows.first?.rootViewController
    else { return }
    root.dismiss(animated: true)
  }
}
