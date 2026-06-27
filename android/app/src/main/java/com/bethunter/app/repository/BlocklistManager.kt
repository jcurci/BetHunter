package com.bethunter.app.repository

import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

class BlocklistManager(
  private val repository: BlockedDomainsRepository
) {
  companion object {
    private const val TAG = "BlocklistManager"
    private const val GIST_RAW_URL = "https://gist.github.com/hidekiiwasa/2fb62fe5fa9781f30a369b1fc41e204f/raw/latin_america_blacklist_bets_cassino_brazil.txt"
    private val REFRESH_INTERVAL_MS = TimeUnit.HOURS.toMillis(24)
  }

  private sealed class FetchResult {
    data class Updated(val domains: Set<String>) : FetchResult()
    object NotModified : FetchResult()
    object Failed : FetchResult()
  }

  fun ensureBlocklistPresent() {
    if (repository.getBlockedDomains().isEmpty()) {
      repository.setBlockedDomains(BlockedDomainsRepository.DEFAULT_BLOCKED_DOMAINS.toList())
      repository.setLastFetchTimestamp(0L)
    }
  }

  fun shouldRefresh(): Boolean {
    val lastFetch = repository.getLastFetchTimestamp()
    val cached = repository.getBlockedDomains()
    return cached.isEmpty() || System.currentTimeMillis() - lastFetch >= REFRESH_INTERVAL_MS
  }

  fun refreshIfStale(): Boolean {
    if (!shouldRefresh()) return false
    return forceRefresh()
  }

  fun forceRefresh(): Boolean {
    return when (val result = fetchFromGist()) {
      is FetchResult.Updated -> {
        if (result.domains.isEmpty()) {
          Log.i(TAG, "Remote blocklist returned no valid domains")
          false
        } else {
          repository.setBlockedDomains(result.domains.toList())
          repository.setLastFetchTimestamp(System.currentTimeMillis())
          Log.i(TAG, "Blocklist updated: ${result.domains.size} domains")
          true
        }
      }
      is FetchResult.NotModified -> {
        repository.setLastFetchTimestamp(System.currentTimeMillis())
        Log.i(TAG, "Blocklist unchanged (304 Not Modified)")
        false
      }
      is FetchResult.Failed -> false
    }
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
          val etag = connection.getHeaderField("ETag")
            ?: connection.getHeaderField("Last-Modified")
          if (etag != null) repository.setETag(etag)

          val reader = BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8))
          val domains = reader.useLines { lines ->
            lines.mapNotNull { line ->
              val candidate = line.substringBefore('#').substringBefore("//").trim()
              BlockedDomainsRepository.normalizeDomain(candidate)
            }.toSet()
          }
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
