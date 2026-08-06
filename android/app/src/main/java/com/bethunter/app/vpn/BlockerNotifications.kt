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
import com.bethunter.app.repository.BlockedDomainsRepository

/**
 * Notificações de alerta do bloqueador (fora da notificação persistente do FGS).
 * Usadas quando o sistema derruba/revoga a VPN e a reativação depende do usuário —
 * o toque abre a MainActivity, que pode re-pedir o consentimento via VpnService.prepare().
 */
object BlockerNotifications {
  private const val ALERT_CHANNEL_ID = "betblocker_alerts"
  private const val REACTIVATION_NOTIF_ID = 43
  const val EXTRA_REACTIVATE_VPN = "bethunter_reactivate_vpn"

  /**
   * @param throttleMs quando > 0, não re-posta se o último alerta saiu há menos que
   * isso. Existe para os caminhos que podem repetir sozinhos (start recusado por
   * licença, health check periódico): sem o freio, um ciclo de start/stop
   * transformava o alerta num aviso piscando de segundo em segundo. Caminhos
   * disparados por ação do usuário passam 0 e continuam imediatos.
   */
  fun showReactivationNotification(
    context: Context,
    title: String,
    text: String,
    throttleMs: Long = 0L,
  ) {
    if (throttleMs > 0L) {
      val repository = BlockedDomainsRepository(context.applicationContext)
      val last = repository.getLastReactivationNoticeAt()
      val now = System.currentTimeMillis()
      // `last > now` = relógio do aparelho andou para trás; trata como vencido.
      if (last in 1..now && now - last < throttleMs) return
      repository.setLastReactivationNoticeAt(now)
    }
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
