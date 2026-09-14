package com.bethunter.app.dns

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.atomic.AtomicInteger
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Mede o caminho de resolução contra um resolver FALSO de verdade — um socket UDP
 * em 127.0.0.1 — em vez de simular.
 *
 * O que importa aqui é o contador: quantos pacotes REALMENTE saíram. É a única
 * forma honesta de afirmar que o cache de negativas tirou tráfego da rede, porque
 * um teste que só olha o valor de retorno não distingue "veio do cache" de "foi
 * buscar de novo".
 */
class DnsInterceptorNetworkTest {

  /** Resolver falso: conta o que recebe e responde o que mandarem responder. */
  private class FakeResolver(
    private val delayMs: Long = 0,
    private val reply: (queryId: Int, query: ByteArray) -> ByteArray?,
  ) {
    val socket = DatagramSocket(0, InetAddress.getByName("127.0.0.1"))
    val received = AtomicInteger(0)
    @Volatile private var running = true

    val port: Int get() = socket.localPort
    val address: InetAddress = InetAddress.getByName("127.0.0.1")

    private val thread = Thread {
      val buf = ByteArray(4096)
      while (running) {
        try {
          val packet = DatagramPacket(buf, buf.size)
          socket.receive(packet)
          received.incrementAndGet()
          val query = packet.data.copyOfRange(0, packet.length)
          val id = ((query[0].toInt() and 0xFF) shl 8) or (query[1].toInt() and 0xFF)
          if (delayMs > 0) Thread.sleep(delayMs)
          val response = reply(id, query) ?: continue
          socket.send(DatagramPacket(response, response.size, packet.address, packet.port))
        } catch (e: Exception) {
          if (running) continue else break
        }
      }
    }.apply { isDaemon = true; start() }

    fun stop() {
      running = false
      socket.close()
      thread.interrupt()
    }
  }

  private val resolvers = mutableListOf<FakeResolver>()

  private fun resolver(delayMs: Long = 0, reply: (Int, ByteArray) -> ByteArray?) =
    FakeResolver(delayMs, reply).also { resolvers.add(it) }

  @After
  fun tearDown() = resolvers.forEach { it.stop() }

  private fun interceptor(
    vararg upstream: FakeResolver,
    blocked: (String) -> Boolean = { false },
    onFailure: (InetAddress) -> Unit = {},
  ): DnsInterceptor {
    // Todos os resolvers falsos precisam compartilhar a mesma porta para caberem na
    // API do interceptor, então usamos um único upstream por teste quando a porta
    // difere; para failover, o teste usa portas iguais em endereços distintos não é
    // possível em loopback — então o cenário de failover usa um upstream inalcançável.
    return DnsInterceptor(
      isBlocked = blocked,
      protect = { true },
      upstreams = { upstream.map { it.address } },
      upstreamPort = upstream.first().port,
      onUpstreamFailure = onFailure,
    )
  }

  private fun ask(
    interceptor: DnsInterceptor,
    id: Int,
    name: String = "exemplo.com",
    qType: Int = 1,
  ): ByteArray? {
    val query = DnsFixtures.query(id = id, name = name, qType = qType)
    return interceptor.handleDnsQuery(query, query.size)
  }

  // ---------------------------------------------------------------- cache

  @Test
  fun `NODATA repetido nao gera segunda ida a rede`() {
    val server = resolver { id, _ -> DnsFixtures.negativeResponse(id = id, qType = 28) }
    val interceptor = interceptor(server)

    assertNotNull(ask(interceptor, id = 1, qType = 28))
    assertNotNull(ask(interceptor, id = 2, qType = 28))
    assertNotNull(ask(interceptor, id = 3, qType = 28))

    // ESTE é o número que sustenta a afirmação de que ficou mais rápido.
    assertEquals("3 perguntas AAAA deveriam custar 1 pacote", 1, server.received.get())
  }

  @Test
  fun `NXDOMAIN repetido nao gera segunda ida a rede`() {
    val server = resolver { id, _ -> DnsFixtures.negativeResponse(id = id, rcode = 3) }
    val interceptor = interceptor(server)

    repeat(3) { ask(interceptor, id = it + 1) }
    assertEquals(1, server.received.get())
  }

  @Test
  fun `resposta positiva repetida nao gera segunda ida a rede`() {
    val server = resolver { id, _ -> DnsFixtures.response(id = id, ttls = listOf(300)) }
    val interceptor = interceptor(server)

    repeat(3) { ask(interceptor, id = it + 1) }
    assertEquals(1, server.received.get())
  }

  @Test
  fun `SERVFAIL do upstream nao gruda no cache`() {
    val server = resolver { id, _ -> DnsFixtures.response(id = id, rcode = 2) }
    val interceptor = interceptor(server)

    repeat(3) { ask(interceptor, id = it + 1) }
    // Falha transitória do upstream não pode ser lembrada: toda pergunta vai à rede.
    assertEquals(3, server.received.get())
  }

  @Test
  fun `dominio bloqueado nunca chega ao upstream`() {
    val server = resolver { id, _ -> DnsFixtures.response(id = id) }
    val interceptor = interceptor(server, blocked = { it == "bet365.com" })

    val response = ask(interceptor, id = 1, name = "bet365.com")
    assertNotNull(response)
    assertEquals("NXDOMAIN", 3, response!![3].toInt() and 0x0F)
    assertEquals("bloqueio nao pode vazar para a rede", 0, server.received.get())
  }

  // ------------------------------------------------------- robustez / limites

  @Test
  fun `resposta maior que o buffer e descartada em vez de devolvida`() {
    // 300 registros A ≈ 4,8 KB: passa dos 4096 do buffer. O kernel entrega o começo
    // e descarta o resto SEM ligar o bit TC — antes isso era devolvido ao cliente e
    // ainda cacheado por ate uma hora.
    val server = resolver { id, _ ->
      DnsFixtures.response(id = id, ttls = List(300) { 300 })
    }
    val interceptor = interceptor(server)

    val response = ask(interceptor, id = 1)
    assertNotNull(response)
    assertEquals("deve virar SERVFAIL, nao lixo", 2, response!![3].toInt() and 0x0F)
  }

  @Test
  fun `resposta com id divergente e rejeitada`() {
    val server = resolver { _, _ -> DnsFixtures.response(id = 0x7777) }
    val interceptor = interceptor(server)

    val response = ask(interceptor, id = 0x1111)
    assertNotNull(response)
    assertEquals("resposta descasada nao pode ser entregue", 2, response!![3].toInt() and 0x0F)
  }

  @Test
  fun `upstream mudo respeita o orcamento total`() {
    val failures = mutableListOf<InetAddress>()
    val server = resolver { _, _ -> null } // recebe e nunca responde
    val interceptor = interceptor(server, onFailure = { failures.add(it) })

    val started = System.currentTimeMillis()
    val response = ask(interceptor, id = 1)
    val elapsed = System.currentTimeMillis() - started

    assertEquals("SERVFAIL", 2, response!![3].toInt() and 0x0F)
    // Antes: 2 s por servidor SEM teto agregado. Agora: 800 ms + 1500 ms de segunda
    // chance, sob teto rigido de 4 s.
    assertTrue("demorou ${elapsed}ms, deveria ficar sob o orcamento", elapsed < 4_000)
    assertTrue("deveria ter tentado de novo antes de desistir", elapsed >= 800)
    assertTrue("a falha deve alimentar a memoria de saude", failures.isNotEmpty())
    assertEquals("1 tentativa + 1 segunda chance", 2, server.received.get())
  }

  // ------------------------------------------------------- simulacao de pagina

  @Test
  fun `pagina revisitada nao gera trafego de DNS`() {
    // 40 hostnames x 3 qtypes (A, AAAA, HTTPS) = o formato real de uma pagina de
    // portal. A resolve; AAAA e HTTPS voltam NODATA, que era o caso NUNCA cacheado.
    val server = resolver(delayMs = 20) { id, query ->
      val qType = ((query[query.size - 4].toInt() and 0xFF) shl 8) or
        (query[query.size - 3].toInt() and 0xFF)
      if (qType == 1) DnsFixtures.response(id = id, ttls = listOf(300))
      else DnsFixtures.negativeResponse(id = id, qType = qType)
    }
    val interceptor = interceptor(server)
    val hosts = (1..40).map { "host$it.exemplo.com" }
    val qTypes = listOf(1, 28, 65)

    var id = 0
    val coldStart = System.currentTimeMillis()
    for (host in hosts) for (t in qTypes) ask(interceptor, ++id, host, t)
    val coldMs = System.currentTimeMillis() - coldStart
    val coldPackets = server.received.get()

    val warmStart = System.currentTimeMillis()
    for (host in hosts) for (t in qTypes) ask(interceptor, ++id, host, t)
    val warmMs = System.currentTimeMillis() - warmStart
    val warmPackets = server.received.get() - coldPackets

    println("[MEDIDO] 1a visita: $coldPackets pacotes, ${coldMs}ms")
    println("[MEDIDO] revisita:  $warmPackets pacotes, ${warmMs}ms")

    assertEquals("primeira visita vai toda a rede", 120, coldPackets)
    assertEquals("revisita nao pode gerar UM pacote sequer", 0, warmPackets)
  }

  @Test
  fun `comparacao com o comportamento anterior`() {
    // Baseline: negativas SEM SOA nao sao cacheaveis — e esse e exatamente o
    // caminho que o codigo ANTIGO percorria para TODA negativa, porque o
    // `isCacheable` de antes exigia ANCOUNT>0. Rodar os dois arms no mesmo harness
    // da um antes/depois medido, e nao estimado.
    fun medir(comSoa: Boolean): Pair<Int, Long> {
      val server = resolver(delayMs = 20) { id, query ->
        val qType = ((query[query.size - 4].toInt() and 0xFF) shl 8) or
          (query[query.size - 3].toInt() and 0xFF)
        if (qType == 1) DnsFixtures.response(id = id, ttls = listOf(300))
        else DnsFixtures.negativeResponse(id = id, qType = qType, includeSoa = comSoa)
      }
      val interceptor = interceptor(server)
      val hosts = (1..40).map { "host$it.exemplo.com" }
      val qTypes = listOf(1, 28, 65)

      var id = 0
      for (host in hosts) for (t in qTypes) ask(interceptor, ++id, host, t) // 1a visita
      val apos = server.received.get()

      val inicio = System.currentTimeMillis()
      for (host in hosts) for (t in qTypes) ask(interceptor, ++id, host, t) // revisita
      val ms = System.currentTimeMillis() - inicio
      return (server.received.get() - apos) to ms
    }

    val (antesPacotes, antesMs) = medir(comSoa = false)
    val (depoisPacotes, depoisMs) = medir(comSoa = true)

    println("[COMPARACAO] revisita ANTES:  $antesPacotes pacotes, ${antesMs}ms")
    println("[COMPARACAO] revisita DEPOIS: $depoisPacotes pacotes, ${depoisMs}ms")

    // 40 hostnames x 2 qtypes negativos (AAAA e HTTPS) iam a rede em toda revisita.
    assertEquals(80, antesPacotes)
    assertEquals(0, depoisPacotes)
    assertTrue("a revisita deveria ficar dramaticamente mais rapida", depoisMs < antesMs / 10)
  }
}
