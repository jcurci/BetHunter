package com.bethunter.app.diagnostics

import android.content.Context
import android.os.Build
import android.os.PowerManager
import android.util.Log
import com.bethunter.app.repository.BlockedDomainsDb
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject

/**
 * Timeline de eventos de lifecycle da VPN. Cada entrada carrega o estado de energia
 * do momento (power save / doze / isenção de bateria) para permitir reconstruir
 * kills em campo.
 *
 * Vive no SQLite, e não mais em SharedPreferences, por duas razões que juntas
 * deixavam o diagnóstico inútil:
 *  1. **Split entre processos** — o `BetBlockerVpnService` roda em `:vpn` e escrevia
 *     num arquivo de prefs que o processo principal (quem lê o log) não enxergava.
 *     Metade da história, justamente a da VPN, era invisível.
 *  2. **Buffer curto demais** — 100 entradas somem em segundos quando algo entra em
 *     laço. A coalescência de repetições em [BlockedDomainsDb.appendEvent] resolve
 *     isso na origem.
 *
 * A API pública é a mesma de antes, para não mexer nos ~30 pontos de chamada.
 */
object VpnEventLog {
  private const val TAG = "VpnEventLog"
  private const val LEGACY_PREFS_NAME = "vpn_event_log"
  private const val LEGACY_KEY_EVENTS = "events"
  private const val MAX_ENTRIES = 500

  /**
   * Prefixos de evento que indicam que a VPN caiu e precisou de recuperação
   * (usado por hasRestartEventSince para invalidar supressões manuais do
   * aviso de bateria quando a proteção realmente falhou).
   */
  private val RESTART_EVENT_PREFIXES = listOf(
    "service_destroy_unexpected",
    "health_check_vpn_down",
    "health_check_restart_blocked",
    "health_check_loop_dead",
    "loop_exited_unexpectedly",
    "loop_read_failed",
    "revoked_by_system",
    "establish_failed",
    "start_blocked_needs_consent",
    "start_foreground_failed",
    "restart_alarm_failed"
  )

  /**
   * Escritas vão para uma thread só: `log()` é chamado da main thread (onCreate,
   * onStartCommand) e do laço de pacotes, e nenhum deles pode parar para esperar
   * disco. Executor serial preserva a ordem dos eventos, que é o valor do log.
   */
  private val writer: ExecutorService = Executors.newSingleThreadExecutor { r ->
    Thread(r, "VpnEventLogWriter").apply { isDaemon = true }
  }

  @Volatile private var db: BlockedDomainsDb? = null

  private fun db(context: Context): BlockedDomainsDb {
    db?.let { return it }
    return synchronized(this) {
      db ?: BlockedDomainsDb(context.applicationContext).also {
        db = it
        migrateLegacyEvents(context.applicationContext, it)
      }
    }
  }

  fun log(context: Context, event: String) {
    val appContext = context.applicationContext
    val ts = System.currentTimeMillis()
    // O estado de energia é colhido AQUI, no momento do evento — de nada serviria
    // o valor lido quando a fila de escrita chegasse na vez dele.
    val meta = try {
      val pm = appContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
      JSONObject().apply {
        put("powerSave", pm?.isPowerSaveMode ?: false)
        put("deviceIdle", pm?.isDeviceIdleMode ?: false)
        put("batteryExempt", pm?.isIgnoringBatteryOptimizations(appContext.packageName) ?: false)
        put("manufacturer", Build.MANUFACTURER)
        put("model", Build.MODEL)
      }.toString()
    } catch (e: Exception) {
      null
    }

    Log.i(TAG, event)
    try {
      writer.execute {
        try {
          db(appContext).appendEvent(ts, event, meta, MAX_ENTRIES)
        } catch (e: Exception) {
          Log.w(TAG, "Failed to persist event '$event': ${e.message}")
        }
      }
    } catch (e: Exception) {
      // Executor recusando tarefa nunca pode derrubar quem só queria logar.
      Log.w(TAG, "Failed to enqueue event '$event': ${e.message}")
    }
  }

  fun getEventsJson(context: Context): String =
    try {
      val array = JSONArray()
      for (row in db(context).getEvents()) {
        val entry = JSONObject()
        entry.put("ts", row.ts)
        entry.put("event", row.event)
        if (row.count > 1) entry.put("count", row.count)
        // meta é achatado na entrada para manter o formato que o consumidor já
        // esperava ({ts, event, powerSave, deviceIdle, batteryExempt, ...}).
        row.meta?.takeIf { it.isNotBlank() }?.let { raw ->
          try {
            val meta = JSONObject(raw)
            for (key in meta.keys()) entry.put(key, meta.get(key))
          } catch (_: Exception) {
          }
        }
        array.put(entry)
      }
      array.toString()
    } catch (e: Exception) {
      Log.w(TAG, "getEventsJson failed: ${e.message}")
      "[]"
    }

  /**
   * true se algum evento de queda/recuperação da VPN foi registrado após
   * sinceTs — usado para invalidar a supressão manual do aviso de bateria
   * quando o usuário confirmou "já configurei" mas a VPN caiu de novo.
   */
  fun hasRestartEventSince(context: Context, sinceTs: Long): Boolean {
    return try {
      db(context).getEvents(sinceTs).any { row ->
        RESTART_EVENT_PREFIXES.any { row.event.startsWith(it) }
      }
    } catch (e: Exception) {
      Log.w(TAG, "hasRestartEventSince failed: ${e.message}")
      false
    }
  }

  /**
   * Traz o histórico das prefs antigas na primeira abertura e apaga a origem.
   * Sem isto, quem atualiza o app perde o rastro justamente da versão que estava
   * falhando — que é o que se quer olhar.
   */
  private fun migrateLegacyEvents(context: Context, target: BlockedDomainsDb) {
    try {
      val prefs = context.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE)
      val raw = prefs.getString(LEGACY_KEY_EVENTS, null) ?: return
      val legacy = JSONArray(raw)
      for (i in 0 until legacy.length()) {
        val entry = legacy.optJSONObject(i) ?: continue
        val event = entry.optString("event", "")
        if (event.isBlank()) continue
        val ts = entry.optLong("ts", 0L)
        entry.remove("ts")
        entry.remove("event")
        target.appendEvent(ts, event, entry.toString(), MAX_ENTRIES)
      }
      prefs.edit().remove(LEGACY_KEY_EVENTS).apply()
      Log.i(TAG, "Migrated ${legacy.length()} legacy events to SQLite")
    } catch (e: Exception) {
      Log.w(TAG, "Legacy event migration failed: ${e.message}")
    }
  }
}
