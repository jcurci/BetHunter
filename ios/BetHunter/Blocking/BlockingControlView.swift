import SwiftUI
import FamilyControls

@available(iOS 16.0, *)
struct BlockingControlView: View {
  @State private var protectionEnabled = AppGroupHelper.isProtectionEnabled
  @State private var selection: FamilyActivitySelection =
    AppGroupHelper.loadFamilyActivitySelection() ?? FamilyActivitySelection()
  @State private var showActivityPicker = false
  @State private var isLoading = false
  @State private var errorMessage: String?
  @State private var showStrictModeConfirm = false
  @State private var strictMode = BlockingManager.shared.isStrictModeEnabled

  /// Lido uma vez, não a cada avaliação do body. A versão anterior era uma
  /// computed property que desserializava um NSArray de 300 mil itens do
  /// UserDefaults toda vez que o SwiftUI reavaliava a view.
  @State private var blockedDomainsCount = BlocklistStore.count
  @State private var isDegraded = AppGroupHelper.isTunnelDegraded
  @State private var isPaused = BlockingManager.shared.isPremiumPaused

  var body: some View {
    ZStack {
      NavigationView {
        List {
          statusSection
          if isDegraded { degradedSection }
          if isPaused { pausedSection }
          appsSection
          sitesSection
          strictModeSection
          screenTimeGuideSection
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
      if isLoading { loadingOverlay }
    }
    .alert(
      "Não foi possível ativar",
      isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    ) {
      Button("OK", role: .cancel) { errorMessage = nil }
    } message: {
      Text(errorMessage ?? "")
    }
    .confirmationDialog(
      "Ativar Modo Rígido?",
      isPresented: $showStrictModeConfirm,
      titleVisibility: .visible
    ) {
      Button("Ativar Modo Rígido", role: .destructive) {
        BlockingManager.shared.setStrictMode(true)
        strictMode = true
      }
      Button("Cancelar", role: .cancel) { strictMode = false }
    } message: {
      Text("Você não conseguirá desinstalar NENHUM app do iPhone enquanto o modo "
           + "estiver ligado, inclusive o BetHunter. A proteção de apostas "
           + "permanece ativa; só o Modo Rígido pode ser desligado nesta tela.")
    }
    .onAppear { refreshState() }
  }

  private func refreshState() {
    blockedDomainsCount = BlocklistStore.count
    isDegraded = AppGroupHelper.isTunnelDegraded
    isPaused = BlockingManager.shared.isPremiumPaused
    protectionEnabled = AppGroupHelper.isProtectionEnabled
    strictMode = BlockingManager.shared.isStrictModeEnabled
  }

  // MARK: - Seções

  private var statusSection: some View {
    Section {
      HStack {
        Circle()
          .fill(statusColor)
          .frame(width: 12, height: 12)
        Text(statusLabel)
          .font(.headline)
        Spacer()
        if protectionEnabled {
          // Autoexclusão: depois de configurada, a proteção não desliga pelo app.
          Image(systemName: "lock.fill")
            .foregroundColor(.secondary)
            .accessibilityLabel("Proteção travada")
        } else {
          Toggle("", isOn: $protectionEnabled)
            .labelsHidden()
            .disabled(isLoading)
            .onChange(of: protectionEnabled) { newValue in
              // NÃO grava isProtectionEnabled aqui. A flag é escrita num único
              // lugar — o BlockingManager, depois de o túnel conectar.
              if newValue {
                activate()
              } else {
                // Desligar pelo app não é permitido; restaura o toggle.
                protectionEnabled = false
              }
            }
        }
      }
    } footer: {
      if protectionEnabled {
        Text("A proteção não pode ser desativada pelo app. "
             + "Você ainda pode alterar apps e o Modo Rígido. "
             + "Para reforçar contra burla, use a seção Proteção Extra.")
      } else {
        Text("O bloqueio de sites funciona em todos os navegadores. "
             + "O bloqueio de apps depende do Tempo de Uso.")
      }
    }
  }

  private var statusColor: Color {
    if isPaused || isDegraded { return .orange }
    return protectionEnabled ? .green : .gray
  }

  private var statusLabel: String {
    if isPaused { return "Pausado — assinatura inativa" }
    if isDegraded { return "Proteção reduzida" }
    return protectionEnabled ? "Proteção ativa" : "Proteção inativa"
  }

  private var degradedSection: some View {
    Section {
      Label(
        "O filtro de sites foi pausado automaticamente por um problema técnico. "
          + "O bloqueio de apps continua ativo. Tentaremos religar sozinho.",
        systemImage: "exclamationmark.triangle.fill"
      )
      .foregroundColor(.orange)
      .font(.footnote)
    }
  }

  private var pausedSection: some View {
    Section {
      Label(
        "Sua assinatura não está ativa, então o bloqueio está pausado. "
          + "Ele volta sozinho assim que a assinatura for renovada.",
        systemImage: "pause.circle.fill"
      )
      .foregroundColor(.orange)
      .font(.footnote)
    }
  }

  private var appsSection: some View {
    Section {
      HStack {
        Image(systemName: "app.badge.fill").foregroundColor(.blue)
        Text("\(blockedAppsCount) app(s) selecionado(s)")
      }
      Button {
        showActivityPicker = true
      } label: {
        HStack {
          Image(systemName: "pencil.circle.fill").foregroundColor(.orange)
          Text("Alterar seleção de apps")
        }
      }
      .disabled(isLoading)
      .familyActivityPicker(isPresented: $showActivityPicker, selection: $selection)
      .onChange(of: selection) { newValue in
        AppGroupHelper.saveFamilyActivitySelection(newValue)
        if protectionEnabled { activate() }
      }
    } header: {
      Text("Apps Bloqueados")
    }
  }

  private var blockedAppsCount: Int {
    selection.applicationTokens.count + selection.categoryTokens.count
  }

  private var sitesSection: some View {
    Section {
      HStack {
        Image(systemName: "globe").foregroundColor(.red)
        Text("\(blockedDomainsCount.formatted()) domínio(s) bloqueado(s)")
      }
      if let builtAt = BlocklistStore.builtAt {
        Text("Lista atualizada em \(builtAt.formatted(date: .abbreviated, time: .shortened))")
          .font(.caption)
          .foregroundColor(.secondary)
      }
    } header: {
      Text("Sites Bloqueados")
    } footer: {
      Text("Vale para Safari, Chrome, Edge, Firefox e qualquer outro navegador.")
    }
  }

  private var strictModeSection: some View {
    Section {
      Toggle("Modo Rígido", isOn: Binding(
        get: { strictMode },
        set: { newValue in
          if newValue {
            showStrictModeConfirm = true
          } else {
            BlockingManager.shared.setStrictMode(false)
            strictMode = false
          }
        }
      ))
      .disabled(isLoading)
    } header: {
      Text("Dificultar Burlar")
    } footer: {
      Text("Impede desinstalar qualquer app do iPhone, incluindo o BetHunter. "
           + "É uma configuração do sistema inteiro.")
    }
  }

  /// A ação de maior alavancagem contra recaída, e a única que o app não pode
  /// fazer sozinho: nem MDM nem API conseguem ativar essa restrição.
  private var screenTimeGuideSection: some View {
    Section {
      VStack(alignment: .leading, spacing: 8) {
        Text("Para não conseguir desligar o bloqueio num momento de fissura:")
          .font(.footnote)
        Text("1. Ajustes › Tempo de Uso › Bloquear Configurações de Tempo de Uso")
          .font(.caption)
        Text("2. Defina um código e peça para alguém de confiança guardá-lo")
          .font(.caption)
        Text("3. Ajustes › Tempo de Uso › Restrições de Conteúdo e Privacidade › VPN › Não Permitir")
          .font(.caption)
        Text("Sem isso, você consegue desligar a proteção a qualquer momento em Ajustes.")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      // NOTA: `App-Prefs:` é um esquema não documentado e é gatilho conhecido da
      // diretriz 2.5.1 na App Review. Mantido por decisão de produto; o passo a
      // passo acima é o que realmente guia o usuário, caso o link não abra.
      Button {
        if let url = URL(string: "App-Prefs:root=SCREEN_TIME") {
          UIApplication.shared.open(url)
        }
      } label: {
        Label("Abrir Tempo de Uso", systemImage: "hourglass")
      }
    } header: {
      Text("Proteção Extra (recomendado)")
    }
  }

  // MARK: - Ações

  private func activate() {
    isLoading = true
    BlockingManager.shared.applyBlocking(with: selection) { result in
      isLoading = false
      switch result {
      case .success:
        refreshState()
      case .failure(let error):
        protectionEnabled = false
        errorMessage = error.errorDescription
      }
    }
  }

  private var loadingOverlay: some View {
    ZStack {
      Color.black.opacity(0.45).ignoresSafeArea()
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

  private func dismiss() {
    guard let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene }).first,
      let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
    else { return }
    root.dismiss(animated: true)
  }
}
