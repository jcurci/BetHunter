package com.bethunter.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainSuffixesTest {

  @Test
  fun `gera do mais curto ao mais longo`() {
    assertEquals(
      listOf("exemplo.com", "b.exemplo.com", "a.b.exemplo.com"),
      DomainSuffixes.of("a.b.exemplo.com"),
    )
  }

  @Test
  fun `dominio registravel devolve so ele mesmo`() {
    assertEquals(listOf("bet365.com"), DomainSuffixes.of("bet365.com"))
  }

  @Test
  fun `ignora nome de um rotulo so`() {
    // `normalizeDomain` recusa entrada sem ponto, então "com" nunca está na tabela:
    // gerar esse sufixo só encheria a cláusula IN.
    assertTrue(DomainSuffixes.of("com").isEmpty())
    assertTrue(DomainSuffixes.of("").isEmpty())
  }

  @Test
  fun `equivale ao passeio da trie - qualquer sufixo mapeado casa`() {
    // A trie antiga casava em QUALQUER nó terminal do caminho. Para um subdomínio
    // profundo, a lista precisa conter tanto o domínio registrável quanto os
    // intermediários.
    val suffixes = DomainSuffixes.of("promo.app.casa-de-aposta.com")
    assertTrue("exige o registrável", suffixes.contains("casa-de-aposta.com"))
    assertTrue("exige o intermediário", suffixes.contains("app.casa-de-aposta.com"))
    assertTrue("exige o nome cheio", suffixes.contains("promo.app.casa-de-aposta.com"))
  }

  @Test
  fun `respeita o teto de sufixos`() {
    val deep = (1..40).joinToString(".") { "s$it" } + ".exemplo.com"
    val suffixes = DomainSuffixes.of(deep)
    assertEquals(DomainSuffixes.MAX_SUFFIXES, suffixes.size)
    // O corte tem de preservar os mais CURTOS, que são os que a blocklist contém.
    assertEquals("exemplo.com", suffixes.first())
  }

  @Test
  fun `ignora rotulos vazios`() {
    assertEquals(listOf("exemplo.com"), DomainSuffixes.of("exemplo.com."))
  }
}
