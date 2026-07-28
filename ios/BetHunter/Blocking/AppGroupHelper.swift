import Foundation
import FamilyControls

@available(iOS 16.0, *)
struct AppGroupHelper {
  static let suiteName = "group.com.bethunter.app.rick"

  private static let protectionEnabledKey = SharedConstants.Keys.protectionEnabled
  private static let selectionKey = SharedConstants.Keys.familyActivitySelection
  static let domainsLastFetchKey = "blocked_domains_last_fetch"
  private static let apiBaseUrlKey = SharedConstants.Keys.authAPIBaseURL

  private static var sharedDefaults: UserDefaults? {
    UserDefaults(suiteName: suiteName)
  }

  // MARK: - Proteção ativa / inativa

  static var isProtectionEnabled: Bool {
    get { sharedDefaults?.bool(forKey: protectionEnabledKey) ?? false }
    set { sharedDefaults?.set(newValue, forKey: protectionEnabledKey) }
  }

  // MARK: - Seleção de apps (FamilyActivitySelection)

  static func saveFamilyActivitySelection(_ selection: FamilyActivitySelection) {
    guard let defaults = sharedDefaults else { return }
    do {
      let data = try JSONEncoder().encode(selection)
      defaults.set(data, forKey: selectionKey)
    } catch {
      print("[BetBlocking] Erro ao salvar seleção: \(error)")
    }
  }

  static func loadFamilyActivitySelection() -> FamilyActivitySelection? {
    guard let defaults = sharedDefaults,
          let data = defaults.data(forKey: selectionKey)
    else { return nil }
    do {
      return try JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    } catch {
      print("[BetBlocking] Erro ao carregar seleção: \(error)")
      return nil
    }
  }

  // MARK: - Blocklist
  //
  // Os domínios em si vivem num índice binário em mmap no container do App Group
  // (ver BlocklistStore / BlocklistIndex), NÃO no UserDefaults. O array de ~300
  // mil strings que existia aqui era re-serializado a cada acesso ao suite,
  // inclusive dentro da extensão, que tem orçamento de ~15 MB.

  static var blockedDomainsLastFetch: Double {
    get { sharedDefaults?.double(forKey: domainsLastFetchKey) ?? 0 }
    set { sharedDefaults?.set(newValue, forKey: domainsLastFetchKey) }
  }

  static var blocklistETag: String? {
    get { sharedDefaults?.string(forKey: SharedConstants.Keys.blocklistETag) }
    set { sharedDefaults?.set(newValue, forKey: SharedConstants.Keys.blocklistETag) }
  }

  /// Marcado pela extensão quando o disjuntor entra em passthrough — a UI usa
  /// para avisar que a proteção está degradada.
  static var isTunnelDegraded: Bool {
    sharedDefaults?.bool(forKey: SharedConstants.Keys.tunnelDegraded) ?? false
  }

  // MARK: - Sessão de auth (usado pelo SubscriptionEnforcementTask)

  /// A URL base não é sensível — fica no UserDefaults compartilhado. O token
  /// em si vive no Keychain (ver AuthSessionKeychain), nunca aqui.
  static var apiBaseUrl: String? {
    get { sharedDefaults?.string(forKey: apiBaseUrlKey) }
    set { sharedDefaults?.set(newValue, forKey: apiBaseUrlKey) }
  }
}
