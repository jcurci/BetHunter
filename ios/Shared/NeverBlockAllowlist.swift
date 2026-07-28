import Foundation

/// Domínios que NUNCA podem ser bloqueados, com prioridade sobre a blocklist e
/// sobre a heurística de keywords.
///
/// Isto não é conveniência — é uma trava de segurança. `GamblingKeywordMatcher`
/// bloqueia qualquer domínio contendo "stake", "blaze", "casino" ou "aposta".
/// Um falso positivo na nossa própria infraestrutura tijolaria o app: sem API,
/// sem RevenueCat (o usuário perderia o acesso que pagou) e sem refresh da
/// blocklist — e o usuário não teria como diagnosticar, porque para ele o
/// sintoma é "o BetHunter parou de funcionar".
///
/// Ao adicionar um domínio novo à infraestrutura, adicione aqui também.
enum NeverBlockAllowlist {

  /// Casam por igualdade exata ou como sufixo de rótulo
  /// (`api.railway.app` casa com `railway.app`).
  static let domains: [String] = [
    // Nossa infraestrutura
    "bethunter-api.up.railway.app",
    "railway.app",
    "up.railway.app",

    // Assinatura — bloquear isto derruba a validação de premium
    "api.revenuecat.com",
    "revenuecat.com",

    // Origem da blocklist — bloquear isto congela a lista para sempre
    "raw.githubusercontent.com",
    "githubusercontent.com",
    "github.com",

    // Login e serviços Google
    "googleapis.com",
    "accounts.google.com",
    "google.com",
    "gstatic.com",

    // Apple: push, App Store, iCloud, verificação de recibo
    "apple.com",
    "icloud.com",
    "push.apple.com",
    "mzstatic.com",
    "itunes.apple.com",
    "cdn-apple.com",
    "apple-cloudkit.com",

    // Falso positivo conhecido, herdado da ALLOWLIST do KeywordMatcher.kt
    "betterment.com",
  ]

  /// Hashes pré-computados na primeira consulta. A caminhada de sufixo usa os
  /// mesmos candidatos da busca no índice, então basta comparar hashes.
  private static let hashes: Set<UInt64> = Set(domains.map { DomainHash.hash(domain: $0) })

  /// `true` se o domínio ou qualquer domínio-pai dele está na allowlist.
  ///
  /// Recebe os mesmos candidatos de sufixo já calculados pelo chamador, para não
  /// caminhar o domínio duas vezes no hot path.
  @inline(__always)
  static func contains(hash: UInt64) -> Bool {
    hashes.contains(hash)
  }

  static func contains(domain: String) -> Bool {
    let lowered = domain.lowercased()
    let labels = lowered.split(separator: ".")
    guard labels.count >= 2 else { return false }
    for i in 0...(labels.count - 2) {
      let candidate = labels[i...].joined(separator: ".")
      if hashes.contains(DomainHash.hash(domain: candidate)) { return true }
    }
    return false
  }
}
