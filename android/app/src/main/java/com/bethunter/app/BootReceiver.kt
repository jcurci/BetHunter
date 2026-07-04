package com.bethunter.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.vpn.BetBlockerVpnService
import com.bethunter.app.work.BlocklistRefreshWorker

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != Intent.ACTION_BOOT_COMPLETED &&
        action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    val repo = BlockedDomainsRepository(context)
    if (repo.isBlockingEnabled()) {
      ContextCompat.startForegroundService(
        context,
        Intent(context, BetBlockerVpnService::class.java)
      )
      BlocklistRefreshWorker.schedule(context)
    }
  }
}
