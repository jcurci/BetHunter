package com.bethunter.app.repository

import android.content.Context
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class BlockedDomainsRepository(private val context: Context) {
  private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  private val domainsDb = BlockedDomainsDb(context)

  // Prefs separado e criptografado só pra sessão de auth (token JWT), usado
  // pelo SubscriptionEnforcementWorker pra checar assinatura em background.
  private val securePrefs by lazy {
    try {
      val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
      EncryptedSharedPreferences.create(
        context,
        SECURE_PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
      )
    } catch (e: Exception) {
      // Keystore corrompida/indisponível em algum device — não pode derrubar o
      // app; sem sessão sincronizada, o worker de enforcement só fica inerte
      // (fail-open, mesma filosofia do resto do bloqueador).
      Log.e("BlockedDomainsRepository", "Failed to create encrypted prefs", e)
      null
    }
  }

  // enabled/revoked ficam no SQLite (cross-process): a VPN roda no processo :vpn e o
  // módulo RN no processo principal — ambos precisam enxergar a MESMA verdade.
  // SharedPreferences não é confiável entre processos. readFlag migra o valor legado
  // do prefs na primeira leitura (instalações anteriores à mudança de processo).
  private fun readFlag(key: String): Boolean {
    domainsDb.getFlagOrNull(key)?.let { return it }
    val legacy = prefs.getBoolean(key, false)
    domainsDb.setFlag(key, legacy)
    return legacy
  }

  fun setBlockingEnabled(enabled: Boolean) {
    domainsDb.setFlag(KEY_ENABLED, enabled)
  }

  fun isBlockingEnabled(): Boolean = readFlag(KEY_ENABLED)

  /**
   * Revogação pelo sistema (outra VPN assumiu ou consentimento retirado).
   * Diferente de isBlockingEnabled(), que representa a intenção do usuário e
   * NÃO deve ser zerada num revoke — reativar exige VpnService.prepare() via Activity.
   */
  fun setRevoked(revoked: Boolean) {
    domainsDb.setFlag(KEY_REVOKED, revoked)
  }

  fun isRevoked(): Boolean = readFlag(KEY_REVOKED)

  /**
   * Bloqueio pausado por assinatura expirada (confirmada pelo backend). Diferente
   * de setBlockingEnabled(false): a INTENÇÃO do usuário é preservada, então basta
   * o premium voltar para o enforcement religar sozinho. O health worker respeita
   * a pausa e não fica brigando para subir a VPN.
   */
  fun setPremiumPaused(paused: Boolean) {
    domainsDb.setFlag(KEY_PREMIUM_PAUSED, paused)
  }

  fun isPremiumPaused(): Boolean = readFlag(KEY_PREMIUM_PAUSED)

  /**
   * Licença que o PRÓPRIO serviço de VPN confere para continuar filtrando.
   *
   * `premiumPaused` só chega até a VPN se alguém mandar (JS ou worker); se o
   * aviso se perde — reboot, restart sticky, app desinstalado do foreground,
   * logout que desliga o enforcement — a VPN seguia bloqueando para sempre.
   * A licença inverte isso: o serviço só filtra enquanto tem prazo válido, e
   * quem confirma o premium é que renova.
   *
   * `untilMs` é absoluto e calculado por quem confirmou, a partir do vencimento
   * REAL da assinatura (ver blockerPremiumGate.ts e o worker de enforcement) —
   * não é um cronômetro cego, senão um assinante mensal perderia a proteção
   * antes da renovação.
   */
  fun setPremiumLeaseUntil(untilMs: Long) {
    domainsDb.setLong(KEY_PREMIUM_LEASE_UNTIL, untilMs)
  }

  fun renewPremiumLease(expiresAtMs: Long?) {
    setPremiumLeaseUntil(leaseUntilFor(expiresAtMs))
  }

  fun revokePremiumLease() {
    setPremiumLeaseUntil(0L)
  }

  /**
   * FAIL-OPEN por construção — as três regras abaixo não são detalhe, são o que
   * impede esta licença de virar um jeito novo de derrubar a proteção de quem
   * está pagando (foi exatamente isso que aconteceu em 18/07 por outro caminho):
   *
   * 1. Chave ausente = válida. Instalação que já existia e nunca gravou o campo
   *    é tratada como em dia; a primeira confirmação preenche. Sem isto, TODO
   *    assinante atual perderia a VPN no primeiro update do app.
   * 2. Erro de leitura = válida. O DB é multi-processo (busy_timeout=3000);
   *    SQLite ocupado ou valor corrompido nunca podem desarmar o bloqueio.
   * 3. Só derruba com valor lido com sucesso e comprovadamente vencido.
   */
  fun isPremiumLeaseValid(): Boolean {
    return try {
      val until = domainsDb.getLongOrNull(KEY_PREMIUM_LEASE_UNTIL) ?: return true
      until > System.currentTimeMillis()
    } catch (e: Exception) {
      Log.w("BlockedDomainsRepository", "Falha ao ler licença de premium — mantendo bloqueio", e)
      true
    }
  }

  private fun leaseUntilFor(expiresAtMs: Long?): Long {
    val base = expiresAtMs ?: return System.currentTimeMillis() + LIFETIME_LEASE_MS
    return base + LEASE_GRACE_MS
  }

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

  /**
   * IPs bloqueados (Camada B). Sempre inclui os defaults (ofensores conhecidos) em
   * união com os curados no DB, para os defaults nunca sumirem. Lida pelo :vpn no
   * startVpn() para criar as rotas /32.
   */
  fun getBlockedIps(): Set<String> = DEFAULT_BLOCKED_IPS + domainsDb.getAllIps()

  fun setBlockedIps(ips: Collection<String>) {
    domainsDb.replaceAllIps(ips.toSet())
  }

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

  fun setAuthSession(token: String?, apiBaseUrl: String?) {
    securePrefs?.edit()
      ?.putString(KEY_AUTH_TOKEN, token)
      ?.putString(KEY_API_BASE_URL, apiBaseUrl)
      ?.apply()
  }

  fun getAuthToken(): String? = securePrefs?.getString(KEY_AUTH_TOKEN, null)

  fun getApiBaseUrl(): String? = securePrefs?.getString(KEY_API_BASE_URL, null)

  fun clearAuthSession() {
    securePrefs?.edit()
      ?.remove(KEY_AUTH_TOKEN)
      ?.remove(KEY_API_BASE_URL)
      ?.apply()
  }

  companion object {
    private const val PREFS_NAME = "bet_blocker"
    private const val SECURE_PREFS_NAME = "bet_blocker_secure"
    private const val KEY_AUTH_TOKEN = "auth_token"
    private const val KEY_API_BASE_URL = "api_base_url"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_REVOKED = "vpn_revoked_pending_reactivation"
    private const val KEY_PREMIUM_PAUSED = "premium_paused"
    private const val KEY_PREMIUM_LEASE_UNTIL = "premium_lease_until"

    /** Folga em cima do vencimento real, para a janela em que a renovação ainda não foi confirmada. */
    private const val LEASE_GRACE_MS = 7L * 24 * 60 * 60 * 1000

    /** Entitlement sem data de vencimento (vitalício): renovado a cada confirmação. */
    private const val LIFETIME_LEASE_MS = 365L * 24 * 60 * 60 * 1000
    private const val KEY_BATTERY_EXEMPTION_REQUESTED = "battery_exemption_requested"
    private const val KEY_BATTERY_WARNING_CONFIRMED_AT = "battery_warning_confirmed_at"
    private const val KEY_LAST_FETCH = "last_fetch_timestamp"
    private const val KEY_LOG_ENABLED = "debug_logs_enabled"
    private const val KEY_ETAG = "blocked_domains_etag"

    private val DOMAIN_REGEX = Regex("^[a-z0-9.-]+$")
    // Compilado uma vez: normalizeDomain roda por query DNS (hot path) e ~300k× por
    // load da blocklist — recompilar o regex a cada chamada custava caro.
    private val WHITESPACE_REGEX = Regex("""\s+""")
    val DEFAULT_BLOCKED_DOMAINS = setOf(
      "bet365.com",
      "betfair.com",
      "blaze.com",
      "pokerstars.com",
      "1xbet.com",
      "23bet36.com"
    )

    // IPs de destino conhecidos (Camada B) — ex.: servidor para onde a 23bet
    // redireciona. Curado manualmente a partir de IPs observados. NÃO derivado da
    // lista de domínios (resolver domínio dá IP de CDN → over-block).
    val DEFAULT_BLOCKED_IPS = setOf(
      "211.43.149.99"
    )

    fun normalizeDomain(input: String?): String? {
      if (input == null) return null
      var candidate = input.trim().lowercase()
        .substringBefore("#")
        .substringBefore("//")
        .trim()
      if (candidate.isBlank()) return null

      val tokens = candidate.split(WHITESPACE_REGEX)
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

