package com.bethunter.app.repository

import android.content.Context

class BlockedDomainsRepository(private val context: Context) {
  private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  private val domainsDb = BlockedDomainsDb(context)

  fun setBlockingEnabled(enabled: Boolean) {
    prefs.edit().putBoolean(KEY_ENABLED, enabled).commit()
  }

  fun isBlockingEnabled(): Boolean = prefs.getBoolean(KEY_ENABLED, false)

  /**
   * Revogação pelo sistema (outra VPN assumiu ou consentimento retirado).
   * Diferente de isBlockingEnabled(), que representa a intenção do usuário e
   * NÃO deve ser zerada num revoke — reativar exige VpnService.prepare() via Activity.
   */
  fun setRevoked(revoked: Boolean) {
    prefs.edit().putBoolean(KEY_REVOKED, revoked).commit()
  }

  fun isRevoked(): Boolean = prefs.getBoolean(KEY_REVOKED, false)

  /** true assim que o usuário tocou no fluxo de pedido de isenção pelo menos uma vez. */
  fun setBatteryExemptionRequested(requested: Boolean) {
    prefs.edit().putBoolean(KEY_BATTERY_EXEMPTION_REQUESTED, requested).apply()
  }

  fun isBatteryExemptionRequested(): Boolean = prefs.getBoolean(KEY_BATTERY_EXEMPTION_REQUESTED, false)

  /**
   * Timestamp em que o usuário confirmou manualmente ter concedido a isenção
   * (usado quando a tela do fabricante não propaga para isIgnoringBatteryOptimizations()).
   * 0L = nunca confirmado.
   */
  fun setBatteryWarningConfirmedAt(timestamp: Long) {
    prefs.edit().putLong(KEY_BATTERY_WARNING_CONFIRMED_AT, timestamp).apply()
  }

  fun getBatteryWarningConfirmedAt(): Long = prefs.getLong(KEY_BATTERY_WARNING_CONFIRMED_AT, 0L)

  fun setBlockedDomains(domains: List<String>) {
    val cleaned = domains
      .mapNotNull { normalizeDomain(it) }
      .toSet()
    domainsDb.replaceAll(cleaned)
  }

  fun getBlockedDomains(): Set<String> = domainsDb.getAll()

  fun getBlockedDomainsCount(): Int = domainsDb.count()

  fun getLastFetchTimestamp(): Long = prefs.getLong(KEY_LAST_FETCH, 0L)

  fun setLastFetchTimestamp(timestamp: Long) {
    prefs.edit().putLong(KEY_LAST_FETCH, timestamp).apply()
  }

  fun isLogEnabled(): Boolean = prefs.getBoolean(KEY_LOG_ENABLED, false)

  fun setLogEnabled(enabled: Boolean) {
    prefs.edit().putBoolean(KEY_LOG_ENABLED, enabled).apply()
  }

  fun getETag(): String? = prefs.getString(KEY_ETAG, null)

  fun setETag(etag: String?) {
    prefs.edit().putString(KEY_ETAG, etag).apply()
  }

  companion object {
    private const val PREFS_NAME = "bet_blocker"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_REVOKED = "vpn_revoked_pending_reactivation"
    private const val KEY_BATTERY_EXEMPTION_REQUESTED = "battery_exemption_requested"
    private const val KEY_BATTERY_WARNING_CONFIRMED_AT = "battery_warning_confirmed_at"
    private const val KEY_LAST_FETCH = "last_fetch_timestamp"
    private const val KEY_LOG_ENABLED = "debug_logs_enabled"
    private const val KEY_ETAG = "blocked_domains_etag"

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
        .removePrefix("||")
        .removePrefix("*.")
        .removePrefix(".")
        .substringBefore("/")
        .removeSuffix("^")
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

