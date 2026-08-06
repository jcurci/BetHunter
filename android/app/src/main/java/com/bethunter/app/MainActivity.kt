package com.bethunter.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.view.WindowCompat

import com.bethunter.app.repository.BlockedDomainsRepository
import com.bethunter.app.vpn.BlockerNotifications

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    WindowCompat.setDecorFitsSystemWindows(window, false)
    captureReactivationRequest(intent)
  }

  /**
   * `launchMode=singleTask`: com o app já aberto, o toque na notificação chega
   * aqui e NÃO pelo onCreate. Sem este override o pedido de reativação se perdia
   * exatamente no caso mais comum (usuário volta ao app que já estava em memória).
   */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    captureReactivationRequest(intent)
  }

  /**
   * A notificação "toque para reativar" só conseguia abrir o app — o extra que ela
   * carrega não era lido por ninguém, e o usuário caía na Home tendo que descobrir
   * sozinho onde reativar. Aqui o pedido é apenas REGISTRADO; quem o executa é a
   * Home, porque reativar exige o `VpnService.prepare()` pela jornada guiada.
   */
  private fun captureReactivationRequest(intent: Intent?) {
    if (intent?.getBooleanExtra(BlockerNotifications.EXTRA_REACTIVATE_VPN, false) != true) return
    try {
      BlockedDomainsRepository(applicationContext).setReactivationRequested(true)
      // Consumido: sem isto, toda rotação de tela ou volta do multitarefa reabriria
      // a jornada a partir do mesmo intent guardado pela Activity.
      intent.removeExtra(BlockerNotifications.EXTRA_REACTIVATE_VPN)
    } catch (e: Exception) {
      Log.w("MainActivity", "Could not record reactivation request: ${e.message}")
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
