package com.bethunter.app.dns

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DnsPacketParserTtlTest {

  @Test
  fun `le o ttl de uma resposta simples`() {
    assertEquals(300, DnsPacketParser.minAnswerTtlSeconds(DnsFixtures.response(id = 1, ttls = listOf(300))))
  }

  @Test
  fun `devolve o menor ttl entre os registros`() {
    val response = DnsFixtures.response(id = 1, ttls = listOf(600, 60, 3600))
    assertEquals(60, DnsPacketParser.minAnswerTtlSeconds(response))
  }

  @Test
  fun `resposta sem answers nao tem ttl`() {
    assertNull(DnsPacketParser.minAnswerTtlSeconds(DnsFixtures.response(id = 1, ttls = emptyList())))
  }

  @Test
  fun `ttl zero e valido`() {
    // TTL 0 = "não cacheie". O piso do DnsResponseCache é quem decide o que fazer;
    // aqui o parser só não pode confundir 0 com "não consegui ler".
    assertEquals(0, DnsPacketParser.minAnswerTtlSeconds(DnsFixtures.response(id = 1, ttls = listOf(0))))
  }

  @Test
  fun `pacote truncado no meio devolve null`() {
    val full = DnsFixtures.response(id = 1, ttls = listOf(300))
    for (cut in 12 until full.size) {
      val partial = full.copyOfRange(0, cut)
      // Nenhum corte pode lançar: o cache chama isto com bytes vindos da rede.
      assertNull("cortado em $cut deveria ser ilegível", DnsPacketParser.minAnswerTtlSeconds(partial))
    }
  }

  @Test
  fun `lixo nao lanca`() {
    assertNull(DnsPacketParser.minAnswerTtlSeconds(ByteArray(0)))
    assertNull(DnsPacketParser.minAnswerTtlSeconds(ByteArray(11)))
    assertNull(DnsPacketParser.minAnswerTtlSeconds(ByteArray(64) { 0xFF.toByte() }))
  }
}
