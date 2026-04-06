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

  fun getLastFetchTimestamp(): Long = prefs.getLong(KEY_LAST_FETCH, 0L)

  fun setLastFetchTimestamp(timestamp: Long) {
    prefs.edit().putLong(KEY_LAST_FETCH, timestamp).apply()
  }

  fun isLogEnabled(): Boolean = prefs.getBoolean(KEY_LOG_ENABLED, false)

  fun setLogEnabled(enabled: Boolean) {
    prefs.edit().putBoolean(KEY_LOG_ENABLED, enabled).apply()
  }

  companion object {
    private const val PREFS_NAME = "bet_blocker"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_BLOCKED = "blocked_domains"
    private const val KEY_LAST_FETCH = "last_fetch_timestamp"
    private const val KEY_LOG_ENABLED = "debug_logs_enabled"

    private val DOMAIN_REGEX = Regex("^[a-z0-9.-]+$")
    val DEFAULT_BLOCKED_DOMAINS = setOf(
      "bet365.com",
      "betfair.com",
      "blaze.com",
      "pokerstars.com",
      "1xbet.com"
    )

    fun normalizeDomain(input: String?): String? {
      if (input == null) return null
      var candidate = input.trim().lowercase()
        .substringBefore("#")
        .substringBefore("//")
        .trim()
      if (candidate.isBlank()) return null

      val tokens = candidate.split("""\s+""".toRegex())
      if (tokens.size > 1 && (tokens[0] == "0.0.0.0" || tokens[0] == "127.0.0.1")) {
        candidate = tokens[1]
      } else {
        candidate = tokens[0]
      }

      candidate = candidate
        .removePrefix("https://")
        .removePrefix("http://")
        .removePrefix("*.")
        .removePrefix(".")
        .substringBefore("/")
        .trimEnd('.')

      if (candidate.isBlank()) return null
      if (candidate.length > 253) return null
      if (!candidate.contains('.')) return null
      if (!DOMAIN_REGEX.matches(candidate)) return null

      val labels = candidate.split('.')
      if (labels.any { it.isBlank() || it.length > 63 || it.startsWith('-') || it.endsWith('-') }) {
        return null
      }
      return candidate
    }
  }
}

