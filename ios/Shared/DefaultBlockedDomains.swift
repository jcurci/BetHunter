import Foundation

/// Fallback compilado, usado quando o índice em disco está ausente ou corrompido
/// (primeira execução sem rede, arquivo truncado, App Group não provisionado).
///
/// Espelha `DEFAULT_BLOCKED_DOMAINS` de `BlockedDomainsRepository.kt`.
///
/// A regra é nunca fail-open: com o índice indisponível o túnel continua
/// filtrando por esta lista + `GamblingKeywordMatcher`. Proteção reduzida é
/// muito melhor que proteção zero num app de autoexclusão — o usuário confia
/// que está bloqueado.
enum DefaultBlockedDomains {

  static let all: [String] = [
    "bet365.com",
    "betfair.com",
    "blaze.com",
    "pokerstars.com",
    "1xbet.com",
    "23bet36.com",
    "betano.com",
    "betano.com.br",
    "sportingbet.com",
    "betnacional.com",
    "estrelabet.com",
    "pixbet.com",
    "vaidebet.com",
    "superbet.com",
    "novibet.com",
    "parimatch.com",
    "brazino777.com",
    "stake.com",
    "betsson.com",
    "bet7k.com",
    "galera.bet",
    "kto.com",
    "rivalo.com",
    "betwarrior.com",
    "esportesdasorte.com",
    "apostaganha.bet",
    "segurobet.com",
    "bateubet.com",
    "mcgames.bet",
    "cassino.bet.br",
  ]

  /// Hashes prontos para a mesma busca por sufixo do índice em disco.
  static let hashes: Set<UInt64> = Set(all.map { DomainHash.hash(domain: $0) })
}
