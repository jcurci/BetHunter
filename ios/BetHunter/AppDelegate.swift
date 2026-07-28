import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
#if DEBUG
    Self.ensureBundleURLProvider()
#endif

    // Precisam ser registradas antes desse método retornar (exigência da Apple).
    if #available(iOS 16.0, *) {
      SubscriptionEnforcementTask.register()
      BlocklistRefreshTask.register()

      // Remove o array legado de ~300 mil strings do UserDefaults do App Group.
      // Instalações antigas têm essa chave, e o plist inteiro é re-serializado a
      // cada acesso ao suite — inclusive dentro da extensão, com 15 MB de teto.
      BlocklistStore.migrateLegacyStorage()
    }

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  /// Reconcilia o estado real do túnel com a intenção do usuário sempre que o
  /// app volta ao primeiro plano. Cobre o caso que o on-demand não cobre: o
  /// usuário ter apagado o perfil de VPN em Ajustes.
  public override func applicationDidBecomeActive(_ application: UIApplication) {
    super.applicationDidBecomeActive(application)
    if #available(iOS 16.0, *) {
      TunnelHealthMonitor.shared.reconcile { _ in }
      TunnelHealthMonitor.shared.checkDegradedState()
    }
  }

  /// Garante que RCTBundleURLProvider tem um host configurado antes do RN arrancar.
  /// Evita que jsBundleURL(forBundleRoot:) devolva nil em qualquer code-path.
  private static func ensureBundleURLProvider() {
    let settings = RCTBundleURLProvider.sharedSettings()
    let current = settings.jsLocation ?? ""
    if !current.isEmpty { return }

#if targetEnvironment(simulator)
    settings.jsLocation = "127.0.0.1"
#else
    if let ip = metroHostFromIpFile() {
      settings.jsLocation = ip
    }
#endif
  }

  private static func metroHostFromIpFile() -> String? {
    guard let path = Bundle.main.path(forResource: "ip", ofType: "txt"),
          let raw = try? String(contentsOfFile: path, encoding: .utf8) else { return nil }
    let ip = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    return ip.isEmpty ? nil : ip
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    if let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry") {
      return url
    }
    // Fallback: RCTBundleURLProvider devolveu nil (Metro não detetado).
    // Devolver URL não-nil evita RCTFatal; o app mostra "Could not connect" recuperável.
    let host: String
#if targetEnvironment(simulator)
    host = "127.0.0.1"
#else
    host = Self.metroHostFromIpFile() ?? "127.0.0.1"
#endif
    return URL(string: "http://\(host):8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true")!
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  private static func metroHostFromIpFile() -> String? {
    guard let path = Bundle.main.path(forResource: "ip", ofType: "txt"),
          let raw = try? String(contentsOfFile: path, encoding: .utf8) else { return nil }
    let ip = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    return ip.isEmpty ? nil : ip
  }
}
