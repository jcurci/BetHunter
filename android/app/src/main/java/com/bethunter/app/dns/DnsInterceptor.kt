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
  private val upstreamServers: List<InetAddress> = listOf(
    InetAddress.getByName("1.1.1.1"),
    InetAddress.getByName("8.8.8.8")
  ),
  private val upstreamPort: Int = 53
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
    return forwardToUpstream(queryPayload, queryLength)
  }

  private fun forwardToUpstream(queryPayload: ByteArray, queryLength: Int): ByteArray? {
    DatagramSocket().use { socket ->
      protect(socket)
      socket.soTimeout = 4000
      val packet = DatagramPacket(queryPayload, queryLength)
      val responseBuf = ByteArray(2048)
      val responsePacket = DatagramPacket(responseBuf, responseBuf.size)

      var lastError: Exception? = null
      for (server in upstreamServers) {
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
  }
}

