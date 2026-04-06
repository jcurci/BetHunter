package com.bethunter.app.reactnative

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.util.Log
import androidx.core.content.ContextCompat
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.repository.BlocklistManager
import com.bethunter.app.vpn.BetBlockerVpnService
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

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "BetBlocker"

  @ReactMethod
  fun startBlocking() {
    repository.setBlockingEnabled(true)
    val prepareIntent = VpnService.prepare(reactContext.currentActivity)
    if (prepareIntent == null) {
      startVpnService()
      return
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      Log.w(TAG, "No current activity to request VPN permission")
      return
    }
    try {
      activity.startActivityForResult(prepareIntent, REQ_PREPARE_VPN)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start VPN prepare: ${e.message}")
    }
  }

  @ReactMethod
  fun stopBlocking() {
    repository.setBlockingEnabled(false)

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
  fun setBlockedDomains(domains: com.facebook.react.bridge.ReadableArray) {
    val list = ArrayList<String>(domains.size())
    for (i in 0 until domains.size()) {
      val v = domains.getString(i)
      if (v != null) list.add(v)
    }
    repository.setBlockedDomains(list)

    // ask service (if running) to reload from SharedPreferences
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
    try {
      val i = Intent(reactContext, BetBlockerVpnService::class.java)
      ContextCompat.startForegroundService(reactContext, i)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start VPN service: ${e.message}")
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQ_PREPARE_VPN) return
    if (resultCode == Activity.RESULT_OK) {
      startVpnService()
    } else {
      // user denied; rollback enabled flag
      repository.setBlockingEnabled(false)
      Log.w(TAG, "VPN permission denied by user")
    }
  }

  override fun onNewIntent(intent: Intent) {
    // no-op
  }

  companion object {
    private const val TAG = "BetBlockerModule"
    private const val REQ_PREPARE_VPN = 0xBEE // arbitrary
  }
}

