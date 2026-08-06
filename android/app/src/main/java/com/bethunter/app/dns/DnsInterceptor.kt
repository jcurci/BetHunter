package com.bethunter.app.dns

import android.util.Log
import com.bethunter.app.BuildConfig
import com.bethunter.app.domain.DomainMatcher
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class DnsInterceptor(
  private val domainMatcher: DomainMatcher,
  private val protect: (DatagramSocket) -> Boolean,
  /**
   * Resolvido a cada query (com cache curto lá dentro) e não fixado na construção:
   * o usuário troca de Wi-Fi para dados móveis sem o túnel ser reerguido, e uma
   * lista congelada apontaria para resolvers da rede anterior.
   */
  private val upstreams: () -> List<InetAddress> = { UpstreamDnsProvider.FALLBACKS },
  private val cache: DnsResponseCache = DnsResponseCache(),
  private val upstreamPort: Int = 53,
) {
  fun handleDnsQuery(queryPayload: ByteArray, queryLength: Int): ByteArray? {
    val msg = DnsPacketParser.parseQuery(queryPayload, queryLength) ?: return null
    val q = msg.questions.firstOrNull() ?: return null
    val domain = q.qName

    if (domainMatcher.isBlocked(domain)) {
      if (BuildConfig.DEBUG) {
        Log.i(TAG, "Blocked DNS query for $domain")
      }
      return DnsResponseBuilder.buildNxDomain(msg)
    }

    cache.get(msg)?.let { return it }

    val response = forwardToUpstream(queryPayload, queryLength)
    if (response == null) {
      // Descartar em silêncio deixava o app cliente esperando o próprio timeout —
      // "a internet travou depois que liguei a proteção". SERVFAIL falha rápido.
      Log.w(TAG, "All upstreams failed for $domain — answering SERVFAIL")
      return DnsResponseBuilder.buildServFail(msg)
    }

    cache.put(msg, response)
    return response
  }

  /** Descarta o que estiver cacheado (troca de rede, mudança de blocklist). */
  fun invalidateCache() = cache.clear()

  private fun forwardToUpstream(queryPayload: ByteArray, queryLength: Int): ByteArray? {
    val servers = upstreams()
    if (servers.isEmpty()) return null

    DatagramSocket().use { socket ->
      protect(socket)
      socket.soTimeout = UPSTREAM_TIMEOUT_MS
      val packet = DatagramPacket(queryPayload, queryLength)
      val responseBuf = ByteArray(2048)
      val responsePacket = DatagramPacket(responseBuf, responseBuf.size)

      var lastError: Exception? = null
      for (server in servers) {
        try {
          packet.address = server
          packet.port = upstreamPort
          socket.send(packet)
          socket.receive(responsePacket)
          return responsePacket.data.copyOfRange(0, responsePacket.length)
        } catch (e: Exception) {
          lastError = e
        }
      }
      if (lastError != null) {
        Log.w(TAG, "Upstream DNS forward failed: ${lastError.message}")
      }
      return null
    }
  }

  companion object {
    private const val TAG = "BetBlockerDns"

    /**
     * 2 s por servidor, não 4. Com a lista da rede à frente das reservas públicas,
     * o pior caso encadeia várias tentativas — e cada segundo aqui é um worker
     * preso e uma resolução que o usuário sente.
     */
    private const val UPSTREAM_TIMEOUT_MS = 2_000
  }
}
