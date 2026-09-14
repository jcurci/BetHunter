package com.bethunter.app.dns

import android.util.Log
import com.bethunter.app.BuildConfig
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class DnsInterceptor(
  /**
   * Só a DECISÃO, não o matcher inteiro: o interceptor não tem por que conhecer o
   * SQLite e o cache de decisões que existem atrás dela. Como lambda, o caminho de
   * resolução pode ser exercitado num teste de JVM comum, sem Android.
   */
  private val isBlocked: (String) -> Boolean,
  private val protect: (DatagramSocket) -> Boolean,
  /**
   * Resolvido a cada query (com cache curto lá dentro) e não fixado na construção:
   * o usuário troca de Wi-Fi para dados móveis sem o túnel ser reerguido, e uma
   * lista congelada apontaria para resolvers da rede anterior.
   */
  private val upstreams: () -> List<InetAddress> = { UpstreamDnsProvider.FALLBACKS },
  private val cache: DnsResponseCache = DnsResponseCache(),
  private val upstreamPort: Int = 53,
  /** Alimenta a memória de saúde do [UpstreamDnsProvider]. */
  private val onUpstreamSuccess: (InetAddress) -> Unit = {},
  private val onUpstreamFailure: (InetAddress) -> Unit = {},
  private val clock: () -> Long = System::currentTimeMillis,
) {
  fun handleDnsQuery(queryPayload: ByteArray, queryLength: Int): ByteArray? {
    val msg = DnsPacketParser.parseQuery(queryPayload, queryLength) ?: return null
    val q = msg.questions.firstOrNull() ?: return null
    val domain = q.qName

    if (isBlocked(domain)) {
      if (BuildConfig.DEBUG) {
        Log.i(TAG, "Blocked DNS query for $domain")
      }
      return DnsResponseBuilder.buildNxDomain(msg)
    }

    cache.get(msg)?.let { return it }

    val response = forwardToUpstream(queryPayload, queryLength, msg.id)
    if (response == null) {
      // Descartar em silêncio deixava o app cliente esperando o próprio timeout —
      // "a internet travou depois que liguei a proteção". SERVFAIL falha rápido.
      Log.w(TAG, "All upstreams failed for $domain — answering SERVFAIL")
      return DnsResponseBuilder.buildServFail(msg)
    }

    cache.put(msg, response)
    return response
  }

  /** Descarta o que estiver cacheado (troca de rede, mudança de blocklist). */
  fun invalidateCache() = cache.clear()

  /**
   * Encaminha a query, tentando os servidores em ordem dentro de um orçamento fixo.
   *
   * Três coisas moldam este laço:
   *
   * 1. **Orçamento total** ([TOTAL_BUDGET_MS]). Antes eram 2 s POR servidor sem
   *    teto agregado: com os resolvers da rede na frente das reservas públicas, uma
   *    única resolução podia segurar um worker por mais de dez segundos, e o
   *    aparelho inteiro tem só um punhado deles.
   * 2. **Timeout curto na primeira tentativa** e mais folgado nas seguintes. O
   *    primeiro da fila é o mais provável de responder; se ele demora, desistir
   *    rápido dele custa menos do que esperar.
   * 3. **Uma segunda chance para o melhor servidor** antes de devolver SERVFAIL.
   *    Era o buraco mais visível: um cochilo isolado — rádio saindo do doze, troca
   *    de célula — virava SERVFAIL, que o Chrome mostra como
   *    DNS_PROBE_FINISHED_BAD_CONFIG. Uma falha de rede transitória não pode virar
   *    tela de erro na primeira tentativa.
   */
  private fun forwardToUpstream(
    queryPayload: ByteArray,
    queryLength: Int,
    queryId: Int,
  ): ByteArray? {
    val servers = upstreams()
    if (servers.isEmpty()) return null

    val deadline = clock() + TOTAL_BUDGET_MS

    DatagramSocket().use { socket ->
      // O retorno importa: sem proteção o pacote volta para a nossa própria tun e a
      // query se perde num laço até estourar o timeout.
      if (!protect(socket)) {
        Log.w(TAG, "protect() failed for upstream socket")
      }
      val responseBuf = ByteArray(RESPONSE_BUFFER_BYTES)
      val responsePacket = DatagramPacket(responseBuf, responseBuf.size)
      val requestPacket = DatagramPacket(queryPayload, queryLength)

      for ((index, server) in servers.withIndex()) {
        val timeout = remainingTimeout(deadline, if (index == 0) FIRST_TIMEOUT_MS else NEXT_TIMEOUT_MS)
          ?: break
        val response = attempt(socket, requestPacket, responsePacket, responseBuf, server, timeout, queryId)
        if (response != null) {
          onUpstreamSuccess(server)
          return response
        }
        onUpstreamFailure(server)
      }

      // Segunda chance só para o primeiro da fila, e só se ainda houver orçamento.
      val best = servers.first()
      val retryTimeout = remainingTimeout(deadline, NEXT_TIMEOUT_MS)
      if (retryTimeout != null) {
        val response =
          attempt(socket, requestPacket, responsePacket, responseBuf, best, retryTimeout, queryId)
        if (response != null) {
          onUpstreamSuccess(best)
          return response
        }
      }
      return null
    }
  }

  /** Timeout desta tentativa, ou null se o orçamento acabou. */
  private fun remainingTimeout(deadline: Long, preferred: Int): Int? {
    val remaining = deadline - clock()
    if (remaining < MIN_ATTEMPT_MS) return null
    return if (remaining < preferred) remaining.toInt() else preferred
  }

  private fun attempt(
    socket: DatagramSocket,
    requestPacket: DatagramPacket,
    responsePacket: DatagramPacket,
    responseBuf: ByteArray,
    server: InetAddress,
    timeoutMs: Int,
    queryId: Int,
  ): ByteArray? {
    return try {
      // `connect` entrega duas coisas: o kernel passa a reportar ICMP unreachable
      // como exceção imediata (um resolver inalcançável custava o timeout INTEIRO,
      // em toda query) e passa a descartar datagrama de qualquer outra origem, o
      // que fecha a porta para resposta forjada de terceiro.
      socket.connect(server, upstreamPort)
      socket.soTimeout = timeoutMs
      requestPacket.address = server
      requestPacket.port = upstreamPort
      socket.send(requestPacket)

      // Obrigatório antes de CADA receive: o receive anterior encolhe o length do
      // pacote para o tamanho recebido, e sem restaurar o buffer inteiro a próxima
      // resposta seria cortada no tamanho da anterior.
      responsePacket.setLength(responseBuf.size)
      socket.receive(responsePacket)

      val length = responsePacket.length
      if (length >= responseBuf.size) {
        // Resposta maior que o buffer: o kernel entregou o começo e jogou fora o
        // resto, SEM ligar o bit TC. Devolvê-la seria entregar um pacote mutilado
        // que o cliente rejeita — e, pior, guardá-lo no cache por até uma hora.
        Log.w(TAG, "Upstream response exceeded ${responseBuf.size} bytes — discarding")
        return null
      }
      if (!isValidResponse(responseBuf, length, queryId)) return null
      responseBuf.copyOfRange(0, length)
    } catch (e: Exception) {
      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Upstream ${server.hostAddress} failed: ${e.message}")
      }
      null
    } finally {
      try {
        socket.disconnect()
      } catch (_: Exception) {
      }
    }
  }

  /**
   * A resposta é para ESTA pergunta?
   *
   * O socket já filtra por origem depois do `connect`, mas o ID ainda importa: uma
   * resposta atrasada da tentativa anterior pode chegar durante a seguinte e seria
   * aceita como se fosse a certa — e então cacheada sob a chave errada.
   */
  private fun isValidResponse(buf: ByteArray, length: Int, queryId: Int): Boolean {
    if (length < 12) return false
    val id = ((buf[0].toInt() and 0xFF) shl 8) or (buf[1].toInt() and 0xFF)
    if (id != queryId) return false
    val isResponse = (buf[2].toInt() and 0x80) != 0
    return isResponse
  }

  companion object {
    private const val TAG = "BetBlockerDns"

    /**
     * 4096 e não 2048: com EDNS0 o resolver do sistema anuncia buffers grandes, e
     * resposta com DNSSEC ou muitos registros passava de 2048 — o kernel cortava em
     * silêncio e o cliente recebia lixo.
     */
    private const val RESPONSE_BUFFER_BYTES = 4096

    /** Teto de tempo para resolver UMA query, somando todas as tentativas. */
    private const val TOTAL_BUDGET_MS = 4_000L

    private const val FIRST_TIMEOUT_MS = 800
    private const val NEXT_TIMEOUT_MS = 1_500

    /** Abaixo disto não vale começar outra tentativa. */
    private const val MIN_ATTEMPT_MS = 150
  }
}
