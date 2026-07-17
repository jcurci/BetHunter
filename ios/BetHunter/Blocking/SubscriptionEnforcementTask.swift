import Foundation
import BackgroundTasks

/// Rede de segurança pra garantir que o bloqueio pare quando a assinatura
/// expira, mesmo que o app JS nunca seja reaberto. O webhook do RevenueCat +
/// a checagem em foreground (App.tsx) cobrem o caminho principal — essa task
/// cobre o caso de webhook perdido / app abandonado.
///
/// Limitação conhecida: BGAppRefreshTask é oportunista — o iOS decide se/quando
/// roda, sem garantia de intervalo. Aceito conscientemente (ver plano).
enum SubscriptionEnforcementTask {
  static let identifier = "com.bethunter.app.subscriptionCheck"
  private static let checkInterval: TimeInterval = 8 * 60 * 60 // 8h, mesmo intervalo do Android

  static func register() {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: nil) { task in
      guard let refreshTask = task as? BGAppRefreshTask else {
        task.setTaskCompleted(success: false)
        return
      }
      handle(refreshTask)
    }
  }

  static func scheduleNext() {
    let request = BGAppRefreshTaskRequest(identifier: identifier)
    request.earliestBeginDate = Date(timeIntervalSinceNow: checkInterval)
    do {
      try BGTaskScheduler.shared.submit(request)
    } catch {
      print("[SubscriptionEnforcementTask] Failed to schedule: \(error)")
    }
  }

  static func cancel() {
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
  }

  private static func handle(_ task: BGAppRefreshTask) {
    // BGTaskScheduler não é recorrente — reagenda a próxima execução já de cara.
    scheduleNext()

    guard #available(iOS 16.0, *), AppGroupHelper.isProtectionEnabled else {
      task.setTaskCompleted(success: true)
      return
    }

    guard let token = AuthSessionKeychain.loadToken(),
          let baseUrl = AppGroupHelper.apiBaseUrl,
          let url = URL(string: "\(baseUrl)/users/subscription-status")
    else {
      task.setTaskCompleted(success: true)
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.timeoutInterval = 15

    let session = URLSession(configuration: .default)
    let dataTask = session.dataTask(with: request) { data, response, error in
      defer { task.setTaskCompleted(success: true) }

      guard error == nil,
            let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200,
            let data = data,
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let isPremium = json["isPremium"] as? Bool
      else {
        // Erro de rede/401/resposta ambígua — nunca derruba a proteção no escuro.
        return
      }

      if !isPremium {
        BlockingManager.shared.removeBlocking()
        AppGroupHelper.isProtectionEnabled = false
        cancel()
      }
    }

    task.expirationHandler = {
      dataTask.cancel()
    }
    dataTask.resume()
  }
}
