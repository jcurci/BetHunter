package com.bethunter.app.dns

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DnsResponseBuilderTest {

  private fun parse(bytes: ByteArray) =
    DnsPacketParser.parseQuery(bytes) ?: error("query de teste inválida")

  private fun rcodeOf(response: ByteArray) = response[3].toInt() and 0x0F
  private fun countAt(response: ByteArray, offset: Int) =
    ((response[offset].toInt() and 0xFF) shl 8) or (response[offset + 1].toInt() and 0xFF)

  @Test
  fun `NXDOMAIN carrega um SOA para o cliente poder cachear a negativa`() {
    val query = parse(DnsFixtures.query(id = 0x1234, name = "bet365.com"))
    val response = DnsResponseBuilder.buildNxDomain(query)

    assertEquals(3, rcodeOf(response))
    assertEquals("ancount", 0, countAt(response, 6))
    assertEquals("nscount deve trazer o SOA", 1, countAt(response, 8))

    // O ponto do SOA: sem ele o cliente re-pergunta o mesmo domínio bloqueado a
    // cada tentativa de conexão, e uma página cheia de recursos gera dezenas de
    // consultas idênticas ocupando a fila do pool.
    assertEquals(
      DnsResponseBuilder.BLOCKED_NEGATIVE_TTL_SECONDS,
      DnsPacketParser.negativeTtlSeconds(response),
    )
  }

  @Test
  fun `NXDOMAIN preserva id e pergunta`() {
    val query = parse(DnsFixtures.query(id = 0xBEEF, name = "betano.com", qType = 28))
    val response = DnsResponseBuilder.buildNxDomain(query)

    assertEquals(0xBE.toByte(), response[0])
    assertEquals(0xEF.toByte(), response[1])
    assertEquals(1, countAt(response, 4)) // qdcount
    assertArrayEquals(
      query.rawQuestionSection,
      response.copyOfRange(12, 12 + query.rawQuestionSection.size),
    )
  }

  @Test
  fun `NXDOMAIN gerado aqui e um pacote estruturalmente completo`() {
    val query = parse(DnsFixtures.query(id = 1, name = "sub.dominio.exemplo.com"))
    val response = DnsResponseBuilder.buildNxDomain(query)
    // Se esta checagem falhasse, o proprio cliente rejeitaria a negativa e o
    // bloqueio viraria um timeout em vez de uma resposta.
    assertTrue(DnsPacketParser.isCompleteMessage(response))
  }

  @Test
  fun `SERVFAIL nao carrega SOA`() {
    val query = parse(DnsFixtures.query(id = 1))
    val response = DnsResponseBuilder.buildServFail(query)

    assertEquals(2, rcodeOf(response))
    assertEquals("nscount", 0, countAt(response, 8))
    // SERVFAIL é falha NOSSA e transitória: o cliente não pode lembrar dela, o
    // próximo pedido tem de ir à rede de novo.
    assertNull(DnsPacketParser.negativeTtlSeconds(response))
  }

  @Test
  fun `resposta marca QR e RA e preserva RD`() {
    val query = parse(DnsFixtures.query(id = 1))
    val response = DnsResponseBuilder.buildNxDomain(query)
    val flags = ((response[2].toInt() and 0xFF) shl 8) or (response[3].toInt() and 0xFF)

    assertEquals("QR", 1, (flags ushr 15) and 1)
    assertEquals("RA", 1, (flags ushr 7) and 1)
    assertEquals("RD preservado da pergunta", 1, (flags ushr 8) and 1)
    assertEquals("TC deve estar limpo", 0, (flags ushr 9) and 1)
  }
}
