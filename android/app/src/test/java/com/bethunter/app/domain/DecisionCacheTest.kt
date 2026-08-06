package com.bethunter.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DecisionCacheTest {

  private var now = 0L
  private fun cache(maxEntries: Int = 3, ttlMs: Long = 1000) =
    DecisionCache(maxEntries = maxEntries, ttlMs = ttlMs, clock = { now })

  @Test
  fun `guarda e devolve a decisao`() {
    val cache = cache()
    cache.put("bet365.com", true)
    cache.put("google.com", false)

    assertEquals(true, cache.get("bet365.com"))
    assertEquals(false, cache.get("google.com"))
  }

  @Test
  fun `ausente devolve null e nao vira false`() {
    // Diferenciar "não sei" de "não bloqueado" é o que impede o cache de virar uma
    // resposta negativa silenciosa para um domínio que ninguém consultou ainda.
    assertNull(cache().get("desconhecido.com"))
  }

  @Test
  fun `expira pelo ttl`() {
    val cache = cache(ttlMs = 1000)
    cache.put("bet365.com", true)
    now = 999
    assertEquals(true, cache.get("bet365.com"))
    now = 1000
    assertNull(cache.get("bet365.com"))
  }

  @Test
  fun `descarta o menos usado ao estourar o limite`() {
    val cache = cache(maxEntries = 3)
    cache.put("a.com", true)
    cache.put("b.com", true)
    cache.put("c.com", true)

    // Toca em "a.com" para ele deixar de ser o mais antigo em USO.
    assertEquals(true, cache.get("a.com"))
    cache.put("d.com", true)

    assertEquals(3, cache.size())
    assertEquals(true, cache.get("a.com"))
    assertNull("b.com era o menos recentemente usado", cache.get("b.com"))
  }

  @Test
  fun `clear invalida tudo`() {
    val cache = cache()
    cache.put("bet365.com", true)
    cache.clear()
    assertNull(cache.get("bet365.com"))
    assertEquals(0, cache.size())
  }

  @Test
  fun `entrada vencida nao ocupa espaco depois de lida`() {
    val cache = cache(ttlMs = 10)
    cache.put("bet365.com", true)
    now = 100
    assertNull(cache.get("bet365.com"))
    assertEquals(0, cache.size())
  }

  @Test
  fun `decisao negativa tambem e cacheada`() {
    val cache = cache()
    cache.put("banco.com.br", false)
    assertFalse(cache.get("banco.com.br")!!)
    assertTrue(cache.size() == 1)
  }
}
