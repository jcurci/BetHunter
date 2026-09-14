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

  /** Cabeçalho de um resource record já percorrido, com o RDATA localizado. */
  private class RecordHeader(
    val type: Int,
    val ttl: Int,
    val rdStart: Int,
    val rdLength: Int,
  )

  private const val TYPE_SOA = 6

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

  /**
   * A mensagem inteira fecha dentro de [length]?
   *
   * Existe por causa de um modo de falha silencioso: quando a resposta UDP é maior
   * que o buffer de recepção, o kernel ENTREGA os primeiros bytes e descarta o
   * resto, sem ligar o bit TC. O header continua íntegro e plausível — RCODE=0,
   * ANCOUNT>0 — então uma checagem que só olhe o header aceita um pacote mutilado,
   * devolve ao cliente (que o rejeita) e ainda o guarda no cache por até uma hora.
   * Só percorrer todos os registros até o fim denuncia o corte.
   */
  fun isCompleteMessage(payload: ByteArray, length: Int = payload.size): Boolean {
    if (length < 12) return false
    return try {
      val buf = ByteBuffer.wrap(payload, 0, length).order(ByteOrder.BIG_ENDIAN)
      buf.short // id
      buf.short // flags
      val qdCount = buf.short.toInt() and 0xFFFF
      val anCount = buf.short.toInt() and 0xFFFF
      val nsCount = buf.short.toInt() and 0xFFFF
      val arCount = buf.short.toInt() and 0xFFFF

      repeat(qdCount) {
        readName(payload, buf, depth = 0) ?: return false
        if (buf.remaining() < 4) return false
        buf.short // qtype
        buf.short // qclass
      }
      repeat(anCount + nsCount + arCount) {
        readRecord(payload, buf) ?: return false
      }
      true
    } catch (e: Exception) {
      false
    }
  }

  /**
   * Menor TTL (em segundos) entre os registros de resposta, ou null quando não dá
   * para determinar com segurança.
   *
   * Usado pelo cache de respostas: guardar por tempo fixo ignoraria zonas de TTL
   * curto (failover, balanceamento) e serviria endereço velho para o usuário. Todo
   * caminho de dúvida devolve null, e o chamador aplica o padrão conservador — é
   * melhor cachear de menos do que servir resposta vencida.
   */
  fun minAnswerTtlSeconds(payload: ByteArray, length: Int = payload.size): Int? {
    if (length < 12) return null
    return try {
      val buf = ByteBuffer.wrap(payload, 0, length).order(ByteOrder.BIG_ENDIAN)
      buf.short // id
      buf.short // flags
      val qdCount = buf.short.toInt() and 0xFFFF
      val anCount = buf.short.toInt() and 0xFFFF
      buf.short // nscount
      buf.short // arcount
      if (anCount <= 0) return null

      if (!skipQuestions(payload, buf, qdCount)) return null

      var min = Int.MAX_VALUE
      repeat(anCount) {
        val record = readRecord(payload, buf) ?: return null
        // TTL é unsigned de 32 bits; valor com o bit alto ligado chega negativo em
        // Kotlin e não é confiável — descarta a resposta inteira do cache.
        if (record.ttl < 0) return null
        if (record.ttl < min) min = record.ttl
      }
      if (min == Int.MAX_VALUE) null else min
    } catch (e: Exception) {
      null
    }
  }

  /**
   * TTL para cachear uma resposta NEGATIVA (NXDOMAIN ou NODATA), lido do SOA que
   * vem na seção de autoridade.
   *
   * RFC 2308 §5: o tempo de vida de uma negativa é o MENOR entre o TTL do próprio
   * registro SOA e o campo MINIMUM dentro do RDATA dele. Sem isso, a alternativa
   * seria um número fixo chutado — e cachear negativa por tempo demais é
   * exatamente como se quebra um domínio que acabou de subir.
   *
   * Devolve null quando não há SOA ou o RDATA não pode ser lido com segurança; o
   * chamador então simplesmente não cacheia.
   */
  fun negativeTtlSeconds(payload: ByteArray, length: Int = payload.size): Int? {
    if (length < 12) return null
    return try {
      val buf = ByteBuffer.wrap(payload, 0, length).order(ByteOrder.BIG_ENDIAN)
      buf.short // id
      buf.short // flags
      val qdCount = buf.short.toInt() and 0xFFFF
      val anCount = buf.short.toInt() and 0xFFFF
      val nsCount = buf.short.toInt() and 0xFFFF
      buf.short // arcount
      if (nsCount <= 0) return null

      if (!skipQuestions(payload, buf, qdCount)) return null
      repeat(anCount) { readRecord(payload, buf) ?: return null }

      repeat(nsCount) {
        val record = readRecord(payload, buf) ?: return null
        if (record.type != TYPE_SOA) return@repeat
        if (record.ttl < 0) return null
        val minimum = soaMinimum(payload, record) ?: return null
        if (minimum < 0) return null
        return if (record.ttl < minimum) record.ttl else minimum
      }
      null
    } catch (e: Exception) {
      null
    }
  }

  /**
   * Campo MINIMUM do RDATA de um SOA: vem depois de MNAME e RNAME (nomes de
   * tamanho variável, possivelmente comprimidos) e de quatro inteiros de 32 bits.
   */
  private fun soaMinimum(payload: ByteArray, record: RecordHeader): Int? {
    if (record.rdLength < 22) return null
    val rd = ByteBuffer.wrap(payload, 0, record.rdStart + record.rdLength)
      .order(ByteOrder.BIG_ENDIAN)
    rd.position(record.rdStart)
    readName(payload, rd, depth = 0) ?: return null // MNAME
    readName(payload, rd, depth = 0) ?: return null // RNAME
    if (rd.remaining() < 20) return null
    rd.int // SERIAL
    rd.int // REFRESH
    rd.int // RETRY
    rd.int // EXPIRE
    return rd.int // MINIMUM
  }

  private fun skipQuestions(packet: ByteArray, buf: ByteBuffer, qdCount: Int): Boolean {
    repeat(qdCount) {
      readName(packet, buf, depth = 0) ?: return false
      if (buf.remaining() < 4) return false
      buf.short // qtype
      buf.short // qclass
    }
    return true
  }

  /** Percorre um resource record inteiro, deixando [buf] logo depois do RDATA. */
  private fun readRecord(packet: ByteArray, buf: ByteBuffer): RecordHeader? {
    readName(packet, buf, depth = 0) ?: return null
    if (buf.remaining() < 10) return null
    val type = buf.short.toInt() and 0xFFFF
    buf.short // class
    val ttl = buf.int
    val rdLength = buf.short.toInt() and 0xFFFF
    if (buf.remaining() < rdLength) return null
    val rdStart = buf.position()
    buf.position(rdStart + rdLength)
    return RecordHeader(type = type, ttl = ttl, rdStart = rdStart, rdLength = rdLength)
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
