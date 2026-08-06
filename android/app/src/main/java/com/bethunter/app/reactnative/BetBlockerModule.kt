package com.bethunter.app.reactnative

import android.app.admin.DevicePolicyManager
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.net.Uri
import android.util.Log
import androidx.core.content.ContextCompat
import com.bethunter.app.admin.BetHunterDeviceAdminReceiver
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.repository.BlocklistManager
import com.bethunter.app.vpn.BetBlockerVpnService
import com.bethunter.app.vpn.BlockerNotifications
import com.bethunter.app.vpn.VpnConsent
import com.bethunter.app.vpn.VpnStatus
import com.bethunter.app.work.BlocklistRefreshWorker
import com.bethunter.app.work.SubscriptionEnforcementWorker
import com.bethunter.app.work.VpnHealthWorker
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlin.concurrent.thread

class BetBlockerModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val repository = BlockedDomainsRepository(reactContext.applicationContext)

  // @Volatile garante visibilidade entre JS thread e UI thread
  @Volatile private var pendingVpnPromise: Promise? = null
  @Volatile private var pendingDeviceAdminPromise: Promise? = null
  @Volatile private var pendingBatteryPromise: Promise? = null

  /**
   * Valor de premiumPaused antes de startBlocking() mexer nele, para desfazer
   * caso a ativação não se complete. Sem isso, uma tentativa abortada deixava a
   * pausa por assinatura limpa como se o usuário tivesse reativado de fato.
   */
  @Volatile private var premiumPausedBeforeStart = false

  private val adminComponent: ComponentName
    get() = ComponentName(reactContext, BetHunterDeviceAdminReceiver::class.java)

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "BetBlocker"

  @ReactMethod
  fun startBlocking(promise: Promise) {
    // Guard: rejeita chamadas paralelas enquanto um diálogo de permissão já está aberto.
    if (pendingVpnPromise != null) {
      promise.reject("ALREADY_IN_PROGRESS", "A VPN permission dialog is already open")
      return
    }

    repository.setBlockingEnabled(true)
    // Ação explícita do usuário limpa qualquer pausa por assinatura: se ele
    // renovou e está reativando, não faz sentido o health worker ficar inerte.
    premiumPausedBeforeStart = repository.isPremiumPaused()
    repository.setPremiumPaused(false)
    // Só chega aqui quem passou pelo paywall. Sem emitir a licença, a VPN se
    // recusaria a subir logo depois (ver o gate em BetBlockerVpnService).
    repository.renewPremiumLease(null)
    BlocklistRefreshWorker.schedule(reactContext.applicationContext)
    if (repository.getAuthToken() != null) {
      SubscriptionEnforcementWorker.schedule(reactContext.applicationContext)
    }
    val prepareIntent = VpnService.prepare(reactContext.currentActivity ?: reactContext)
    if (prepareIntent == null) {
      // Permissão já concedida — tenta iniciar imediatamente
      try {
        repository.setRevoked(false)
        VpnHealthWorker.schedule(reactContext.applicationContext)
        startVpnService()
        // A isenção de bateria NÃO é mais disparada aqui: ela vira um passo
        // explícito e explicado na jornada guiada do JS (evita empilhar diálogos
        // de sistema e o aviso vazar como banner depois).
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to start VPN service after permission check", e)
        rollbackStartBlocking()
        promise.resolve(false)
      }
      return
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      rollbackStartBlocking()
      promise.reject("NO_ACTIVITY", "No active Android activity")
      return
    }
    pendingVpnPromise = promise
    try {
      activity.startActivityForResult(prepareIntent, REQ_PREPARE_VPN)
    } catch (e: Exception) {
      pendingVpnPromise = null
      rollbackStartBlocking()
      promise.reject("VPN_PREPARE_FAILED", e.message)
    }
  }

  /**
   * Desfaz os efeitos colaterais de startBlocking() quando a ativação não se
   * completa — inclusive a limpeza da pausa por assinatura, que antes ficava
   * aplicada mesmo com o usuário negando a VPN.
   */
  private fun rollbackStartBlocking() {
    repository.setBlockingEnabled(false)
    repository.setPremiumPaused(premiumPausedBeforeStart)
    BlocklistRefreshWorker.cancel(reactContext.applicationContext)
    SubscriptionEnforcementWorker.cancel(reactContext.applicationContext)
  }

  @ReactMethod
  fun stopBlocking() {
    repository.setBlockingEnabled(false)
    repository.setRevoked(false)
    BlocklistRefreshWorker.cancel(reactContext.applicationContext)
    VpnHealthWorker.cancel(reactContext.applicationContext)
    SubscriptionEnforcementWorker.cancel(reactContext.applicationContext)
    BlockerNotifications.cancelReactivationNotification(reactContext.applicationContext)

    val intent = Intent(reactContext, BetBlockerVpnService::class.java)
    intent.action = BetBlockerVpnService.ACTION_STOP

    try {
      ContextCompat.startForegroundService(reactContext, intent)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to startForegroundService for stopping: ${e.message}")
    }
  }

  /**
   * Pausa reversível por assinatura inativa.
   *
   * Diferente de [stopBlocking]: preserva `isBlockingEnabled` (a intenção do
   * usuário) e mantém o SubscriptionEnforcementWorker agendado, para religar
   * sozinho na renovação. Sem isto exposto, o `pauseBlocking()` do JS não tinha
   * como chegar até aqui e o App.tsx acabava chamando `stopBlocking`, apagando a
   * configuração do usuário a cada lapso de pagamento.
   */
  @ReactMethod
  fun pauseBlocking() {
    if (repository.isPremiumPaused()) return
    repository.setPremiumPaused(true)
    repository.revokePremiumLease()

    // Só manda o PAUSE se há o que pausar: onCreate() do serviço faz
    // startAsForeground(), então um PAUSE com a VPN já parada subiria o serviço
    // inteiro só para derrubá-lo em seguida (ver commit 2f7ac372).
    if (VpnStatus.isVpnActive(reactContext)) {
      val intent = Intent(reactContext, BetBlockerVpnService::class.java).apply {
        action = BetBlockerVpnService.ACTION_PAUSE
      }
      try {
        ContextCompat.startForegroundService(reactContext, intent)
      } catch (e: Exception) {
        Log.w(TAG, "Failed to send ACTION_PAUSE: ${e.message}")
      }
    }

    BlockerNotifications.showReactivationNotification(
      reactContext.applicationContext,
      "Bloqueio pausado",
      "Sua assinatura não está ativa. Renove para voltar a bloquear sites de apostas."
    )
  }

  /**
   * Renova a licença que o serviço de VPN confere para continuar filtrando.
   *
   * Separada de [resumeBlocking] de propósito: aquele sai cedo quando o usuário
   * não estava pausado, ou seja, NÃO serve como caminho de renovação para quem
   * está com tudo em dia. Se a renovação dependesse só do worker de
   * enforcement, um assinante num aparelho que estrangula o WorkManager
   * (Xiaomi e afins) veria a licença vencer e perderia a proteção.
   */
  @ReactMethod
  fun renewPremiumLease(untilMs: Double) {
    repository.setPremiumLeaseUntil(untilMs.toLong())
  }

  @ReactMethod
  fun resumeBlocking() {
    if (!repository.isPremiumPaused()) return
    repository.setPremiumPaused(false)
    BlockerNotifications.cancelReactivationNotification(reactContext.applicationContext)
    BlocklistRefreshWorker.schedule(reactContext.applicationContext)
    VpnHealthWorker.schedule(reactContext.applicationContext)

    try {
      ContextCompat.startForegroundService(
        reactContext,
        Intent(reactContext, BetBlockerVpnService::class.java)
      )
    } catch (e: Exception) {
      // FGS bloqueado em background: o health worker e a reabertura do app
      // cobrem o religamento; a intenção já está preservada.
      Log.w(TAG, "Could not resume VPN: ${e.message}")
    }
  }

  /**
   * O usuário tocou na notificação de reativação? Consome o pedido: responde uma
   * única vez, para a jornada não reabrir sozinha em toda volta ao app.
   *
   * O pedido é registrado pela MainActivity e não emitido por evento porque a
   * notificação costuma abrir o app do zero — um evento disparado antes de o JS
   * estar de pé se perderia, e o toque não faria nada (que é o bug que isto
   * corrige).
   */
  @ReactMethod
  fun consumePendingReactivation(promise: Promise) {
    val requested = repository.isReactivationRequested()
    if (requested) {
      repository.setReactivationRequested(false)
      VpnEventLog.log(reactContext.applicationContext, "reactivation_request_consumed")
    }
    promise.resolve(requested)
  }

  @ReactMethod
  fun isBlockingEnabled(promise: Promise) {
    promise.resolve(repository.isBlockingEnabled())
  }

  @ReactMethod
  fun isDeviceAdminActive(promise: Promise) {
    promise.resolve(isDeviceAdminActiveInternal())
  }

  /**
   * Abre a tela do sistema para o usuário ativar o BetHunter como administrador
   * do dispositivo — impede desinstalação direta enquanto ativo.
   */
  @ReactMethod
  fun requestDeviceAdmin(promise: Promise) {
    if (pendingDeviceAdminPromise != null) {
      promise.reject("ALREADY_IN_PROGRESS", "Device admin dialog already open")
      return
    }
    if (isDeviceAdminActiveInternal()) {
      promise.resolve(true)
      return
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No active Android activity")
      return
    }
    val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
      putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
      putExtra(
        DevicePolicyManager.EXTRA_ADD_EXPLANATION,
        "Ative para impedir a remoção fácil do BetHunter enquanto sua proteção contra apostas estiver ativa."
      )
    }
    pendingDeviceAdminPromise = promise
    try {
      activity.startActivityForResult(intent, REQ_DEVICE_ADMIN)
    } catch (e: Exception) {
      pendingDeviceAdminPromise = null
      promise.reject("DEVICE_ADMIN_FAILED", e.message)
    }
  }

  @ReactMethod
  fun getProtectionStatus(promise: Promise) {
    val result = Arguments.createMap()
    result.putBoolean("vpnEnabled", repository.isBlockingEnabled())
    result.putBoolean("deviceAdminActive", isDeviceAdminActiveInternal())
    // Sem isto a Home mostra "desligado" para quem está só pausado por
    // assinatura — a interface TS já declarava `paused`, o Android é que nunca mandava.
    // Licença vencida COM cortesia disponível não é pausa: a proteção segue de pé,
    // e mostrar "pausado" faria a Home mentir para quem ainda está protegido.
    result.putBoolean(
      "paused",
      repository.isPremiumPaused() ||
        (!repository.isPremiumLeaseValid() && !repository.hasLeaseGraceAvailable()),
    )
    promise.resolve(result)
  }

  /**
   * Verifica se a VPN está realmente ativa no Android e reconcilia com SharedPreferences.
   * Se o estado salvo diz "ativo" mas não há VPN rodando, tenta reiniciar automaticamente.
   * Deve ser usado no lugar de isBlockingEnabled() para checagens de integridade do estado.
   */
  @ReactMethod
  fun checkAndSyncBlockingStatus(promise: Promise) {
    val stored = repository.isBlockingEnabled()
    val running = isVpnActuallyRunning()

    if (stored && !running) {
      // Pausado por assinatura: não é inconsistência, é estado esperado. Religar
      // aqui reabriria a VPN de quem o backend confirmou não ser assinante.
      if (repository.isPremiumPaused()) {
        VpnEventLog.log(reactContext.applicationContext, "sync_premium_paused")
        promise.resolve(false)
        return
      }
      // Licença vencida: o serviço se recusaria a subir de qualquer forma, e o
      // startVpnService() abaixo NÃO lançaria (o startForegroundService dá certo,
      // quem para é o serviço logo depois) — resolveríamos `true` com a VPN morta.
      if (!repository.isPremiumLeaseValid() && !repository.hasLeaseGraceAvailable()) {
        VpnEventLog.log(reactContext.applicationContext, "sync_premium_lease_expired")
        SubscriptionEnforcementWorker.enqueueImmediateCheck(reactContext.applicationContext)
        promise.resolve(false)
        return
      }
      // Consentimento revogado (outra VPN assumiu ou usuário desligou em Config):
      // blind-start falharia no establish(). A intenção (enabled) é preservada;
      // resolve false para a UI mostrar desligado e oferecer a reativação, que
      // passa pelo fluxo do prepare() em startBlocking().
      if (!VpnConsent.hasConsent(reactContext, repository)) {
        Log.w(TAG, "VPN consent missing during sync — user must reactivate")
        VpnEventLog.log(reactContext.applicationContext, "sync_needs_consent")
        promise.resolve(false)
        return
      }
      Log.w(TAG, "VPN inconsistency detected: stored=true but VPN not running. Attempting restart.")
      try {
        startVpnService()
        promise.resolve(true)
      } catch (e: Exception) {
        // NÃO desliga o bloqueio aqui. A falha típica é transitória — o
        // `startForegroundService` é recusado quando o app perde o foreground na
        // corrida entre o AppState "active" e esta chamada. Apagar `enabled` (e
        // ainda cancelar o watchdog) transformava esse tropeço em desligamento
        // permanente e silencioso: nada mais religava, porque o próprio caminho de
        // recuperação tinha sido cancelado junto.
        Log.e(TAG, "VPN restart failed during sync, scheduling recovery", e)
        VpnEventLog.log(
          reactContext.applicationContext,
          "sync_restart_failed:${e.javaClass.simpleName}",
        )
        VpnHealthWorker.enqueueExpeditedCheck(reactContext.applicationContext)
        promise.resolve(false)
      }
    } else {
      promise.resolve(stored)
    }
  }

  /** true se o app está isento da otimização de bateria (Doze whitelist). */
  @ReactMethod
  fun isBatteryOptimizationExempt(promise: Promise) {
    try {
      val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
      promise.resolve(pm.isIgnoringBatteryOptimizations(reactContext.packageName))
    } catch (e: Exception) {
      promise.reject("BATTERY_CHECK_FAILED", e.message)
    }
  }

  /**
   * Pede a isenção de otimização de bateria e resolve com o estado REAL da
   * permissão. Usa startActivityForResult para que a jornada guiada avance por
   * callback determinístico, em vez de depender do JS re-checar no AppState —
   * o que deixava o passo mudo quando o usuário voltava sem conceder.
   *
   * Fallback (sem Activity ou intent recusado): abre a tela em NEW_TASK e
   * resolve com o estado atual; nesse caminho o re-check no AppState continua
   * sendo o que reconcilia.
   */
  @ReactMethod
  fun requestBatteryExemption(promise: Promise) {
    val pm = try {
      reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
    } catch (e: Exception) {
      promise.resolve(false)
      return
    }
    if (pm.isIgnoringBatteryOptimizations(reactContext.packageName)) {
      promise.resolve(true)
      return
    }
    if (pendingBatteryPromise != null) {
      promise.reject("ALREADY_IN_PROGRESS", "Battery exemption dialog already open")
      return
    }

    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
      data = Uri.parse("package:${reactContext.packageName}")
    }
    val activity = reactContext.currentActivity
    if (activity != null) {
      pendingBatteryPromise = promise
      try {
        activity.startActivityForResult(intent, REQ_BATTERY_EXEMPTION)
        // Só marca "já pediu" depois de a tela realmente abrir — a flag governa
        // o texto do banner e antes mentia quando o intent falhava.
        repository.setBatteryExemptionRequested(true)
        return
      } catch (e: Exception) {
        pendingBatteryPromise = null
        Log.w(TAG, "startActivityForResult for battery exemption failed: ${e.message}")
      }
    }

    try {
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      reactContext.startActivity(intent)
      repository.setBatteryExemptionRequested(true)
      promise.resolve(pm.isIgnoringBatteryOptimizations(reactContext.packageName))
    } catch (e: Exception) {
      Log.w(TAG, "Could not open battery optimization settings: ${e.message}")
      promise.resolve(false)
    }
  }

  /** true se o usuário já tocou no fluxo de pedido de isenção pelo menos uma vez. */
  @ReactMethod
  fun isBatteryExemptionRequested(promise: Promise) {
    promise.resolve(repository.isBatteryExemptionRequested())
  }

  /**
   * Confirmação manual do usuário de que já concedeu a isenção pela tela do
   * fabricante, para o caso em que isIgnoringBatteryOptimizations() não
   * reflete essa escolha. Suprime o aviso até hasRestartEventSince() provar
   * o contrário (ver isBatteryWarningSuppressed).
   */
  @ReactMethod
  fun confirmBatteryExceptionManually(promise: Promise) {
    repository.setBatteryWarningConfirmedAt(System.currentTimeMillis())
    promise.resolve(true)
  }

  /**
   * true se o aviso de bateria deve ficar suprimido por uma confirmação
   * manual ainda válida: dentro dos 7 dias e sem nenhum evento de
   * queda/recuperação da VPN registrado desde a confirmação.
   */
  @ReactMethod
  fun isBatteryWarningSuppressed(promise: Promise) {
    val confirmedAt = repository.getBatteryWarningConfirmedAt()
    if (confirmedAt <= 0L) {
      promise.resolve(false)
      return
    }
    val expired = System.currentTimeMillis() - confirmedAt > SUPPRESSION_WINDOW_MS
    if (expired) {
      promise.resolve(false)
      return
    }
    val hasRestarted = VpnEventLog.hasRestartEventSince(reactContext.applicationContext, confirmedAt)
    promise.resolve(!hasRestarted)
  }

  /** Timeline de eventos de lifecycle da VPN (JSON string) para diagnóstico. */
  @ReactMethod
  fun getVpnEventLog(promise: Promise) {
    promise.resolve(VpnEventLog.getEventsJson(reactContext.applicationContext))
  }

  /**
   * Info de fabricante para decidir se mostra orientação específica de MIUI.
   * A isenção padrão de bateria não é suficiente na Xiaomi: o limpador de RAM
   * do MIUI mata o processo mesmo assim, a menos que a permissão própria
   * "Início automático" também esteja concedida.
   */
  @ReactMethod
  fun getManufacturerInfo(promise: Promise) {
    val manufacturer = Build.MANUFACTURER.lowercase()
    val isXiaomi = manufacturer.contains("xiaomi") ||
      manufacturer.contains("redmi") ||
      manufacturer.contains("poco")
    val result = Arguments.createMap()
    result.putBoolean("isXiaomi", isXiaomi)
    promise.resolve(result)
  }

  /**
   * Abre a tela de "Início automático" (Autostart) do MIUI. Intent explícito,
   * não exige <queries> no manifest. Se a activity não existir (aparelho não é
   * MIUI, ou versão diferente), cai para a tela de detalhes do app.
   */
  @ReactMethod
  fun openAutoStartSettings(promise: Promise) {
    try {
      val intent = Intent().apply {
        component = ComponentName(
          "com.miui.securitycenter",
          "com.miui.permcenter.autostart.AutoStartManagementActivity",
        )
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: ActivityNotFoundException) {
      Log.w(TAG, "MIUI AutoStart activity not found, falling back to app details")
      openAppDetailsSettings(promise)
    } catch (e: Exception) {
      Log.w(TAG, "Could not open AutoStart settings: ${e.message}")
      openAppDetailsSettings(promise)
    }
  }

  /**
   * Abre a tela de configurações de VPN do Android, para o usuário promover o
   * BetHunter a "VPN sempre ativa" — proteção mais forte, porque quem religa
   * a VPN depois de uma queda passa a ser o próprio sistema, não o app.
   */
  @ReactMethod
  fun openVpnSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_VPN_SETTINGS).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      Log.w(TAG, "Could not open VPN settings: ${e.message}")
      promise.resolve(false)
    }
  }

  /**
   * Abre a tela onde o usuário liga a "VPN sempre ativa" e resolve com o nível
   * alcançado, para o guia do passo 4 adaptar o texto:
   *   { opened: Boolean, deepLinked: Boolean, target: "vpn_settings"|"settings"|"app_details"|"none" }
   *
   * `deepLinked` é hoje SEMPRE false, de propósito: não existe caminho público
   * para a página por-app da VPN (a que tem o toggle). O deep link conhecido
   * (extras ":settings:show_fragment" → com.android.settings.vpn2.AppManagementFragment)
   * foi avaliado e descartado: o SettingsActivity valida o fragment contra uma
   * allowlist e LANÇA dentro do processo do Settings quando reprova — crash que
   * este try/catch não captura, porque o startActivity já retornou com sucesso.
   * Além disso o SubSettings é exported=false desde o Android 12 e os Settings de
   * OEM são forks. Economizar um toque não vale crashar as Configurações do
   * usuário no meio da jornada de proteção. O campo fica no contrato para o JS
   * não precisar mudar se algum dia aparecer um caminho oficial.
   */
  @ReactMethod
  fun openAlwaysOnVpnSettings(promise: Promise) {
    // resolveActivity() NÃO serve de guarda aqui: a visibilidade de pacotes do
    // Android 11+ filtra CONSULTAS, não o startActivity de um intent implícito —
    // usá-la daria falso-negativo em caso que abriria bem. O guarda é o try/catch,
    // mesmo padrão de openAutoStartSettings.
    val target = when {
      launchSettingsScreen(Intent(Settings.ACTION_VPN_SETTINGS)) -> "vpn_settings"
      launchSettingsScreen(Intent(Settings.ACTION_SETTINGS)) -> "settings"
      launchSettingsScreen(appDetailsIntent()) -> "app_details"
      else -> "none"
    }
    VpnEventLog.log(reactContext.applicationContext, "always_on_settings_opened_$target")
    val result = Arguments.createMap()
    result.putBoolean("opened", target != "none")
    result.putBoolean("deepLinked", false)
    result.putString("target", target)
    promise.resolve(result)
  }

  /**
   * startActivityForResult quando há Activity — não porque a tela devolva
   * resultado (não devolve), mas porque dá um callback determinístico de "o
   * usuário voltou", que vira log. Quem reconcilia o estado é o re-check do JS no
   * AppState. Sem Activity, cai para NEW_TASK.
   */
  private fun launchSettingsScreen(intent: Intent): Boolean {
    reactContext.currentActivity?.let { activity ->
      try {
        activity.startActivityForResult(intent, REQ_ALWAYS_ON_VPN)
        return true
      } catch (e: Exception) {
        Log.w(TAG, "startActivityForResult failed for ${intent.action}: ${e.message}")
      }
    }
    return try {
      intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      reactContext.startActivity(intent)
      true
    } catch (e: Exception) {
      Log.w(TAG, "startActivity failed for ${intent.action}: ${e.message}")
      false
    }
  }

  /** Leitura do estado always-on em Settings.Secure — ver readAlwaysOnSetting. */
  private data class AlwaysOnRead(
    val detected: Boolean,
    val denied: Boolean,
    val otherPackage: Boolean,
    val lockdown: Boolean,
    val lockdownKnown: Boolean,
  )

  /**
   * Sinal 1 de always-on. As chaves são @hide, mas usar a string literal não é
   * reflection (não cai na restrição de hidden API) e a LEITURA de Settings.Secure
   * não exige permissão — só a escrita (WRITE_SECURE_SETTINGS). Não há alternativa
   * pública: DevicePolicyManager.getAlwaysOnVpnPackage() só responde a device owner
   * e o ConnectivityManager não expõe nada.
   *
   * null é INDETERMINADO, jamais "desligado": é essa distinção que impede o passo
   * de acusar falsamente quem já configurou numa ROM que esconde a chave.
   */
  private fun readAlwaysOnSetting(): AlwaysOnRead {
    return try {
      val cr = reactContext.contentResolver
      val pkg = Settings.Secure.getString(cr, SECURE_ALWAYS_ON_VPN_APP)
      when {
        pkg == null -> AlwaysOnRead(false, false, false, false, false)
        pkg == reactContext.packageName -> {
          val lockdown = Settings.Secure.getInt(cr, SECURE_ALWAYS_ON_VPN_LOCKDOWN, 0) == 1
          AlwaysOnRead(true, false, false, lockdown, true)
        }
        // Chave legível e vazia = comprovadamente nenhuma VPN sempre ativa.
        pkg.isEmpty() -> AlwaysOnRead(false, true, false, false, true)
        // Outro app é a VPN sempre ativa: negativa definitiva E impedimento real
        // (só uma VPN por vez), então merece copy própria no passo.
        else -> AlwaysOnRead(false, true, true, false, true)
      }
    } catch (e: Exception) {
      Log.w(TAG, "Could not read $SECURE_ALWAYS_ON_VPN_APP: ${e.message}")
      AlwaysOnRead(false, false, false, false, false)
    }
  }

  /**
   * Estado da "VPN sempre ativa", combinando os três sinais possíveis. Três
   * estados de propósito — `unknown` NUNCA deve ser lido como desligado:
   *  - confirmed:   Settings.Secure, ou o sistema tendo subido o serviço, ou autoatestado válido
   *  - not_enabled: o sistema PROVOU que está desligada
   *  - unknown:     não foi possível determinar (ROM que esconde a chave)
   */
  @ReactMethod
  fun getAlwaysOnVpnStatus(promise: Promise) {
    val read = readAlwaysOnSetting()
    // Negativa definitiva invalida os sinais latched: sem isto, o latch do sistema
    // (ou o autoatestado) mentiria para sempre depois de o usuário desligar a opção.
    if (read.denied) repository.clearAlwaysOnSignals()

    val systemStartAt = repository.getAlwaysOnSystemStartAt()
    val attestedAt = repository.getAlwaysOnAttestedAt()
    val attestationValid = attestedAt > 0L &&
      System.currentTimeMillis() - attestedAt <= ALWAYS_ON_ATTESTATION_WINDOW_MS

    val detectedBySystemStart = !read.denied && systemStartAt > 0L
    val userAttested = !read.denied && attestationValid

    val state = when {
      read.detected || detectedBySystemStart || userAttested -> "confirmed"
      read.denied -> "not_enabled"
      else -> "unknown"
    }

    val result = Arguments.createMap()
    result.putString("state", state)
    result.putBoolean("detectedBySetting", read.detected)
    result.putBoolean("detectedBySystemStart", detectedBySystemStart)
    result.putBoolean("userAttested", userAttested)
    result.putBoolean("lockdown", read.lockdown)
    result.putBoolean("lockdownKnown", read.lockdownKnown)
    result.putBoolean("blockedByOtherApp", read.otherPackage)
    promise.resolve(result)
  }

  /**
   * Autoatestado explícito ("Já ativei"). Resolve false quando o sistema PROVA o
   * contrário — acreditar no usuário só vale onde não temos como saber, senão a
   * flag viraria um jeito de dispensar o passo com a opção comprovadamente off.
   */
  @ReactMethod
  fun confirmAlwaysOnManually(promise: Promise) {
    val read = readAlwaysOnSetting()
    if (read.denied) {
      repository.clearAlwaysOnSignals()
      promise.resolve(false)
      return
    }
    repository.setAlwaysOnAttestedAt(System.currentTimeMillis())
    VpnEventLog.log(reactContext.applicationContext, "always_on_attested_by_user")
    promise.resolve(true)
  }

  private fun appDetailsIntent(): Intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
    data = Uri.parse("package:${reactContext.packageName}")
  }

  private fun openAppDetailsSettings(promise: Promise) {
    try {
      val intent = appDetailsIntent().apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      Log.w(TAG, "Could not open app details settings: ${e.message}")
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun setBlockedDomains(domains: com.facebook.react.bridge.ReadableArray) {
    val list = ArrayList<String>(domains.size())
    for (i in 0 until domains.size()) {
      val v = domains.getString(i)
      if (v != null) list.add(v)
    }
    repository.setBlockedDomains(list)

    try {
      val reloadIntent = Intent(reactContext, BetBlockerVpnService::class.java).apply {
        action = BetBlockerVpnService.ACTION_RELOAD
      }
      ContextCompat.startForegroundService(reactContext, reloadIntent)
    } catch (e: Exception) {
      Log.w(TAG, "Reload broadcast failed: ${e.message}")
    }
  }

  @ReactMethod
  fun refreshBlockedDomains(promise: Promise) {
    thread(name = "BetBlockerRefresh") {
      try {
        val manager = BlocklistManager(repository, reactContext)
        val outcome = manager.forceRefresh()
        if (outcome.anythingChanged) {
          // IP novo só vira rota num establish() — daí o restart da tun. O
          // restart já dispara o reload da trie no processo :vpn.
          val vpnAction = if (outcome.ipsChanged) {
            BetBlockerVpnService.ACTION_RESTART_TUNNEL
          } else {
            BetBlockerVpnService.ACTION_RELOAD
          }
          val reloadIntent = Intent(reactContext, BetBlockerVpnService::class.java).apply {
            action = vpnAction
          }
          try {
            ContextCompat.startForegroundService(reactContext, reloadIntent)
          } catch (e: Exception) {
            Log.w(TAG, "Failed to send $vpnAction after refresh: ${e.message}")
          }
        }
        promise.resolve(outcome.anythingChanged)
      } catch (e: Exception) {
        promise.reject("REFRESH_FAILED", e)
      }
    }
  }

  @ReactMethod
  fun syncAuthSession(token: String, apiBaseUrl: String) {
    repository.setAuthSession(token, apiBaseUrl)
    if (repository.isBlockingEnabled()) {
      SubscriptionEnforcementWorker.schedule(reactContext.applicationContext)
    }
  }

  @ReactMethod
  fun clearAuthSession() {
    repository.clearAuthSession()
  }

  private fun startVpnService() {
    val i = Intent(reactContext, BetBlockerVpnService::class.java)
    ContextCompat.startForegroundService(reactContext, i)
  }

  private fun isDeviceAdminActiveInternal(): Boolean {
    return try {
      val dpm = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
      dpm.isAdminActive(adminComponent)
    } catch (e: Exception) {
      Log.w(TAG, "Could not check device admin state: ${e.message}")
      false
    }
  }

  private fun isVpnActuallyRunning(): Boolean {
    return try {
      val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        cm.allNetworks.any { network ->
          cm.getNetworkCapabilities(network)
            ?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
        }
      } else {
        @Suppress("DEPRECATION")
        cm.getNetworkInfo(ConnectivityManager.TYPE_VPN)?.isConnected == true
      }
    } catch (e: Exception) {
      Log.w(TAG, "Could not check VPN running state: ${e.message}")
      false
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    when (requestCode) {
      REQ_PREPARE_VPN -> {
        val p = pendingVpnPromise
        pendingVpnPromise = null
        if (resultCode == Activity.RESULT_OK) {
          try {
            repository.setRevoked(false)
            VpnHealthWorker.schedule(reactContext.applicationContext)
            startVpnService()
            // Isenção de bateria é orquestrada pelo JS na jornada guiada — ver
            // startBlocking(). Não disparar aqui para não soterrar sob outros diálogos.
            p?.resolve(true)
          } catch (e: Exception) {
            Log.e(TAG, "Failed to start VPN service after user approval", e)
            rollbackStartBlocking()
            p?.resolve(false)
          }
        } else {
          rollbackStartBlocking()
          p?.resolve(false)
          Log.w(TAG, "VPN permission denied by user")
        }
      }
      REQ_BATTERY_EXEMPTION -> {
        val p = pendingBatteryPromise
        pendingBatteryPromise = null
        // O resultCode desta tela não é confiável (vários fabricantes devolvem
        // CANCELED mesmo após conceder): o que vale é reconsultar o PowerManager.
        val exempt = try {
          val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
          pm.isIgnoringBatteryOptimizations(reactContext.packageName)
        } catch (e: Exception) {
          false
        }
        VpnEventLog.log(
          reactContext.applicationContext,
          if (exempt) "battery_exemption_granted" else "battery_exemption_missing",
        )
        p?.resolve(exempt)
      }
      REQ_DEVICE_ADMIN -> {
        val p = pendingDeviceAdminPromise
        pendingDeviceAdminPromise = null
        val accepted = resultCode == Activity.RESULT_OK
        if (accepted) {
          VpnEventLog.log(reactContext.applicationContext, "device_admin_accepted_in_app")
        } else {
          VpnEventLog.log(reactContext.applicationContext, "device_admin_declined_in_app")
        }
        p?.resolve(accepted)
      }
      REQ_ALWAYS_ON_VPN -> {
        // Sem promise pendurada: openAlwaysOnVpnSettings já resolveu antes de sair
        // do método. Este callback só marca a volta, para diagnóstico; quem
        // reconcilia o estado é o refresh do JS no AppState "active".
        VpnEventLog.log(reactContext.applicationContext, "always_on_settings_returned")
      }
    }
  }

  override fun onNewIntent(intent: Intent) {
    // no-op
  }

  override fun onCatalystInstanceDestroy() {
    pendingVpnPromise?.reject("MODULE_DESTROYED", "Module was destroyed")
    pendingVpnPromise = null
    pendingDeviceAdminPromise?.reject("MODULE_DESTROYED", "Module was destroyed")
    pendingDeviceAdminPromise = null
    pendingBatteryPromise?.reject("MODULE_DESTROYED", "Module was destroyed")
    pendingBatteryPromise = null
    reactContext.removeActivityEventListener(this)
  }

  companion object {
    private const val TAG = "BetBlockerModule"
    private const val REQ_PREPARE_VPN = 0xBEE
    private const val REQ_DEVICE_ADMIN = 0xBEF
    private const val REQ_BATTERY_EXEMPTION = 0xBF0
    private const val REQ_ALWAYS_ON_VPN = 0xBF1
    private const val SUPPRESSION_WINDOW_MS = 7L * 24 * 60 * 60 * 1000

    // Chaves @hide de Settings.Secure — ver readAlwaysOnSetting.
    private const val SECURE_ALWAYS_ON_VPN_APP = "always_on_vpn_app"
    private const val SECURE_ALWAYS_ON_VPN_LOCKDOWN = "always_on_vpn_lockdown"

    /**
     * Validade do autoatestado de always-on. Mais longa que a janela de bateria
     * (7 dias) porque aquela é reforçada por VpnEventLog.hasRestartEventSince, e
     * não existe evidência equivalente barata aqui — re-nagar semanalmente quem
     * falou a verdade seria pior que a folga.
     */
    private const val ALWAYS_ON_ATTESTATION_WINDOW_MS = 30L * 24 * 60 * 60 * 1000
  }
}
