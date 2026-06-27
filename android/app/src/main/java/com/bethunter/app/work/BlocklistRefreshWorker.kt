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
      val manager = BlocklistManager(repo)
      val updated = manager.forceRefresh()
      if (updated) {
        val intent = Intent(applicationContext, BetBlockerVpnService::class.java).apply {
          action = BetBlockerVpnService.ACTION_RELOAD
        }
        try {
          applicationContext.startService(intent)
        } catch (e: Exception) {
          Log.w(TAG, "Could not send RELOAD to VPN service: ${e.message}")
        }
      }
      Log.i(TAG, "Periodic refresh completed (updated=$updated)")
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
      val request = PeriodicWorkRequestBuilder<BlocklistRefreshWorker>(12, TimeUnit.HOURS)
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        WORK_NAME,
        ExistingPeriodicWorkPolicy.KEEP,
        request
      )
      Log.i(TAG, "Periodic blocklist refresh scheduled (12h)")
    }

    fun cancel(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
      Log.i(TAG, "Periodic blocklist refresh cancelled")
    }
  }
}
