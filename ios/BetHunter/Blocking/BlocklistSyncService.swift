import Foundation
import BackgroundTasks
import os

/// Baixa a blocklist e reconstrói o índice.
///
/// Paridade com `BlocklistManager.kt` (Android): ETag condicional, 3 tentativas
/// com backoff, checagem de truncamento e guarda de encolhimento suspeito — tudo
/// que faltava aqui.
///
/// A normalização foi extraída para `DomainNormalizer` (compartilhado com a
/// extensão) e a gravação para `BlocklistStore`.
@available(iOS 16.0, *)
final class BlocklistSyncService {

  static let shared = BlocklistSyncService()

  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: SharedConstants.logCategoryBlocklist
  )

  private static let sourceURL =
    "https://raw.githubusercontent.com/hidekiiwasa/blacklist-cassino/main/latin_america_blacklist_bets_cassino_brazil.txt"
  private static let refreshInterval: TimeInterval = 24 * 60 * 60
  private static let requestTimeout: TimeInterval = 8   // valor do Android
  private static let maxAttempts = 3
  private static let backoffUnit: TimeInterval = 1.5

  private init() {}

  enum SyncError: Error, LocalizedError {
    case download(String)
    case noCache
    case store(BlocklistStore.StoreError)

    var errorDescription: String? {
      switch self {
      case .download(let reason): return "Falha ao baixar a lista: \(reason)"
      case .noCache: return "Sem lista disponível e sem cache."
      case .store(let error): return error.errorDescription
      }
    }
  }

  // MARK: - API pública

  /// Baixa se necessário e garante que existe um índice utilizável.
  func refreshIfNeeded(completion: @escaping (Result<Int, SyncError>) -> Void) {
    let lastFetch = AppGroupHelper.blockedDomainsLastFetch
    let hasIndex = BlocklistStore.hasUsableIndex
    let isStale = !hasIndex || Date().timeIntervalSince1970 - lastFetch >= Self.refreshInterval

    guard isStale else {
      completion(.success(BlocklistStore.count))
      return
    }

    download(attempt: 1) { [weak self] result in
      guard let self else { return }
      switch result {
      case .success(.notModified):
        // 304: o conteúdo é o mesmo. Só renova o carimbo, sem reescrever o índice.
        AppGroupHelper.blockedDomainsLastFetch = Date().timeIntervalSince1970
        self.log.info("Blocklist inalterada (304)")
        completion(.success(BlocklistStore.count))

      case .success(.body(let text, let etag)):
        switch BlocklistStore.rebuildIndex(from: text) {
        case .success(let count):
          // O ETag só é gravado DEPOIS de o corpo ser validado e o índice
          // reconstruído. Gravar antes faria o próximo request receber 304 de um
          // conteúdo que nunca chegou inteiro, fixando o app numa lista
          // truncada para sempre. (O comentário equivalente no
          // BlocklistManager.kt:126-129 é load-bearing pelo mesmo motivo.)
          if let etag { AppGroupHelper.blocklistETag = etag }
          AppGroupHelper.blockedDomainsLastFetch = Date().timeIntervalSince1970
          completion(.success(count))

        case .failure(let error):
          // Índice anterior é preservado. Se não havia nenhum, é falha real.
          if hasIndex {
            self.log.error("Reconstrução rejeitada (\(error.localizedDescription, privacy: .public)) — mantendo índice anterior")
            completion(.success(BlocklistStore.count))
          } else {
            completion(.failure(.store(error)))
          }
        }

      case .failure(let error):
        if hasIndex {
          self.log.notice("Download falhou, usando índice em cache")
          completion(.success(BlocklistStore.count))
        } else {
          completion(.failure(error))
        }
      }
    }
  }

  /// Força o download ignorando o intervalo e o ETag.
  func forceRefresh(completion: @escaping (Result<Int, SyncError>) -> Void) {
    AppGroupHelper.blocklistETag = nil
    AppGroupHelper.blockedDomainsLastFetch = 0
    refreshIfNeeded(completion: completion)
  }

  // MARK: - Download

  private enum DownloadResult {
    case body(String, etag: String?)
    case notModified
  }

  private func download(
    attempt: Int,
    completion: @escaping (Result<DownloadResult, SyncError>) -> Void
  ) {
    guard let url = URL(string: Self.sourceURL) else {
      completion(.failure(.download("URL inválida")))
      return
    }

    var request = URLRequest(url: url, timeoutInterval: Self.requestTimeout)
    request.httpMethod = "GET"
    if let etag = AppGroupHelper.blocklistETag {
      request.setValue(etag, forHTTPHeaderField: "If-None-Match")
    }

    URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      guard let self else { return }

      let retry: (String) -> Void = { reason in
        if attempt < Self.maxAttempts {
          let delay = Self.backoffUnit * Double(attempt)
          self.log.notice("Tentativa \(attempt) falhou (\(reason, privacy: .public)) — nova em \(delay)s")
          DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + delay) {
            self.download(attempt: attempt + 1, completion: completion)
          }
        } else {
          completion(.failure(.download(reason)))
        }
      }

      if let error {
        retry(error.localizedDescription)
        return
      }
      guard let httpResponse = response as? HTTPURLResponse else {
        retry("resposta não-HTTP")
        return
      }
      if httpResponse.statusCode == 304 {
        completion(.success(.notModified))
        return
      }
      guard httpResponse.statusCode == 200 else {
        retry("HTTP \(httpResponse.statusCode)")
        return
      }
      guard let data, !data.isEmpty else {
        retry("corpo vazio")
        return
      }

      // Checagem de truncamento. Com gzip transparente o expectedContentLength
      // costuma vir -1, daí a guarda de > 0.
      let expected = httpResponse.expectedContentLength
      if expected > 0, Int64(data.count) < expected {
        retry("corpo truncado (\(data.count) de \(expected) bytes)")
        return
      }
      guard let text = String(data: data, encoding: .utf8) else {
        retry("corpo não é UTF-8")
        return
      }

      let etag = httpResponse.value(forHTTPHeaderField: "ETag")
      completion(.success(.body(text, etag: etag)))
    }.resume()
  }
}

// MARK: - Refresh em background

/// Mantém o índice fresco sem depender de o usuário abrir o app.
///
/// A extensão **nunca** baixa nem reconstrói a lista: 311 mil linhas num
/// orçamento de ~15 MB é jetsam garantido. Refresh é sempre no app.
/// Consequência assumida: um usuário que nunca abrir o app fica com lista velha —
/// aceitável, já que o propósito do app é justamente trazê-lo de volta.
@available(iOS 16.0, *)
enum BlocklistRefreshTask {
  static let identifier = "com.bethunter.app.blocklistRefresh"
  private static let interval: TimeInterval = 24 * 60 * 60

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
    request.earliestBeginDate = Date(timeIntervalSinceNow: interval)
    try? BGTaskScheduler.shared.submit(request)
  }

  static func cancel() {
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
  }

  private static func handle(_ task: BGAppRefreshTask) {
    scheduleNext()

    guard SharedConstants.defaults?.bool(forKey: SharedConstants.Keys.protectionEnabled) == true else {
      task.setTaskCompleted(success: true)
      return
    }

    var finished = false
    task.expirationHandler = {
      guard !finished else { return }
      finished = true
      task.setTaskCompleted(success: false)
    }

    BlocklistSyncService.shared.refreshIfNeeded { result in
      guard !finished else { return }
      finished = true
      if case .success = result {
        // Pede ao provider em execução para reabrir o mmap agora, em vez de
        // esperar a checagem periódica de generation.
        TunnelController.shared.sendMessage("reloadBlocklist")
      }
      task.setTaskCompleted(success: true)
    }
  }
}
