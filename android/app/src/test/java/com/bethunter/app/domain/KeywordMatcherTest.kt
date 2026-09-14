package com.bethunter.app.domain

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Fixa o comportamento ATUAL da heurística de palavra-chave.
 *
 * Não é uma lista de desejos: é a rede de segurança que faltava. Esta é a única
 * peça da decisão por query que não tinha teste, e é também a mais delicada de
 * mexer — ela existe para pegar mirrors que a lista remota ainda não mapeou
 * (`23bet*`, `bet\d+`), e afrouxá-la sem perceber significa deixar passar casa de
 * aposta num app de autoexclusão.
 *
 * O over-block é DELIBERADO (ver o cabeçalho de [KeywordMatcher]): a filosofia do
 * produto tolera bloquear demais para não bloquear de menos. Os casos abaixo
 * documentam onde essa linha está hoje, para que qualquer mudança futura apareça
 * como quebra de teste em vez de como regressão silenciosa em campo.
 */
class KeywordMatcherTest {

  @Test
  fun `pega bet como palavra isolada ou grudada em digitos`() {
    assertTrue(KeywordMatcher.isGamblingDomain("bet.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("bet365.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("23bet36.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("estrela-bet.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("aposta-bet.net"))
  }

  @Test
  fun `nao pega bet como substring solta`() {
    // O limite que impede o falso positivo óbvio: "bet" colado em letras não conta.
    assertFalse(KeywordMatcher.isGamblingDomain("betterment.com"))
    assertFalse(KeywordMatcher.isGamblingDomain("abet.com"))
    assertFalse(KeywordMatcher.isGamblingDomain("alphabet.com"))
  }

  @Test
  fun `pega marcas conhecidas em qualquer posicao`() {
    assertTrue(KeywordMatcher.isGamblingDomain("betano.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("www.betfair.com.br"))
    assertTrue(KeywordMatcher.isGamblingDomain("1xbet.mirror.io"))
    assertTrue(KeywordMatcher.isGamblingDomain("parimatch.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("cdn.pixbet.com"))
  }

  @Test
  fun `allowlist vence a heuristica inclusive em subdominio`() {
    assertFalse(KeywordMatcher.isGamblingDomain("betterment.com"))
    assertFalse(KeywordMatcher.isGamblingDomain("app.betterment.com"))
  }

  @Test
  fun `dominio vazio nunca bloqueia`() {
    // Query de raiz normaliza para string vazia; não pode virar bloqueio.
    assertFalse(KeywordMatcher.isGamblingDomain(""))
  }

  @Test
  fun `tokens genericos casam como substring — over-block deliberado`() {
    // COMPORTAMENTO ATUAL, documentado de propósito. Estes tokens não têm limite de
    // label, então pegam variantes coladas — que é o objetivo com `stake7`, mas
    // também alcança nomes legítimos. Trocar por match com limite de label faria
    // `stake7.com` e `stakecasino.com` DEIXAREM de ser bloqueados; se algum dia
    // isso for feito, é aqui que a decisão tem de ser reavaliada em conjunto com a
    // ALLOWLIST.
    assertTrue(KeywordMatcher.isGamblingDomain("stake.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("stake7.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("blaze.com"))
    assertTrue(KeywordMatcher.isGamblingDomain("casino-online.net"))
    assertTrue(KeywordMatcher.isGamblingDomain("melhores-apostas.com"))

    // O outro lado da mesma moeda, também atual:
    assertTrue("colisao conhecida do token 'stake'", KeywordMatcher.isGamblingDomain("stakeholder.com"))
    assertTrue("colisao conhecida do token 'blaze'", KeywordMatcher.isGamblingDomain("blazemeter.com"))
  }
}
