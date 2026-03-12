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
    return trie.matches(normalized)
  }
}

