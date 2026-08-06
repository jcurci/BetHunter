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
  //
  // `onError` é por chave, não um default único: o valor que MANTÉM a proteção é
  // `true` para `enabled` e `false` para `revoked`/`premiumPaused`. O DB é
  // multi-processo e pode dar busy no meio de um refresh de 300k linhas — sem este
  // catch, a exceção subia até a thread de pacotes da VPN e matava o processo.
  private fun readFlag(key: String, onError: Boolean = false): Boolean {
    return try {
      domainsDb.getFlagOrNull(key)?.let { return it }
      val legacy = prefs.getBoolean(key, false)
      domainsDb.setFlag(key, legacy)
      legacy
    } catch (e: Exception) {
      Log.w("BlockedDomainsRepository", "Falha ao ler flag '$key' — assumindo $onError", e)
      onError
    }
  }

  fun setBlockingEnabled(enabled: Boolean) {
    domainsDb.setFlag(KEY_ENABLED, enabled)
  }

  /** Erro de leitura devolve `true`: na dúvida, mantém a proteção (mesma regra de [isPremiumLeaseValid]). */
  fun isBlockingEnabled(): Boolean = readFlag(KEY_ENABLED, onError = true)

  /**
   * Revogação pelo sistema (outra VPN assumiu ou consentimento retirado).
   * Diferente de isBlockingEnabled(), que representa a intenção do usuário e
   * NÃO deve ser zerada num revoke — reativar exige VpnService.prepare() via Activity.
   */
  fun setRevoked(revoked: Boolean) {
    domainsDb.setFlag(KEY_REVOKED, revoked)
  }

  /** Erro de leitura devolve `false`: quem decide de verdade é o `prepare()` do sistema (ver VpnConsent). */
  fun isRevoked(): Boolean = readFlag(KEY_REVOKED, onError = false)

  /**
   * Bloqueio pausado por assinatura expirada (confirmada pelo backend). Diferente
   * de setBlockingEnabled(false): a INTENÇÃO do usuário é preservada, então basta
   * o premium voltar para o enforcement religar sozinho. O health worker respeita
   * a pausa e não fica brigando para subir a VPN.
   */
  fun setPremiumPaused(paused: Boolean) {
    domainsDb.setFlag(KEY_PREMIUM_PAUSED, paused)
  }

  /** Erro de leitura devolve `false`: não pausa sem prova; a licença segue como rede de segurança. */
  fun isPremiumPaused(): Boolean = readFlag(KEY_PREMIUM_PAUSED, onError = false)

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
    // Confirmação de verdade recomeça a contagem de cortesias: as extensões são
    // para atravessar um período SEM contato, não um saldo que se esgota na vida
    // do assinante.
    setLeaseGraceUsed(0)
  }

  /**
   * Ainda há cortesia a conceder se a licença estiver vencida.
   *
   * Existe para os pontos que decidem ANTES do serviço (health worker, boot,
   * watchdog, sync da Home): sem consultar isto, eles barrariam um start que o
   * `isPremiumAllowed()` concederia, e a proteção ficaria caída esperando um start
   * que ninguém faria.
   */
  fun hasLeaseGraceAvailable(): Boolean = getLeaseGraceUsed() < MAX_LEASE_GRACE_EXTENSIONS

  /**
   * Extensões de cortesia já concedidas à licença — ver [consumeLeaseGrace].
   */
  fun getLeaseGraceUsed(): Int = try {
    (domainsDb.getLongOrNull(KEY_PREMIUM_LEASE_GRACE_USED) ?: 0L).toInt()
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao ler cortesias de licença", e)
    // Erro de leitura vira "nenhuma usada": o teto existe para conter abuso, e
    // errar para o lado de manter a proteção é a regra desta classe inteira.
    0
  }

  private fun setLeaseGraceUsed(value: Int) {
    try {
      domainsDb.setLong(KEY_PREMIUM_LEASE_GRACE_USED, value.toLong())
    } catch (e: Exception) {
      Log.w("BlockedDomainsRepository", "Falha ao gravar cortesias de licença", e)
    }
  }

  /**
   * Estende a licença por conta própria quando ela venceu sem que NINGUÉM tenha
   * confirmado o fim da assinatura, e devolve se a cortesia foi concedida.
   *
   * Existe porque "licença vencida" era tratada como prova de não-assinatura, e não
   * é: o JWT dura 30 dias sem refresh, e quando ele expira o worker de enforcement
   * fica inerte por falta de token. Um assinante em dia que simplesmente não abre o
   * app perdia a proteção em silêncio, sem nada capaz de trazê-la de volta.
   *
   * Assimetria deliberada: cada cortesia é uma janela a mais de bloqueio para quem
   * talvez já não pague — e o bloqueador não libera nenhum conteúdo pago, então o
   * custo disso é próximo de zero. Já o erro oposto, tirar a proteção de quem está
   * pagando, é o dano que o produto existe para evitar. O teto é o que impede a
   * cortesia de virar acesso vitalício; quem tem `premiumPaused` (negativa
   * confirmada) nunca chega aqui.
   */
  fun consumeLeaseGrace(): Boolean {
    val used = getLeaseGraceUsed()
    if (used >= MAX_LEASE_GRACE_EXTENSIONS) return false
    setLeaseGraceUsed(used + 1)
    setPremiumLeaseUntil(System.currentTimeMillis() + LEASE_GRACE_EXTENSION_MS)
    return true
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

  /**
   * Tentativas consecutivas do watchdog de restart, para o backoff exponencial.
   * Zerada em todo `establish()` bem-sucedido.
   *
   * Vive no KV do SQLite porque quem incrementa é o processo `:vpn` (no onDestroy)
   * e o alarme pode reerguer o serviço num processo novo — um contador em memória
   * seria zerado justamente a cada volta do ciclo que ele existe para conter.
   */
  fun getRestartAttempts(): Int = try {
    (domainsDb.getLongOrNull(KEY_RESTART_ATTEMPTS) ?: 0L).toInt()
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao ler contador de restart", e)
    0
  }

  fun setRestartAttempts(attempts: Int) {
    try {
      domainsDb.setLong(KEY_RESTART_ATTEMPTS, attempts.toLong())
    } catch (e: Exception) {
      // Perder o contador só piora o backoff, nunca a proteção — nunca propagar.
      Log.w("BlockedDomainsRepository", "Falha ao gravar contador de restart", e)
    }
  }

  /**
   * Quando a notificação de reativação foi mostrada pela última vez. Usada para
   * não re-postar o mesmo alerta a cada volta de um ciclo de start/stop.
   */
  fun getLastReactivationNoticeAt(): Long = try {
    domainsDb.getLongOrNull(KEY_LAST_REACTIVATION_NOTICE_AT) ?: 0L
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao ler timestamp da notificação", e)
    0L
  }

  fun setLastReactivationNoticeAt(timestamp: Long) {
    try {
      domainsDb.setLong(KEY_LAST_REACTIVATION_NOTICE_AT, timestamp)
    } catch (e: Exception) {
      Log.w("BlockedDomainsRepository", "Falha ao gravar timestamp da notificação", e)
    }
  }

  /**
   * O laço de leitura da tun está vivo (1) ou saiu (0).
   *
   * `VpnStatus.isVpnActive()` só prova que a interface EXISTE. Se o laço morre com
   * a tun de pé — exceção de I/O, processo em estado ruim — todo o DNS do aparelho
   * cai no vácuo enquanto o sistema, o health worker e a Home continuam reportando
   * "protegido". Este par (tun viva + laço morto) é o que torna esse estado
   * detectável de fora do processo `:vpn`.
   */
  fun setLoopRunning(running: Boolean) {
    try {
      domainsDb.setFlag(KEY_LOOP_RUNNING, running)
    } catch (e: Exception) {
      Log.w("BlockedDomainsRepository", "Falha ao gravar estado do laço", e)
    }
  }

  /** false só quando o laço PROVADAMENTE saiu; erro de leitura devolve true (não acusa queda). */
  fun isLoopRunning(): Boolean = try {
    domainsDb.getFlagOrNull(KEY_LOOP_RUNNING) ?: true
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao ler estado do laço", e)
    true
  }

  /**
   * O usuário tocou na notificação de reativação e ainda não foi atendido.
   *
   * A notificação promete "toque para reativar", mas reativar exige
   * `VpnService.prepare()` a partir de uma Activity — ou seja, passar pela jornada
   * do JS. Uma flag persistida (e não um evento no bridge) porque a notificação
   * costuma abrir o app do zero: um `DeviceEventEmitter` disparado antes de o JS
   * subir se perderia, e o toque não faria nada. Vive no KV do SQLite porque quem
   * grava é a Activity e quem lê é o módulo RN.
   */
  fun setReactivationRequested(requested: Boolean) {
    try {
      domainsDb.setFlag(KEY_REACTIVATION_REQUESTED, requested)
    } catch (e: Exception) {
      Log.w("BlockedDomainsRepository", "Falha ao gravar pedido de reativação", e)
    }
  }

  fun isReactivationRequested(): Boolean = readFlag(KEY_REACTIVATION_REQUESTED, onError = false)

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

  /**
   * Sinais de "VPN sempre ativa" (always-on). Vão para o KV do SQLite e NÃO para
   * o prefs porque o sinal do sistema é gravado pelo processo :vpn e lido pelo
   * processo principal — SharedPreferences não é confiável entre processos (é
   * exatamente disso que o VpnEventLog sofre).
   *
   * Ao contrário de isPremiumLeaseValid(), aqui o default é FAIL-CLOSED: erro de
   * leitura devolve 0 (= não detectado) e o passo é pedido de novo. O risco é
   * repetir um pedido já cumprido, não desarmar a proteção de quem paga.
   */
  fun setAlwaysOnSystemStartAt(timestamp: Long) {
    domainsDb.setLong(KEY_ALWAYS_ON_SYSTEM_START_AT, timestamp)
  }

  fun getAlwaysOnSystemStartAt(): Long = try {
    domainsDb.getLongOrNull(KEY_ALWAYS_ON_SYSTEM_START_AT) ?: 0L
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao ler sinal de always-on do sistema", e)
    0L
  }

  /** Timestamp do autoatestado do usuário ("Já ativei"). 0L = nunca atestado. */
  fun setAlwaysOnAttestedAt(timestamp: Long) {
    domainsDb.setLong(KEY_ALWAYS_ON_ATTESTED_AT, timestamp)
  }

  fun getAlwaysOnAttestedAt(): Long = try {
    domainsDb.getLongOrNull(KEY_ALWAYS_ON_ATTESTED_AT) ?: 0L
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao ler autoatestado de always-on", e)
    0L
  }

  /**
   * Negativa definitiva do sistema: derruba o latch do sinal do sistema e o
   * autoatestado juntos. Sem isso, os dois mentiriam para sempre depois que o
   * usuário desligasse a opção nas configurações.
   */
  fun clearAlwaysOnSignals() {
    setAlwaysOnSystemStartAt(0L)
    setAlwaysOnAttestedAt(0L)
  }

  fun setBlockedDomains(domains: List<String>) {
    val cleaned = domains
      .mapNotNull { normalizeDomain(it) }
      .toSet()
    domainsDb.replaceAll(cleaned)
  }

  // Não existe mais um "leia a lista inteira": materializar as ~311 mil strings era
  // o pico de memória que derrubava o processo :vpn, e a única razão para isso
  // existir (reconstruir a trie) acabou. Consulta pontual, ver isAnyDomainBlocked.

  /**
   * true se algum dos sufixos candidatos está na blocklist. Caminho quente do
   * bloqueio — ver [BlockedDomainsDb.isAnyBlocked].
   *
   * Falha de leitura devolve `false`, ou seja, NÃO bloqueia. É a única decisão do
   * projeto que falha para o lado de não proteger, e de propósito: o contrário
   * seria responder NXDOMAIN para tudo enquanto o banco estivesse indisponível —
   * o aparelho inteiro sem internet, que é um estrago maior e mais difícil de
   * atribuir do que um domínio que passou.
   */
  fun isAnyDomainBlocked(candidates: Collection<String>): Boolean = try {
    domainsDb.isAnyBlocked(candidates)
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao consultar blocklist — deixando passar", e)
    false
  }

  /**
   * Só os IPs vindos da lista remota, sem os defaults do app e sem o filtro da
   * allowlist. É o que o BlocklistManager compara para saber se o refresh
   * realmente mexeu na Camada B — e mexer nela exige reiniciar o túnel.
   */
  fun getListBlockedIps(): Set<String> = domainsDb.getAllIps()

  /**
   * IPs bloqueados (Camada B). Sempre inclui os defaults (ofensores conhecidos) em
   * união com os curados no DB, para os defaults nunca sumirem. Lida pelo :vpn no
   * startVpn() para criar as rotas /32.
   */
  fun getBlockedIps(): Set<String> =
    (DEFAULT_BLOCKED_IPS + domainsDb.getAllIps()) - IP_ALLOWLIST

  fun setBlockedIps(ips: Collection<String>) {
    // Sanitiza na escrita também: nenhum chamador consegue plantar no DB algo que
    // viraria rota /32 inválida (ou pior, rota para dentro da rede local).
    domainsDb.replaceAllIps(ips.mapNotNull { blockableIpv4OrNull(it) }.toSet())
  }

  fun getBlockedDomainsCount(): Int = domainsDb.count()

  /**
   * Tenta virar o único refresh de blocklist em andamento — ver
   * [BlockedDomainsDb.tryAcquireLock].
   *
   * Erro de banco devolve `true` (segue com o refresh): o lock existe para evitar
   * trabalho duplicado, não para autorizar a atualização da lista. Falhar aqui não
   * pode ser motivo para a blocklist parar de ser atualizada.
   */
  fun tryAcquireRefreshLock(ttlMs: Long): Boolean = try {
    domainsDb.tryAcquireLock(KEY_REFRESH_LOCK_UNTIL, System.currentTimeMillis(), ttlMs)
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao adquirir lock de refresh", e)
    true
  }

  fun releaseRefreshLock() {
    try {
      domainsDb.releaseLock(KEY_REFRESH_LOCK_UNTIL)
    } catch (e: Exception) {
      // O TTL do lock cobre este caso: no pior cenário, o próximo refresh espera
      // a janela vencer em vez de começar na hora.
      Log.w("BlockedDomainsRepository", "Falha ao liberar lock de refresh", e)
    }
  }

  fun getLastFetchTimestamp(): Long = prefs.getLong(KEY_LAST_FETCH, 0L)

  fun setLastFetchTimestamp(timestamp: Long) {
    prefs.edit().putLong(KEY_LAST_FETCH, timestamp).apply()
  }

  fun isLogEnabled(): Boolean = prefs.getBoolean(KEY_LOG_ENABLED, false)

  fun setLogEnabled(enabled: Boolean) {
    prefs.edit().putBoolean(KEY_LOG_ENABLED, enabled).apply()
  }

  /**
   * Versão do PARSER que interpretou a lista já baixada (não a versão da lista).
   *
   * Existe porque o cache é validado por ETag: quando só a forma de ler o
   * arquivo muda, o conteúdo remoto continua idêntico, o servidor responde 304 e
   * a lista local permanece interpretada pela regra antiga — para sempre, até
   * alguém publicar algo novo upstream. Vive no KV do SQLite (e não no prefs,
   * onde está o ETag) porque é lido e escrito pelos dois processos.
   */
  fun getIngestVersion(): Long = try {
    domainsDb.getLongOrNull(KEY_INGEST_VERSION) ?: 0L
  } catch (e: Exception) {
    Log.w("BlockedDomainsRepository", "Falha ao ler ingest version", e)
    0L
  }

  fun setIngestVersion(version: Long) {
    domainsDb.setLong(KEY_INGEST_VERSION, version)
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
    private const val KEY_RESTART_ATTEMPTS = "vpn_restart_attempts"
    private const val KEY_LAST_REACTIVATION_NOTICE_AT = "last_reactivation_notice_at"
    private const val KEY_LOOP_RUNNING = "vpn_loop_running"
    private const val KEY_REFRESH_LOCK_UNTIL = "blocklist_refresh_lock_until"
    private const val KEY_REACTIVATION_REQUESTED = "reactivation_requested"

    /** Folga em cima do vencimento real, para a janela em que a renovação ainda não foi confirmada. */
    private const val LEASE_GRACE_MS = 7L * 24 * 60 * 60 * 1000

    /** Entitlement sem data de vencimento (vitalício): renovado a cada confirmação. */
    private const val LIFETIME_LEASE_MS = 365L * 24 * 60 * 60 * 1000

    private const val KEY_PREMIUM_LEASE_GRACE_USED = "premium_lease_grace_used"

    /**
     * Teto de extensões automáticas — ver [consumeLeaseGrace]. Três de 30 dias dão
     * ~90 dias para o usuário abrir o app ao menos uma vez antes de a proteção
     * realmente parar. Calibrar aqui.
     */
    private const val MAX_LEASE_GRACE_EXTENSIONS = 3
    private const val LEASE_GRACE_EXTENSION_MS = 30L * 24 * 60 * 60 * 1000
    private const val KEY_BATTERY_EXEMPTION_REQUESTED = "battery_exemption_requested"
    private const val KEY_BATTERY_WARNING_CONFIRMED_AT = "battery_warning_confirmed_at"

    // KV do SQLite (cross-process) — ver setAlwaysOnSystemStartAt.
    private const val KEY_ALWAYS_ON_SYSTEM_START_AT = "always_on_system_start_at"
    private const val KEY_ALWAYS_ON_ATTESTED_AT = "always_on_attested_at"

    private const val KEY_INGEST_VERSION = "blocklist_ingest_version"

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
      "23bet36.com",
      // Par do domínio com os IPs da betweb logo abaixo, igual 23bet36.com está
      // para 211.43.149.99: sozinho, `betweb` não casa nem na trie nem no
      // KeywordMatcher (BET_REGEX exige `bet` isolado por `.`/`-`/borda, e
      // "betweb" não isola), então sem esta entrada o domínio só bloqueia
      // enquanto a lista remota estiver baixada.
      "betweb.com"
    )

    // IPs de destino conhecidos (Camada B) — ex.: servidor para onde a 23bet
    // redireciona. Curado manualmente a partir de IPs observados. NÃO derivado da
    // lista de domínios (resolver domínio dá IP de CDN → over-block).
    //
    // Piso embutido no app: a lista remota também alimenta a Camada B (ver
    // BlocklistManager), mas estes ficam garantidos mesmo sem rede/refresh.
    val DEFAULT_BLOCKED_IPS = setOf(
      "211.43.149.99",
      // betweb — acessada por IP cru em porta alta (:36249) e também em :443.
      // O segundo endereço veio do CN do certificado servido pelo primeiro; os
      // dois são EC2 em sa-east-1 servindo /betweb.com/ com resposta idêntica,
      // então bloquear só um deixa a casa acessível.
      "15.229.221.132",
      "18.228.51.151"
    )

    /**
     * IPs que NUNCA viram rota, mesmo vindo da lista remota.
     *
     * A lista upstream mistura curadoria de terceiros com o que o nosso
     * `betting-link` publica, e nem tudo que está lá é casa de aposta. Filtrado
     * na leitura (getBlockedIps) e não na ingestão, para valer também sobre
     * bases já gravadas e sobrescrever qualquer re-adição upstream.
     */
    val IP_ALLOWLIST = setOf(
      // Electronic Arts. Provavelmente incluído upstream por loot box de
      // FIFA/Ultimate Team; bloquear derrubaria jogos legítimos dos assinantes.
      "159.153.253.16"
    )

    /**
     * Reconhece um IPv4 que pode virar rota /32 na Camada B, ou null.
     *
     * Existe porque `normalizeDomain` aceita "15.229.221.132" como domínio
     * válido (o DOMAIN_REGEX casa dígitos e pontos, e há ponto separando
     * labels) — o IP ia parar na trie de DNS, onde nunca seria consultado:
     * navegador não resolve nome nenhum quando o host da URL já é um IP.
     * Por isso a classificação de IP tem que rodar ANTES da de domínio.
     *
     * As faixas rejeitadas não são preciosismo: uma linha malformada de arquivo
     * `hosts` na lista remota viraria rota para dentro da rede local do usuário,
     * e o runLoop descarta tudo que não é DNS — ou seja, blackhole no roteador
     * doméstico dele.
     */
    fun blockableIpv4OrNull(input: String?): String? {
      if (input == null) return null
      val candidate = input.trim().removeSuffix("^")
      val parts = candidate.split('.')
      if (parts.size != 4) return null

      val octets = IntArray(4)
      for (i in 0 until 4) {
        val part = parts[i]
        if (part.isEmpty() || part.length > 3) return null
        // Zero à esquerda é ambíguo (há parser que lê como octal) — recusa.
        if (part.length > 1 && part[0] == '0') return null
        if (!part.all { it in '0'..'9' }) return null
        val value = part.toIntOrNull() ?: return null
        if (value !in 0..255) return null
        octets[i] = value
      }

      val a = octets[0]
      val b = octets[1]
      if (a == 0) return null                    // "this network"
      if (a == 10) return null                   // privado
      if (a == 127) return null                  // loopback
      if (a == 100 && b in 64..127) return null  // CGNAT (operadoras)
      if (a == 169 && b == 254) return null      // link-local
      if (a == 172 && b in 16..31) return null   // privado
      if (a == 192 && b == 168) return null      // privado
      if (a >= 224) return null                  // multicast, reservado, broadcast

      return candidate
    }

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

