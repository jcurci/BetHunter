package com.bethunter.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.vpn.BetBlockerVpnService
import com.bethunter.app.work.BlocklistRefreshWorker
import com.bethunter.app.work.VpnHealthWorker

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != Intent.ACTION_BOOT_COMPLETED &&
        action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    val repo = BlockedDomainsRepository(context)
    if (repo.isBlockingEnabled()) {
      VpnEventLog.log(context, "boot_receiver:$action")
      try {
        ContextCompat.startForegroundService(
          context,
          Intent(context, BetBlockerVpnService::class.java)
        )
      } catch (e: Exception) {
        // Nunca crashar um receiver; o health check periódico religa depois.
        Log.w("BootReceiver", "Could not start VPN service on boot: ${e.message}")
        VpnEventLog.log(context, "boot_start_failed:${e.javaClass.simpleName}")
      }
      BlocklistRefreshWorker.schedule(context)
      VpnHealthWorker.schedule(context)
    }
  }
}
