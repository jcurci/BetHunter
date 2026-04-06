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
    private const val GIST_RAW_URL = "https://gist.githubusercontent.com/gilberto-009199/5e4672816f5db6c4bc055f209ae2adf0/raw/latin_america_blacklist_bets_cassino_brazil.txt"
    private val REFRESH_INTERVAL_MS = TimeUnit.HOURS.toMillis(24)
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
    val domains = fetchRemoteBlocklist() ?: return false
    if (domains.isEmpty()) {
      Log.i(TAG, "Remote blocklist returned no valid domains")
      return false
    }

    repository.setBlockedDomains(domains.toList())
    repository.setLastFetchTimestamp(System.currentTimeMillis())
    return true
  }

  private fun fetchRemoteBlocklist(): Set<String>? {
    var connection: HttpURLConnection? = null
    return try {
      val url = URL(GIST_RAW_URL)
      connection = url.openConnection() as HttpURLConnection
      connection.requestMethod = "GET"
      connection.connectTimeout = 8000
      connection.readTimeout = 8000
      connection.instanceFollowRedirects = true

      if (connection.responseCode != HttpURLConnection.HTTP_OK) {
        Log.w(TAG, "Failed to fetch remote blocklist: ${connection.responseCode}")
        return null
      }

      val reader = BufferedReader(InputStreamReader(connection.inputStream, Charsets.UTF_8))
      reader.useLines { lines ->
        lines.mapNotNull { line ->
          val candidate = line.substringBefore('#').substringBefore("//").trim()
          BlockedDomainsRepository.normalizeDomain(candidate)
        }.toSet()
      }
    } catch (error: Exception) {
      Log.w(TAG, "Failed to download remote blocklist", error)
      null
    } finally {
      connection?.disconnect()
    }
  }
}
