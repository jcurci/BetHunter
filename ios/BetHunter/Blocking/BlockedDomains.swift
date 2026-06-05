import Foundation

/// Fallback usado apenas quando o App Group ainda não tem a lista do Gist
/// (primeira execução sem conexão). Espelha DEFAULT_BLOCKED_DOMAINS do Android.
struct BlockedDomains {
  static let all: [String] = [
    "bet365.com",
    "betfair.com",
    "blaze.com",
    "pokerstars.com",
    "1xbet.com",
  ]
}
