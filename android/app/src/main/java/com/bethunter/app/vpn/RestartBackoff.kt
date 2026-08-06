package com.bethunter.app.vpn

/**
 * Backoff exponencial do watchdog de restart da VPN: 2 s, 4 s, 8 s… com teto de 5 min.
 *
 * Separado do serviço para poder ser testado sem Android — e porque a política de
 * quando insistir é decisão própria, não detalhe do lifecycle.
 *
 * O delay fixo de 2 s de antes pressupunha que o próximo start daria certo. Quando
 * a causa da queda persiste (start recusado por licença, `establish()` falhando em
 * série), esse pressuposto virava um ciclo de 2 em 2 segundos que queimava bateria,
 * dados e o próprio log de diagnóstico. O contador é zerado em todo `establish()`
 * bem-sucedido, então uma queda isolada continua sendo recuperada em 2 s.
 */
object RestartBackoff {
  const val BASE_DELAY_MS = 2_000L
  const val MAX_DELAY_MS = 5L * 60 * 1000

  /** Delay para a tentativa [attempt] (0 = primeira). Nunca abaixo da base nem acima do teto. */
  fun delayFor(attempt: Int): Long {
    if (attempt <= 0) return BASE_DELAY_MS
    // Teto no shift antes do shift: 1L shl 63 vira negativo.
    val shift = attempt.coerceAtMost(8)
    return (BASE_DELAY_MS shl shift).coerceAtMost(MAX_DELAY_MS)
  }
}
