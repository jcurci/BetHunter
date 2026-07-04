package com.bethunter.app.reactnative

import android.app.Activity
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
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.repository.BlocklistManager
import com.bethunter.app.vpn.BetBlockerVpnService
import com.bethunter.app.work.BlocklistRefreshWorker
import com.facebook.react.bridge.ActivityEventListener
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
    BlocklistRefreshWorker.schedule(reactContext.applicationContext)
    val prepareIntent = VpnService.prepare(reactContext.currentActivity ?: reactContext)
    if (prepareIntent == null) {
      // Permissão já concedida — tenta iniciar imediatamente
      try {
        startVpnService()
        requestBatteryOptimizationExemption()
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to start VPN service after permission check", e)
        repository.setBlockingEnabled(false)
        BlocklistRefreshWorker.cancel(reactContext.applicationContext)
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
      promise.reject("VPN_PREPARE_FAILED", e.message)
    }
  }

  @ReactMethod
  fun stopBlocking() {
    repository.setBlockingEnabled(false)
    BlocklistRefreshWorker.cancel(reactContext.applicationContext)

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
      Log.w(TAG, "VPN inconsistency detected: stored=true but VPN not running. Attempting restart.")
      try {
        startVpnService()
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "VPN restart failed during sync, rolling back flag", e)
        repository.setBlockingEnabled(false)
        BlocklistRefreshWorker.cancel(reactContext.applicationContext)
        promise.resolve(false)
      }
    } else {
      promise.resolve(stored)
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
        val manager = BlocklistManager(repository)
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

  private fun startVpnService() {
    val i = Intent(reactContext, BetBlockerVpnService::class.java)
    ContextCompat.startForegroundService(reactContext, i)
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
    if (requestCode != REQ_PREPARE_VPN) return
    val p = pendingVpnPromise
    pendingVpnPromise = null
    if (resultCode == Activity.RESULT_OK) {
      try {
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

  override fun onNewIntent(intent: Intent) {
    // no-op
  }

  override fun onCatalystInstanceDestroy() {
    pendingVpnPromise?.reject("MODULE_DESTROYED", "Module was destroyed")
    pendingVpnPromise = null
    reactContext.removeActivityEventListener(this)
  }

  companion object {
    private const val TAG = "BetBlockerModule"
    private const val REQ_PREPARE_VPN = 0xBEE
  }
}
