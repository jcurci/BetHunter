import Foundation
import ManagedSettings
import FamilyControls
import NetworkExtension

@available(iOS 16.0, *)
class BlockingManager {
  static let shared = BlockingManager()

  private let store = ManagedSettingsStore()

  private init() {}

  /// Aplica bloqueio de apps via ManagedSettings e ativa o DNS Proxy
  func applyBlocking(with selection: FamilyActivitySelection) {
    let appTokens = selection.applicationTokens
    let catTokens = selection.categoryTokens

    store.shield.applications = appTokens.isEmpty ? nil : appTokens
    store.shield.applicationCategories = catTokens.isEmpty
      ? nil
      : ShieldSettings.ActivityCategoryPolicy.specific(catTokens)

    enableDNSProxy()
  }

  /// Remove todos os bloqueios de apps e desativa o DNS Proxy
  func removeBlocking() {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    disableDNSProxy()
  }

  // MARK: - DNS Proxy

  private func enableDNSProxy() {
    let manager = NEDNSProxyManager.shared()
    manager.loadFromPreferences { error in
      if error != nil { return }
      let proto = NEDNSProxyProviderProtocol()
      // Tem de coincidir com PRODUCT_BUNDLE_IDENTIFIER do target DNSProxy no Xcode.
      proto.providerBundleIdentifier = "com.bethunter.app.rick.DNSProxy"
      manager.providerProtocol = proto
      manager.isEnabled = true
      manager.saveToPreferences { error in
        if let error = error {
          print("[BetBlocking] Erro ao ativar DNS proxy: \(error)")
        }
      }
    }
  }

  private func disableDNSProxy() {
    let manager = NEDNSProxyManager.shared()
    manager.loadFromPreferences { error in
      if error != nil { return }
      manager.isEnabled = false
      manager.saveToPreferences { _ in }
    }
  }
}
