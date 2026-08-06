package com.bethunter.app.work

import android.content.Context
import android.content.Intent
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
import com.bethunter.app.vpn.VpnConsent
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

    if (!repo.isPremiumLeaseValid() && !repo.hasLeaseGraceAvailable()) {
      // Licença vencida E sem cortesia restante: o serviço se recusaria a subir de
      // qualquer forma. Com cortesia disponível, seguimos em frente — quem concede
      // a extensão é o próprio serviço, no start.
      VpnEventLog.log(context, "health_check_premium_lease_expired")
      SubscriptionEnforcementWorker.enqueueImmediateCheck(context)
      return Result.success()
    }

    // Consentimento é decidido pelo sistema, não pela flag: `hasConsent` limpa um
    // `revoked` obsoleto (ex.: gravado por um prepare() transitório na atualização
    // do app) e devolve a recuperação automática a este worker.
    if (!VpnConsent.hasConsent(context, repo)) {
      // Sem consentimento não há o que religar; garante que o usuário está avisado.
      VpnEventLog.log(context, "health_check_needs_consent")
      BlockerNotifications.showReactivationNotification(
        context,
        "Proteção desativada",
        "O bloqueio de sites de apostas foi interrompido pelo sistema. Toque para reativar.",
        // Este worker roda a cada 15 min: sem o freio, uma revogação que o usuário
        // ainda não resolveu vira 96 notificações por dia.
        throttleMs = REACTIVATION_NOTICE_THROTTLE_MS,
      )
      return Result.success()
    }

    if (VpnStatus.isVpnActive(context)) {
      if (repo.isLoopRunning()) return Result.success()

      // Interface de pé com o laço de leitura morto: o pior estado possível, porque
      // o sistema, este worker e a Home reportam "protegido" enquanto NENHUMA query
      // DNS é respondida — o aparelho fica sem internet e a proteção, sem efeito.
      // Interface viva não é sinal de saúde; por isso o par de flags.
      Log.w(TAG, "VPN interface up but packet loop is dead — restarting tunnel")
      VpnEventLog.log(context, "health_check_loop_dead")
      return try {
        ContextCompat.startForegroundService(
          context,
          Intent(context, BetBlockerVpnService::class.java).apply {
            action = BetBlockerVpnService.ACTION_RESTART_TUNNEL
          }
        )
        Result.success()
      } catch (e: Exception) {
        Log.w(TAG, "Cannot restart dead loop from background: ${e.message}")
        VpnEventLog.log(context, "health_check_loop_restart_blocked:${e.javaClass.simpleName}")
        Result.success()
      }
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
        "O sistema impediu a retomada do bloqueio em segundo plano. Toque para restaurar.",
        throttleMs = REACTIVATION_NOTICE_THROTTLE_MS,
      )
      Result.success()
    }
  }

  companion object {
    private const val TAG = "VpnHealthWorker"
    private const val WORK_NAME = "vpn_health_check"
    private const val EXPEDITED_WORK_NAME = "vpn_health_check_expedited"

    /** Intervalo mínimo entre alertas repetidos — este worker roda a cada 15 min. */
    private const val REACTIVATION_NOTICE_THROTTLE_MS = 6L * 60 * 60 * 1000

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
