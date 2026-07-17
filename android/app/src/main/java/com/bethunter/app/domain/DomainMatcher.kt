package com.bethunter.app.domain

import com.bethunter.app.repository.BlockedDomainsRepository

class DomainMatcher(
  private val repository: BlockedDomainsRepository
) {
  private val trie = DomainTrie()
  @Volatile private var loaded: Boolean = false

  @Synchronized
  fun reload() {
    trie.clear()
    repository.getBlockedDomains()
      .mapNotNull { BlockedDomainsRepository.normalizeDomain(it) }
      .forEach { trie.addDomain(it) }
    loaded = true
  }

  fun isBlocked(domain: String): Boolean {
    if (!loaded) reload()
    val normalized = BlockedDomainsRepository.normalizeDomain(domain) ?: return false
    // 1) match exato/sufixo na lista mapeada; 2) heurística por palavra-chave para
    // pegar mirrors não mapeados (23bet*, bet\d+, tokens de aposta).
    return trie.matches(normalized) || KeywordMatcher.isGamblingDomain(normalized)
  }
}

