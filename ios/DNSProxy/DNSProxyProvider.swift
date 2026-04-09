import NetworkExtension

class DNSProxyProvider: NEDNSProxyProvider {

  private let upstreamDNS = NWHostEndpoint(hostname: "8.8.8.8", port: "53")

  override func startProxy(
    options: [String: Any]? = nil,
    completionHandler: @escaping (Error?) -> Void
  ) {
    completionHandler(nil)
  }

  override func stopProxy(
    with reason: NEProviderStopReason,
    completionHandler: @escaping () -> Void
  ) {
    completionHandler()
  }

  override func handleNewFlow(_ flow: NEAppProxyFlow) -> Bool {
    guard let udpFlow = flow as? NEAppProxyUDPFlow else { return false }
    processFlow(udpFlow)
    return true
  }

  // MARK: - Processamento de fluxos DNS

  private func processFlow(_ flow: NEAppProxyUDPFlow) {
    flow.open(withLocalEndpoint: nil) { error in
      if error != nil { return }
      self.readLoop(flow)
    }
  }

  private func readLoop(_ flow: NEAppProxyUDPFlow) {
    flow.readDatagrams { datagrams, endpoints, error in
      guard let datagrams = datagrams,
            let endpoints = endpoints,
            error == nil
      else { return }

      for (i, packet) in datagrams.enumerated() {
        if let domain = self.extractDomain(from: packet),
           self.shouldBlock(domain) {
          if let nxResponse = self.makeNXDOMAIN(from: packet) {
            flow.writeDatagrams([nxResponse], sentBy: [endpoints[i]]) { _ in }
          }
        } else {
          self.forward(packet, endpoint: endpoints[i], flow: flow)
        }
      }

      self.readLoop(flow)
    }
  }

  // MARK: - Bloqueio

  private func shouldBlock(_ domain: String) -> Bool {
    let lowered = domain.lowercased()
    return BlockedDomains.all.contains { blocked in
      lowered == blocked || lowered.hasSuffix("." + blocked)
    }
  }

  // MARK: - Encaminhamento para DNS upstream

  private func forward(_ query: Data, endpoint: NWEndpoint, flow: NEAppProxyUDPFlow) {
    let session = createUDPSession(to: upstreamDNS, from: nil)
    session.setReadHandler({ datagrams, error in
      if let response = datagrams?.first {
        flow.writeDatagrams([response], sentBy: [endpoint]) { _ in }
      }
      session.cancel()
    }, maxDatagrams: 1)
    session.writeDatagram(query) { error in
      if error != nil { session.cancel() }
    }
  }

  // MARK: - Parsing DNS

  /// Extrai o domínio consultado de um pacote DNS (wire format)
  private func extractDomain(from packet: Data) -> String? {
    guard packet.count > 12 else { return nil }
    var offset = 12
    var labels: [String] = []

    while offset < packet.count {
      let length = Int(packet[offset])
      if length == 0 { break }
      offset += 1
      guard offset + length <= packet.count else { return nil }
      if let label = String(data: packet[offset..<(offset + length)], encoding: .utf8) {
        labels.append(label)
      }
      offset += length
    }
    return labels.isEmpty ? nil : labels.joined(separator: ".")
  }

  /// Constrói resposta NXDOMAIN a partir da query original
  private func makeNXDOMAIN(from query: Data) -> Data? {
    guard query.count >= 12 else { return nil }
    var response = query
    response[2] = 0x81 // QR=1, RD=1
    response[3] = 0x83 // RA=1, RCODE=3 (NXDOMAIN)
    response[6] = 0x00 // ANCOUNT high byte
    response[7] = 0x00 // ANCOUNT low byte
    return response
  }
}
