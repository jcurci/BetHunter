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
    result.putBoolean("paused", repository.isPremiumPaused() || !repository.isPremiumLeaseValid())
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
      if (!repository.isPremiumLeaseValid()) {
        VpnEventLog.log(reactContext.applicationContext, "sync_premium_lease_expired")
        SubscriptionEnforcementWorker.enqueueImmediateCheck(reactContext.applicationContext)
        promise.resolve(false)
        return
      }
      // Consentimento revogado (outra VPN assumiu ou usuário desligou em Config):
      // blind-start falharia no establish(). A intenção (enabled) é preservada;
      // resolve false para a UI mostrar desligado e oferecer a reativação, que
      // passa pelo fluxo do prepare() em startBlocking().
      if (repository.isRevoked() || VpnService.prepare(reactContext) != null) {
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
        Log.e(TAG, "VPN restart failed during sync, rolling back flag", e)
        repository.setBlockingEnabled(false)
        BlocklistRefreshWorker.cancel(reactContext.applicationContext)
        VpnHealthWorker.cancel(reactContext.applicationContext)
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

  private fun openAppDetailsSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:${reactContext.packageName}")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
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
        val updated = manager.forceRefresh()
        if (updated) {
          val reloadIntent = Intent(reactContext, BetBlockerVpnService::class.java).apply {
            action = BetBlockerVpnService.ACTION_RELOAD
          }
          try {
            ContextCompat.startForegroundService(reactContext, reloadIntent)
          } catch (e: Exception) {
            Log.w(TAG, "Failed to reload VPN service after refresh: ${e.message}")
          }
        }
        promise.resolve(updated)
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
    private const val SUPPRESSION_WINDOW_MS = 7L * 24 * 60 * 60 * 1000
  }
}
