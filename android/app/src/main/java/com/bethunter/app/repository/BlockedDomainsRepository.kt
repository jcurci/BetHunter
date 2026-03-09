package com.bethunter.app.repository

import android.content.Context

class BlockedDomainsRepository(private val context: Context) {
  private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun setBlockingEnabled(enabled: Boolean) {
    prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
  }

  fun isBlockingEnabled(): Boolean = prefs.getBoolean(KEY_ENABLED, false)

  fun setBlockedDomains(domains: List<String>) {
    val cleaned = domains
      .mapNotNull { normalizeDomain(it) }
      .toSet()
    prefs.edit().putStringSet(KEY_BLOCKED, cleaned).apply()
  }

  fun getBlockedDomains(): Set<String> =
    prefs.getStringSet(KEY_BLOCKED, emptySet()) ?: emptySet()

  companion object {
    private const val PREFS_NAME = "bet_blocker"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_BLOCKED = "blocked_domains"

    fun normalizeDomain(input: String?): String? {
      if (input == null) return null
      val d = input.trim().lowercase()
        .removePrefix("https://")
        .removePrefix("http://")
        .substringBefore("/") // strip path
        .trimEnd('.')
      if (d.isBlank()) return null
      // quick sanity: must contain at least one dot (tld)
      if (!d.contains('.')) return null
      return d
    }
  }
}

