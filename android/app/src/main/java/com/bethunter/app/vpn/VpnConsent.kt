package com.bethunter.app.vpn

import android.content.Context
import android.net.VpnService
import android.util.Log
import com.bethunter.app.diagnostics.VpnEventLog
import com.bethunter.app.repository.BlockedDomainsRepository

/**
 * Consentimento da VPN, com o `VpnService.prepare()` do sistema como ÚNICA fonte
 * de verdade — a flag `revoked` do banco é só cache.
 *
 * Existe porque os três pontos que decidem religar a proteção (start cego do
 * serviço, VpnHealthWorker e o sync do módulo RN) testavam
 * `isRevoked() || prepare() != null`. A flag é pegajosa: basta um `prepare()`
 * não-nulo transitório — a janela de atualização do app derruba o processo `:vpn`
 * e o serviço é resubido pelo MY_PACKAGE_REPLACED bem nesse intervalo — para ela
 * ficar gravada. Depois disso o primeiro termo do `||` continuava verdadeiro
 * mesmo com o consentimento de volta, então NENHUMA recuperação automática
 * disparava: nem o health check de 15 min, nem a reabertura do app. A proteção só
 * voltava com o usuário reativando na mão.
 *
 * Consultar o sistema e limpar a flag quando ele diz que está tudo certo faz a
 * recuperação voltar a ser automática, sem afrouxar o caso real: se outra VPN
 * assumiu ou o usuário desligou em Configurações, `prepare()` continua não-nulo e
 * a reativação segue exigindo a Activity.
 */
object VpnConsent {
  private const val TAG = "VpnConsent"

  /**
   * true se dá para chamar `establish()` agora. Como efeito colateral deliberado,
   * limpa a flag `revoked` quando o sistema confirma que o consentimento existe.
   */
  fun hasConsent(context: Context, repository: BlockedDomainsRepository): Boolean {
    val prepared = try {
      VpnService.prepare(context) == null
    } catch (e: Exception) {
      // Falha ao CONSULTAR não é prova de revogação. Cai no último estado
      // conhecido em vez de inventar uma negativa.
      Log.w(TAG, "prepare() failed: ${e.message}")
      return !repository.isRevoked()
    }

    if (!prepared) return false

    if (repository.isRevoked()) {
      repository.setRevoked(false)
      VpnEventLog.log(context, "consent_flag_cleared")
      Log.i(TAG, "Consent confirmed by system — clearing stale revoked flag")
    }
    return true
  }
}
