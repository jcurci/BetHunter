package com.bethunter.app.repository

import android.content.Context
import android.util.Log
import com.bethunter.app.diagnostics.VpnEventLog
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

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
  }

  private sealed class FetchResult {
    data class Updated(val domains: Set<String>) : FetchResult()
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

  fun refreshIfStale(): Boolean {
    if (!shouldRefresh()) return false
    return forceRefresh()
  }

  fun forceRefresh(): Boolean {
    repeat(MAX_ATTEMPTS) { attempt ->
      when (val result = fetchFromGist()) {
        is FetchResult.Updated -> {
          if (result.domains.isEmpty()) {
            Log.i(TAG, "Remote blocklist returned no valid domains")
            VpnEventLog.log(context, "blocklist_refresh_empty")
            return false
          }
          val previousCount = repository.getBlockedDomainsCount()
          if (previousCount >= MIN_SANE_PREVIOUS_SIZE && result.domains.size < previousCount / 2) {
            // Provável fetch truncado/parcial (ex.: conexão cortada no meio do
            // download de um arquivo grande) — não sobrescreve uma lista boa
            // por uma pior sem confirmação.
            Log.w(TAG, "Refusing suspicious blocklist shrink: had $previousCount, got ${result.domains.size}")
            VpnEventLog.log(context, "blocklist_refresh_rejected_shrink:had=$previousCount,got=${result.domains.size}")
            return false
          }
          repository.setBlockedDomains(result.domains.toList())
          repository.setLastFetchTimestamp(System.currentTimeMillis())
          Log.i(TAG, "Blocklist updated: ${result.domains.size} domains")
          VpnEventLog.log(context, "blocklist_updated:domains=${result.domains.size}")
          return true
        }
        is FetchResult.NotModified -> {
          repository.setLastFetchTimestamp(System.currentTimeMillis())
          Log.i(TAG, "Blocklist unchanged (304 Not Modified)")
          return false
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
    return false
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

          val domains = bytes.toString(Charsets.UTF_8).lineSequence()
            .mapNotNull { line ->
              val candidate = line.substringBefore('#').substringBefore("//").trim()
              BlockedDomainsRepository.normalizeDomain(candidate)
            }.toSet()

          // Só grava o ETag depois de confirmar que o corpo foi lido por
          // completo — gravar antes faz o próximo refresh mandar
          // If-None-Match pro conteúdo cheio e receber 304 mesmo com a lista
          // local truncada, travando o app numa lista incompleta pra sempre.
          val etag = connection.getHeaderField("ETag")
            ?: connection.getHeaderField("Last-Modified")
          if (etag != null) repository.setETag(etag)

          FetchResult.Updated(domains)
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
