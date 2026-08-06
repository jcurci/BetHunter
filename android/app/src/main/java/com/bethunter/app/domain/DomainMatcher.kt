package com.bethunter.app.domain

import com.bethunter.app.repository.BlockedDomainsRepository

/**
 * Decide se um domínio consultado por DNS deve ser bloqueado.
 *
 * A lista NÃO é mais carregada em memória. Antes, uma trie de `HashMap` com os
 * ~311 mil domínios da lista remota ocupava 150-200 MB de heap no processo `:vpn`,
 * o que o tornava o primeiro candidato do lmkd em qualquer aperto de memória — a
 * causa mais provável do "cai e volta" relatado em campo. E cada refresh
 * reconstruía tudo, com a proteção furada durante o rebuild.
 *
 * Agora a consulta vai ao SQLite (lookup por PRIMARY KEY, ver
 * [BlockedDomainsRepository.isAnyDomainBlocked]) com um [DecisionCache] na frente,
 * que absorve a repetição natural do tráfego DNS.
 */
class DomainMatcher(
  private val repository: BlockedDomainsRepository,
  private val cache: DecisionCache = DecisionCache(),
) {

  fun isBlocked(domain: String): Boolean {
    val normalized = BlockedDomainsRepository.normalizeDomain(domain) ?: return false

    cache.get(normalized)?.let { return it }

    // 1) match exato/sufixo na lista mapeada; 2) heurística por palavra-chave para
    // pegar mirrors não mapeados (23bet*, bet\d+, tokens de aposta).
    val blocked = repository.isAnyDomainBlocked(DomainSuffixes.of(normalized)) ||
      KeywordMatcher.isGamblingDomain(normalized)

    cache.put(normalized, blocked)
    return blocked
  }

  /**
   * A lista mudou: as decisões em cache deixaram de valer.
   *
   * O que antes era um rebuild de trie de vários segundos (e a razão de existir um
   * executor serial com coalescência de rajadas) virou uma limpeza de mapa — barata
   * o bastante para rodar de qualquer thread, inclusive a main.
   */
  fun invalidate() {
    cache.clear()
  }
}
