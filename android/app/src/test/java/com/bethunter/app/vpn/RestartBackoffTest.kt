package com.bethunter.app.vpn

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RestartBackoffTest {

  @Test
  fun `primeira tentativa mantem os 2s do comportamento anterior`() {
    // Queda isolada precisa ser recuperada tão rápido quanto antes do backoff.
    assertEquals(2_000L, RestartBackoff.delayFor(0))
  }

  @Test
  fun `dobra a cada tentativa consecutiva`() {
    assertEquals(4_000L, RestartBackoff.delayFor(1))
    assertEquals(8_000L, RestartBackoff.delayFor(2))
    assertEquals(16_000L, RestartBackoff.delayFor(3))
  }

  @Test
  fun `respeita o teto de 5 minutos`() {
    assertEquals(RestartBackoff.MAX_DELAY_MS, RestartBackoff.delayFor(8))
    assertEquals(RestartBackoff.MAX_DELAY_MS, RestartBackoff.delayFor(50))
    // O contador vem do SQLite e pode voltar corrompido/enorme: o shift não pode
    // estourar para negativo nem o delay virar "nunca mais tenta".
    assertEquals(RestartBackoff.MAX_DELAY_MS, RestartBackoff.delayFor(Int.MAX_VALUE))
  }

  @Test
  fun `nunca devolve delay invalido`() {
    for (attempt in -5..64) {
      val delay = RestartBackoff.delayFor(attempt)
      assertTrue(
        "delay fora da faixa para attempt=$attempt: $delay",
        delay in RestartBackoff.BASE_DELAY_MS..RestartBackoff.MAX_DELAY_MS,
      )
    }
  }

  @Test
  fun `e monotonico enquanto nao bate o teto`() {
    var previous = 0L
    for (attempt in 0..12) {
      val delay = RestartBackoff.delayFor(attempt)
      assertTrue("attempt=$attempt regrediu ($previous -> $delay)", delay >= previous)
      previous = delay
    }
  }
}
