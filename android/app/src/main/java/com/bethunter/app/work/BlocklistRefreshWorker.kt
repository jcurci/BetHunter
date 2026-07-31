package com.bethunter.app.work

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.WorkManager
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.repository.BlocklistManager
import com.bethunter.app.vpn.BetBlockerVpnService
import java.util.concurrent.TimeUnit

class BlocklistRefreshWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

  override fun doWork(): Result {
    return try {
      val repo = BlockedDomainsRepository(applicationContext)
      val manager = BlocklistManager(repo, applicationContext)
      val outcome = manager.forceRefresh()
      if (outcome.anythingChanged) {
        // IP mudou → a tun precisa ser reerguida (rota só entra no establish);
        // o restart já leva o reload dos domínios junto. Só domínio → reload,
        // que é barato e não abre janela de desproteção.
        val vpnAction = if (outcome.ipsChanged) {
          BetBlockerVpnService.ACTION_RESTART_TUNNEL
        } else {
          BetBlockerVpnService.ACTION_RELOAD
        }
        val intent = Intent(applicationContext, BetBlockerVpnService::class.java).apply {
          action = vpnAction
        }
        try {
          applicationContext.startService(intent)
        } catch (e: Exception) {
          Log.w(TAG, "Could not send $vpnAction to VPN service: ${e.message}")
        }
      }
      Log.i(TAG, "Periodic refresh completed ($outcome)")
      Result.success()
    } catch (e: Exception) {
      Log.w(TAG, "Periodic refresh failed", e)
      Result.retry()
    }
  }

  companion object {
    private const val TAG = "BlocklistRefreshWorker"
    private const val WORK_NAME = "blocklist_periodic_refresh"

    fun schedule(context: Context) {
      val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()
      val request = PeriodicWorkRequestBuilder<BlocklistRefreshWorker>(1, TimeUnit.HOURS)
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        WORK_NAME,
        ExistingPeriodicWorkPolicy.KEEP,
        request
      )
      Log.i(TAG, "Periodic blocklist refresh scheduled (1h)")
    }

    fun cancel(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
      Log.i(TAG, "Periodic blocklist refresh cancelled")
    }
  }
}
