package com.bethunter.app.work

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.WorkManager
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.vpn.BetBlockerVpnService
import com.bethunter.app.vpn.BlockerNotifications
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit
import org.json.JSONObject

/**
 * Rede de segurança pra garantir que o bloqueio pare quando a assinatura
 * expira, mesmo que o app JS nunca seja reaberto (o RevenueCat webhook +
 * checagem em foreground em App.tsx cobrem o caminho principal, quase em
 * tempo real — esse worker cobre o caso de webhook perdido / app abandonado).
 */
class SubscriptionEnforcementWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

  override fun doWork(): Result {
    val repo = BlockedDomainsRepository(applicationContext)
    if (!repo.isBlockingEnabled()) {
      cancel(applicationContext)
      return Result.success()
    }

    val token = repo.getAuthToken() ?: return Result.success()
    val baseUrl = repo.getApiBaseUrl() ?: return Result.success()

    return when (fetchIsPremium(baseUrl, token)) {
      true -> Result.success()
      false -> {
        Log.i(TAG, "Subscription expired — stopping blocker")
        VpnEventLog.log(applicationContext, "subscription_enforcement_stopped")
        stopBlockingLocally(applicationContext)
        Result.success()
      }
      null -> Result.retry() // erro de rede/401/resposta ambígua — nunca derruba no escuro
    }
  }

  private fun fetchIsPremium(baseUrl: String, token: String): Boolean? {
    var connection: HttpURLConnection? = null
    return try {
      val url = URL("$baseUrl/users/subscription-status")
      connection = url.openConnection() as HttpURLConnection
      connection.requestMethod = "GET"
      connection.connectTimeout = 8000
      connection.readTimeout = 8000
      connection.setRequestProperty("Authorization", "Bearer $token")

      if (connection.responseCode != HttpURLConnection.HTTP_OK) {
        Log.w(TAG, "subscription-status returned ${connection.responseCode}")
        return null
      }

      val body = connection.inputStream.bufferedReader().use { it.readText() }
      JSONObject(body).getBoolean("isPremium")
    } catch (e: Exception) {
      Log.w(TAG, "Failed to check subscription status", e)
      null
    } finally {
      connection?.disconnect()
    }
  }

  private fun stopBlockingLocally(context: Context) {
    val repo = BlockedDomainsRepository(context)
    repo.setBlockingEnabled(false)
    repo.setRevoked(false)
    BlocklistRefreshWorker.cancel(context)
    VpnHealthWorker.cancel(context)
    BlockerNotifications.cancelReactivationNotification(context)

    val intent = Intent(context, BetBlockerVpnService::class.java).apply {
      action = BetBlockerVpnService.ACTION_STOP
    }
    try {
      ContextCompat.startForegroundService(context, intent)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to send ACTION_STOP: ${e.message}")
    }

    cancel(context) // nada mais pra fazer enforcement de — se cancela
  }

  companion object {
    private const val TAG = "SubscriptionEnforcement"
    private const val WORK_NAME = "subscription_enforcement_check"
    private val CHECK_INTERVAL = 8L to TimeUnit.HOURS

    fun schedule(context: Context) {
      val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()
      val request = PeriodicWorkRequestBuilder<SubscriptionEnforcementWorker>(
        CHECK_INTERVAL.first, CHECK_INTERVAL.second
      )
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        WORK_NAME,
        ExistingPeriodicWorkPolicy.KEEP,
        request
      )
    }

    fun cancel(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
    }
  }
}
