package com.bethunter.app.domain

/**
 * Heurística por palavra-chave para pegar mirrors de casas de aposta que NÃO estão
 * na blocklist exata (ex.: `23bet36.com` e a família `23bet*`, criados/rotacionados
 * mais rápido do que a lista remota consegue mapear).
 *
 * Complementa a consulta à blocklist (match exato/sufixo). Roda por query DNS, então
 * as regex são compiladas uma única vez aqui.
 *
 * Filosofia (app de proteção/autoexclusão): tolera algum over-block, mas evita os
 * falso-positivos óbvios — por isso "bet" só conta quando é palavra isolada ou vem
 * com dígitos (`bet365`, `23bet36`), nunca como substring solta (`betterment`, `abet`).
 */
object KeywordMatcher {

  // "bet" delimitado por início/ponto/hífen, sozinho ou grudado em dígitos.
  // Casa: bet.com, bet365, 23bet36, bet36, estrela-bet.com, aposta-bet.
  // NÃO casa: betterment.com, abet.com, sportsbetting (sem limite após "bet").
  private val BET_REGEX = Regex("""(^|[.-])(\d*bet\d*)([.-]|$)""")

  // Marcas/tokens fortes de aposta (checados por `contains` no domínio normalizado).
  // Vários já contêm "bet" grudado em letras (betano, betfair) e por isso não são
  // pegos pela BET_REGEX — precisam estar aqui explicitamente.
  private val KEYWORDS = listOf(
    "aposta", "cassino", "casino",
    "betano", "betfair", "betnacional", "betsson", "betwarrior", "bet7k",
    "1xbet", "sportingbet", "sportsbet", "estrelabet", "vaidebet", "superbet",
    "novibet", "parimatch", "pixbet", "brazino", "blaze", "stake", "galera.bet"
  )

  // Domínios legítimos que casariam por engano — nunca bloquear.
  private val ALLOWLIST = setOf(
    "betterment.com"
  )

  /** true se o domínio normalizado tem cara de casa de aposta. */
  fun isGamblingDomain(normalized: String): Boolean {
    if (normalized.isEmpty()) return false
    if (isAllowlisted(normalized)) return false
    if (BET_REGEX.containsMatchIn(normalized)) return true
    return KEYWORDS.any { normalized.contains(it) }
  }

  private fun isAllowlisted(normalized: String): Boolean {
    if (normalized in ALLOWLIST) return true
    // Cobre subdomínios de um domínio allowlisted (app.betterment.com).
    return ALLOWLIST.any { normalized == it || normalized.endsWith(".$it") }
  }
}
