package com.bethunter.app.dns

/**
 * Cache de respostas DNS já encaminhadas.
 *
 * Cada query que sai custa um socket novo, um round-trip e até 2 s de espera de um
 * dos worker threads. O tráfego real é muito repetitivo (o mesmo punhado de
 * domínios responde pela maioria das consultas), então cachear é o que impede a
 * fila de encher e o aparelho de parecer lento com a proteção ligada.
 *
 * Só entram respostas de sucesso COM resposta (`RCODE=0` e `ANCOUNT>0`): erro e
 * resposta vazia são justamente o que não pode ficar grudado — se um upstream
 * falhou uma vez, a próxima tentativa tem de ir na rede de novo.
 */
class DnsResponseCache(
  private val maxEntries: Int = DEFAULT_MAX_ENTRIES,
  private val clock: () -> Long = System::currentTimeMillis,
) {
  private class Entry(
    val response: ByteArray,
    val questionSection: ByteArray,
    val expiresAt: Long,
  )

  private val entries = object : LinkedHashMap<String, Entry>(64, 0.75f, true) {
    override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Entry>): Boolean =
      size > maxEntries
  }

  /**
   * Resposta cacheada, já com o ID da transação do PEDIDO ATUAL.
   *
   * O ID é sorteado por query: devolver a resposta com o ID antigo faria o
   * resolver do sistema descartá-la em silêncio (e o app ficar esperando).
   */
  @Synchronized
  fun get(query: DnsMessage): ByteArray? {
    val question = query.questions.firstOrNull() ?: return null
    val entry = entries[keyOf(question)] ?: return null
    if (clock() >= entry.expiresAt) {
      entries.remove(keyOf(question))
      return null
    }
    // A chave normaliza o nome, então uma pergunta com grafia diferente (DNS 0x20)
    // cairia aqui com a seção de pergunta do pedido ANTERIOR. Cliente que compara
    // byte a byte descartaria a resposta — melhor tratar como miss.
    if (!entry.questionSection.contentEquals(query.rawQuestionSection)) return null

    val copy = entry.response.copyOf()
    if (copy.size >= 2) {
      copy[0] = ((query.id ushr 8) and 0xFF).toByte()
      copy[1] = (query.id and 0xFF).toByte()
    }
    return copy
  }

  @Synchronized
  fun put(query: DnsMessage, response: ByteArray) {
    val question = query.questions.firstOrNull() ?: return
    if (!isCacheable(response)) return

    val ttlSeconds = DnsPacketParser.minAnswerTtlSeconds(response) ?: return
    val ttlMs = (ttlSeconds.toLong() * 1000).coerceIn(MIN_TTL_MS, MAX_TTL_MS)
    entries[keyOf(question)] = Entry(
      response = response.copyOf(),
      questionSection = query.rawQuestionSection.copyOf(),
      expiresAt = clock() + ttlMs,
    )
  }

  @Synchronized
  fun clear() = entries.clear()

  @Synchronized
  fun size(): Int = entries.size

  private fun keyOf(question: DnsQuestion): String =
    "${question.qName.lowercase()}|${question.qType}|${question.qClass}"

  private fun isCacheable(response: ByteArray): Boolean {
    if (response.size < 12) return false
    val rcode = response[3].toInt() and 0x0F
    if (rcode != 0) return false
    val anCount = ((response[6].toInt() and 0xFF) shl 8) or (response[7].toInt() and 0xFF)
    if (anCount <= 0) return false
    val truncated = (response[2].toInt() and 0x02) != 0
    return !truncated
  }

  companion object {
    const val DEFAULT_MAX_ENTRIES = 512

    /** Piso: evita ida à rede em rajada por causa de TTL de poucos segundos. */
    const val MIN_TTL_MS = 30_000L

    /** Teto: mesmo com TTL de dias, não seguramos resposta por mais de uma hora. */
    const val MAX_TTL_MS = 60L * 60 * 1000
  }
}
