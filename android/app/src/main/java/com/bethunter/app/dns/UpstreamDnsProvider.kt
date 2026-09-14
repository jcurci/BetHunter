package com.bethunter.app.dns

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Log
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.util.concurrent.ConcurrentHashMap

/**
 * Servidores para onde encaminhar as queries que não são bloqueadas.
 *
 * Antes eram fixos em 1.1.1.1 e 8.8.8.8. Isso quebra em toda rede que não deixa o
 * aparelho falar com DNS público — Wi-Fi corporativo, portal cativo de hotel,
 * operadora que intercepta a porta 53 — e o efeito para o usuário era o pior
 * possível: com a proteção ligada, o aparelho ficava "sem internet". Quem passa
 * por isso desliga o bloqueador ou desinstala o app, e nada no log denuncia a
 * causa.
 *
 * Agora o resolver da própria rede vem primeiro, e os públicos ficam como reserva
 * para o caso de a rede não anunciar DNS nenhum.
 */
class UpstreamDnsProvider(
  private val context: Context,
  private val ttlMs: Long = CACHE_TTL_MS,
  private val clock: () -> Long = System::currentTimeMillis,
  /**
   * Chamado quando a lista de resolvers muda, o que na prática significa que o
   * usuário trocou de rede (Wi-Fi ↔ dados móveis, outro Wi-Fi).
   *
   * Serve para descartar respostas cacheadas: nomes internos de uma rede
   * corporativa, ou o IP mais próximo devolvido por um CDN, não valem na rede
   * seguinte — e o cache chega a segurar resposta por uma hora.
   */
  private val onServersChanged: () -> Unit = {},
) {
  @Volatile private var cached: List<InetAddress> = emptyList()
  @Volatile private var cachedAt = 0L

  /** Servidor -> instante até o qual ele fica rebaixado por ter falhado. */
  private val penalizedUntil = ConcurrentHashMap<InetAddress, Long>()

  /**
   * Resolvers em ordem de preferência: os da rede subjacente, depois os públicos,
   * com quem falhou recentemente empurrado para o fim.
   */
  fun servers(): List<InetAddress> {
    val now = clock()
    val snapshot = cached
    val base = if (snapshot.isNotEmpty() && now - cachedAt < ttlMs) snapshot else refresh(now)
    return demoteUnhealthy(base, now)
  }

  /**
   * Este servidor não respondeu. Rebaixa por [PENALTY_MS] em vez de remover.
   *
   * Sem isso, um resolver morto anunciado pela rede era tentado PRIMEIRO em cada
   * query, para sempre — o timeout dele entrava no custo de toda resolução do
   * aparelho. Rebaixar em vez de remover porque a falha pode ser da rede, não dele:
   * a lista tem de se recompor sozinha quando o sinal voltar.
   */
  fun reportFailure(server: InetAddress) {
    penalizedUntil[server] = clock() + PENALTY_MS
  }

  /** Este servidor respondeu: volta imediatamente à posição natural. */
  fun reportSuccess(server: InetAddress) {
    penalizedUntil.remove(server)
  }

  private fun refresh(now: Long): List<InetAddress> {
    val snapshot = cached
    val discovered = try {
      discover()
    } catch (e: Exception) {
      Log.w(TAG, "Could not read network DNS servers: ${e.message}")
      emptyList()
    }

    // `distinct` porque é comum a rede anunciar justamente um resolver público.
    // O corte em MAX_DISCOVERED limita o pior caso de uma rede que anuncia quatro
    // ou mais resolvers; as duas reservas públicas ficam SEMPRE no fim, porque são
    // a última linha de defesa contra "o aparelho ficou sem DNS".
    val result = (discovered.take(MAX_DISCOVERED) + FALLBACKS).distinct()
    val changed = snapshot.isNotEmpty() && result != snapshot
    cached = result
    cachedAt = now
    if (changed) {
      Log.i(TAG, "Upstream DNS servers changed — network switch")
      penalizedUntil.clear()
      try {
        onServersChanged()
      } catch (e: Exception) {
        Log.w(TAG, "onServersChanged failed: ${e.message}")
      }
    }
    return result
  }

  /**
   * Saudáveis primeiro, rebaixados depois, preservando a preferência dentro de cada
   * grupo.
   *
   * A classificação é feita de uma vez, antes de ordenar, e não dentro do
   * comparador: o seletor de `sortedBy` é chamado a cada comparação, então expirar
   * penalidade lá dentro seria mutar o mapa no meio da ordenação.
   */
  private fun demoteUnhealthy(base: List<InetAddress>, now: Long): List<InetAddress> {
    if (penalizedUntil.isEmpty()) return base
    val (healthy, demoted) = base.partition { server ->
      val until = penalizedUntil[server] ?: return@partition true
      if (now >= until) {
        penalizedUntil.remove(server)
        true
      } else {
        false
      }
    }
    return if (demoted.isEmpty()) base else healthy + demoted
  }

  /**
   * DNS da rede REAL, nunca da nossa.
   *
   * Com o túnel de pé, a rede ativa do sistema é a própria VPN e o DNS dela é o
   * endereço falso que anunciamos — perguntar a ele seria um laço. Por isso a
   * varredura pula tudo que tem transporte VPN. Redes validadas têm preferência:
   * `allNetworks` também devolve interfaces em transição, que dariam uma lista de
   * resolvers inalcançáveis.
   */
  private fun discover(): List<InetAddress> {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
      ?: return emptyList()

    val candidates = ArrayList<List<InetAddress>>()
    for (network in cm.allNetworks) {
      val caps = cm.getNetworkCapabilities(network) ?: continue
      if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) continue
      if (!caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) continue

      val servers = cm.getLinkProperties(network)?.dnsServers
        ?.filter { it.hostAddress != FAKE_DNS_SERVER }
        ?.filter { isUsable(it) }
        ?.let { preferIpv4(it) }
        ?: continue
      if (servers.isEmpty()) continue

      if (caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
        return servers
      }
      candidates.add(servers)
    }
    return candidates.firstOrNull() ?: emptyList()
  }

  /**
   * IPv4 na frente, IPv6 PRESERVADO atrás.
   *
   * Ordenar, e não filtrar: em rede IPv6-only (464XLAT) os únicos resolvers
   * anunciados podem ser IPv6, e descartá-los deixaria o aparelho dependendo de
   * 1.1.1.1 alcançável só via CLAT — recriando exatamente o "ficou sem internet com
   * a proteção ligada" que esta classe existe para evitar. A preferência por IPv4
   * é só de latência: é o caminho que costuma responder primeiro em rede
   * dual-stack, onde o IPv6 anunciado às vezes nem tem conectividade real.
   *
   * `sortedBy` é estável, então a ordem que o sistema deu é preservada dentro de
   * cada família.
   */
  private fun preferIpv4(servers: List<InetAddress>): List<InetAddress> =
    servers.sortedBy { if (it is Inet4Address) 0 else 1 }

  /**
   * Link-local IPv6 sem scope id não é roteável — mandar pacote para lá é gastar o
   * timeout inteiro para nada. Com scope id é endereço legítimo e fica.
   */
  private fun isUsable(address: InetAddress): Boolean {
    if (address !is Inet6Address) return true
    return !address.isLinkLocalAddress || address.scopeId != 0
  }

  companion object {
    private const val TAG = "UpstreamDns"

    /** Mesmo endereço anunciado pelo túnel — ver BetBlockerVpnService.FAKE_DNS_SERVER. */
    private const val FAKE_DNS_SERVER = "10.0.0.1"

    private val CACHE_TTL_MS = 60_000L

    /** Quantos resolvers da rede entram na lista, no máximo. */
    private const val MAX_DISCOVERED = 2

    /** Quanto tempo um servidor que falhou fica no fim da fila. */
    private const val PENALTY_MS = 2L * 60 * 1000

    /** Reserva para rede que não anuncia resolver (ou anuncia só o nosso). */
    val FALLBACKS: List<InetAddress> = listOf(
      InetAddress.getByName("1.1.1.1"),
      InetAddress.getByName("8.8.8.8"),
    )
  }
}
