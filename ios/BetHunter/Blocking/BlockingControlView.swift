import SwiftUI
import FamilyControls

@available(iOS 16.0, *)
struct BlockingControlView: View {
  @State private var protectionEnabled = AppGroupHelper.isProtectionEnabled
  @State private var selection: FamilyActivitySelection = AppGroupHelper.loadFamilyActivitySelection() ?? FamilyActivitySelection()
  @State private var showActivityPicker = false

  private var blockedAppsCount: Int {
    selection.applicationTokens.count + selection.categoryTokens.count
  }

  private var blockedDomainsCount: Int {
    BlockedDomains.all.count
  }

  var body: some View {
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
        }
      }
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
          .onChange(of: protectionEnabled) { newValue in
            AppGroupHelper.isProtectionEnabled = newValue
            if newValue {
              BlockingManager.shared.applyBlocking(with: selection)
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
      .familyActivityPicker(
        isPresented: $showActivityPicker,
        selection: $selection
      )
      .onChange(of: selection) { newValue in
        AppGroupHelper.saveFamilyActivitySelection(newValue)
        if protectionEnabled {
          BlockingManager.shared.applyBlocking(with: newValue)
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
