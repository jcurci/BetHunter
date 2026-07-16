package com.bethunter.app.admin

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import com.bethunter.app.diagnostics.VpnEventLog

class BetHunterDeviceAdminReceiver : DeviceAdminReceiver() {
  override fun onEnabled(context: Context, intent: Intent) {
    super.onEnabled(context, intent)
    VpnEventLog.log(context, "device_admin_enabled")
  }

  override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
    return "Isso removerá sua proteção contra apostas e permitirá desinstalar o BetHunter."
  }

  override fun onDisabled(context: Context, intent: Intent) {
    super.onDisabled(context, intent)
    VpnEventLog.log(context, "device_admin_disabled")
  }
}
