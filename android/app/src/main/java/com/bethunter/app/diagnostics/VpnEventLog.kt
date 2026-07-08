package com.bethunter.app.diagnostics

import android.content.Context
import android.os.PowerManager
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * Ring buffer de eventos de lifecycle da VPN em SharedPreferences próprio.
 * Cada entrada carrega o estado de energia do momento (power save / doze /
 * isenção de bateria) para permitir reconstruir kills em campo.
 */
object VpnEventLog {
  private const val TAG = "VpnEventLog"
  private const val PREFS_NAME = "vpn_event_log"
  private const val KEY_EVENTS = "events"
  private const val MAX_ENTRIES = 100

  @Synchronized
  fun log(context: Context, event: String) {
    try {
      val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
      val entry = JSONObject().apply {
        put("ts", System.currentTimeMillis())
        put("event", event)
        put("powerSave", pm?.isPowerSaveMode ?: false)
        put("deviceIdle", pm?.isDeviceIdleMode ?: false)
        put("batteryExempt", pm?.isIgnoringBatteryOptimizations(context.packageName) ?: false)
      }
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val current = JSONArray(prefs.getString(KEY_EVENTS, "[]"))
      current.put(entry)
      val trimmed = if (current.length() > MAX_ENTRIES) {
        JSONArray().also { out ->
          for (i in current.length() - MAX_ENTRIES until current.length()) out.put(current.get(i))
        }
      } else current
      prefs.edit().putString(KEY_EVENTS, trimmed.toString()).apply()
      Log.i(TAG, event)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to log event '$event': ${e.message}")
    }
  }

  @Synchronized
  fun getEventsJson(context: Context): String =
    try {
      context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(KEY_EVENTS, "[]") ?: "[]"
    } catch (e: Exception) {
      "[]"
    }
}
