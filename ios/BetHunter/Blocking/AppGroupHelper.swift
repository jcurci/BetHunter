import Foundation
import FamilyControls

@available(iOS 16.0, *)
struct AppGroupHelper {
  static let suiteName = "group.com.ricardo.bethunter"

  private static let protectionEnabledKey = "protectionEnabled"
  private static let selectionKey = "familyActivitySelectionData"
  static let domainsKey = "blocked_domains_list"
  static let domainsLastFetchKey = "blocked_domains_last_fetch"

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

  // MARK: - Lista de domínios bloqueados (compartilhada com extensão DNS)

  static func saveBlockedDomains(_ domains: [String]) {
    sharedDefaults?.set(domains, forKey: domainsKey)
  }

  static func loadBlockedDomains() -> [String] {
    sharedDefaults?.stringArray(forKey: domainsKey) ?? []
  }

  static var blockedDomainsLastFetch: Double {
    get { sharedDefaults?.double(forKey: domainsLastFetchKey) ?? 0 }
    set { sharedDefaults?.set(newValue, forKey: domainsLastFetchKey) }
  }
}
