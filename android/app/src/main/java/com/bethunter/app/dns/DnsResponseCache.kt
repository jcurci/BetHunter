package com.bethunter.app.dns

/**
 * Cache de respostas DNS já encaminhadas.
 *
 * Cada query que sai custa um socket novo, um round-trip e até 2 s de espera de um
 * dos worker threads. O tráfego real é muito repetitivo (o mesmo punhado de
 * domínios responde pela maioria das consultas), então cachear é o que impede a
 * fila de encher e o aparelho de parecer lento com a proteção ligada.
 *
 * Entram respostas ESTRUTURALMENTE ÍNTEGRAS que sejam:
 *  - positivas: `RCODE=0` com `ANCOUNT>0`, pelo TTL real dos registros;
 *  - negativas: `NODATA` (`RCODE=0`, `ANCOUNT=0`) e `NXDOMAIN`, pelo TTL do SOA.
 *
 * As negativas passaram a entrar porque eram a maior fonte de consulta repetida: o
 * navegador pergunta `A`, `AAAA` e `HTTPS` (tipo 65) para cada host, e na maioria
 * dos domínios as duas últimas voltam NODATA. Recusando-as, ~2/3 das consultas iam
 * à rede TODA vez — com a proteção ligada isso é o aparelho inteiro parecendo lento.
 *
 * `SERVFAIL` e respostas truncadas continuam de fora: erro nosso ou resposta
 * incompleta não pode grudar, a próxima tentativa tem de ir na rede de novo.
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

    val ttlMs = ttlMsFor(response) ?: return
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

  /**
   * Por quanto tempo guardar, ou null para não guardar.
   *
   * Positiva e negativa têm tetos diferentes de propósito: uma resposta com
   * endereço pode valer uma hora, mas lembrar por uma hora que algo NÃO existe é
   * como se quebra um domínio que acabou de subir.
   */
  private fun ttlMsFor(response: ByteArray): Long? {
    val anCount = answerCount(response)
    return if (anCount > 0) {
      val ttl = DnsPacketParser.minAnswerTtlSeconds(response) ?: return null
      (ttl.toLong() * 1000).coerceIn(MIN_TTL_MS, MAX_TTL_MS)
    } else {
      // Sem SOA na autoridade não há TTL negativo confiável — não cacheia.
      val ttl = DnsPacketParser.negativeTtlSeconds(response) ?: return null
      (ttl.toLong() * 1000).coerceIn(MIN_TTL_MS, MAX_NEGATIVE_TTL_MS)
    }
  }

  private fun answerCount(response: ByteArray): Int =
    ((response[6].toInt() and 0xFF) shl 8) or (response[7].toInt() and 0xFF)

  private fun isCacheable(response: ByteArray): Boolean {
    if (response.size < 12) return false

    val rcode = response[3].toInt() and 0x0F
    if (rcode != RCODE_NOERROR && rcode != RCODE_NXDOMAIN) return false

    val truncated = (response[2].toInt() and 0x02) != 0
    if (truncated) return false

    // Checagem estrutural, não só de header: uma resposta cortada pelo buffer de
    // recepção chega com o header intacto e plausível, e sem o bit TC. Aceitá-la
    // significaria devolver lixo ao cliente E guardá-lo por até uma hora — foi
    // assim que um site quebrava e CONTINUAVA quebrado.
    return DnsPacketParser.isCompleteMessage(response)
  }

  companion object {
    const val DEFAULT_MAX_ENTRIES = 512

    private const val RCODE_NOERROR = 0
    private const val RCODE_NXDOMAIN = 3

    /** Piso: evita ida à rede em rajada por causa de TTL de poucos segundos. */
    const val MIN_TTL_MS = 30_000L

    /** Teto: mesmo com TTL de dias, não seguramos resposta por mais de uma hora. */
    const val MAX_TTL_MS = 60L * 60 * 1000

    /**
     * Teto das negativas, bem mais baixo: o custo de errar aqui é um domínio novo
     * (ou recém-desbloqueado) parecer inexistente, e cinco minutos já entrega quase
     * todo o ganho de tráfego.
     */
    const val MAX_NEGATIVE_TTL_MS = 5L * 60 * 1000
  }
}
