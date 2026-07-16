package com.bethunter.app.diagnostics

import android.content.Context
import android.os.Build
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

  /**
   * Prefixos de evento que indicam que a VPN caiu e precisou de recuperação
   * (usado por hasRestartEventSince para invalidar supressões manuais do
   * aviso de bateria quando a proteção realmente falhou).
   */
  private val RESTART_EVENT_PREFIXES = listOf(
    "service_destroy_unexpected",
    "health_check_vpn_down",
    "health_check_restart_blocked",
    "revoked_by_system",
    "establish_failed",
    "start_blocked_needs_consent",
    "start_foreground_failed",
    "restart_alarm_failed"
  )

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
        put("manufacturer", Build.MANUFACTURER)
        put("model", Build.MODEL)
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

  /**
   * true se algum evento de queda/recuperação da VPN foi registrado após
   * sinceTs — usado para invalidar a supressão manual do aviso de bateria
   * quando o usuário confirmou "já configurei" mas a VPN caiu de novo.
   */
  @Synchronized
  fun hasRestartEventSince(context: Context, sinceTs: Long): Boolean {
    return try {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val events = JSONArray(prefs.getString(KEY_EVENTS, "[]"))
      for (i in 0 until events.length()) {
        val entry = events.getJSONObject(i)
        if (entry.optLong("ts", 0L) <= sinceTs) continue
        val event = entry.optString("event", "")
        if (RESTART_EVENT_PREFIXES.any { event.startsWith(it) }) return true
      }
      false
    } catch (e: Exception) {
      Log.w(TAG, "hasRestartEventSince failed: ${e.message}")
      false
    }
  }
}
