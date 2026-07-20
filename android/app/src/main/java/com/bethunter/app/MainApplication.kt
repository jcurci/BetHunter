package com.bethunter.app

import android.app.Application
import android.app.ActivityManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.os.Process
import android.util.Log

import androidx.work.Configuration as WorkManagerConfiguration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import com.bethunter.app.reactnative.BetBlockerPackage

class MainApplication : Application(), ReactApplication, WorkManagerConfiguration.Provider {

  // Init on-demand do WorkManager, válida em TODOS os processos (inclusive :vpn).
  // O InitializationProvider padrão (androidx.startup) só instancia no processo
  // principal, então workers agendados de dentro do BetBlockerVpnService (:vpn)
  // falhavam com "WorkManager is not initialized properly". O inicializador padrão
  // é removido no AndroidManifest para esta config on-demand assumir.
  override val workManagerConfiguration: WorkManagerConfiguration
    get() = WorkManagerConfiguration.Builder()
      .setMinimumLoggingLevel(if (BuildConfig.DEBUG) Log.DEBUG else Log.INFO)
      .build()

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
              add(BetBlockerPackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    // O BetBlockerVpnService roda no processo :vpn (isolado da UI). onCreate roda em
    // TODO processo — aqui pulamos a inicialização do React Native/expo no :vpn:
    // a VPN não precisa de RN, e não subir RN economiza memória e mantém a VPN
    // imune a crashes da camada JS/UI.
    if (!isMainProcess()) return

    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    if (!isMainProcess()) return
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }

  /** true no processo principal (packageName); false no processo ":vpn". */
  private fun isMainProcess(): Boolean {
    val processName = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      getProcessName()
    } else {
      val pid = Process.myPid()
      val am = getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
      am?.runningAppProcesses?.firstOrNull { it.pid == pid }?.processName
    }
    // Se não der para determinar, assume principal (default seguro: init completa).
    return processName == null || processName == packageName
  }
}
