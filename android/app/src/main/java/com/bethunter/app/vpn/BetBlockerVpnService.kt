package com.bethunter.app.vpn

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.system.OsConstants
import android.util.Log
import androidx.core.app.NotificationCompat
import com.bethunter.app.MainActivity
import com.bethunter.app.R
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.dns.DnsInterceptor
import com.bethunter.app.dns.UpstreamDnsProvider
import com.bethunter.app.domain.DomainMatcher
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.repository.BlocklistManager
import com.bethunter.app.repository.RefreshOutcome
import com.bethunter.app.work.SubscriptionEnforcementWorker
import com.bethunter.app.work.VpnHealthWorker
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramSocket
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import android.content.pm.ServiceInfo
import com.bethunter.app.BuildConfig

class BetBlockerVpnService : VpnService() {
  @Volatile private var running = false

  /**
   * Alguém pediu a derrubada do túnel (stop, pause, restart por rota).
   *
   * Distingue "o laço terminou porque mandamos" de "o laço morreu sozinho" — o
   * segundo caso precisa de recuperação, o primeiro não. Checar `tunInterface`
   * no lugar disso teria corrida: o `close()` acorda o laço com exceção antes de
   * a referência ser zerada.
   */
  @Volatile private var teardownRequested = false

  /** Quedas seguidas do laço logo após subir — ver onLoopExited. */
  @Volatile private var consecutiveFastLoopFailures = 0
  private var tunInterface: ParcelFileDescriptor? = null
  private var workerThread: Thread? = null
  private var refreshThread: Thread? = null

  private lateinit var repository: BlockedDomainsRepository
  private lateinit var blocklistManager: BlocklistManager
  private lateinit var domainMatcher: DomainMatcher
  private lateinit var dnsInterceptor: DnsInterceptor
  private lateinit var upstreamDnsProvider: UpstreamDnsProvider

  // Executor serial para trabalho de DB que não pode rodar na main thread (hoje só
  // o seed inicial). O rebuild da trie — motivo original deste executor e de um
  // ANR em produção — deixou de existir: a blocklist agora é consultada no SQLite.
  private val dbExecutor: ExecutorService = Executors.newSingleThreadExecutor()

  /**
   * Pool que resolve as queries DNS. Criado junto com o túnel e derrubado com ele.
   *
   * Fila LIMITADA de propósito: sem teto, um upstream fora do ar acumularia
   * milhares de pacotes na memória do processo `:vpn` — justamente o processo cuja
   * pegada de memória este release está reduzindo.
   */
  @Volatile private var dnsExecutor: ThreadPoolExecutor? = null

  override fun onCreate() {
    super.onCreate()
    repository = BlockedDomainsRepository(applicationContext)
    blocklistManager = BlocklistManager(repository, applicationContext)
    domainMatcher = DomainMatcher(repository)
    // Seed inicial da blocklist (query count() + possível insert de defaults) fora
    // da main thread.
    dbExecutor.execute {
      try {
        blocklistManager.ensureBlocklistPresent()
      } catch (e: Exception) {
        Log.w(TAG, "ensureBlocklistPresent failed: ${e.message}")
      }
    }
    upstreamDnsProvider = UpstreamDnsProvider(
      applicationContext,
      // Trocou de rede: o que estava cacheado foi respondido por outro resolver e
      // pode não valer aqui (nome interno de rede corporativa, IP de CDN distante).
      onServersChanged = {
        if (::dnsInterceptor.isInitialized) dnsInterceptor.invalidateCache()
      },
    )
    dnsInterceptor = DnsInterceptor(
      domainMatcher = domainMatcher,
      protect = { socket: DatagramSocket -> protect(socket) },
      // O resolver da própria rede na frente dos públicos: é o que faz a proteção
      // funcionar em Wi-Fi corporativo, portal cativo e operadora que bloqueia
      // DNS público — onde antes o aparelho simplesmente ficava sem internet.
      upstreams = { upstreamDnsProvider.servers() },
    )
    startAsForeground()
    VpnEventLog.log(this, "service_create")
    // Self-heal: garante que o health check periódico existe mesmo que
    // o agendamento original tenha se perdido (update do app, clear de dados do WM).
    VpnHealthWorker.schedule(applicationContext)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // "VPN sempre ativa" (always-on): quando a opção está ligada, é o SISTEMA que
    // sobe este serviço, com startService(Intent(VpnService.SERVICE_INTERFACE)) —
    // ver Vpn#startAlwaysOnVpn no AOSP. É o único sinal de always-on que não
    // depende de ler chave @hide de Settings.Secure, então vale registrar mesmo
    // com o bloqueio desligado. Vai para o KV do SQLite porque este código roda no
    // processo :vpn e quem lê é o processo principal.
    //
    // Deliberadamente SEM return: esta action não é nenhuma das tratadas abaixo,
    // então o start segue pelo caminho genérico (enabled → premium → revoked),
    // igual a um start com intent nulo.
    if (intent?.action == VpnService.SERVICE_INTERFACE) {
      try {
        repository.setAlwaysOnSystemStartAt(System.currentTimeMillis())
      } catch (e: Exception) {
        Log.w(TAG, "Could not record always-on start signal: ${e.message}")
      }
      VpnEventLog.log(this, "always_on_system_start")
    }

    if (intent?.action == ACTION_STOP) {
        Log.d(TAG, "STOP action received")
        VpnEventLog.log(this, "stop_requested_by_user")

        repository.setBlockingEnabled(false)
        repository.setRevoked(false)

        stopVpn()

        stopForeground(true)

        stopSelf()

        return START_NOT_STICKY
    }

    // Pausa por assinatura: derruba a VPN mas NÃO mexe em isBlockingEnabled.
    // Quem pausa (SubscriptionEnforcementWorker) já marcou premiumPaused; assim
    // o bloqueio volta sozinho quando o premium for confirmado de novo.
    if (intent?.action == ACTION_PAUSE) {
      Log.i(TAG, "PAUSE action received (subscription)")
      VpnEventLog.log(this, "paused_subscription_expired")

      stopVpn()
      stopForeground(true)
      stopSelf()

      return START_NOT_STICKY
    }

    if (intent?.action == ACTION_RELOAD) {
      Log.i(TAG, "Reload requested")
      invalidateMatcher()
      return Service.START_STICKY
    }

    // Mudou a lista de IPs bloqueados: rota só entra no establish(), então a tun
    // precisa ser reerguida.
    //
    // A invalidação do cache de domínios é feita já; o restart em si fica para
    // DEPOIS das guardas de licença e consentimento, para reerguer o túnel passar
    // pelo mesmo crivo de qualquer outro start. Tratado aqui em cima, um refresh de
    // blocklist ressuscitaria a VPN de quem deixou de ser assinante.
    val restartRequested = intent?.action == ACTION_RESTART_TUNNEL
    if (restartRequested) {
      // Quem manda esta action é o processo principal, depois de gravar a lista
      // nova no SQLite. As decisões em cache neste processo podem ter sido tomadas
      // com a lista antiga, então são descartadas junto.
      invalidateMatcher()
    }

    if (!repository.isBlockingEnabled()) {
      Log.i(TAG, "Blocking disabled, stopping VPN service")
      stopSelf()
      return Service.START_NOT_STICKY
    }
    // Premium é pré-condição do bloqueio, e este é o único ponto do sistema que
    // consegue impor isso sozinho. `isBlockingEnabled` continua true durante a
    // pausa (é a intenção do usuário, preservada de propósito), então sem esta
    // checagem qualquer start cego — boot, alarme do watchdog, restart sticky —
    // ressuscitava a VPN de quem não é mais assinante.
    if (!isPremiumAllowed()) {
      stopSelf()
      return Service.START_NOT_STICKY
    }
    // Restart vindo de alarme/boot/worker: se o consentimento foi revogado,
    // establish() falharia — só a Activity pode re-pedir via prepare().
    if (!VpnConsent.hasConsent(this, repository)) {
      Log.w(TAG, "VPN consent missing, cannot start — scheduling re-check")
      VpnEventLog.log(this, "start_blocked_needs_consent")
      handleConsentMissing()
      return Service.START_NOT_STICKY
    }
    // Licença e consentimento já conferidos acima: só agora vale reerguer a tun
    // para aplicar as rotas novas. Se o túnel já estava caído, o start normal
    // logo abaixo lê a lista nova de qualquer forma.
    if (restartRequested && running) {
      restartTunnel()
      return Service.START_STICKY
    }
    if (running) return Service.START_STICKY
    startVpn()
    return Service.START_STICKY
  }

  /**
   * A lista mudou: descarta as decisões em cache.
   *
   * Era um rebuild de trie a partir de ~300k linhas (que precisava de executor
   * próprio e de coalescência de rajadas para não causar ANR); hoje é uma limpeza
   * de mapa, barata o bastante para rodar direto.
   */
  private fun invalidateMatcher() {
    try {
      domainMatcher.invalidate()
    } catch (e: Exception) {
      Log.w(TAG, "Cache invalidation failed: ${e.message}")
    }
  }

  override fun onDestroy() {
    stopVpn()
    try {
      dbExecutor.shutdownNow()
    } catch (_: Exception) {}
    super.onDestroy()

    if (canRestartAfterDestroy()) {
      Log.i(TAG, "VPN killed unexpectedly, restarting")
      VpnEventLog.log(this, "service_destroy_unexpected")
      scheduleRestart()
    } else {
      Log.i(TAG, "VPN stopped intentionally")
      VpnEventLog.log(this, "service_destroy_intentional")
    }
  }

  /**
   * O watchdog só pode agendar restart quando o serviço TEM como subir.
   *
   * A condição antiga (`enabled && !revoked`) ignorava a licença, mas o
   * `onStartCommand` recusa o start por premium logo em seguida — e `enabled`
   * continua true durante a pausa, de propósito, porque é a intenção do usuário.
   * O resultado era um ciclo fechado: alarme → onCreate → stopSelf → onDestroy →
   * alarme, a cada 2 segundos, para sempre. Cada volta postava notificação,
   * agendava worker, baixava a blocklist e escrevia no event log — que, com ring
   * buffer de 100 entradas, se apagava por completo em menos de um minuto e levava
   * junto o histórico necessário para diagnosticar qualquer outra coisa.
   */
  private fun canRestartAfterDestroy(): Boolean {
    if (!repository.isBlockingEnabled()) return false
    if (repository.isPremiumPaused()) return false
    if (!repository.isPremiumLeaseValid() && !repository.hasLeaseGraceAvailable()) return false
    // `hasConsent` (e não a flag `revoked`) porque um consentimento recuperado
    // deve voltar a permitir o restart automático — ver VpnConsent.
    return VpnConsent.hasConsent(this, repository)
  }

  override fun onRevoke() {
    Log.w(TAG, "VPN permission revoked")
    VpnEventLog.log(this, "revoked_by_system")
    handleRevoked()
    super.onRevoke()
  }

  /**
   * O sistema retirou o consentimento da VPN (outra VPN assumiu, usuário desligou
   * em Configurações, ou battery manager de OEM derrubou). A intenção do usuário
   * (isBlockingEnabled) é preservada; marcamos revoked e avisamos com notificação
   * de alta prioridade — o toque abre a Activity, único caminho para re-pedir
   * o prepare().
   */
  private fun handleRevoked() {
    repository.setRevoked(true)
    BlockerNotifications.showReactivationNotification(
      this,
      "Proteção desativada",
      "O bloqueio de sites de apostas foi interrompido pelo sistema. Toque para reativar."
    )
    stopVpn()
    stopSelf()
  }

  /**
   * Start cego (boot, alarme, worker, atualização do app) esbarrou em
   * `prepare() != null`.
   *
   * Deliberadamente NÃO persiste `revoked`, ao contrário de [handleRevoked]: aqui
   * não há prova de que o sistema retirou o consentimento. A janela de atualização
   * do app mata o processo `:vpn` e o serviço é resubido pelo MY_PACKAGE_REPLACED
   * bem nesse intervalo, quando o `prepare()` pode responder não-nulo por um
   * instante. Gravar a flag nesse caminho era o que desativava o bloqueador a cada
   * update: ela travava toda a recuperação automática e só um toque do usuário
   * religava (ver [VpnConsent]).
   *
   * Quem decide se é queda de verdade é o health check, que reconsulta o sistema
   * e só então avisa o usuário — assim um blip transitório não vira notificação.
   */
  private fun handleConsentMissing() {
    VpnHealthWorker.enqueueExpeditedCheck(applicationContext)
    stopVpn()
    stopSelf()
  }

  /**
   * Reergue a tun para aplicar mudanças na lista de IPs bloqueados.
   *
   * `getBlockedIps()` só é lido dentro do `establish()` — rota de tun já
   * estabelecida é imutável. Sem este caminho, um IP novo vindo do refresh
   * ficaria parado no banco até o túnel cair por outro motivo (reboot, kill do
   * sistema, health worker de 15 min): bloqueio que funciona "às vezes, horas
   * depois", que é pior do que não funcionar porque parece estar funcionando.
   */
  private fun restartTunnel() {
    Log.i(TAG, "Restarting tunnel to apply blocked IP routes")
    VpnEventLog.log(this, "tunnel_restart_for_ips")
    teardownTunnel()
    startVpn(isRestart = true)
  }

  private fun startVpn(isRestart: Boolean = false) {
    // Tun anterior ainda aberta (caso típico: o laço morreu com a interface de pé
    // e o health worker mandou reerguer). Sobrescrever `tunInterface` vazaria o fd
    // antigo e deixaria dois estabelecimentos concorrendo pelo mesmo túnel.
    if (tunInterface != null) teardownTunnel()
    running = true
    teardownRequested = false
    val builder = Builder()
      .setSession(SESSION_NAME)
      .setBlocking(true)
      .setMtu(1500)

    // TUN address (we only route DNS to our "fake" DNS IP, so we don't have to forward all traffic)
    builder.addAddress(VPN_ADDRESS, 32)
    builder.addRoute(FAKE_DNS_SERVER, 32)
    builder.addDnsServer(FAKE_DNS_SERVER)

    // O próprio app fica FORA do túnel: seu DNS (RevenueCat, API, Google Sign-In)
    // não pode depender do DnsInterceptor. Quando o upstream não responde (rede
    // corporativa, captive portal, operadora que bloqueia 1.1.1.1/8.8.8.8), o
    // forward retorna null e o pacote é descartado — o que deixaria o BetHunter
    // sem resolver nada enquanto a proteção estivesse ligada. Não enfraquece o
    // bloqueio: navegadores e apps de aposta rodam em outro UID e continuam na tun.
    try {
      builder.addDisallowedApplication(packageName)
      Log.i(TAG, "App excluído do túnel: $packageName")
    } catch (e: Exception) {
      Log.w(TAG, "Falha ao excluir o app do túnel: ${e.message}")
    }

    // Camada B — bloqueio por IP: roteia cada IP bloqueado (/32) para dentro da tun.
    // O runLoop descarta todo pacote não-DNS (parse retorna null p/ TCP), então esses
    // IPs ficam blackholados — a conexão direta para eles morre. O resto do tráfego
    // continua saindo direto (fail-open preservado). IPs inválidos são ignorados.
    var blockedIpRoutes = 0
    for (ip in repository.getBlockedIps()) {
      try {
        builder.addRoute(ip, 32)
        blockedIpRoutes++
      } catch (e: Exception) {
        Log.w(TAG, "Rota de IP bloqueado inválida ignorada: $ip (${e.message})")
      }
    }
    Log.i(TAG, "Bloqueio por IP ativo: $blockedIpRoutes rota(s)")

    // Some apps try IPv6 DNS; explicitly disable by not adding IPv6 routes/dns.
    tunInterface = try {
      builder.establish()
    } catch (e: Exception) {
      // SecurityException aqui = consentimento revogado entre o kill e o restart
      // (alarme/boot/worker). Tratar como revoke para notificar o usuário.
      Log.e(TAG, "establish() failed: ${e.message}")
      VpnEventLog.log(this, "establish_failed:${e.javaClass.simpleName}")
      running = false
      // Num restart por lista de IPs, só SecurityException significa perda de
      // consentimento. Falha transitória aqui NÃO pode marcar revoked: isso
      // exigiria reativação manual pela Activity e daria a um refresh de
      // blocklist o poder de desarmar a proteção de quem está pagando.
      if (isRestart && e !is SecurityException) {
        VpnHealthWorker.enqueueExpeditedCheck(applicationContext)
        return
      }
      handleRevoked()
      return
    }
    if (tunInterface == null) {
      Log.e(TAG, "Failed to establish VPN interface")
      VpnEventLog.log(this, "establish_returned_null")
      running = false
      // Num restart não há ninguém mais para tentar de novo: o túnel já foi
      // derrubado e o caminho normal de recuperação (onDestroy) não roda porque
      // o serviço segue vivo. Sem isto, a proteção ficaria caída em silêncio.
      if (isRestart) VpnHealthWorker.enqueueExpeditedCheck(applicationContext)
      return
    }

    // VPN de pé: qualquer alerta de reativação pendente deixou de valer, e a
    // sequência de quedas terminou — o backoff volta ao primeiro degrau para que
    // a próxima queda isolada seja recuperada em 2 s, como antes.
    BlockerNotifications.cancelReactivationNotification(this)
    repository.setRestartAttempts(0)
    VpnEventLog.log(this, "vpn_established")

    val fd = tunInterface!!.fileDescriptor
    val input = FileInputStream(fd)
    val output = FileOutputStream(fd)
    val reader = PacketReader(input)
    val writer = PacketWriter(output)

    dnsExecutor = ThreadPoolExecutor(
      DNS_POOL_SIZE,
      DNS_POOL_SIZE,
      0L,
      TimeUnit.MILLISECONDS,
      ArrayBlockingQueue(DNS_QUEUE_CAPACITY),
    ) { r -> Thread(r, "BetBlockerDnsWorker").apply { isDaemon = true } }

    workerThread = thread(name = "BetBlockerVpnThread") {
      runLoop(reader, writer)
    }
    startRefreshLoop()
    // Depois do establish, e só aqui: ficava no onCreate, disparando um
    // forceRefresh de 5 MB em TODO start do serviço — inclusive nos que eram
    // recusados logo em seguida pelas guardas.
    refreshBlocklistIfNeeded()
  }

  /**
   * Derruba o túnel mas NÃO mexe no estado de foreground do serviço.
   *
   * Separado de [stopVpn] por causa do restart: a lista de rotas só pode ser
   * declarada antes do `establish()`, então aplicar um IP novo exige reerguer a
   * tun. Se esse caminho chamasse `stopForeground`, o serviço perderia o status
   * de FGS no meio do processo e, em API 31+, esbarraria na restrição de start
   * em background para voltar — a proteção simplesmente não voltaria.
   */
  private fun teardownTunnel() {
    teardownRequested = true
    stopRefreshLoop()
    running = false

    // 1. Fechar o TUN Interface PRIMEIRO. Isso força o `reader.read()` a lançar
    // uma exceção e destravar a thread bloqueada em I/O.
    try {
      tunInterface?.close()
    } catch (_: Exception) {}
    tunInterface = null

    // 2. Agora podemos interromper as threads com segurança
    try {
      workerThread?.interrupt()
    } catch (_: Exception) {}
    workerThread = null

    // Pool de DNS morre com o túnel: suas tarefas escrevem num fd que acabou de ser
    // fechado. `shutdownNow` sem `awaitTermination` — não vale bloquear o teardown
    // esperando um upstream que já está em timeout.
    try {
      dnsExecutor?.shutdownNow()
    } catch (_: Exception) {}
    dnsExecutor = null

    try {
      refreshThread?.interrupt()
    } catch (_: Exception) {}
    refreshThread = null
  }

  private fun stopVpn() {
    teardownTunnel()

    try {
      if (Build.VERSION.SDK_INT >= 24) {
        stopForeground(Service.STOP_FOREGROUND_REMOVE)
      } else {
        @Suppress("DEPRECATION")
        stopForeground(true)
      }
    } catch (_: Exception) {}
  }

  fun stopVpnService() {
    repository.setBlockingEnabled(false)
    stopVpn()
    stopSelf()
  }

  /**
   * O bloqueio é premium-only, e este serviço é o único ponto que consegue impor
   * isso sem depender de aviso de ninguém.
   *
   * Quando a barreira é a LICENÇA (e não uma pausa já decidida por alguém), a
   * queda não pode ser silenciosa: um assinante em dia que caiu num buraco de
   * renovação precisa voltar em minutos, não na próxima janela periódica. Por
   * isso dispara uma checagem imediata de assinatura e avisa o usuário.
   */
  private fun isPremiumAllowed(): Boolean {
    if (repository.isPremiumPaused()) {
      VpnEventLog.log(this, "start_blocked_premium_paused")
      return false
    }
    if (!repository.isPremiumLeaseValid()) {
      // Licença vencida NÃO é prova de que a assinatura acabou — só de que ficamos
      // sem contato. Quem tem prova (`premiumPaused`) já saiu no `if` acima; aqui
      // sobram os casos em que ninguém conseguiu confirmar nada: sessão expirada
      // (o JWT dura 30 dias e o 401 a descarta), aparelho que estrangula o
      // WorkManager, usuário que não abre o app. Tratar isso como não-assinatura
      // desligava a proteção de quem estava pagando, em silêncio.
      SubscriptionEnforcementWorker.enqueueImmediateCheck(applicationContext)
      BlockerNotifications.showReactivationNotification(
        applicationContext,
        "Confirme sua assinatura",
        "Abra o app para mantermos o bloqueio de sites de apostas ativo.",
        throttleMs = REACTIVATION_NOTICE_THROTTLE_MS,
      )

      if (repository.consumeLeaseGrace()) {
        Log.w(TAG, "Premium lease expired — granting grace extension")
        VpnEventLog.log(this, "premium_lease_grace_granted:used=${repository.getLeaseGraceUsed()}")
        return true
      }

      Log.w(TAG, "Premium lease expired and grace exhausted — refusing to filter")
      VpnEventLog.log(this, "premium_lease_expired")
      return false
    }
    return true
  }

  private fun runLoop(reader: PacketReader, writer: PacketWriter) {
    val buffer = ByteArray(32767)
    var nextPremiumCheckAt = System.currentTimeMillis() + PREMIUM_CHECK_INTERVAL_MS
    var emptyReads = 0
    var consecutiveFailures = 0
    var stoppedByPremium = false
    val startedAt = System.currentTimeMillis()

    // Publicado no KV (cross-process) porque `VpnStatus.isVpnActive()` só prova que
    // a INTERFACE existe. Se este laço morre com a tun de pé, todo o DNS do aparelho
    // cai no vácuo enquanto o sistema, o health worker e a Home continuam dizendo
    // "protegido" — o estado mais perigoso possível, porque não parece falha.
    repository.setLoopRunning(true)
    try {
      while (running && !Thread.currentThread().isInterrupted) {
        // Uma leitura de SQLite a cada 5 min, irrisória perto do tráfego DNS. É o
        // que faz a VPN morrer sozinha quando a licença vence — sem depender de
        // ninguém avisar. Cobre o caso do usuário deslogado (que desliga o worker
        // de enforcement) e o do serviço recriado por START_STICKY.
        if (System.currentTimeMillis() >= nextPremiumCheckAt) {
          nextPremiumCheckAt = System.currentTimeMillis() + PREMIUM_CHECK_INTERVAL_MS
          // Falha ao LER o banco (multi-processo, pode dar busy) não é prova de
          // licença vencida — e, sem este catch, derrubava a thread inteira.
          val allowed = try {
            isPremiumAllowed()
          } catch (e: Exception) {
            Log.w(TAG, "Premium re-check failed, keeping tunnel up: ${e.message}")
            true
          }
          if (!allowed) {
            stoppedByPremium = true
            running = false
            // Teardown na main thread: stopVpn() interrompe a workerThread, que é
            // esta aqui — chamá-lo daqui seria a thread se auto-interrompendo no
            // meio do próprio shutdown.
            Handler(Looper.getMainLooper()).post {
              stopVpn()
              stopSelf()
            }
            break
          }
        }

        val length = try {
          reader.read(buffer)
        } catch (e: Exception) {
          Log.w(TAG, "VPN read crash", e)
          VpnEventLog.log(this, "loop_read_failed:${e.javaClass.simpleName}")
          break
        }
        if (length <= 0) {
          // `continue` puro aqui era busy-spin: um read que devolve 0 em sequência
          // consome 100% de um núcleo, esquenta o aparelho e convida o gerenciador
          // de energia do fabricante a matar justamente este processo.
          if (++emptyReads >= EMPTY_READ_BACKOFF_THRESHOLD) {
            try {
              Thread.sleep(EMPTY_READ_BACKOFF_MS)
            } catch (_: InterruptedException) {
              break
            }
          }
          continue
        }
        emptyReads = 0

        // Uma query malformada (ou um bug de parsing) não pode derrubar o DNS do
        // aparelho inteiro: sem este catch, a exceção subia da thread e o handler
        // padrão do Android matava o processo :vpn.
        try {
          handlePacket(buffer, length, writer)
          consecutiveFailures = 0
        } catch (e: Exception) {
          consecutiveFailures++
          Log.w(TAG, "Packet handling failed ($consecutiveFailures)", e)
          if (consecutiveFailures >= MAX_CONSECUTIVE_PACKET_FAILURES) {
            // Falha em TODO pacote é problema estrutural (banco inacessível, tun
            // em estado ruim). Sai para a recuperação em vez de girar em falso.
            VpnEventLog.log(this, "loop_failing_repeatedly:${e.javaClass.simpleName}")
            break
          }
        }
      }
    } finally {
      running = false
      repository.setLoopRunning(false)
      if (!stoppedByPremium) onLoopExited(System.currentTimeMillis() - startedAt)
    }
  }

  /**
   * Classifica o pacote e ENTREGA a resolução ao pool.
   *
   * O laço de leitura não pode mais esperar pelo upstream: era uma fila de uma
   * thread só, e uma query lenta segurava o DNS de TODOS os apps do aparelho por
   * segundos (head-of-line blocking). `Ipv4UdpPacket.parse` já copia o payload,
   * então o pacote pode cruzar de thread com segurança enquanto o buffer de leitura
   * é reaproveitado na próxima volta.
   */
  private fun handlePacket(buffer: ByteArray, length: Int, writer: PacketWriter) {
    val packet = Ipv4UdpPacket.parse(buffer, length) ?: return
    if (BuildConfig.DEBUG) Log.d(TAG, "Packet port: ${packet.dstPort}")
    // Only intercept UDP/53 (DNS) destined to our fake DNS IP.
    if (packet.protocol != OsConstants.IPPROTO_UDP) return
    if (packet.dstPort != 53) return

    val executor = dnsExecutor
    if (executor == null) {
      resolveAndWrite(packet, writer)
      return
    }
    try {
      executor.execute { resolveAndWrite(packet, writer) }
    } catch (e: RejectedExecutionException) {
      // Fila cheia (rajada anormal ou upstream inteiro fora do ar): descartar é o
      // comportamento certo — o cliente de DNS reenvia, e segurar a fila só
      // atrasaria todo mundo. Registrado de forma esparsa pelo próprio coalescing
      // do event log.
      VpnEventLog.log(this, "dns_query_dropped_queue_full")
    }
  }

  private fun resolveAndWrite(packet: Ipv4UdpPacket, writer: PacketWriter) {
    try {
      val responsePayload =
        dnsInterceptor.handleDnsQuery(packet.payload, packet.payloadLength) ?: return
      val responsePacket = Ipv4UdpPacket.buildResponse(
        request = packet,
        responsePayload = responsePayload
      ) ?: return
      writer.write(responsePacket, responsePacket.size)
    } catch (e: Exception) {
      // Uma resolução que falha não pode derrubar o worker do pool.
      Log.w(TAG, "DNS resolution failed: ${e.message}")
    }
  }

  /**
   * O laço de leitura saiu sem ninguém ter pedido.
   *
   * Antes isto simplesmente não existia: o `break` deixava a tun estabelecida e
   * sem leitor, ou seja, o aparelho inteiro sem DNS — e como a interface continuava
   * de pé, nem o `VpnHealthWorker` nem a Home percebiam. A proteção "estava ligada"
   * e a internet não funcionava, até algo reiniciar o serviço por outro motivo.
   */
  private fun onLoopExited(lifetimeMs: Long) {
    if (teardownRequested) return // parada intencional (stop, pause, restart de rotas)

    // Laço que morre logo depois de subir indica causa persistente (tun em estado
    // ruim, banco inacessível). Reerguer na hora, sem contar as repetições, apenas
    // trocaria o antigo "cai e fica caído" por um laço de restart rápido — que é
    // justamente o que este release está removendo em outro lugar.
    if (lifetimeMs < FAST_LOOP_FAILURE_WINDOW_MS) {
      consecutiveFastLoopFailures++
    } else {
      consecutiveFastLoopFailures = 0
    }

    Log.w(TAG, "Packet loop exited unexpectedly after ${lifetimeMs}ms")
    VpnEventLog.log(this, "loop_exited_unexpectedly:fast=$consecutiveFastLoopFailures")

    if (consecutiveFastLoopFailures >= MAX_FAST_LOOP_FAILURES) {
      // Entrega o caso ao watchdog externo (alarme com backoff + health check de
      // 15 min) em vez de insistir aqui. Empurrar o contador para o teto evita que
      // o `setRestartAttempts(0)` do establish bem-sucedido zere o backoff a cada
      // volta e recrie o ciclo rápido por outro caminho.
      Log.w(TAG, "Packet loop failing repeatedly — handing over to watchdog")
      VpnEventLog.log(this, "loop_recovery_gave_up")
      repository.setRestartAttempts(BACKOFF_CAP_ATTEMPT)
      Handler(Looper.getMainLooper()).post {
        stopVpn()
        stopSelf()
      }
      return
    }

    Handler(Looper.getMainLooper()).post {
      if (!repository.isBlockingEnabled()) return@post
      // Mesmo crivo de qualquer outro start: recuperar não pode ressuscitar a VPN
      // de quem não é mais assinante.
      if (isPremiumAllowed()) {
        restartTunnel()
      } else {
        stopVpn()
        stopSelf()
      }
    }
  }

  private fun scheduleRestart() {
    // Corpo inteiro em try/catch: roda dentro de onDestroy e NUNCA pode crashar
    // o processo (era o que acontecia com setExactAndAllowWhileIdle sem
    // SCHEDULE_EXACT_ALARM em API 31+, matando o watchdog silenciosamente).
    val attempt = repository.getRestartAttempts()
    repository.setRestartAttempts(attempt + 1)
    val delayMs = RestartBackoff.delayFor(attempt)
    try {
      val am = getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(this, BetBlockerVpnService::class.java)
      val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
      // getForegroundService requer API 26 e dispara startForegroundService, que é
      // permitido a partir do background — ao contrário de getService/startService.
      val pi = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        PendingIntent.getForegroundService(this, 1, intent, piFlags)
      } else {
        PendingIntent.getService(this, 1, intent, piFlags)
      }
      val triggerAt = System.currentTimeMillis() + delayMs
      val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
      if (canExact) {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
      } else {
        // Sem SCHEDULE_EXACT_ALARM (negada por padrão em 14+): alarme inexato
        // while-idle não exige permissão; o VpnHealthWorker cobre o resto.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
      }
      Log.i(TAG, "Scheduled VPN restart in ${delayMs}ms (exact=$canExact, attempt=${attempt + 1})")
      VpnEventLog.log(this, "restart_alarm_scheduled:exact=$canExact,delayMs=$delayMs")
    } catch (e: Exception) {
      Log.w(TAG, "Failed to schedule restart alarm: ${e.message}")
      VpnEventLog.log(this, "restart_alarm_failed:${e.javaClass.simpleName}")
    }
    // Segundo caminho de recuperação, independente do AlarmManager.
    try {
      VpnHealthWorker.enqueueExpeditedCheck(applicationContext)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to enqueue expedited health check: ${e.message}")
    }
  }

  /**
   * Leva o resultado de um refresh até o túnel, cada tipo pelo seu caminho:
   * domínio por reload da trie, IP por reerguer a tun.
   *
   * O restart é postado na main thread de propósito. Este método roda em thread
   * de refresh, e `teardownTunnel()` interrompe justamente a refreshThread —
   * chamado direto, seria a thread se auto-interrompendo no meio do próprio
   * trabalho.
   */
  private fun applyRefreshOutcome(outcome: RefreshOutcome) {
    if (outcome.domainsChanged) {
      invalidateMatcher()
      Log.i(TAG, "Blocklist refreshed from remote source")
    }
    if (outcome.ipsChanged) {
      Handler(Looper.getMainLooper()).post {
        // Mesmo crivo do caminho por Intent: reerguer a tun é um start, e start
        // sem licença válida não pode acontecer nem vindo daqui.
        if (running && isPremiumAllowed()) restartTunnel()
      }
    }
  }

  /**
   * `refreshIfStale`, não `forceRefresh`: a lista já é atualizada de hora em hora
   * pelo laço de refresh e pelo BlocklistRefreshWorker. Baixar 5 MB a cada start do
   * serviço (boot, alarme, worker, RELOAD) era gasto de bateria e dados do usuário
   * sem nada em troca — e, num ciclo de start/stop, virava um download por segundo.
   */
  private fun refreshBlocklistIfNeeded() {
    thread(name = "BetBlockerRefreshCheck") {
      try {
        // Roda em paralelo ao establish() do onStartCommand, então pode terminar
        // depois dele — por isso o caminho de IP passa por restartTunnel() e não
        // confia em o start ainda não ter acontecido.
        applyRefreshOutcome(blocklistManager.refreshIfStale())
      } catch (e: Exception) {
        Log.w(TAG, "Blocklist refresh failed", e)
      }
    }
  }

  private fun startRefreshLoop() {
    refreshThread = thread(name = "BetBlockerRefreshLoop") {
      while (running && !Thread.currentThread().isInterrupted) {
        try {
          Thread.sleep(TimeUnit.HOURS.toMillis(1))
        } catch (_: InterruptedException) {
          break
        }
        if (!running) break
        try {
          applyRefreshOutcome(blocklistManager.forceRefresh())
          Log.i(TAG, "Periodic blocklist refresh completed")
        } catch (e: Exception) {
          Log.w(TAG, "Periodic blocklist refresh failed", e)
        }
      }
    }
  }

  private fun stopRefreshLoop() {
    try {
      refreshThread?.interrupt()
    } catch (_: Exception) {}
    refreshThread = null
  }

  private fun startAsForeground() {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        NOTIF_CHANNEL_ID,
        "BetBlocker VPN",
        NotificationManager.IMPORTANCE_LOW
      )
      nm.createNotificationChannel(channel)
    }

    val contentIntent = Intent(this, MainActivity::class.java)
    val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
    val pi = PendingIntent.getActivity(this, 0, contentIntent, piFlags)

    val notification: Notification = NotificationCompat.Builder(this, NOTIF_CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("BetBlocker is active")
      .setContentText("Blocking gambling domains via local VPN")
      .setContentIntent(pi)
      .setOngoing(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      // startForeground(id, notification, type) só existe a partir da API 29.
      startForeground(NOTIF_ID, notification)
      return
    }

    // systemExempted é o tipo que o Android reserva para apps de VPN (isento das
    // restrições de economia de energia), mas só é válido enquanto somos a VPN
    // autorizada — após um revoke, o fallback é specialUse.
    val preferredType = if (Build.VERSION.SDK_INT >= 34 && VpnService.prepare(this) == null) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED
    } else {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
    }
    try {
      startForeground(NOTIF_ID, notification, preferredType)
    } catch (e: Exception) {
      Log.w(TAG, "startForeground with type $preferredType failed, falling back: ${e.message}")
      val fallbackType = if (preferredType == ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE && Build.VERSION.SDK_INT >= 34) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED
      } else {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
      }
      try {
        startForeground(NOTIF_ID, notification, fallbackType)
      } catch (e2: Exception) {
        Log.e(TAG, "startForeground fallback also failed: ${e2.message}")
        VpnEventLog.log(this, "start_foreground_failed:${e2.javaClass.simpleName}")
        startForeground(NOTIF_ID, notification)
      }
    }
  }

  companion object {
    private const val TAG = "BetBlockerVpn"
    private const val SESSION_NAME = "BetBlocker"
    private const val VPN_ADDRESS = "10.0.0.2"
    private const val FAKE_DNS_SERVER = "10.0.0.1"
    private const val NOTIF_CHANNEL_ID = "betblocker_vpn"
    private const val NOTIF_ID = 42
    /** De quanto em quanto tempo o próprio túnel reconfere a licença de premium. */
    private const val PREMIUM_CHECK_INTERVAL_MS = 5L * 60 * 1000

    /** Intervalo mínimo entre alertas de reativação repetidos por causa técnica. */
    private const val REACTIVATION_NOTICE_THROTTLE_MS = 6L * 60 * 60 * 1000

    /** Leituras vazias seguidas antes de começar a ceder CPU — ver runLoop. */
    private const val EMPTY_READ_BACKOFF_THRESHOLD = 10
    private const val EMPTY_READ_BACKOFF_MS = 20L

    /** Falhas seguidas de processamento antes de desistir e recuperar o túnel. */
    private const val MAX_CONSECUTIVE_PACKET_FAILURES = 50

    /**
     * Workers de DNS. Poucos e fixos: o gargalo é espera de rede, não CPU, e cada
     * thread a mais é memória num processo que precisa ficar pequeno.
     */
    private const val DNS_POOL_SIZE = 6
    private const val DNS_QUEUE_CAPACITY = 256

    /** Abaixo disto, a queda do laço conta como falha rápida (causa persistente). */
    private const val FAST_LOOP_FAILURE_WINDOW_MS = 10_000L
    private const val MAX_FAST_LOOP_FAILURES = 5

    /** Tentativa que já satura o backoff — ver RestartBackoff.delayFor. */
    private const val BACKOFF_CAP_ATTEMPT = 8
    const val ACTION_RELOAD = "com.bethunter.app.action.RELOAD_BLOCKED_DOMAINS"
    const val ACTION_RESTART_TUNNEL = "com.bethunter.app.action.RESTART_TUNNEL"
    const val ACTION_STOP = "com.bethunter.app.action.STOP_VPN"
    const val ACTION_PAUSE = "com.bethunter.app.action.PAUSE_VPN"
  }
}

/**
 * Minimal IPv4+UDP packet parsing/building for DNS interception.
 */
private data class Ipv4UdpPacket(
  val srcIp: Int,
  val dstIp: Int,
  val protocol: Int,
  val srcPort: Int,
  val dstPort: Int,
  val payload: ByteArray,
  val payloadLength: Int
) {
  companion object {
    fun parse(packet: ByteArray, length: Int): Ipv4UdpPacket? {
      if (length < 20) return null
      val vihl = packet[0].toInt() and 0xFF
      val version = vihl ushr 4
      if (version != 4) return null
      val ihl = (vihl and 0x0F) * 4
      if (ihl < 20 || length < ihl + 8) return null

      val totalLen = u16(packet, 2)
      if (totalLen <= 0 || totalLen > length) return null
      val protocol = packet[9].toInt() and 0xFF
      if (protocol != OsConstants.IPPROTO_UDP) return null

      val srcIp = i32(packet, 12)
      val dstIp = i32(packet, 16)

      val udpOffset = ihl
      val srcPort = u16(packet, udpOffset)
      val dstPort = u16(packet, udpOffset + 2)
      val udpLen = u16(packet, udpOffset + 4)
      if (udpLen < 8) return null
      val payloadOffset = udpOffset + 8
      val payloadLen = udpLen - 8
      if (payloadOffset + payloadLen > totalLen) return null

      val payload = packet.copyOfRange(payloadOffset, payloadOffset + payloadLen)
      return Ipv4UdpPacket(srcIp, dstIp, protocol, srcPort, dstPort, payload, payloadLen)
    }

    fun buildResponse(request: Ipv4UdpPacket, responsePayload: ByteArray): ByteArray? {
      val ipHeaderLen = 20
      val udpHeaderLen = 8
      val totalLen = ipHeaderLen + udpHeaderLen + responsePayload.size
      val out = ByteArray(totalLen)

      // IPv4 header
      out[0] = 0x45.toByte() // v4, IHL=5
      out[1] = 0 // DSCP/ECN
      putU16(out, 2, totalLen)
      putU16(out, 4, 0) // id
      putU16(out, 6, 0x4000) // flags=DF
      out[8] = 64 // TTL
      out[9] = OsConstants.IPPROTO_UDP.toByte()
      putU16(out, 10, 0) // checksum placeholder
      putI32(out, 12, request.dstIp) // swapped
      putI32(out, 16, request.srcIp)
      putU16(out, 10, ipv4Checksum(out, 0, ipHeaderLen))

      // UDP header
      val udpOffset = ipHeaderLen
      putU16(out, udpOffset, request.dstPort) // swapped ports
      putU16(out, udpOffset + 2, request.srcPort)
      val udpLen = udpHeaderLen + responsePayload.size
      putU16(out, udpOffset + 4, udpLen)
      putU16(out, udpOffset + 6, 0) // UDP checksum optional for IPv4 (0 = not used)

      // payload
      System.arraycopy(responsePayload, 0, out, udpOffset + udpHeaderLen, responsePayload.size)
      return out
    }

    private fun u16(b: ByteArray, off: Int): Int =
      ((b[off].toInt() and 0xFF) shl 8) or (b[off + 1].toInt() and 0xFF)

    private fun i32(b: ByteArray, off: Int): Int =
      ((b[off].toInt() and 0xFF) shl 24) or
        ((b[off + 1].toInt() and 0xFF) shl 16) or
        ((b[off + 2].toInt() and 0xFF) shl 8) or
        (b[off + 3].toInt() and 0xFF)

    private fun putU16(b: ByteArray, off: Int, v: Int) {
      b[off] = ((v ushr 8) and 0xFF).toByte()
      b[off + 1] = (v and 0xFF).toByte()
    }

    private fun putI32(b: ByteArray, off: Int, v: Int) {
      b[off] = ((v ushr 24) and 0xFF).toByte()
      b[off + 1] = ((v ushr 16) and 0xFF).toByte()
      b[off + 2] = ((v ushr 8) and 0xFF).toByte()
      b[off + 3] = (v and 0xFF).toByte()
    }

    private fun ipv4Checksum(buf: ByteArray, offset: Int, length: Int): Int {
      var sum = 0L
      var i = offset
      while (i < offset + length) {
        val word = ((buf[i].toInt() and 0xFF) shl 8) or (buf[i + 1].toInt() and 0xFF)
        sum += word.toLong()
        i += 2
      }
      while ((sum ushr 16) != 0L) {
        sum = (sum and 0xFFFF) + (sum ushr 16)
      }
      val result = sum.inv().toInt() and 0xFFFF
      return result
    }
  }
}

