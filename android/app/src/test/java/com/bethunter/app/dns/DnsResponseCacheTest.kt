package com.bethunter.app.dns

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class DnsResponseCacheTest {

  private var now = 0L
  private fun cache(maxEntries: Int = 4) =
    DnsResponseCache(maxEntries = maxEntries, clock = { now })

  private fun parse(bytes: ByteArray) =
    DnsPacketParser.parseQuery(bytes) ?: error("query de teste inválida")

  @Test
  fun `serve a resposta cacheada com o id da nova pergunta`() {
    val cache = cache()
    val first = parse(DnsFixtures.query(id = 0x1234))
    cache.put(first, DnsFixtures.response(id = 0x1234, ttls = listOf(300)))

    val second = parse(DnsFixtures.query(id = 0xABCD))
    val hit = cache.get(second)

    assertNotNull("mesma pergunta deveria acertar o cache", hit)
    // O ID é sorteado por query: devolver o antigo faria o resolver do sistema
    // descartar a resposta em silêncio, e o app ficaria esperando o timeout.
    assertEquals(0xAB.toByte(), hit!![0])
    assertEquals(0xCD.toByte(), hit[1])
    // O resto do pacote é preservado byte a byte.
    val expected = DnsFixtures.response(id = 0xABCD, ttls = listOf(300))
    assertArrayEquals(expected, hit)
  }

  @Test
  fun `pergunta diferente nao acerta`() {
    val cache = cache()
    cache.put(parse(DnsFixtures.query(id = 1)), DnsFixtures.response(id = 1))
    assertNull(cache.get(parse(DnsFixtures.query(id = 2, name = "outro.com"))))
  }

  @Test
  fun `mesmo nome com qtype diferente nao acerta`() {
    val cache = cache()
    cache.put(parse(DnsFixtures.query(id = 1, qType = 1)), DnsFixtures.response(id = 1, qType = 1))
    assertNull(cache.get(parse(DnsFixtures.query(id = 2, qType = 28))))
  }

  @Test
  fun `expira pelo menor ttl da resposta`() {
    val cache = cache()
    val query = parse(DnsFixtures.query(id = 1))
    // Dois registros: vale o MENOR, senão serviríamos um endereço já vencido.
    cache.put(query, DnsFixtures.response(id = 1, ttls = listOf(300, 45)))

    now = 44_999
    assertNotNull(cache.get(parse(DnsFixtures.query(id = 2))))
    now = 45_000
    assertNull(cache.get(parse(DnsFixtures.query(id = 3))))
  }

  @Test
  fun `aplica piso de ttl`() {
    val cache = cache()
    cache.put(parse(DnsFixtures.query(id = 1)), DnsFixtures.response(id = 1, ttls = listOf(1)))

    now = DnsResponseCache.MIN_TTL_MS - 1
    assertNotNull("TTL de 1s deve ser elevado ao piso", cache.get(parse(DnsFixtures.query(id = 2))))
    now = DnsResponseCache.MIN_TTL_MS
    assertNull(cache.get(parse(DnsFixtures.query(id = 3))))
  }

  @Test
  fun `aplica teto de ttl`() {
    val cache = cache()
    val tenDays = 10 * 24 * 60 * 60
    cache.put(parse(DnsFixtures.query(id = 1)), DnsFixtures.response(id = 1, ttls = listOf(tenDays)))

    now = DnsResponseCache.MAX_TTL_MS
    assertNull("nunca segurar resposta por mais de uma hora", cache.get(parse(DnsFixtures.query(id = 2))))
  }

  @Test
  fun `nao cacheia erro nem resposta vazia nem truncada`() {
    val cache = cache()
    val query = parse(DnsFixtures.query(id = 1))

    cache.put(query, DnsFixtures.response(id = 1, rcode = 2)) // SERVFAIL
    assertEquals(0, cache.size())

    cache.put(query, DnsFixtures.response(id = 1, ttls = emptyList())) // sem answers
    assertEquals(0, cache.size())

    cache.put(query, DnsFixtures.response(id = 1, truncated = true))
    assertEquals(0, cache.size())
  }

  @Test
  fun `descarta o menos usado ao estourar o limite`() {
    val cache = cache(maxEntries = 2)
    cache.put(parse(DnsFixtures.query(id = 1, name = "a.com")), DnsFixtures.response(id = 1, name = "a.com"))
    cache.put(parse(DnsFixtures.query(id = 2, name = "b.com")), DnsFixtures.response(id = 2, name = "b.com"))
    cache.put(parse(DnsFixtures.query(id = 3, name = "c.com")), DnsFixtures.response(id = 3, name = "c.com"))

    assertEquals(2, cache.size())
    assertNull(cache.get(parse(DnsFixtures.query(id = 4, name = "a.com"))))
  }
}
