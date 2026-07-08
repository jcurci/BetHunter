package com.bethunter.app.vpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.bethunter.app.MainActivity
import com.bethunter.app.R

/**
 * Notificações de alerta do bloqueador (fora da notificação persistente do FGS).
 * Usadas quando o sistema derruba/revoga a VPN e a reativação depende do usuário —
 * o toque abre a MainActivity, que pode re-pedir o consentimento via VpnService.prepare().
 */
object BlockerNotifications {
  private const val ALERT_CHANNEL_ID = "betblocker_alerts"
  private const val REACTIVATION_NOTIF_ID = 43
  const val EXTRA_REACTIVATE_VPN = "bethunter_reactivate_vpn"

  fun showReactivationNotification(context: Context, title: String, text: String) {
    try {
      val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
          ALERT_CHANNEL_ID,
          "Alertas do BetBlocker",
          NotificationManager.IMPORTANCE_HIGH
        )
        nm.createNotificationChannel(channel)
      }

      val contentIntent = Intent(context, MainActivity::class.java).apply {
        putExtra(EXTRA_REACTIVATE_VPN, true)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      }
      val pi = PendingIntent.getActivity(
        context,
        1,
        contentIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      val notification = NotificationCompat.Builder(context, ALERT_CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(text)
        .setStyle(NotificationCompat.BigTextStyle().bigText(text))
        .setContentIntent(pi)
        .setAutoCancel(true)
        .setCategory(NotificationCompat.CATEGORY_ERROR)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .build()

      nm.notify(REACTIVATION_NOTIF_ID, notification)
    } catch (_: Exception) {}
  }

  fun cancelReactivationNotification(context: Context) {
    try {
      val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      nm.cancel(REACTIVATION_NOTIF_ID)
    } catch (_: Exception) {}
  }
}
