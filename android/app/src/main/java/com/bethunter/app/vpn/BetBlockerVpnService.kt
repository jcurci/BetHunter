package com.bethunter.app.vpn

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.system.OsConstants
import android.util.Log
import androidx.core.app.NotificationCompat
import com.bethunter.app.MainActivity
import com.bethunter.app.R
import com.bethunter.app.dns.DnsInterceptor
import com.bethunter.app.domain.DomainMatcher
import com.bethunter.app.repository.BlockedDomainsRepository
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramSocket
import kotlin.concurrent.thread
import android.content.pm.ServiceInfo
import java.net.DatagramPacket
import java.net.InetAddress

class BetBlockerVpnService : VpnService() {
  @Volatile private var running = false
  private var tunInterface: ParcelFileDescriptor? = null
  private var workerThread: Thread? = null

  private lateinit var repository: BlockedDomainsRepository
  private lateinit var domainMatcher: DomainMatcher
  private lateinit var dnsInterceptor: DnsInterceptor

  override fun onCreate() {
    super.onCreate()
    repository = BlockedDomainsRepository(applicationContext)
    domainMatcher = DomainMatcher(repository)
    dnsInterceptor = DnsInterceptor(
      domainMatcher = domainMatcher,
      protect = { socket: DatagramSocket -> protect(socket) }
    )
    startAsForeground()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
        Log.d(TAG, "STOP action received")

        repository.setBlockingEnabled(false)

        stopVpn()

        stopForeground(true)

        stopSelf()

        return START_NOT_STICKY
    }
    
    if (intent?.action == ACTION_RELOAD) {
      Log.i(TAG, "Reload requested")
      try {
        domainMatcher.reload()
      } catch (e: Exception) {
        Log.w(TAG, "Reload failed: ${e.message}")
      }
      return Service.START_STICKY
    }
    if (!repository.isBlockingEnabled()) {
      Log.i(TAG, "Blocking disabled, stopping VPN service")
      stopSelf()
      return Service.START_NOT_STICKY
    }
    if (running) return Service.START_STICKY
    startVpn()
    return Service.START_STICKY
  }

  override fun onDestroy() {
    stopVpn()
    super.onDestroy()

    if (repository.isBlockingEnabled()) {
      Log.i(TAG, "VPN killed unexpectedly, restarting")
      scheduleRestart()
    } else {
      Log.i(TAG, "VPN stopped intentionally")
    }
  }

  override fun onRevoke() {
    Log.w(TAG, "VPN permission revoked")
    repository.setBlockingEnabled(false)
    stopVpn()
    super.onRevoke()
  }

  private fun startVpn() {
    running = true
    val builder = Builder()
      .setSession(SESSION_NAME)
      .setBlocking(true)
      .setMtu(1500)

    // TUN address (we only route DNS to our "fake" DNS IP, so we don't have to forward all traffic)
    builder.addAddress(VPN_ADDRESS, 32)
    builder.addRoute(FAKE_DNS_SERVER, 32)
    builder.addDnsServer(FAKE_DNS_SERVER)

    // Some apps try IPv6 DNS; explicitly disable by not adding IPv6 routes/dns.
    tunInterface = builder.establish()
    if (tunInterface == null) {
      Log.e(TAG, "Failed to establish VPN interface")
      running = false
      return
    }

    val fd = tunInterface!!.fileDescriptor
    val input = FileInputStream(fd)
    val output = FileOutputStream(fd)
    val reader = PacketReader(input)
    val writer = PacketWriter(output)

    workerThread = thread(name = "BetBlockerVpnThread") {
      runLoop(reader, writer)
    }
  }

  private fun stopVpn() {
    running = false
    try {
      workerThread?.interrupt()
    } catch (_: Exception) {}
    workerThread = null
    try {
      tunInterface?.close()
    } catch (_: Exception) {}
    tunInterface = null
    try {
      if (Build.VERSION.SDK_INT >= 24) {
        stopForeground(Service.STOP_FOREGROUND_REMOVE)
      } else {
        @Suppress("DEPRECATION")
        stopForeground(true)
      }
    } catch (_: Exception) {}
  }

  fun stopVpnService() {
    repository.setBlockingEnabled(false)
    stopVpn()
    stopSelf()
  }

  private fun runLoop(reader: PacketReader, writer: PacketWriter) {
    val buffer = ByteArray(32767)
    while (running && !Thread.currentThread().isInterrupted) {
      val length = try {
        reader.read(buffer)
      } catch (e: Exception) {
        Log.w(TAG, "VPN read crash", e)
        break
      }
      if (length <= 0) continue

      val packet = Ipv4UdpPacket.parse(buffer, length) ?: continue
      Log.d(TAG, "Packet port: ${packet.dstPort}")
      // Only intercept UDP/53 (DNS) destined to our fake DNS IP.
      if (packet.protocol != OsConstants.IPPROTO_UDP) continue
      if (packet.dstPort != 53) continue

      val responsePayload = dnsInterceptor.handleDnsQuery(packet.payload, packet.payloadLength) ?: continue
      val responsePacket = Ipv4UdpPacket.buildResponse(
        request = packet,
        responsePayload = responsePayload
      ) ?: continue

      try {
        writer.write(responsePacket, responsePacket.size)
      } catch (e: Exception) {
        Log.w(TAG, "Write failed: ${e.message}")
      }
    }
    running = false
  }

  private fun scheduleRestart() {
    val am = getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(this, BetBlockerVpnService::class.java)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
    val pi = PendingIntent.getService(this, 1, intent, flags)
    val triggerAt = System.currentTimeMillis() + 1500
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
    } else {
      am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi)
    }
    Log.i(TAG, "Scheduled VPN restart in 1.5s")
  }

  fun handleDnsQuery(payload: ByteArray, length: Int): ByteArray? {
    val domain = parseDomain(payload)

    if (domainMatcher.isBlocked(domain)) {
        Log.d("BetBlocker", "Blocked domain: $domain")
        return buildBlockedResponse(payload)
    }

    // forward para DNS real
    return forwardDns(payload)
  }

  private fun forwardDns(query: ByteArray): ByteArray {
    return try {
        val socket = DatagramSocket()
        protect(socket)
        
        socket.soTimeout = 5000

        val address = InetAddress.getByName("8.8.8.8")

        val request = DatagramPacket(
            query,
            query.size,
            address,
            53
        )

        socket.send(request)

        val buffer = ByteArray(1024)

        val response = DatagramPacket(buffer, buffer.size)

        socket.receive(response)

        socket.close()

        buffer.copyOf(response.length)

    } catch (e: Exception) {
        Log.e("BetBlocker", "DNS forward error: ${e.message}")
        ByteArray(0)
    }
  }

  private fun parseDomain(query: ByteArray): String {
    return try {
        var pos = 12
        val domain = StringBuilder()

        while (true) {
            val len = query[pos].toInt() and 0xFF
            if (len == 0) break

            pos++

            if (domain.isNotEmpty()) {
                domain.append(".")
            }

            for (i in 0 until len) {
                domain.append(query[pos + i].toInt().toChar())
            }

            pos += len
        }

        domain.toString()
    } catch (e: Exception) {
        ""
    }
  }

  private fun buildBlockedResponse(query: ByteArray): ByteArray {
    val response = query.copyOf()

    response[2] = (response[2].toInt() or 0x80).toByte() // response flag
    response[3] = 0x00

    response[7] = 1 // ANCOUNT = 1

    val answer = byteArrayOf(
        0xC0.toByte(), 0x0C,
        0x00, 0x01,
        0x00, 0x01,
        0x00, 0x00, 0x00, 0x3C,
        0x00, 0x04,
        0x00, 0x00, 0x00, 0x00
    )

    return response + answer
  }

  private fun startAsForeground() {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        NOTIF_CHANNEL_ID,
        "BetBlocker VPN",
        NotificationManager.IMPORTANCE_LOW
      )
      nm.createNotificationChannel(channel)
    }

    val contentIntent = Intent(this, MainActivity::class.java)
    val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
    val pi = PendingIntent.getActivity(this, 0, contentIntent, piFlags)

    val notification: Notification = NotificationCompat.Builder(this, NOTIF_CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("BetBlocker is active")
      .setContentText("Blocking gambling domains via local VPN")
      .setContentIntent(pi)
      .setOngoing(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()

    startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
  }

  companion object {
    private const val TAG = "BetBlockerVpn"
    private const val SESSION_NAME = "BetBlocker"
    private const val VPN_ADDRESS = "10.0.0.2"
    private const val FAKE_DNS_SERVER = "10.0.0.1"
    private const val NOTIF_CHANNEL_ID = "betblocker_vpn"
    private const val NOTIF_ID = 42
    const val ACTION_RELOAD = "com.bethunter.app.action.RELOAD_BLOCKED_DOMAINS"
    const val ACTION_STOP = "com.bethunter.app.action.STOP_VPN"
  }
}

/**
 * Minimal IPv4+UDP packet parsing/building for DNS interception.
 */
private data class Ipv4UdpPacket(
  val srcIp: Int,
  val dstIp: Int,
  val protocol: Int,
  val srcPort: Int,
  val dstPort: Int,
  val payload: ByteArray,
  val payloadLength: Int
) {
  companion object {
    fun parse(packet: ByteArray, length: Int): Ipv4UdpPacket? {
      if (length < 20) return null
      val vihl = packet[0].toInt() and 0xFF
      val version = vihl ushr 4
      if (version != 4) return null
      val ihl = (vihl and 0x0F) * 4
      if (ihl < 20 || length < ihl + 8) return null

      val totalLen = u16(packet, 2)
      if (totalLen <= 0 || totalLen > length) return null
      val protocol = packet[9].toInt() and 0xFF
      if (protocol != OsConstants.IPPROTO_UDP) return null

      val srcIp = i32(packet, 12)
      val dstIp = i32(packet, 16)

      val udpOffset = ihl
      val srcPort = u16(packet, udpOffset)
      val dstPort = u16(packet, udpOffset + 2)
      val udpLen = u16(packet, udpOffset + 4)
      if (udpLen < 8) return null
      val payloadOffset = udpOffset + 8
      val payloadLen = udpLen - 8
      if (payloadOffset + payloadLen > totalLen) return null

      val payload = packet.copyOfRange(payloadOffset, payloadOffset + payloadLen)
      return Ipv4UdpPacket(srcIp, dstIp, protocol, srcPort, dstPort, payload, payloadLen)
    }

    fun buildResponse(request: Ipv4UdpPacket, responsePayload: ByteArray): ByteArray? {
      val ipHeaderLen = 20
      val udpHeaderLen = 8
      val totalLen = ipHeaderLen + udpHeaderLen + responsePayload.size
      val out = ByteArray(totalLen)

      // IPv4 header
      out[0] = 0x45.toByte() // v4, IHL=5
      out[1] = 0 // DSCP/ECN
      putU16(out, 2, totalLen)
      putU16(out, 4, 0) // id
      putU16(out, 6, 0x4000) // flags=DF
      out[8] = 64 // TTL
      out[9] = OsConstants.IPPROTO_UDP.toByte()
      putU16(out, 10, 0) // checksum placeholder
      putI32(out, 12, request.dstIp) // swapped
      putI32(out, 16, request.srcIp)
      putU16(out, 10, ipv4Checksum(out, 0, ipHeaderLen))

      // UDP header
      val udpOffset = ipHeaderLen
      putU16(out, udpOffset, request.dstPort) // swapped ports
      putU16(out, udpOffset + 2, request.srcPort)
      val udpLen = udpHeaderLen + responsePayload.size
      putU16(out, udpOffset + 4, udpLen)
      putU16(out, udpOffset + 6, 0) // UDP checksum optional for IPv4 (0 = not used)

      // payload
      System.arraycopy(responsePayload, 0, out, udpOffset + udpHeaderLen, responsePayload.size)
      return out
    }

    private fun u16(b: ByteArray, off: Int): Int =
      ((b[off].toInt() and 0xFF) shl 8) or (b[off + 1].toInt() and 0xFF)

    private fun i32(b: ByteArray, off: Int): Int =
      ((b[off].toInt() and 0xFF) shl 24) or
        ((b[off + 1].toInt() and 0xFF) shl 16) or
        ((b[off + 2].toInt() and 0xFF) shl 8) or
        (b[off + 3].toInt() and 0xFF)

    private fun putU16(b: ByteArray, off: Int, v: Int) {
      b[off] = ((v ushr 8) and 0xFF).toByte()
      b[off + 1] = (v and 0xFF).toByte()
    }

    private fun putI32(b: ByteArray, off: Int, v: Int) {
      b[off] = ((v ushr 24) and 0xFF).toByte()
      b[off + 1] = ((v ushr 16) and 0xFF).toByte()
      b[off + 2] = ((v ushr 8) and 0xFF).toByte()
      b[off + 3] = (v and 0xFF).toByte()
    }

    private fun ipv4Checksum(buf: ByteArray, offset: Int, length: Int): Int {
      var sum = 0L
      var i = offset
      while (i < offset + length) {
        val word = ((buf[i].toInt() and 0xFF) shl 8) or (buf[i + 1].toInt() and 0xFF)
        sum += word.toLong()
        i += 2
      }
      while ((sum ushr 16) != 0L) {
        sum = (sum and 0xFFFF) + (sum ushr 16)
      }
      val result = sum.inv().toInt() and 0xFFFF
      return result
    }
  }
}

