import Foundation
import Network
import os

/// Encaminhamento de queries DNS para os resolvers upstream.
///
/// O `DNSProxyProvider` antigo criava uma `NWUDPSession` **por datagrama** e a
/// cancelava depois de uma resposta. Aqui há uma `NWConnection` UDP longeva por
/// upstream, com `receiveMessage` sempre armado.
///
/// **O remapeamento de transaction ID é o que torna o pooling seguro.**
/// Multiplexar várias queries de clientes diferentes num único socket faz os
/// txids colidirem — duas queries simultâneas com o mesmo ID e a resposta iria
/// para o cliente errado. Ao enviar, sobrescrevemos o ID pelo nosso, monotônico;
/// ao receber, restauramos o do cliente. De quebra, isso endurece contra spoofing
/// off-path.
final class UpstreamResolver {

  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: SharedConstants.logCategoryTunnel
  )

  private struct Pending {
    let clientTransactionID: UInt16
    let reply: ([UInt8]) -> Void
    let deadline: Date
    let upstream: String
    let query: [UInt8]
    let retried: Bool
  }

  private let queue: DispatchQueue
  private var connections: [String: NWConnection] = [:]
  private var connectionFailureUntil: [String: Date] = [:]
  private var pending: [UInt16: Pending] = [:]
  private var nextTransactionID: UInt16 = .random(in: 0...UInt16.max)
  private var sweepTimer: DispatchSourceTimer?

  private static let queryTimeout: TimeInterval = 4
  private static let maxPending = 512
  private static let connectionBackoff: TimeInterval = 0.25

  /// Chamado a cada resposta recebida ou timeout, para alimentar o disjuntor.
  var onResult: ((Bool) -> Void)?

  init(queue: DispatchQueue) {
    self.queue = queue
    startSweepTimer()
  }

  deinit {
    sweepTimer?.cancel()
  }

  // MARK: - Envio

  /// Encaminha uma query e chama `reply` com a resposta, já com o transaction ID
  /// do cliente restaurado.
  func forward(query: [UInt8], preferIPv6: Bool, reply: @escaping ([UInt8]) -> Void) {
    guard query.count >= 2 else { return }
    let clientID = DNSMessage.transactionID(of: query[...]) ?? 0
    let upstream = primaryUpstream(preferIPv6: preferIPv6)
    send(query: query, clientID: clientID, to: upstream, reply: reply, isRetry: false)
  }

  private func send(
    query: [UInt8], clientID: UInt16, to upstream: String,
    reply: @escaping ([UInt8]) -> Void, isRetry: Bool
  ) {
    // Limite de memória: uma enxurrada de queries não pode fazer o dicionário
    // crescer sem teto num processo com ~15 MB.
    if pending.count >= Self.maxPending, let oldest = pending.min(by: { $0.value.deadline < $1.value.deadline }) {
      pending.removeValue(forKey: oldest.key)
      onResult?(false)
    }

    let ourID = allocateTransactionID()
    var rewritten = query
    DNSMessage.rewriteTransactionID(&rewritten, to: ourID)

    pending[ourID] = Pending(
      clientTransactionID: clientID,
      reply: reply,
      deadline: Date().addingTimeInterval(Self.queryTimeout),
      upstream: upstream,
      query: query,
      retried: isRetry
    )

    guard let connection = connection(for: upstream) else {
      pending.removeValue(forKey: ourID)
      onResult?(false)
      return
    }

    connection.send(content: Data(rewritten), completion: .contentProcessed { [weak self] error in
      guard let self, let error else { return }
      self.queue.async {
        self.log.error("Falha ao enviar para \(upstream, privacy: .public): \(error.localizedDescription, privacy: .public)")
        self.dropConnection(upstream)
      }
    })
  }

  private func allocateTransactionID() -> UInt16 {
    // Salta IDs já em uso — com 512 pendentes num espaço de 65536 a colisão é
    // rara, mas o laço é barato e elimina a classe de bug por completo.
    var candidate = nextTransactionID
    var attempts = 0
    while pending[candidate] != nil, attempts < 1024 {
      candidate = candidate &+ 1
      attempts += 1
    }
    nextTransactionID = candidate &+ 1
    return candidate
  }

  // MARK: - Conexões

  private func primaryUpstream(preferIPv6: Bool) -> String {
    preferIPv6 ? SharedConstants.Upstream.primaryIPv6 : SharedConstants.Upstream.primaryIPv4
  }

  private func secondaryUpstream(for upstream: String) -> String {
    switch upstream {
    case SharedConstants.Upstream.primaryIPv4: return SharedConstants.Upstream.secondaryIPv4
    case SharedConstants.Upstream.primaryIPv6: return SharedConstants.Upstream.secondaryIPv6
    default: return SharedConstants.Upstream.secondaryIPv4
    }
  }

  private func connection(for upstream: String) -> NWConnection? {
    if let existing = connections[upstream] { return existing }

    // Backoff após falha: sem isto, um upstream inalcançável faria o provider
    // recriar a conexão a cada query, girando CPU à toa.
    if let until = connectionFailureUntil[upstream], Date() < until { return nil }

    let host = NWEndpoint.Host(upstream)
    guard let port = NWEndpoint.Port(rawValue: SharedConstants.Upstream.port) else { return nil }

    let parameters = NWParameters.udp
    parameters.prohibitConstrainedPaths = false
    parameters.multipathServiceType = .disabled

    let connection = NWConnection(host: host, port: port, using: parameters)
    connections[upstream] = connection

    connection.stateUpdateHandler = { [weak self] state in
      guard let self else { return }
      self.queue.async {
        switch state {
        case .failed(let error):
          self.log.error("Conexão com \(upstream, privacy: .public) falhou: \(error.localizedDescription, privacy: .public)")
          self.dropConnection(upstream)
        case .cancelled:
          self.connections.removeValue(forKey: upstream)
        default:
          break
        }
      }
    }

    // Uma mudança de caminho (Wi-Fi -> LTE) invalida o socket. Sem derrubar a
    // conexão aqui, o túnel fica "conectado" resolvendo absolutamente nada.
    connection.viabilityUpdateHandler = { [weak self] viable in
      guard let self, !viable else { return }
      self.queue.async {
        self.log.notice("Caminho inviável para \(upstream, privacy: .public) — recriando")
        self.dropConnection(upstream)
      }
    }
    connection.betterPathUpdateHandler = { [weak self] better in
      guard let self, better else { return }
      self.queue.async { self.dropConnection(upstream) }
    }

    connection.start(queue: queue)
    receiveLoop(on: connection, upstream: upstream)
    return connection
  }

  private func receiveLoop(on connection: NWConnection, upstream: String) {
    connection.receiveMessage { [weak self] data, _, _, error in
      guard let self else { return }
      self.queue.async {
        if let data, !data.isEmpty {
          self.handleResponse(Array(data))
        }
        if error != nil {
          self.dropConnection(upstream)
          return
        }
        // Re-arma o laço apenas se a conexão ainda é a corrente.
        if self.connections[upstream] === connection {
          self.receiveLoop(on: connection, upstream: upstream)
        }
      }
    }
  }

  private func handleResponse(_ response: [UInt8]) {
    guard let ourID = DNSMessage.transactionID(of: response[...]),
          let entry = pending.removeValue(forKey: ourID)
    else {
      // Resposta sem pendência: tardia demais, duplicada, ou spoof. Descarta.
      return
    }

    var restored = response
    DNSMessage.rewriteTransactionID(&restored, to: entry.clientTransactionID)
    onResult?(true)
    entry.reply(restored)
  }

  private func dropConnection(_ upstream: String) {
    if let connection = connections.removeValue(forKey: upstream) {
      connection.cancel()
    }
    connectionFailureUntil[upstream] = Date().addingTimeInterval(Self.connectionBackoff)
  }

  // MARK: - Timeouts

  private func startSweepTimer() {
    let timer = DispatchSource.makeTimerSource(queue: queue)
    timer.schedule(deadline: .now() + 1, repeating: 1)
    timer.setEventHandler { [weak self] in self?.sweepExpired() }
    timer.resume()
    sweepTimer = timer
  }

  private func sweepExpired() {
    let now = Date()
    let expired = pending.filter { $0.value.deadline <= now }
    guard !expired.isEmpty else { return }

    for (id, entry) in expired {
      pending.removeValue(forKey: id)

      if !entry.retried {
        // Uma tentativa no secundário antes de desistir.
        let fallback = secondaryUpstream(for: entry.upstream)
        send(query: entry.query, clientID: entry.clientTransactionID,
             to: fallback, reply: entry.reply, isRetry: true)
      } else {
        // Desiste em silêncio: o cliente re-tenta. Nunca responder NXDOMAIN por
        // falha de upstream — isso transformaria uma queda de rede em bloqueio
        // total da internet.
        onResult?(false)
      }
    }
  }

  // MARK: - Ciclo de vida

  /// Derruba o pool. Chamado em `wake()` (o caminho quase certamente mudou
  /// durante o sono) e em `stopTunnel`.
  func teardown() {
    sweepTimer?.cancel()
    sweepTimer = nil
    for (_, connection) in connections { connection.cancel() }
    connections.removeAll()
    connectionFailureUntil.removeAll()
    pending.removeAll()
  }

  func restart() {
    teardown()
    startSweepTimer()
  }
}
