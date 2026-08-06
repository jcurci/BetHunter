package com.bethunter.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.vpn.BetBlockerVpnService
import com.bethunter.app.vpn.BlockerNotifications
import com.bethunter.app.work.BlocklistRefreshWorker
import com.bethunter.app.work.SubscriptionEnforcementWorker
import com.bethunter.app.work.VpnHealthWorker

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != Intent.ACTION_BOOT_COMPLETED &&
        action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    val repo = BlockedDomainsRepository(context)
    if (repo.isBlockingEnabled()) {
      VpnEventLog.log(context, "boot_receiver:$action")

      // Os workers são agendados mesmo sem premium: são eles que confirmam a
      // assinatura e religam a proteção sozinhos quando ela volta.
      BlocklistRefreshWorker.schedule(context)
      VpnHealthWorker.schedule(context)
      if (repo.getAuthToken() != null) {
        SubscriptionEnforcementWorker.schedule(context)
      }

      // `isBlockingEnabled` continua true durante a pausa por assinatura, então
      // sem esta checagem reiniciar o aparelho ressuscitava o bloqueio de quem
      // não é mais assinante.
      // Licença vencida só barra o boot quando a cortesia também acabou — senão
      // um assinante que ficou sem contato conosco perderia a proteção justamente
      // ao reiniciar o aparelho (ver consumeLeaseGrace).
      if (repo.isPremiumPaused() || (!repo.isPremiumLeaseValid() && !repo.hasLeaseGraceAvailable())) {
        VpnEventLog.log(context, "boot_skipped_no_premium")
        return
      }

      try {
        ContextCompat.startForegroundService(
          context,
          Intent(context, BetBlockerVpnService::class.java)
        )
      } catch (e: Exception) {
        // Nunca crashar um receiver. Antes isto só logava e a proteção ficava
        // caída até a próxima janela periódica (15 min) ou até o usuário abrir o
        // app — o caso clássico é a atualização do app, em que o start pode ser
        // recusado na janela do MY_PACKAGE_REPLACED. Enfileira a recuperação
        // rápida e avisa, em vez de esperar em silêncio.
        Log.w("BootReceiver", "Could not start VPN service on boot: ${e.message}")
        VpnEventLog.log(context, "boot_start_failed:${e.javaClass.simpleName}")
        VpnHealthWorker.enqueueExpeditedCheck(context)
        BlockerNotifications.showReactivationNotification(
          context,
          "Proteção interrompida",
          "Não foi possível retomar o bloqueio automaticamente. Toque para restaurar."
        )
      }
    }
  }
}
