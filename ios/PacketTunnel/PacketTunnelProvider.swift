import NetworkExtension
import os

/// Túnel local de filtragem de DNS.
///
/// Substitui o `NEDNSProxyProvider` anterior, que **nunca funcionou em nenhum
/// iPhone de consumidor**: a Apple só permite configurações de DNS Proxy em
/// aparelhos supervisionados/MDM, e `saveToPreferences` falhava com
/// `NEConfigurationErrorDomain` código 10 em qualquer aparelho pessoal.
///
/// Este provider captura **apenas DNS**. `includedRoutes` contém só as rotas de
/// host do resolver falso; a rota default fica em `excludedRoutes`. Nenhum
/// tráfego do usuário entra no túnel — o que importa para bateria, privacidade e,
/// principalmente, para a defesa na App Review: não somos uma VPN de tráfego, e
/// as rotas provam isso.
///
/// Fluxo:
///   readPackets -> parse IPv4/IPv6 + UDP -> parse DNS -> decide
///     bloqueado -> sintetiza NXDOMAIN e devolve pelo túnel
///     liberado  -> encaminha ao upstream e devolve a resposta
class PacketTunnelProvider: NEPacketTunnelProvider {

  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: SharedConstants.logCategoryTunnel
  )

  /// Uma única fila serial para o laço de pacotes e todos os callbacks de
  /// NWConnection — nenhum lock em nenhum lugar.
  private let workQueue = DispatchQueue(label: "com.bethunter.tunnel", qos: .userInitiated)

  private let index = BlocklistIndex()
  private let breaker = CircuitBreaker()
  private lazy var resolver: UpstreamResolver = {
    let resolver = UpstreamResolver(queue: workQueue)
    resolver.onResult = { [weak self] success in
      success ? self?.breaker.recordSuccess() : self?.breaker.recordFailure()
    }
    return resolver
  }()

  private var isRunning = false

  #if DEBUG
  /// Diagnóstico só de build de debug.
  ///
  /// `queriesSeen` é o **portão da Fase 1**: se ele fica em zero enquanto você
  /// navega, o iOS não está entregando o DNS ao resolver falso e toda a
  /// arquitetura precisa ser reavaliada antes de qualquer outra coisa. Ver
  /// docs/APP_REVIEW_NOTES.md §4.
  private var queriesSeen = 0
  private var queriesBlocked = 0
  #endif

  // MARK: - Ciclo de vida

  override func startTunnel(
    options: [String: NSObject]?,
    completionHandler: @escaping (Error?) -> Void
  ) {
    // Um IP que seja ao mesmo tempo blackhole e upstream deixaria o túnel
    // incapaz de resolver qualquer coisa. Registrar aqui é muito melhor que
    // virar um bug de campo indecifrável.
    let collisions = DoHEndpoints.validateNoUpstreamCollision()
    if !collisions.isEmpty {
      log.fault("Upstream também está no blackhole: \(collisions, privacy: .public)")
    }

    index.reload()
    breaker.forcedPassthrough = false
    log.notice("Iniciando túnel — índice com \(self.index.count) domínios (fallback: \(self.index.usingFallback))")

    setTunnelNetworkSettings(makeNetworkSettings()) { [weak self] error in
      guard let self else { return }
      if let error {
        self.log.error("setTunnelNetworkSettings falhou: \(error.localizedDescription, privacy: .public)")
        completionHandler(error)
        return
      }
      SharedConstants.defaults?.set(
        Date().timeIntervalSince1970, forKey: SharedConstants.Keys.tunnelLastStart
      )
      self.isRunning = true
      self.workQueue.async { self.readLoop() }
      completionHandler(nil)
    }
  }

  override func stopTunnel(
    with reason: NEProviderStopReason,
    completionHandler: @escaping () -> Void
  ) {
    log.notice("Parando túnel: \(String(describing: reason), privacy: .public)")
    isRunning = false
    // A NE mata o processo se stopTunnel demorar. Derruba o pool e devolve já.
    workQueue.async { [weak self] in self?.resolver.teardown() }
    completionHandler()
  }

  override func sleep(completionHandler: @escaping () -> Void) {
    workQueue.async { [weak self] in
      self?.resolver.teardown()
      completionHandler()
    }
  }

  override func wake() {
    workQueue.async { [weak self] in
      guard let self else { return }
      // O caminho de rede quase certamente mudou durante o sono, e o app pode
      // ter reconstruído o índice.
      self.resolver.restart()
      self.index.reloadIfNeeded()
    }
  }

  /// Mensagens vindas do app: kill switch remoto e refresh de índice.
  override func handleAppMessage(_ messageData: Data, completionHandler: ((Data?) -> Void)?) {
    guard let command = String(data: messageData, encoding: .utf8) else {
      completionHandler?(nil)
      return
    }
    workQueue.async { [weak self] in
      guard let self else { return }
      switch command {
      case "reloadBlocklist":
        self.index.reload()
        completionHandler?("ok:\(self.index.count)".data(using: .utf8))
      case "passthroughOn":
        self.breaker.forcedPassthrough = true
        completionHandler?("ok".data(using: .utf8))
      case "passthroughOff":
        self.breaker.forcedPassthrough = false
        completionHandler?("ok".data(using: .utf8))
      case "status":
        let status = "filtering=\(self.breaker.shouldFilter) "
          + "count=\(self.index.count) fallback=\(self.index.usingFallback)"
        completionHandler?(status.data(using: .utf8))
      default:
        completionHandler?(nil)
      }
    }
  }

  // MARK: - Configuração de rede

  private func makeNetworkSettings() -> NEPacketTunnelNetworkSettings {
    let settings = NEPacketTunnelNetworkSettings(
      tunnelRemoteAddress: SharedConstants.Tunnel.remoteAddress
    )
    settings.mtu = SharedConstants.Tunnel.mtu

    // IPv4 — só o resolver falso e os IPs de DoH entram no túnel.
    let ipv4 = NEIPv4Settings(
      addresses: [SharedConstants.Tunnel.ipv4Address],
      subnetMasks: [SharedConstants.Tunnel.ipv4SubnetMask]
    )
    var ipv4Routes = [
      NEIPv4Route(
        destinationAddress: SharedConstants.Tunnel.ipv4DNSServer,
        subnetMask: "255.255.255.255"
      )
    ]
    ipv4Routes += DoHEndpoints.blackholeIPv4.map {
      NEIPv4Route(destinationAddress: $0.address, subnetMask: $0.mask)
    }
    ipv4.includedRoutes = ipv4Routes
    // Explícito de propósito: deixa claro na tabela de rotas, e para quem
    // auditar o app, que o tráfego do usuário não passa por aqui.
    ipv4.excludedRoutes = [NEIPv4Route.default()]
    settings.ipv4Settings = ipv4

    let ipv6 = NEIPv6Settings(
      addresses: [SharedConstants.Tunnel.ipv6Address],
      networkPrefixLengths: [SharedConstants.Tunnel.ipv6PrefixLength]
    )
    var ipv6Routes = [
      NEIPv6Route(
        destinationAddress: SharedConstants.Tunnel.ipv6DNSServer,
        networkPrefixLength: 128
      )
    ]
    ipv6Routes += DoHEndpoints.blackholeIPv6.map {
      NEIPv6Route(
        destinationAddress: $0.address,
        networkPrefixLength: NSNumber(value: $0.prefixLength)
      )
    }
    ipv6.includedRoutes = ipv6Routes
    ipv6.excludedRoutes = [NEIPv6Route.default()]
    settings.ipv6Settings = ipv6

    let dns = NEDNSSettings(servers: [
      SharedConstants.Tunnel.ipv4DNSServer,
      SharedConstants.Tunnel.ipv6DNSServer,
    ])
    // [""] é a sentinela documentada de "casa com todo domínio". Sem ela, com a
    // rota default excluída, estes servidores só valeriam se o túnel fosse dono
    // da rota default — que deliberadamente ele não é — e TODA query escaparia.
    dns.matchDomains = [""]
    dns.matchDomainsNoSearch = true
    settings.dnsSettings = dns

    return settings
  }

  // MARK: - Laço de pacotes

  private func readLoop() {
    packetFlow.readPackets { [weak self] packets, protocols in
      guard let self, self.isRunning else { return }
      self.workQueue.async {
        self.handle(packets: packets, protocols: protocols)
        self.readLoop()   // re-arma de forma assíncrona: a pilha não cresce
      }
    }
  }

  private func handle(packets: [Data], protocols: [NSNumber]) {
    var immediateResponses: [Data] = []
    var immediateProtocols: [NSNumber] = []

    for (offset, packetData) in packets.enumerated() {
      let protocolNumber = offset < protocols.count ? protocols[offset] : NSNumber(value: AF_INET)
      let packet = [UInt8](packetData)

      guard let datagram = IPPacket.parseUDP(packet) else {
        // Não é UDP, ou é fragmento. Se veio pelo túnel e não é DNS, é uma rota
        // blackhole — descartar é exatamente o comportamento desejado.
        continue
      }
      guard datagram.destinationPort == IPPacket.dnsPort else { continue }

      guard let query = DNSMessage.parseQuery(datagram.payload) else {
        // Mensagem DNS que não conseguimos entender: encaminha verbatim em vez
        // de descartar, para não quebrar um cliente exótico mas legítimo.
        forward(datagram: datagram, rawQuery: Array(datagram.payload), query: nil)
        continue
      }

      let blocked = breaker.shouldFilter && index.shouldBlock(domainBytes: query.name)

      #if DEBUG
      queriesSeen += 1
      if blocked { queriesBlocked += 1 }
      // O nome consultado só aparece em DEBUG. Build de release não registra
      // absolutamente nada sobre o que o usuário acessa — é o que sustenta a
      // afirmação de privacidade nas notas de review.
      log.debug("""
        DNS #\(self.queriesSeen) \(datagram.version == .v6 ? "v6" : "v4") \
        \(String(decoding: query.name, as: UTF8.self), privacy: .public) \
        qtype=\(query.qtype) -> \(blocked ? "NXDOMAIN" : "forward") \
        (bloqueadas: \(self.queriesBlocked))
        """)
      #endif

      if blocked {
        let response = DNSMessage.buildNXDOMAIN(for: query)
        if let responsePacket = IPPacket.buildUDPResponse(
          to: datagram, payload: response, mtu: SharedConstants.Tunnel.mtu.intValue
        ) {
          immediateResponses.append(Data(responsePacket))
          immediateProtocols.append(protocolNumber)
        }
      } else {
        forward(datagram: datagram, rawQuery: Array(datagram.payload), query: query)
      }
    }

    if !immediateResponses.isEmpty {
      packetFlow.writePackets(immediateResponses, withProtocols: immediateProtocols)
    }

    // Canário: com o disjuntor aberto, uma consulta periódica testa se o
    // upstream voltou.
    if breaker.shouldProbe() {
      breaker.markProbeSent()
      sendProbe()
    }
  }

  private func forward(datagram: IPPacket.UDPDatagram, rawQuery: [UInt8], query: DNSMessage.Query?) {
    let preferIPv6 = datagram.version == .v6
    let protocolNumber = NSNumber(value: preferIPv6 ? AF_INET6 : AF_INET)
    let mtu = SharedConstants.Tunnel.mtu.intValue

    resolver.forward(query: rawQuery, preferIPv6: preferIPv6) { [weak self] response in
      guard let self else { return }

      if let responsePacket = IPPacket.buildUDPResponse(to: datagram, payload: response, mtu: mtu) {
        self.packetFlow.writePackets([Data(responsePacket)], withProtocols: [protocolNumber])
        return
      }

      // A resposta não cabe na MTU. Emitir um pacote maior seria descartado e a
      // query ficaria pendurada até o timeout do cliente; com TC=1 o cliente
      // re-tenta imediatamente por TCP/53.
      guard let query,
            let truncatedPacket = IPPacket.buildUDPResponse(
              to: datagram, payload: DNSMessage.buildTruncated(for: query), mtu: mtu
            )
      else { return }
      self.packetFlow.writePackets([Data(truncatedPacket)], withProtocols: [protocolNumber])
    }
  }

  /// Query canário (`dns.quad9.net` A) usada para fechar o disjuntor quando o
  /// upstream volta a responder.
  private func sendProbe() {
    var probe: [UInt8] = []
    probe.append(contentsOf: [0x00, 0x00])  // transaction ID (remapeado no resolver)
    probe.append(contentsOf: [0x01, 0x00])  // flags: RD = 1
    probe.append(contentsOf: [0x00, 0x01])  // QDCOUNT = 1
    probe.append(contentsOf: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    for label in ["dns", "quad9", "net"] {
      probe.append(UInt8(label.utf8.count))
      probe.append(contentsOf: Array(label.utf8))
    }
    probe.append(0x00)
    probe.append(contentsOf: [0x00, 0x01])  // QTYPE = A
    probe.append(contentsOf: [0x00, 0x01])  // QCLASS = IN

    resolver.forward(query: probe, preferIPv6: false) { _ in
      // A resposta em si não interessa: o UpstreamResolver já chamou
      // onResult(true), e é isso que fecha o disjuntor.
    }
  }
}
