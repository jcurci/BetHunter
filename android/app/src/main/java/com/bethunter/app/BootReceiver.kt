package com.bethunter.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.vpn.BetBlockerVpnService

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
    val repo = BlockedDomainsRepository(context)
    if (repo.isBlockingEnabled()) {
      ContextCompat.startForegroundService(
        context,
        Intent(context, BetBlockerVpnService::class.java)
      )
    }
  }
}
