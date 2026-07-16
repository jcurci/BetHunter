import Foundation

@available(iOS 16.0, *)
class BlocklistSyncService {
  static let shared = BlocklistSyncService()

  private static let gistURL =
    "https://raw.githubusercontent.com/hidekiiwasa/blacklist-cassino/main/latin_america_blacklist_bets_cassino_brazil.txt"
  private static let refreshInterval: TimeInterval = 24 * 60 * 60

  private init() {}

  // MARK: - API pública

  /// completion(true)  → temos domínios disponíveis (cache fresco, download OK ou cache de fallback)
  /// completion(false) → download falhou E não há nenhuma lista em cache — não ativar
  func refreshIfNeeded(completion: @escaping (Bool) -> Void = { _ in }) {
    let lastFetch = AppGroupHelper.blockedDomainsLastFetch
    let cached = AppGroupHelper.loadBlockedDomains()
    let isStale = cached.isEmpty || Date().timeIntervalSince1970 - lastFetch >= Self.refreshInterval

    guard isStale else {
      completion(true)   // cache ainda válido — pode ativar
      return
    }

    fetchFromGist { domains in
      if let domains = domains, !domains.isEmpty {
        AppGroupHelper.saveBlockedDomains(domains)
        AppGroupHelper.blockedDomainsLastFetch = Date().timeIntervalSince1970
        print("[BetBlocking] Blocklist atualizada: \(domains.count) domínios")
        completion(true)
      } else if !cached.isEmpty {
        // Download falhou mas temos cache anterior — usa silenciosamente
        print("[BetBlocking] Download falhou, usando cache (\(cached.count) domínios)")
        completion(true)
      } else {
        // Download falhou E sem cache — não tem como ativar com lista real
        print("[BetBlocking] Download falhou e sem cache disponível")
        completion(false)
      }
    }
  }

  func forceRefresh(completion: @escaping (Bool) -> Void = { _ in }) {
    fetchFromGist { domains in
      guard let domains = domains, !domains.isEmpty else {
        completion(false)
        return
      }
      AppGroupHelper.saveBlockedDomains(domains)
      AppGroupHelper.blockedDomainsLastFetch = Date().timeIntervalSince1970
      print("[BetBlocking] Blocklist atualizada: \(domains.count) domínios")
      completion(true)
    }
  }

  // MARK: - Download do Gist

  private func fetchFromGist(completion: @escaping ([String]?) -> Void) {
    guard let url = URL(string: Self.gistURL) else {
      completion(nil)
      return
    }

    var request = URLRequest(url: url, timeoutInterval: 10)
    request.httpMethod = "GET"

    URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      guard let self = self,
            let data = data,
            let text = String(data: data, encoding: .utf8),
            error == nil
      else {
        print("[BetBlocking] Falha ao baixar blocklist: \(error?.localizedDescription ?? "desconhecido")")
        completion(nil)
        return
      }

      let domains = text
        .components(separatedBy: .newlines)
        .compactMap { self.normalizeDomain($0) }

      completion(domains.isEmpty ? nil : domains)
    }.resume()
  }

  // MARK: - Normalização (espelho do BlockedDomainsRepository.normalizeDomain do Android)

  private func normalizeDomain(_ input: String) -> String? {
    var candidate = input.trimmingCharacters(in: .whitespaces)

    // Remove comentários inline (# e //)
    if let range = candidate.range(of: "#") {
      candidate = String(candidate[..<range.lowerBound]).trimmingCharacters(in: .whitespaces)
    }
    if let range = candidate.range(of: "//") {
      candidate = String(candidate[..<range.lowerBound]).trimmingCharacters(in: .whitespaces)
    }

    guard !candidate.isEmpty else { return nil }

    // Hosts file format: "0.0.0.0 dominio.com" ou "127.0.0.1 dominio.com"
    let tokens = candidate.components(separatedBy: .whitespaces).filter { !$0.isEmpty }
    if tokens.count > 1, tokens[0] == "0.0.0.0" || tokens[0] == "127.0.0.1" {
      candidate = tokens[1]
    } else {
      candidate = tokens[0]
    }

    // Remove protocolo
    candidate = candidate
      .replacingOccurrences(of: "https://", with: "")
      .replacingOccurrences(of: "http://", with: "")

    // Remove wildcard e ponto inicial
    if candidate.hasPrefix("*.") { candidate = String(candidate.dropFirst(2)) }
    if candidate.hasPrefix(".") { candidate = String(candidate.dropFirst()) }

    // Remove path
    if let slashIdx = candidate.firstIndex(of: "/") {
      candidate = String(candidate[..<slashIdx])
    }

    // Remove pontos extras no final
    candidate = candidate.trimmingCharacters(in: CharacterSet(charactersIn: "."))

    guard !candidate.isEmpty else { return nil }
    guard candidate.count <= 253 else { return nil }
    guard candidate.contains(".") else { return nil }

    // Valida caracteres permitidos
    let allowed = CharacterSet.lowercaseLetters
      .union(.decimalDigits)
      .union(CharacterSet(charactersIn: ".-"))
    guard candidate.lowercased().unicodeScalars.allSatisfy({ allowed.contains($0) }) else { return nil }

    // Valida cada label
    let labels = candidate.components(separatedBy: ".")
    for label in labels {
      guard !label.isEmpty,
            label.count <= 63,
            !label.hasPrefix("-"),
            !label.hasSuffix("-")
      else { return nil }
    }

    return candidate.lowercased()
  }
}
