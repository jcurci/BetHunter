package com.bethunter.app.work

import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.vpn.BetBlockerVpnService
import com.bethunter.app.vpn.BlockerNotifications
import com.bethunter.app.vpn.VpnStatus
import java.util.concurrent.TimeUnit

/**
 * Health check periódico do bloqueador: se a intenção do usuário é "bloqueando"
 * mas a VPN não está de pé, religa o serviço. É o backstop para kills por
 * economia de bateria/Doze/OEM em que onDestroy não roda (alarme nunca agendado).
 *
 * Limite honesto: WorkManager sobrevive a Doze (janelas de manutenção) e battery
 * saver, mas NÃO a force-stop — nesse caso só boot/reabertura do app recuperam.
 * Sem constraint de rede: o health check precisa rodar offline também.
 */
class VpnHealthWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

  override fun doWork(): Result {
    val context = applicationContext
    val repo = BlockedDomainsRepository(context)

    if (!repo.isBlockingEnabled()) {
      // Usuário desligou — este worker não tem mais função.
      cancel(context)
      return Result.success()
    }

    if (repo.isPremiumPaused()) {
      // Pausado por assinatura: a intenção do usuário segue "bloqueando", então
      // este worker continua vivo — mas religar aqui brigaria com o enforcement.
      return Result.success()
    }

    if (!repo.isPremiumLeaseValid()) {
      // Licença vencida: o serviço se recusaria a subir de qualquer forma.
      // Pede uma confirmação de assinatura em vez de insistir na VPN.
      VpnEventLog.log(context, "health_check_premium_lease_expired")
      SubscriptionEnforcementWorker.enqueueImmediateCheck(context)
      return Result.success()
    }

    if (repo.isRevoked() || VpnService.prepare(context) != null) {
      // Sem consentimento não há o que religar; garante que o usuário está avisado.
      VpnEventLog.log(context, "health_check_needs_consent")
      BlockerNotifications.showReactivationNotification(
        context,
        "Proteção desativada",
        "O bloqueio de sites de apostas foi interrompido pelo sistema. Toque para reativar."
      )
      return Result.success()
    }

    if (VpnStatus.isVpnActive(context)) {
      return Result.success()
    }

    VpnEventLog.log(context, "health_check_vpn_down")
    return try {
      ContextCompat.startForegroundService(
        context,
        Intent(context, BetBlockerVpnService::class.java)
      )
      VpnEventLog.log(context, "health_check_restarted")
      Result.success()
    } catch (e: Exception) {
      // ForegroundServiceStartNotAllowedException (API 31+) quando o app não tem
      // isenção de otimização de bateria: só o usuário pode restaurar — o toque
      // na notificação passa pela Activity, que é exceção documentada de FGS start.
      Log.w(TAG, "Cannot restart VPN from background: ${e.message}")
      VpnEventLog.log(context, "health_check_restart_blocked:${e.javaClass.simpleName}")
      BlockerNotifications.showReactivationNotification(
        context,
        "Proteção interrompida",
        "O sistema impediu a retomada do bloqueio em segundo plano. Toque para restaurar."
      )
      Result.success()
    }
  }

  companion object {
    private const val TAG = "VpnHealthWorker"
    private const val WORK_NAME = "vpn_health_check"
    private const val EXPEDITED_WORK_NAME = "vpn_health_check_expedited"

    fun schedule(context: Context) {
      try {
        val request = PeriodicWorkRequestBuilder<VpnHealthWorker>(15, TimeUnit.MINUTES)
          .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
          WORK_NAME,
          ExistingPeriodicWorkPolicy.UPDATE,
          request
        )
        Log.i(TAG, "Periodic VPN health check scheduled (15min)")
      } catch (e: Exception) {
        Log.w(TAG, "Failed to schedule health check: ${e.message}")
      }
    }

    fun cancel(context: Context) {
      try {
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        Log.i(TAG, "Periodic VPN health check cancelled")
      } catch (e: Exception) {
        Log.w(TAG, "Failed to cancel health check: ${e.message}")
      }
    }

    /**
     * Checagem única logo após um onDestroy inesperado — caminho de recuperação
     * independente do AlarmManager (que pode não ter permissão de alarme exato).
     * Sem setExpedited: expedited work não aceita initial delay, e o delay importa
     * para dar chance ao alarme de restart (+2s) agir primeiro.
     */
    fun enqueueExpeditedCheck(context: Context) {
      try {
        val request = OneTimeWorkRequestBuilder<VpnHealthWorker>()
          .setInitialDelay(10, TimeUnit.SECONDS)
          .build()
        WorkManager.getInstance(context).enqueueUniqueWork(
          EXPEDITED_WORK_NAME,
          androidx.work.ExistingWorkPolicy.REPLACE,
          request
        )
      } catch (e: Exception) {
        Log.w(TAG, "Failed to enqueue expedited check: ${e.message}")
      }
    }
  }
}
