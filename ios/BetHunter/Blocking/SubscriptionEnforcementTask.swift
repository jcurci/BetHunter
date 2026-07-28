import Foundation
import BackgroundTasks
import os

/// Rede de segurança para pausar o bloqueio quando a assinatura expira, mesmo que
/// o app JS nunca seja reaberto. O webhook do RevenueCat + a checagem em
/// foreground cobrem o caminho principal; esta task cobre webhook perdido e app
/// abandonado.
///
/// Porta de `SubscriptionEnforcementWorker.kt` (commit 99f718b2). A versão
/// anterior confiava num `isPremium: false` cru e chamava `removeBlocking()` de
/// forma irreversível — exatamente o bug que o Android já tinha corrigido. Duas
/// mudanças:
///
///   1. Exige `verified: true` do backend. Ausência de informação nunca é prova
///      de não-assinatura.
///   2. **Pausa** em vez de remover, preservando a intenção do usuário para poder
///      religar sozinho quando a assinatura voltar.
///
/// Limitação conhecida: BGAppRefreshTask é oportunista — o iOS decide se e quando
/// roda, sem garantia de intervalo. Assumido conscientemente.
@available(iOS 16.0, *)
enum SubscriptionEnforcementTask {

  static let identifier = "com.bethunter.app.subscriptionCheck"
  private static let checkInterval: TimeInterval = 8 * 60 * 60  // igual ao Android

  private static let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: "SubscriptionEnforcement"
  )

  /// Resultado da consulta ao backend.
  ///
  /// `unknown` cobre erro de rede, status != 200, JSON malformado **e**
  /// `verified != true`. Só `expired` derruba a proteção.
  enum PremiumCheck {
    case active
    case expired
    case unknown
  }

  // MARK: - Agendamento

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
      log.error("Falha ao agendar: \(error.localizedDescription, privacy: .public)")
    }
  }

  static func cancel() {
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
  }

  // MARK: - Execução

  private static func handle(_ task: BGAppRefreshTask) {
    // BGTaskScheduler não é recorrente — reagenda já de cara.
    scheduleNext()

    // Roda mesmo com a proteção pausada: é assim que ela volta sozinha quando a
    // assinatura é renovada.
    guard SharedConstants.defaults?.bool(forKey: SharedConstants.Keys.protectionEnabled) == true else {
      task.setTaskCompleted(success: true)
      return
    }

    var finished = false
    let complete: (Bool) -> Void = { success in
      guard !finished else { return }
      finished = true
      task.setTaskCompleted(success: success)
    }

    let dataTask = checkPremium { result in
      switch result {
      case .active:
        if BlockingManager.shared.isPremiumPaused {
          log.notice("Assinatura ativa de novo — retomando proteção")
          BlockingManager.shared.resumeAfterSubscriptionRenewed { _ in complete(true) }
          return
        }
        complete(true)

      case .expired:
        log.notice("Assinatura expirada e verificada — pausando proteção")
        // Pausa, NÃO remove: protectionEnabled continua true e a task continua
        // agendada, então a renovação religa tudo sem o usuário fazer nada.
        BlockingManager.shared.pauseForExpiredSubscription()
        complete(true)

      case .unknown:
        // Nada. Ausência de informação não é prova de não-assinatura, e derrubar
        // a proteção no escuro é o pior erro possível num app de autoexclusão.
        log.info("Status de assinatura indeterminado — nenhuma ação")
        complete(true)
      }
    }

    task.expirationHandler = {
      dataTask?.cancel()
      complete(false)
    }
  }

  /// Consulta `GET {baseUrl}/users/subscription-status`.
  @discardableResult
  private static func checkPremium(completion: @escaping (PremiumCheck) -> Void) -> URLSessionDataTask? {
    guard let token = AuthSessionKeychain.loadToken(),
          let baseUrl = AppGroupHelper.apiBaseUrl,
          let url = URL(string: "\(baseUrl)/users/subscription-status")
    else {
      // Sem sessão sincronizada não dá para verificar nada.
      completion(.unknown)
      return nil
    }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.timeoutInterval = 15

    let task = URLSession(configuration: .default).dataTask(with: request) { data, response, error in
      guard error == nil,
            let httpResponse = response as? HTTPURLResponse,
            httpResponse.statusCode == 200,
            let data,
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
      else {
        completion(.unknown)
        return
      }

      // Um backend que não manda `verified` conta como NÃO verificado. Isso é
      // deliberadamente conservador: preferimos manter alguém bloqueado a mais
      // do que desbloquear por engano.
      guard json["verified"] as? Bool == true else {
        completion(.unknown)
        return
      }
      guard let isPremium = json["isPremium"] as? Bool else {
        completion(.unknown)
        return
      }
      completion(isPremium ? .active : .expired)
    }
    task.resume()
    return task
  }
}
