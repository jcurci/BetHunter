package com.bethunter.app.work

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
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
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
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

    return when (val result = fetchStatus(baseUrl, token)) {
      is StatusResult.Confirmed -> when (result.status.isPremium) {
        true -> {
          // Renova a licença SEMPRE, não só quando estávamos pausados: é o
          // caminho que mantém a proteção viva para quem nunca abre o app.
          repo.renewPremiumLease(result.status.expiresAtMs)
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
      }

      // Sessão do nosso backend morreu (JWT de 30 dias, sem refresh). Repetir não
      // ressuscita o token: o `retry` eterno só garantia que a licença NUNCA mais
      // seria renovada por aqui, até vencer e desligar a proteção de quem paga.
      // Descarta a sessão inútil e sai limpo — quem renova agora é o RevenueCat,
      // no boot do app (ver App.tsx, "boot-unauthed").
      StatusResult.SessionExpired -> {
        repo.clearAuthSession()
        Result.success()
      }

      // Erro de rede/resposta ambígua/status NÃO verificado pelo backend:
      // ausência de informação nunca é prova de não-assinatura. Tenta de novo.
      StatusResult.Unknown -> Result.retry()
    }
  }

  private data class SubscriptionStatus(val isPremium: Boolean, val expiresAtMs: Long?)

  private sealed class StatusResult {
    data class Confirmed(val status: SubscriptionStatus) : StatusResult()

    /** 401/403: o token guardado não vale mais e não vai voltar a valer. */
    object SessionExpired : StatusResult()

    /** Rede, 5xx, corpo estranho ou `verified:false` — não sabemos. */
    object Unknown : StatusResult()
  }

  /**
   * `Confirmed` só quando o backend CONFIRMOU com o RevenueCat (verified=true).
   * Um `isPremium:false` derivado do cache do banco (verified=false) volta como
   * `Unknown` — foi exatamente esse caso que desligava o bloqueador de assinantes
   * legítimos quando o webhook falhava em gravar o rc_customer_id.
   */
  private fun fetchStatus(baseUrl: String, token: String): StatusResult {
    var connection: HttpURLConnection? = null
    return try {
      val url = URL("$baseUrl/users/subscription-status")
      connection = url.openConnection() as HttpURLConnection
      connection.requestMethod = "GET"
      connection.connectTimeout = 8000
      connection.readTimeout = 8000
      connection.setRequestProperty("Authorization", "Bearer $token")

      val code = connection.responseCode
      if (code == HttpURLConnection.HTTP_UNAUTHORIZED || code == HttpURLConnection.HTTP_FORBIDDEN) {
        Log.w(TAG, "subscription-status returned $code — sessão expirada")
        VpnEventLog.log(applicationContext, "subscription_status_unauthorized")
        return StatusResult.SessionExpired
      }
      if (code != HttpURLConnection.HTTP_OK) {
        Log.w(TAG, "subscription-status returned $code")
        return StatusResult.Unknown
      }

      val body = connection.inputStream.bufferedReader().use { it.readText() }
      val json = JSONObject(body)

      // Backend antigo não manda `verified`. Tratamos a ausência como NÃO
      // verificado: o enforcement é uma rede de segurança, e falhar para o lado
      // de manter a proteção é sempre preferível a desligá-la sem certeza.
      if (!json.optBoolean("verified", false)) {
        Log.w(TAG, "subscription-status não verificado pelo backend — ignorando")
        VpnEventLog.log(applicationContext, "subscription_status_unverified")
        return StatusResult.Unknown
      }

      StatusResult.Confirmed(
        SubscriptionStatus(
          isPremium = json.getBoolean("isPremium"),
          // Ausente ou null = vitalício/sem vencimento conhecido; a licença cai no
          // prazo padrão em vez de expirar imediatamente.
          expiresAtMs = parseExpiresAt(json.optString("expiresAt", "")),
        )
      )
    } catch (e: Exception) {
      Log.w(TAG, "Failed to check subscription status", e)
      StatusResult.Unknown
    } finally {
      connection?.disconnect()
    }
  }

  /**
   * O backend serializa Date como ISO-8601 UTC. SimpleDateFormat em vez de
   * java.time porque o minSdk do projeto é anterior à API 26 e não há
   * desugaring configurado. null = sem vencimento conhecido (a licença cai no
   * prazo padrão, nunca em "vencida").
   */
  private fun parseExpiresAt(raw: String): Long? {
    if (raw.isBlank() || raw == "null") return null
    for (pattern in ISO_PATTERNS) {
      try {
        val format = SimpleDateFormat(pattern, Locale.US)
        format.timeZone = TimeZone.getTimeZone("UTC")
        return format.parse(raw)?.time
      } catch (_: ParseException) {
        // tenta o próximo formato
      }
    }
    Log.w(TAG, "expiresAt em formato inesperado: $raw")
    return null
  }

  /**
   * Pausa reversível: preserva isBlockingEnabled (intenção do usuário) e mantém
   * este worker agendado, para religar sozinho quando a assinatura voltar.
   * A versão anterior apagava `enabled` e se autocancelava — o bloqueio caía
   * para sempre, em silêncio, mesmo depois de o usuário renovar.
   */
  private fun pauseBlocking(context: Context, repo: BlockedDomainsRepository) {
    repo.setPremiumPaused(true)
    repo.revokePremiumLease()

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
    private const val IMMEDIATE_WORK_NAME = "subscription_enforcement_now"
    // 8h deixava a assinatura vencida valendo por quase um dia inteiro de
    // bloqueio. Com a licença como rede de segurança, o custo de 1h é baixo.
    private val CHECK_INTERVAL = 1L to TimeUnit.HOURS
    private val ISO_PATTERNS = arrayOf(
      "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
      "yyyy-MM-dd'T'HH:mm:ss'Z'",
    )

    private fun networkConstraints() = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()

    fun schedule(context: Context) {
      val request = PeriodicWorkRequestBuilder<SubscriptionEnforcementWorker>(
        CHECK_INTERVAL.first, CHECK_INTERVAL.second
      )
        .setConstraints(networkConstraints())
        .build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        WORK_NAME,
        // UPDATE, não KEEP: quem já tinha o worker agendado no intervalo antigo
        // continuaria em 8h para sempre.
        ExistingPeriodicWorkPolicy.UPDATE,
        request
      )
    }

    /**
     * Checagem única e imediata. Chamada quando a licença de premium venceu,
     * para que um assinante em dia que caiu num buraco de renovação volte em
     * minutos em vez de esperar a próxima janela periódica.
     *
     * Todo o corpo em try/catch: também é chamada do processo `:vpn`, onde o
     * WorkManager pode não estar inicializado — e falhar aqui nunca pode
     * derrubar o serviço.
     */
    fun enqueueImmediateCheck(context: Context) {
      try {
        val request = OneTimeWorkRequestBuilder<SubscriptionEnforcementWorker>()
          .setConstraints(networkConstraints())
          .build()
        WorkManager.getInstance(context).enqueueUniqueWork(
          IMMEDIATE_WORK_NAME,
          ExistingWorkPolicy.KEEP,
          request
        )
      } catch (e: Exception) {
        Log.w(TAG, "Could not enqueue immediate subscription check: ${e.message}")
      }
    }

    fun cancel(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
    }
  }
}
