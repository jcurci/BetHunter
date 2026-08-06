package com.bethunter.app.dns

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Log
import java.net.InetAddress

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

  /** Resolvers em ordem de preferência: os da rede subjacente, depois os públicos. */
  fun servers(): List<InetAddress> {
    val now = clock()
    val snapshot = cached
    if (snapshot.isNotEmpty() && now - cachedAt < ttlMs) return snapshot

    val discovered = try {
      discover()
    } catch (e: Exception) {
      Log.w(TAG, "Could not read network DNS servers: ${e.message}")
      emptyList()
    }

    // `distinct` porque é comum a rede anunciar justamente um resolver público.
    val result = (discovered + FALLBACKS).distinct()
    val changed = snapshot.isNotEmpty() && result != snapshot
    cached = result
    cachedAt = now
    if (changed) {
      Log.i(TAG, "Upstream DNS servers changed — network switch")
      try {
        onServersChanged()
      } catch (e: Exception) {
        Log.w(TAG, "onServersChanged failed: ${e.message}")
      }
    }
    return result
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
        ?: continue
      if (servers.isEmpty()) continue

      if (caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
        return servers
      }
      candidates.add(servers)
    }
    return candidates.firstOrNull() ?: emptyList()
  }

  companion object {
    private const val TAG = "UpstreamDns"

    /** Mesmo endereço anunciado pelo túnel — ver BetBlockerVpnService.FAKE_DNS_SERVER. */
    private const val FAKE_DNS_SERVER = "10.0.0.1"

    private val CACHE_TTL_MS = 60_000L

    /** Reserva para rede que não anuncia resolver (ou anuncia só o nosso). */
    val FALLBACKS: List<InetAddress> = listOf(
      InetAddress.getByName("1.1.1.1"),
      InetAddress.getByName("8.8.8.8"),
    )
  }
}
