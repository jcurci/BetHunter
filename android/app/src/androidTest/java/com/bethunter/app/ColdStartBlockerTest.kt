package com.bethunter.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.domain.DomainMatcher
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.repository.BlocklistManager
import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * O caminho de INSTALAÇÃO NOVA do bloqueador, exercitado de verdade.
 *
 * Existe porque todo o resto da suíte é lógica pura: a criação do banco, o seed da
 * blocklist e a consulta por sufixos nunca eram executados fora do aparelho. Um erro
 * ali não aparece em nenhum teste, não crasha, e falha do jeito mais perigoso
 * possível — o app abre, diz "protegido" e não bloqueia nada.
 *
 * Roda dentro do processo do app (`connectedDebugAndroidTest`), com as permissões e o
 * diretório de dados reais. Cada teste começa apagando o banco, então o estado é o de
 * quem acabou de instalar.
 *
 * NÃO cobre — e nenhum teste automatizado cobre: compra no RevenueCat, jornada guiada,
 * diálogo de consentimento do Android, device admin e VPN sempre ativa. Isso exige
 * aparelho e conta reais.
 */
@RunWith(AndroidJUnit4::class)
class ColdStartBlockerTest {

  private val context = InstrumentationRegistry.getInstrumentation().targetContext

  @Before
  fun apagaOBancoParaSimularInstalacaoNova() {
    context.deleteDatabase(DB_NAME)
  }

  @Test
  fun bancoNasceDoZeroEJaProtegeComOsDefaults() {
    val repository = BlockedDomainsRepository(context)
    val manager = BlocklistManager(repository, context)

    // Sem isto, o usuário novo fica desprotegido até o primeiro refresh remoto
    // terminar — que depende de rede e pode demorar.
    manager.ensureBlocklistPresent()

    assertEquals(
      "o seed inicial precisa gravar todos os defaults",
      BlockedDomainsRepository.DEFAULT_BLOCKED_DOMAINS.size,
      repository.getBlockedDomainsCount(),
    )

    val matcher = DomainMatcher(repository)
    assertTrue("bet365.com é default e tem que bloquear", matcher.isBlocked("bet365.com"))
    assertFalse("google.com não pode ser bloqueado", matcher.isBlocked("google.com"))
    assertFalse("betterment.com está na allowlist", matcher.isBlocked("betterment.com"))
  }

  @Test
  fun casaSubdominioNoBancoRecemCriado() {
    val repository = BlockedDomainsRepository(context)
    BlocklistManager(repository, context).ensureBlocklistPresent()
    val matcher = DomainMatcher(repository)

    // `pokerstars.com` de propósito: é o único default que o KeywordMatcher NÃO pega
    // (não tem "bet" nem token de marca), então o resultado vem exclusivamente da
    // consulta por sufixos no banco. Com `bet365.com` o teste passaria pela heurística
    // mesmo se a SQL estivesse quebrada.
    assertTrue(matcher.isBlocked("www.pokerstars.com"))
    assertTrue(matcher.isBlocked("promo.app.pokerstars.com"))

    // Sufixo é sufixo, não substring: o domínio bloqueado aparecendo no MEIO de outro
    // nome não pode bloquear o outro nome.
    assertFalse(matcher.isBlocked("pokerstars.com.exemplo-legitimo.com"))

    // Já `bet365.com.algumacoisa.com` É bloqueado — mas pelo KeywordMatcher, que existe
    // justamente para pegar esse padrão de mirror. Fixado aqui para a diferença entre
    // os dois mecanismos ficar explícita.
    assertTrue(matcher.isBlocked("bet365.com.exemplo-qualquer.com"))
  }

  @Test
  fun licencaAusenteEmInstalacaoNovaEValida() {
    // Chave nunca gravada = em dia. Se isto virasse "vencida", TODO usuário novo (e
    // todo assinante no primeiro update) perderia a VPN antes da primeira confirmação.
    val repository = BlockedDomainsRepository(context)
    assertTrue(repository.isPremiumLeaseValid())
    assertFalse(repository.isPremiumPaused())
    assertFalse(repository.isBlockingEnabled())
  }

  @Test
  fun flagsSobrevivemAReaberturaDoBanco() {
    BlockedDomainsRepository(context).setBlockingEnabled(true)

    // Instância nova = o que acontece entre o processo :vpn e o principal. Se o KV
    // não persistisse, a intenção do usuário se perderia a cada troca de processo.
    assertTrue(BlockedDomainsRepository(context).isBlockingEnabled())
  }

  @Test
  fun lockDeRefreshImpedeDoisAoMesmoTempo() {
    val repository = BlockedDomainsRepository(context)

    assertTrue("o primeiro tem que passar", repository.tryAcquireRefreshLock(60_000))
    assertFalse("o segundo tem que ser recusado", repository.tryAcquireRefreshLock(60_000))

    repository.releaseRefreshLock()
    assertTrue("depois do release, passa de novo", repository.tryAcquireRefreshLock(60_000))
    repository.releaseRefreshLock()
  }

  @Test
  fun eventLogGravaECoalesceRepeticoes() {
    repeat(3) { VpnEventLog.log(context, "teste_evento_repetido") }
    VpnEventLog.log(context, "teste_evento_unico")
    Thread.sleep(1_000) // as escritas são enfileiradas num executor serial

    val events = JSONArray(VpnEventLog.getEventsJson(context))
    var repetido: org.json.JSONObject? = null
    var unico: org.json.JSONObject? = null
    for (i in 0 until events.length()) {
      val entry = events.getJSONObject(i)
      when (entry.optString("event")) {
        "teste_evento_repetido" -> repetido = entry
        "teste_evento_unico" -> unico = entry
      }
    }

    // Coalescer é o que impede um laço de start/stop de apagar o histórico inteiro.
    assertEquals("3 repetições viram uma linha com contador", 3, repetido?.optInt("count"))
    assertEquals("evento único não ganha contador", 0, unico?.optInt("count", 0))
  }

  /**
   * Exercita o download e a ingestão da lista real (~300 mil domínios).
   *
   * É o teste mais lento e o único que depende de rede — e também o único que prova
   * que um usuário novo termina protegido de verdade, e não só pelos 7 defaults.
   */
  @Test(timeout = 300_000)
  fun refreshRemotoIngereAListaCompletaEPassaAValer() {
    val repository = BlockedDomainsRepository(context)
    val manager = BlocklistManager(repository, context)
    manager.ensureBlocklistPresent()

    val outcome = manager.forceRefresh()
    assertTrue("o refresh precisa trazer domínios novos", outcome.domainsChanged)

    val total = repository.getBlockedDomainsCount()
    assertTrue("lista remota tem centenas de milhares de domínios, veio $total", total > 100_000)

    // Domínio que NÃO é default: só bloqueia se a ingestão e a consulta funcionarem.
    val matcher = DomainMatcher(repository)
    assertTrue(matcher.isBlocked("betano.com"))
    assertFalse("um refresh grande não pode passar a bloquear a internet toda", matcher.isBlocked("wikipedia.org"))
  }

  private companion object {
    const val DB_NAME = "bet_blocker_domains.db"
  }
}
