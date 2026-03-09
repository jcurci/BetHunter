package com.bethunter.app.dns

import java.nio.ByteBuffer
import java.nio.ByteOrder

object DnsResponseBuilder {
  /**
   * Build a minimal NXDOMAIN response for the given query.
   *
   * Response includes the original question section, and sets:
   * - QR=1
   * - RCODE=3 (NXDOMAIN)
   * - ANCOUNT/NSCOUNT/ARCOUNT = 0
   */
  fun buildNxDomain(query: DnsMessage): ByteArray {
    val flags = buildResponseFlags(query.flags, rcode = 3)
    val qdCount = query.questions.size

    val capacity = 12 + query.rawQuestionSection.size
    val buf = ByteBuffer.allocate(capacity).order(ByteOrder.BIG_ENDIAN)
    buf.putShort(query.id.toShort())
    buf.putShort(flags.toShort())
    buf.putShort(qdCount.toShort())
    buf.putShort(0) // ancount
    buf.putShort(0) // nscount
    buf.putShort(0) // arcount
    buf.put(query.rawQuestionSection)
    return buf.array()
  }

  private fun buildResponseFlags(queryFlags: Int, rcode: Int): Int {
    val opcode = (queryFlags ushr 11) and 0xF
    val rd = (queryFlags ushr 8) and 0x1
    // QR=1, same OPCODE, AA=0, TC=0, RD preserved, RA=1, Z=0, AD/CDATA cleared, RCODE set
    var flags = 0
    flags = flags or (1 shl 15) // QR
    flags = flags or (opcode shl 11)
    flags = flags or (rd shl 8)
    flags = flags or (1 shl 7) // RA
    flags = flags or (rcode and 0xF)
    return flags
  }
}

