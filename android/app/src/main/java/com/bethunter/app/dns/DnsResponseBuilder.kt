package com.bethunter.app.dns

import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

object DnsResponseBuilder {

  /**
   * Quanto tempo o CLIENTE pode lembrar que um domínio bloqueado não existe.
   *
   * Curto de propósito. Esse cache mora no resolver do sistema e nos apps, fora do
   * nosso alcance: se um domínio sair da lista ou o usuário pausar a proteção, este
   * é o atraso máximo até a mudança valer. Um minuto já elimina a repetição em
   * rajada (que é o problema) sem transformar o desbloqueio em algo que "demora".
   */
  const val BLOCKED_NEGATIVE_TTL_SECONDS = 60

  private const val TYPE_SOA = 6
  private const val CLASS_IN = 1

  /** Ponteiro de compressão para o nome da pergunta, que começa logo após o header. */
  private const val QUESTION_NAME_POINTER = 0xC00C

  // Zona sintética sob .invalid (RFC 2606), que por definição nunca existe de
  // verdade — deixa claro em qualquer captura de pacote que a negativa foi
  // fabricada aqui, e não veio de um servidor autoritativo real.
  private const val SOA_MNAME = "betblocker.invalid"
  private const val SOA_RNAME = "blocked.betblocker.invalid"

  /**
   * Build a minimal NXDOMAIN response for the given query.
   *
   * Response includes the original question section, and sets:
   * - QR=1
   * - RCODE=3 (NXDOMAIN)
   * - ANCOUNT/ARCOUNT = 0, NSCOUNT = 1 (SOA)
   *
   * O SOA na seção de autoridade não é decorativo: sem ele (RFC 2308) o cliente não
   * tem TTL negativo para guardar e volta a perguntar o MESMO domínio bloqueado a
   * cada tentativa de conexão — um site de aposta com a página cheia de recursos
   * gerava dezenas de consultas idênticas, todas ocupando fila do pool. Com o SOA,
   * a primeira negativa cala o cliente por [BLOCKED_NEGATIVE_TTL_SECONDS].
   */
  fun buildNxDomain(query: DnsMessage): ByteArray {
    val flags = buildResponseFlags(query.flags, rcode = 3)
    val authority = buildSoaAuthority(BLOCKED_NEGATIVE_TTL_SECONDS)

    val buf = ByteBuffer
      .allocate(12 + query.rawQuestionSection.size + authority.size)
      .order(ByteOrder.BIG_ENDIAN)
    buf.putShort(query.id.toShort())
    buf.putShort(flags.toShort())
    buf.putShort(query.questions.size.toShort())
    buf.putShort(0) // ancount
    buf.putShort(1) // nscount — o SOA abaixo
    buf.putShort(0) // arcount
    buf.put(query.rawQuestionSection)
    buf.put(authority)
    return buf.array()
  }

  /**
   * SERVFAIL (RCODE=2) para quando NENHUM upstream respondeu.
   *
   * Antes, nesse caso, o pacote era simplesmente descartado — e o app que
   * perguntou ficava esperando o próprio timeout (segundos, às vezes por
   * tentativa), o que o usuário lê como "a internet travou depois que liguei a
   * proteção". Uma resposta de erro deixa o cliente falhar rápido e tentar outro
   * caminho.
   *
   * Sem SOA de propósito: SERVFAIL é uma falha NOSSA, transitória, e não pode ser
   * lembrada pelo cliente — o próximo pedido tem de ir à rede de novo.
   */
  fun buildServFail(query: DnsMessage): ByteArray {
    val flags = buildResponseFlags(query.flags, rcode = 2)
    val buf = ByteBuffer.allocate(12 + query.rawQuestionSection.size).order(ByteOrder.BIG_ENDIAN)
    buf.putShort(query.id.toShort())
    buf.putShort(flags.toShort())
    buf.putShort(query.questions.size.toShort())
    buf.putShort(0) // ancount
    buf.putShort(0) // nscount
    buf.putShort(0) // arcount
    buf.put(query.rawQuestionSection)
    return buf.array()
  }

  /**
   * Registro SOA cujo dono é o próprio nome perguntado (via ponteiro de compressão).
   *
   * Escopo estreito de propósito: apontar para o nome exato impede que o cliente
   * estenda a negativa para a zona pai — um SOA de `bet365.com` faria o resolver
   * tratar QUALQUER subdomínio como inexistente por tabela, incluindo os que ainda
   * nem foram decididos.
   */
  private fun buildSoaAuthority(ttlSeconds: Int): ByteArray {
    val rdata = ByteArrayOutputStream().apply {
      writeName(SOA_MNAME)
      writeName(SOA_RNAME)
      writeInt(1)      // SERIAL
      writeInt(3600)   // REFRESH
      writeInt(600)    // RETRY
      writeInt(86400)  // EXPIRE
      writeInt(ttlSeconds) // MINIMUM — o que o cliente usa junto com o TTL do RR
    }.toByteArray()

    return ByteArrayOutputStream().apply {
      writeShort(QUESTION_NAME_POINTER)
      writeShort(TYPE_SOA)
      writeShort(CLASS_IN)
      writeInt(ttlSeconds)
      writeShort(rdata.size)
      write(rdata)
    }.toByteArray()
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

  private fun ByteArrayOutputStream.writeShort(value: Int) {
    write((value ushr 8) and 0xFF)
    write(value and 0xFF)
  }

  private fun ByteArrayOutputStream.writeInt(value: Int) {
    write((value ushr 24) and 0xFF)
    write((value ushr 16) and 0xFF)
    write((value ushr 8) and 0xFF)
    write(value and 0xFF)
  }

  private fun ByteArrayOutputStream.writeName(name: String) {
    for (label in name.split('.')) {
      if (label.isEmpty()) continue
      write(label.length)
      write(label.toByteArray(Charsets.UTF_8))
    }
    write(0)
  }
}
