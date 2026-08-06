package com.bethunter.app.repository

import android.content.Context
import android.util.Log
import com.bethunter.app.diagnostics.VpnEventLog
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * O que um refresh efetivamente mudou.
 *
 * Domínio e IP precisam ser distinguidos porque chegam ao túnel por caminhos
 * diferentes: domínio entra por reload da trie (barato, com a VPN de pé), IP é
 * rota — só pode ser declarada antes do `establish()`, então exige reerguer o
 * túnel. Devolver um Boolean único fazia o IP novo ficar dormindo no banco.
 */
data class RefreshOutcome(
  val domainsChanged: Boolean = false,
  val ipsChanged: Boolean = false
) {
  val anythingChanged: Boolean get() = domainsChanged || ipsChanged

  companion object {
    val NONE = RefreshOutcome()
  }
}

class BlocklistManager(
  private val repository: BlockedDomainsRepository,
  private val context: Context
) {
  companion object {
    private const val TAG = "BlocklistManager"
    private const val GIST_RAW_URL = "https://raw.githubusercontent.com/hidekiiwasa/blacklist-cassino/main/latin_america_blacklist_bets_cassino_brazil.txt"
    private val REFRESH_INTERVAL_MS = TimeUnit.HOURS.toMillis(24)
    private const val MAX_ATTEMPTS = 3
    private const val RETRY_BACKOFF_MS = 1500L
    // Só aplica o piso de sanidade quando já havia uma lista "real" (não os 5
    // domínios default) — evita bloquear a primeira sincronização legítima.
    private const val MIN_SANE_PREVIOUS_SIZE = 1000

    /**
     * Janela do lock de refresh. Generosa porque o pior caso legítimo (baixar 5 MB
     * numa rede ruim e reescrever 311 mil linhas) é lento; o TTL existe só para um
     * processo morto no meio não travar os refreshes seguintes para sempre.
     */
    private val REFRESH_LOCK_TTL_MS = TimeUnit.MINUTES.toMillis(2)

    /**
     * Bump SEMPRE que a forma de interpretar a lista mudar (nova classificação,
     * novo tipo de entrada, mudança em normalizeDomain/blockableIpv4OrNull).
     * NÃO mexer quando só o conteúdo da lista muda — para isso o ETag já serve.
     *
     * v2 = separação de IP e domínio em tabelas distintas.
     */
    private const val INGEST_VERSION = 2L
  }

  private sealed class FetchResult {
    data class Updated(val domains: Set<String>, val ips: Set<String>) : FetchResult()
    object NotModified : FetchResult()
    object Failed : FetchResult()
  }

  fun ensureBlocklistPresent() {
    if (repository.getBlockedDomainsCount() == 0) {
      repository.setBlockedDomains(BlockedDomainsRepository.DEFAULT_BLOCKED_DOMAINS.toList())
      repository.setLastFetchTimestamp(0L)
    }
  }

  fun shouldRefresh(): Boolean {
    val lastFetch = repository.getLastFetchTimestamp()
    val cachedEmpty = repository.getBlockedDomainsCount() == 0
    return cachedEmpty || System.currentTimeMillis() - lastFetch >= REFRESH_INTERVAL_MS
  }

  fun refreshIfStale(): RefreshOutcome {
    if (!shouldRefresh()) return RefreshOutcome.NONE
    return forceRefresh()
  }

  /**
   * Invalida o cache quando quem mudou foi o PARSER, não a lista.
   *
   * O fetch é condicional por ETag. Numa atualização que só muda a forma de
   * interpretar o arquivo — como passar a separar IP de domínio — o conteúdo
   * remoto continua idêntico, o servidor devolve 304 e a lista local segue
   * interpretada pela regra velha até alguém publicar algo novo upstream (dias,
   * e sem hora marcada). Zerar o ETag força um 200 e uma releitura completa no
   * primeiro refresh depois do update.
   */
  private fun ensureIngestVersionFresh() {
    try {
      if (repository.getIngestVersion() == INGEST_VERSION) return
      repository.setETag(null)
      repository.setIngestVersion(INGEST_VERSION)
      Log.i(TAG, "Ingest version changed — dropping ETag to force full re-ingest")
      VpnEventLog.log(context, "blocklist_ingest_version_bump:v=$INGEST_VERSION")
    } catch (e: Exception) {
      // Nunca pode impedir o refresh: no pior caso o 304 volta e a releitura
      // acontece quando a lista mudar upstream.
      Log.w(TAG, "Could not apply ingest version: ${e.message}")
    }
  }

  fun forceRefresh(): RefreshOutcome {
    // Um refresh por vez em TODO o app, nos dois processos. Sem isto, dois
    // downloads simultâneos viravam duas reescritas de ~311 mil linhas disputando
    // o mesmo arquivo SQLite — e o `busy_timeout` de 3 s de quem só queria ler uma
    // flag (a thread de DNS, inclusive) estourava.
    if (!repository.tryAcquireRefreshLock(REFRESH_LOCK_TTL_MS)) {
      Log.i(TAG, "Another blocklist refresh is in progress — skipping")
      return RefreshOutcome.NONE
    }
    return try {
      refreshLocked()
    } finally {
      repository.releaseRefreshLock()
    }
  }

  private fun refreshLocked(): RefreshOutcome {
    ensureIngestVersionFresh()
    repeat(MAX_ATTEMPTS) { attempt ->
      when (val result = fetchFromGist()) {
        is FetchResult.Updated -> {
          if (result.domains.isEmpty()) {
            Log.i(TAG, "Remote blocklist returned no valid domains")
            VpnEventLog.log(context, "blocklist_refresh_empty")
            return RefreshOutcome.NONE
          }
          val previousCount = repository.getBlockedDomainsCount()
          if (previousCount >= MIN_SANE_PREVIOUS_SIZE && result.domains.size < previousCount / 2) {
            // Provável fetch truncado/parcial (ex.: conexão cortada no meio do
            // download de um arquivo grande) — não sobrescreve uma lista boa
            // por uma pior sem confirmação. Vale para os IPs junto: se o corpo
            // veio degradado, nada dele merece confiança.
            Log.w(TAG, "Refusing suspicious blocklist shrink: had $previousCount, got ${result.domains.size}")
            VpnEventLog.log(context, "blocklist_refresh_rejected_shrink:had=$previousCount,got=${result.domains.size}")
            return RefreshOutcome.NONE
          }
          repository.setBlockedDomains(result.domains.toList())
          repository.setLastFetchTimestamp(System.currentTimeMillis())
          Log.i(TAG, "Blocklist updated: ${result.domains.size} domains")
          VpnEventLog.log(context, "blocklist_updated:domains=${result.domains.size}")
          return RefreshOutcome(
            domainsChanged = true,
            ipsChanged = applyIps(result.ips)
          )
        }
        is FetchResult.NotModified -> {
          repository.setLastFetchTimestamp(System.currentTimeMillis())
          Log.i(TAG, "Blocklist unchanged (304 Not Modified)")
          return RefreshOutcome.NONE
        }
        is FetchResult.Failed -> {
          if (attempt < MAX_ATTEMPTS - 1) {
            Log.w(TAG, "Blocklist fetch failed, retrying (attempt ${attempt + 1}/$MAX_ATTEMPTS)")
            Thread.sleep(RETRY_BACKOFF_MS * (attempt + 1))
          }
        }
      }
    }
    Log.w(TAG, "Blocklist refresh failed after $MAX_ATTEMPTS attempts")
    VpnEventLog.log(context, "blocklist_refresh_failed")
    return RefreshOutcome.NONE
  }

  /**
   * Grava os IPs colhidos da lista remota (Camada B).
   *
   * Devolve true só quando o conjunto REALMENTE mudou, porque quem chama usa
   * isso para decidir reerguer o túnel — e reerguer o túnel a cada refresh de
   * hora em hora seria uma janela de desproteção recorrente sem motivo.
   *
   * Espelha o piso de sanidade dos domínios: zero IPs vindos da rede quando
   * havia IPs curados é fetch degradado, não remoção deliberada.
   */
  private fun applyIps(fetched: Set<String>): Boolean {
    val previous = repository.getListBlockedIps()

    if (fetched.isEmpty() && previous.isNotEmpty()) {
      Log.w(TAG, "Refusing empty IP list from remote (had ${previous.size})")
      VpnEventLog.log(context, "blocklist_ips_rejected_empty:had=${previous.size}")
      return false
    }
    if (fetched == previous) return false

    repository.setBlockedIps(fetched)
    Log.i(TAG, "Blocked IP list updated: ${fetched.size} IPs (was ${previous.size})")
    VpnEventLog.log(context, "blocklist_ips_updated:ips=${fetched.size}")
    return true
  }

  private fun fetchFromGist(): FetchResult {
    var connection: HttpURLConnection? = null
    return try {
      val url = URL(GIST_RAW_URL)
      connection = url.openConnection() as HttpURLConnection
      connection.requestMethod = "GET"
      connection.connectTimeout = 8000
      connection.readTimeout = 8000
      connection.instanceFollowRedirects = true

      repository.getETag()?.let { etag ->
        connection.setRequestProperty("If-None-Match", etag)
      }

      when (connection.responseCode) {
        HttpURLConnection.HTTP_NOT_MODIFIED -> FetchResult.NotModified

        HttpURLConnection.HTTP_OK -> {
          // contentLengthLong vem -1 quando o Android descomprime gzip
          // transparentemente (comum nesse host) — nesse caso não dá pra
          // validar o tamanho, mas o piso de sanidade em forceRefresh() ainda
          // protege contra um corpo cortado no meio.
          val expectedLength = connection.contentLengthLong
          val bytes = connection.inputStream.use { it.readBytes() }
          if (expectedLength > 0 && bytes.size.toLong() < expectedLength) {
            Log.w(TAG, "Truncated blocklist response: got ${bytes.size} bytes, expected $expectedLength")
            return FetchResult.Failed
          }

          // A lista mistura domínios e IPs na mesma sintaxe (`alvo^`), e os dois
          // precisam ir para tabelas diferentes: domínio é sinkhole de DNS, IP é
          // rota /32. A ordem do teste é o que importa aqui — normalizeDomain
          // aceita "15.229.221.132" como domínio válido, então classificar IP
          // depois faria o IP ser engolido pela trie e nunca bloquear nada.
          val domains = LinkedHashSet<String>()
          val ips = LinkedHashSet<String>()
          bytes.toString(Charsets.UTF_8).lineSequence().forEach { line ->
            val candidate = line.substringBefore('#').substringBefore("//").trim()
            if (candidate.isEmpty()) return@forEach
            val ip = BlockedDomainsRepository.blockableIpv4OrNull(candidate)
            if (ip != null) {
              ips.add(ip)
              return@forEach
            }
            BlockedDomainsRepository.normalizeDomain(candidate)?.let { domains.add(it) }
          }

          // Só grava o ETag depois de confirmar que o corpo foi lido por
          // completo — gravar antes faz o próximo refresh mandar
          // If-None-Match pro conteúdo cheio e receber 304 mesmo com a lista
          // local truncada, travando o app numa lista incompleta pra sempre.
          val etag = connection.getHeaderField("ETag")
            ?: connection.getHeaderField("Last-Modified")
          if (etag != null) repository.setETag(etag)

          FetchResult.Updated(domains, ips)
        }

        else -> {
          Log.w(TAG, "Failed to fetch remote blocklist: ${connection.responseCode}")
          FetchResult.Failed
        }
      }
    } catch (error: Exception) {
      Log.w(TAG, "Failed to download remote blocklist", error)
      FetchResult.Failed
    } finally {
      connection?.disconnect()
    }
  }
}
