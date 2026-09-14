package com.bethunter.app.dns

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Cobre as duas leituras que o cache passou a precisar: o TTL de uma resposta
 * negativa e a checagem de que a mensagem inteira fecha.
 */
class DnsPacketParserNegativeTest {

  @Test
  fun `ttl negativo e o menor entre o ttl do SOA e o MINIMUM`() {
    assertEquals(
      120,
      DnsPacketParser.negativeTtlSeconds(
        DnsFixtures.negativeResponse(id = 1, soaTtl = 300, soaMinimum = 120)
      ),
    )
    assertEquals(
      90,
      DnsPacketParser.negativeTtlSeconds(
        DnsFixtures.negativeResponse(id = 1, soaTtl = 90, soaMinimum = 600)
      ),
    )
  }

  @Test
  fun `sem SOA nao ha ttl negativo`() {
    assertNull(
      DnsPacketParser.negativeTtlSeconds(
        DnsFixtures.negativeResponse(id = 1, includeSoa = false)
      )
    )
  }

  @Test
  fun `resposta positiva nao tem ttl negativo`() {
    // Só a seção de autoridade conta; uma resposta com registros não é negativa.
    assertNull(DnsPacketParser.negativeTtlSeconds(DnsFixtures.response(id = 1)))
  }

  @Test
  fun `mensagem intacta e considerada completa`() {
    assertTrue(DnsPacketParser.isCompleteMessage(DnsFixtures.response(id = 1, ttls = listOf(300))))
    assertTrue(DnsPacketParser.isCompleteMessage(DnsFixtures.response(id = 1, ttls = listOf(60, 90))))
    assertTrue(DnsPacketParser.isCompleteMessage(DnsFixtures.negativeResponse(id = 1)))
    assertTrue(DnsPacketParser.isCompleteMessage(DnsFixtures.query(id = 1)))
  }

  @Test
  fun `mensagem cortada no meio de um registro e detectada`() {
    val full = DnsFixtures.response(id = 1, ttls = listOf(300))
    // É o corte que o kernel faz quando a resposta não cabe no buffer: header
    // íntegro, sem bit TC, e o registro pela metade.
    for (chop in 1..6) {
      assertFalse(
        "corte de $chop byte(s) deveria ser detectado",
        DnsPacketParser.isCompleteMessage(full.copyOfRange(0, full.size - chop)),
      )
    }
  }

  @Test
  fun `header que promete mais registros do que existem e detectado`() {
    // ANCOUNT diz 2, mas só há um registro no pacote.
    val bytes = DnsFixtures.response(id = 1, ttls = listOf(300))
    bytes[6] = 0
    bytes[7] = 2
    assertFalse(DnsPacketParser.isCompleteMessage(bytes))
  }
}
