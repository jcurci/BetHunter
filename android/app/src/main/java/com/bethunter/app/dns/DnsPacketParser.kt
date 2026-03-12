package com.bethunter.app.dns

import java.nio.ByteBuffer
import java.nio.ByteOrder

data class DnsQuestion(
  val qName: String,
  val qType: Int,
  val qClass: Int
)

data class DnsMessage(
  val id: Int,
  val flags: Int,
  val questions: List<DnsQuestion>,
  val rawQuestionSection: ByteArray
)

object DnsPacketParser {
  fun parseQuery(payload: ByteArray, length: Int = payload.size): DnsMessage? {
    if (length < 12) return null
    val buf = ByteBuffer.wrap(payload, 0, length).order(ByteOrder.BIG_ENDIAN)
    val id = buf.short.toInt() and 0xFFFF
    val flags = buf.short.toInt() and 0xFFFF
    val qdCount = buf.short.toInt() and 0xFFFF
    val anCount = buf.short.toInt() and 0xFFFF
    val nsCount = buf.short.toInt() and 0xFFFF
    val arCount = buf.short.toInt() and 0xFFFF

    // standard query: QR=0; ignore others
    val qr = (flags ushr 15) and 0x1
    if (qr != 0) return null
    if (qdCount <= 0) return null

    val questionStart = buf.position()
    val questions = ArrayList<DnsQuestion>(qdCount)
    for (i in 0 until qdCount) {
      val name = readName(payload, buf, depth = 0) ?: return null
      if (buf.remaining() < 4) return null
      val qType = buf.short.toInt() and 0xFFFF
      val qClass = buf.short.toInt() and 0xFFFF
      questions.add(DnsQuestion(name, qType, qClass))
    }
    val questionEnd = buf.position()
    val rawQuestion = payload.copyOfRange(questionStart, questionEnd)

    // We don't need the rest for a simple proxy; just validate header counts a bit.
    if (anCount < 0 || nsCount < 0 || arCount < 0) return null

    return DnsMessage(
      id = id,
      flags = flags,
      questions = questions,
      rawQuestionSection = rawQuestion
    )
  }

  private fun readName(packet: ByteArray, buf: ByteBuffer, depth: Int): String? {
    if (depth > 10) return null
    val labels = ArrayList<String>(4)
    var jumped = false
    var jumpPos = -1

    while (true) {
      if (!buf.hasRemaining()) return null
      val len = packet[buf.position()].toInt() and 0xFF

      // pointer (compression)
      if ((len and 0xC0) == 0xC0) {
        if (buf.remaining() < 2) return null
        val b1 = buf.get().toInt() and 0xFF
        val b2 = buf.get().toInt() and 0xFF
        val ptr = ((b1 and 0x3F) shl 8) or b2
        if (ptr < 0 || ptr >= packet.size) return null
        if (!jumped) {
          jumped = true
          jumpPos = buf.position()
        }
        val dup = ByteBuffer.wrap(packet).order(ByteOrder.BIG_ENDIAN)
        dup.position(ptr)
        val pointed = readName(packet, dup, depth + 1) ?: return null
        labels.addAll(pointed.split('.').filter { it.isNotBlank() })
        break
      }

      buf.get() // consume length
      if (len == 0) break
      if (len > 63) return null
      if (buf.remaining() < len) return null
      val labelBytes = ByteArray(len)
      buf.get(labelBytes)
      labels.add(labelBytes.toString(Charsets.UTF_8))
    }

    if (jumped && jumpPos >= 0) {
      buf.position(jumpPos)
    }
    return labels.joinToString(".")
  }
}

