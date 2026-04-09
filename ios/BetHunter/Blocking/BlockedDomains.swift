import Foundation

/// Domínios de apostas bloqueados pelo DNS Proxy.
/// Compartilhado entre o app principal e a extensão DNS via App Group.
struct BlockedDomains {
  static let all: [String] = [
    "bet365.com",
    // Site BR atual: https://www.betano.bet.br/ (betano.com.br é outro domínio)
    "betano.bet.br",
    "pixbet.com",
    "esportes.betfair.com",
    "br.bwin.com",
  ]
}
