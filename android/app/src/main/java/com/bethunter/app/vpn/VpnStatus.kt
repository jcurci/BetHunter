package com.bethunter.app.vpn

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Log

/**
 * Checagem compartilhada (módulo RN + workers) de VPN ativa via TRANSPORT_VPN.
 */
object VpnStatus {
  private const val TAG = "VpnStatus"

  fun isVpnActive(context: Context): Boolean {
    return try {
      val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
      cm.allNetworks.any { network ->
        cm.getNetworkCapabilities(network)
          ?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
      }
    } catch (e: Exception) {
      Log.w(TAG, "Could not check VPN running state: ${e.message}")
      false
    }
  }
}
