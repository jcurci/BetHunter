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
import com.bethunter.app.vpn.VpnStatus
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
      true -> {
        // Premium confirmado: se estávamos pausados por engano (ou a assinatura
        // foi renovada), religa sem exigir nada do usuário.
        if (repo.isPremiumPaused()) {
          Log.i(TAG, "Subscription active again — resuming blocker")
          VpnEventLog.log(applicationContext, "subscription_enforcement_resumed")
          resumeBlocking(applicationContext, repo)
        }
        Result.success()
      }
      false -> {
        Log.i(TAG, "Subscription expired (verified) — pausing blocker")
        VpnEventLog.log(applicationContext, "subscription_enforcement_paused")
        pauseBlocking(applicationContext, repo)
        Result.success()
      }
      // Erro de rede/401/resposta ambígua/status NÃO verificado pelo backend:
      // ausência de informação nunca é prova de não-assinatura. Tenta de novo.
      null -> Result.retry()
    }
  }

  /**
   * true/false só quando o backend CONFIRMOU com o RevenueCat (verified=true).
   * Um `isPremium:false` derivado do cache do banco (verified=false) volta como
   * null — foi exatamente esse caso que desligava o bloqueador de assinantes
   * legítimos quando o webhook falhava em gravar o rc_customer_id.
   */
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
      val json = JSONObject(body)

      // Backend antigo não manda `verified`. Tratamos a ausência como NÃO
      // verificado: o enforcement é uma rede de segurança, e falhar para o lado
      // de manter a proteção é sempre preferível a desligá-la sem certeza.
      if (!json.optBoolean("verified", false)) {
        Log.w(TAG, "subscription-status não verificado pelo backend — ignorando")
        VpnEventLog.log(applicationContext, "subscription_status_unverified")
        return null
      }

      json.getBoolean("isPremium")
    } catch (e: Exception) {
      Log.w(TAG, "Failed to check subscription status", e)
      null
    } finally {
      connection?.disconnect()
    }
  }

  /**
   * Pausa reversível: preserva isBlockingEnabled (intenção do usuário) e mantém
   * este worker agendado, para religar sozinho quando a assinatura voltar.
   * A versão anterior apagava `enabled` e se autocancelava — o bloqueio caía
   * para sempre, em silêncio, mesmo depois de o usuário renovar.
   */
  private fun pauseBlocking(context: Context, repo: BlockedDomainsRepository) {
    repo.setPremiumPaused(true)

    // Só manda o PAUSE se há o que pausar: onCreate() do serviço faz
    // startAsForeground(), então um PAUSE com a VPN já parada subiria o serviço
    // inteiro só para derrubá-lo em seguida.
    if (VpnStatus.isVpnActive(context)) {
      val intent = Intent(context, BetBlockerVpnService::class.java).apply {
        action = BetBlockerVpnService.ACTION_PAUSE
      }
      try {
        ContextCompat.startForegroundService(context, intent)
      } catch (e: Exception) {
        Log.w(TAG, "Failed to send ACTION_PAUSE: ${e.message}")
      }
    }

    BlockerNotifications.showReactivationNotification(
      context,
      "Bloqueio pausado",
      "Sua assinatura não está ativa. Renove para voltar a bloquear sites de apostas."
    )
  }

  private fun resumeBlocking(context: Context, repo: BlockedDomainsRepository) {
    repo.setPremiumPaused(false)
    BlockerNotifications.cancelReactivationNotification(context)
    BlocklistRefreshWorker.schedule(context)
    VpnHealthWorker.schedule(context)

    try {
      ContextCompat.startForegroundService(
        context,
        Intent(context, BetBlockerVpnService::class.java)
      )
    } catch (e: Exception) {
      // FGS start bloqueado em background: o health worker e a reabertura do
      // app cobrem o religamento; a intenção já está preservada.
      Log.w(TAG, "Could not resume VPN from background: ${e.message}")
    }
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
