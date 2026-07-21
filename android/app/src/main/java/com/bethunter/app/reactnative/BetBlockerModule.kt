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
    repository.setPremiumPaused(false)
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
        requestBatteryOptimizationExemption()
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to start VPN service after permission check", e)
        repository.setBlockingEnabled(false)
        BlocklistRefreshWorker.cancel(reactContext.applicationContext)
        SubscriptionEnforcementWorker.cancel(reactContext.applicationContext)
        promise.resolve(false)
      }
      return
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      repository.setBlockingEnabled(false)
      promise.reject("NO_ACTIVITY", "No active Android activity")
      return
    }
    pendingVpnPromise = promise
    try {
      activity.startActivityForResult(prepareIntent, REQ_PREPARE_VPN)
    } catch (e: Exception) {
      pendingVpnPromise = null
      repository.setBlockingEnabled(false)
      BlocklistRefreshWorker.cancel(reactContext.applicationContext)
      SubscriptionEnforcementWorker.cancel(reactContext.applicationContext)
      promise.reject("VPN_PREPARE_FAILED", e.message)
    }
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
   * Versão promisificada do pedido de isenção: resolve true se o dialog do
   * sistema foi aberto (o resultado real deve ser re-checado no AppState active).
   */
  @ReactMethod
  fun requestBatteryExemption(promise: Promise) {
    try {
      repository.setBatteryExemptionRequested(true)
      val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
      if (pm.isIgnoringBatteryOptimizations(reactContext.packageName)) {
        promise.resolve(true)
        return
      }
      val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:${reactContext.packageName}")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      reactContext.startActivity(intent)
      promise.resolve(true)
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

  private fun requestBatteryOptimizationExemption() {
    val pm = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return
    if (pm.isIgnoringBatteryOptimizations(reactContext.packageName)) return
    try {
      val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:${reactContext.packageName}")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      reactContext.startActivity(intent)
    } catch (e: Exception) {
      Log.w(TAG, "Could not open battery optimization settings: ${e.message}")
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
            requestBatteryOptimizationExemption()
            p?.resolve(true)
          } catch (e: Exception) {
            Log.e(TAG, "Failed to start VPN service after user approval", e)
            repository.setBlockingEnabled(false)
            BlocklistRefreshWorker.cancel(reactContext.applicationContext)
            p?.resolve(false)
          }
        } else {
          repository.setBlockingEnabled(false)
          BlocklistRefreshWorker.cancel(reactContext.applicationContext)
          p?.resolve(false)
          Log.w(TAG, "VPN permission denied by user")
        }
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
    reactContext.removeActivityEventListener(this)
  }

  companion object {
    private const val TAG = "BetBlockerModule"
    private const val REQ_PREPARE_VPN = 0xBEE
    private const val REQ_DEVICE_ADMIN = 0xBEF
    private const val SUPPRESSION_WINDOW_MS = 7L * 24 * 60 * 60 * 1000
  }
}
