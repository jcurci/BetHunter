import Foundation

/// Parsing e síntese de pacotes IPv4/IPv6 + UDP.
///
/// O `NEPacketTunnelProvider` entrega pacotes IP crus — não há API de nível mais
/// alto (a que existe, `NEDNSProxyProvider`, só funciona em aparelho
/// supervisionado, que é exatamente o motivo desta reescrita). Então os headers
/// são montados na mão, checksums inclusive.
enum IPPacket {

  static let protocolUDP: UInt8 = 17
  static let dnsPort: UInt16 = 53

  enum IPVersion {
    case v4
    case v6
  }

  /// Uma query DNS extraída de um datagrama, com o que é preciso para responder.
  struct UDPDatagram {
    let version: IPVersion
    /// Bytes crus dos endereços: 4 para IPv4, 16 para IPv6.
    let sourceAddress: [UInt8]
    let destinationAddress: [UInt8]
    let sourcePort: UInt16
    let destinationPort: UInt16
    let payload: ArraySlice<UInt8>
  }

  // MARK: - Parsing

  static func parseUDP(_ packet: [UInt8]) -> UDPDatagram? {
    guard let first = packet.first else { return nil }
    switch first >> 4 {
    case 4: return parseIPv4(packet)
    case 6: return parseIPv6(packet)
    default: return nil
    }
  }

  private static func parseIPv4(_ p: [UInt8]) -> UDPDatagram? {
    guard p.count >= 20 else { return nil }

    let ihl = Int(p[0] & 0x0F) * 4
    guard ihl >= 20, ihl <= p.count else { return nil }

    // Descarta fragmentos: MF setado ou offset != 0. Reassembly está fora de
    // escopo e query DNS não fragmenta na prática.
    let flagsAndOffset = (UInt16(p[6]) << 8) | UInt16(p[7])
    guard flagsAndOffset & 0x1FFF == 0, p[6] & 0x20 == 0 else { return nil }

    guard p[9] == protocolUDP else { return nil }

    let totalLength = Int((UInt16(p[2]) << 8) | UInt16(p[3]))
    let end = min(totalLength > 0 ? totalLength : p.count, p.count)
    guard end - ihl >= 8 else { return nil }

    return parseUDPHeader(
      p, udpStart: ihl, packetEnd: end,
      version: .v4,
      source: Array(p[12..<16]), destination: Array(p[16..<20])
    )
  }

  private static func parseIPv6(_ p: [UInt8]) -> UDPDatagram? {
    guard p.count >= 40 else { return nil }

    let payloadLength = Int((UInt16(p[4]) << 8) | UInt16(p[5]))
    var nextHeader = p[6]
    var cursor = 40

    // Caminha pelos extension headers. Máximo 4 saltos — mais que isso é
    // patológico e não vale o risco de laço.
    var hops = 0
    while nextHeader != protocolUDP, hops < 4 {
      switch nextHeader {
      case 0, 43, 60:  // hop-by-hop, routing, destination options
        guard cursor + 2 <= p.count else { return nil }
        let headerLength = (Int(p[cursor + 1]) + 1) * 8
        nextHeader = p[cursor]
        cursor += headerLength
        hops += 1
      default:
        // 44 = fragment, e qualquer outra coisa: descarta.
        return nil
      }
    }
    guard nextHeader == protocolUDP, cursor + 8 <= p.count else { return nil }

    let end = min(40 + payloadLength, p.count)
    guard end > cursor else { return nil }

    return parseUDPHeader(
      p, udpStart: cursor, packetEnd: end,
      version: .v6,
      source: Array(p[8..<24]), destination: Array(p[24..<40])
    )
  }

  private static func parseUDPHeader(
    _ p: [UInt8], udpStart: Int, packetEnd: Int,
    version: IPVersion, source: [UInt8], destination: [UInt8]
  ) -> UDPDatagram? {
    guard udpStart + 8 <= packetEnd else { return nil }

    let sourcePort = (UInt16(p[udpStart]) << 8) | UInt16(p[udpStart + 1])
    let destinationPort = (UInt16(p[udpStart + 2]) << 8) | UInt16(p[udpStart + 3])
    let udpLength = Int((UInt16(p[udpStart + 4]) << 8) | UInt16(p[udpStart + 5]))

    let payloadStart = udpStart + 8
    let payloadEnd = min(udpStart + max(udpLength, 8), packetEnd)
    guard payloadEnd >= payloadStart else { return nil }

    return UDPDatagram(
      version: version,
      sourceAddress: source,
      destinationAddress: destination,
      sourcePort: sourcePort,
      destinationPort: destinationPort,
      payload: p[payloadStart..<payloadEnd]
    )
  }

  // MARK: - Síntese

  /// Monta um pacote de resposta para `request`, invertendo origem e destino nas
  /// duas camadas. `payload` é a mensagem DNS pronta.
  ///
  /// Retorna `nil` se o resultado excederia a MTU — o chamador tem de emitir uma
  /// resposta truncada (TC=1) em vez de um pacote grande demais, que seria
  /// descartado e deixaria a query pendurada.
  static func buildUDPResponse(
    to request: UDPDatagram,
    payload: [UInt8],
    mtu: Int
  ) -> [UInt8]? {
    switch request.version {
    case .v4: return buildIPv4Response(to: request, payload: payload, mtu: mtu)
    case .v6: return buildIPv6Response(to: request, payload: payload, mtu: mtu)
    }
  }

  private static func buildIPv4Response(to request: UDPDatagram, payload: [UInt8], mtu: Int) -> [UInt8]? {
    let totalLength = 20 + 8 + payload.count
    guard totalLength <= mtu, totalLength <= 65535 else { return nil }

    var packet = [UInt8](repeating: 0, count: totalLength)

    packet[0] = 0x45                                    // versão 4, IHL 5
    packet[1] = 0                                       // DSCP/ECN
    packet[2] = UInt8((totalLength >> 8) & 0xFF)
    packet[3] = UInt8(totalLength & 0xFF)
    let identification = nextIdentification()
    packet[4] = UInt8((identification >> 8) & 0xFF)
    packet[5] = UInt8(identification & 0xFF)
    packet[6] = 0                                       // sem DF, sem MF, offset 0
    packet[7] = 0
    packet[8] = 64                                      // TTL
    packet[9] = protocolUDP
    // 10-11: checksum do header, calculado abaixo
    packet.replaceSubrange(12..<16, with: request.destinationAddress)  // origem = quem era destino
    packet.replaceSubrange(16..<20, with: request.sourceAddress)

    let headerChecksum = onesComplementChecksum(packet[0..<20])
    packet[10] = UInt8((headerChecksum >> 8) & 0xFF)
    packet[11] = UInt8(headerChecksum & 0xFF)

    writeUDPHeader(&packet, at: 20,
                   sourcePort: request.destinationPort,
                   destinationPort: request.sourcePort,
                   payloadCount: payload.count)
    packet.replaceSubrange(28..<totalLength, with: payload)

    // Checksum UDP sobre IPv4 é opcional (RFC 768). Zero literal significa "não
    // calculado" e é aceito; um checksum ERRADO faria o cliente descartar. Como
    // não há ganho real aqui, zero é a escolha segura.
    packet[26] = 0
    packet[27] = 0

    return packet
  }

  private static func buildIPv6Response(to request: UDPDatagram, payload: [UInt8], mtu: Int) -> [UInt8]? {
    let udpLength = 8 + payload.count
    let totalLength = 40 + udpLength
    guard totalLength <= mtu, udpLength <= 65535 else { return nil }

    var packet = [UInt8](repeating: 0, count: totalLength)

    packet[0] = 0x60                                    // versão 6
    packet[4] = UInt8((udpLength >> 8) & 0xFF)          // payload length
    packet[5] = UInt8(udpLength & 0xFF)
    packet[6] = protocolUDP                             // next header
    packet[7] = 64                                      // hop limit
    packet.replaceSubrange(8..<24, with: request.destinationAddress)
    packet.replaceSubrange(24..<40, with: request.sourceAddress)

    writeUDPHeader(&packet, at: 40,
                   sourcePort: request.destinationPort,
                   destinationPort: request.sourcePort,
                   payloadCount: payload.count)
    packet.replaceSubrange(48..<totalLength, with: payload)

    // Sobre IPv6 o checksum UDP é OBRIGATÓRIO (RFC 8200 §8.1) — zero não é
    // permitido e o pacote seria descartado pela stack do cliente.
    let checksum = udpChecksumIPv6(
      source: request.destinationAddress,
      destination: request.sourceAddress,
      udpSegment: packet[40..<totalLength]
    )
    packet[46] = UInt8((checksum >> 8) & 0xFF)
    packet[47] = UInt8(checksum & 0xFF)

    return packet
  }

  private static func writeUDPHeader(
    _ packet: inout [UInt8], at offset: Int,
    sourcePort: UInt16, destinationPort: UInt16, payloadCount: Int
  ) {
    let udpLength = 8 + payloadCount
    packet[offset] = UInt8((sourcePort >> 8) & 0xFF)
    packet[offset + 1] = UInt8(sourcePort & 0xFF)
    packet[offset + 2] = UInt8((destinationPort >> 8) & 0xFF)
    packet[offset + 3] = UInt8(destinationPort & 0xFF)
    packet[offset + 4] = UInt8((udpLength >> 8) & 0xFF)
    packet[offset + 5] = UInt8(udpLength & 0xFF)
    packet[offset + 6] = 0  // checksum, preenchido pelo chamador
    packet[offset + 7] = 0
  }

  // MARK: - Checksums

  /// Soma em complemento de um sobre palavras de 16 bits big-endian, com carries
  /// dobrados e resultado invertido.
  static func onesComplementChecksum(_ bytes: ArraySlice<UInt8>) -> UInt16 {
    var sum: UInt32 = 0
    var index = bytes.startIndex
    let end = bytes.endIndex

    while index + 1 < end {
      sum += UInt32(bytes[index]) << 8 | UInt32(bytes[index + 1])
      index += 2
    }
    if index < end {
      sum += UInt32(bytes[index]) << 8   // byte ímpar final, padding com zero
    }
    while sum >> 16 != 0 {
      sum = (sum & 0xFFFF) + (sum >> 16)
    }
    return UInt16(truncatingIfNeeded: ~sum)
  }

  /// Checksum UDP sobre IPv6, incluindo o pseudo-header:
  /// origem(16) ‖ destino(16) ‖ tamanho(32 BE) ‖ zeros(3) ‖ next header(1).
  static func udpChecksumIPv6(
    source: [UInt8], destination: [UInt8], udpSegment: ArraySlice<UInt8>
  ) -> UInt16 {
    var buffer = [UInt8]()
    buffer.reserveCapacity(40 + udpSegment.count + 1)
    buffer.append(contentsOf: source)
    buffer.append(contentsOf: destination)

    let length = UInt32(udpSegment.count)
    buffer.append(UInt8((length >> 24) & 0xFF))
    buffer.append(UInt8((length >> 16) & 0xFF))
    buffer.append(UInt8((length >> 8) & 0xFF))
    buffer.append(UInt8(length & 0xFF))
    buffer.append(contentsOf: [0, 0, 0, protocolUDP])

    buffer.append(contentsOf: udpSegment)
    // Zera o campo de checksum dentro da cópia antes de somar.
    let checksumOffset = 40 + 6
    if buffer.count > checksumOffset + 1 {
      buffer[checksumOffset] = 0
      buffer[checksumOffset + 1] = 0
    }

    let result = onesComplementChecksum(buffer[...])
    // RFC 768: um checksum calculado como zero é transmitido como 0xFFFF, porque
    // zero significaria "sem checksum" — proibido em IPv6.
    return result == 0 ? 0xFFFF : result
  }

  // MARK: - Utilitários

  private static var identificationCounter: UInt16 = UInt16.random(in: 0...UInt16.max)

  private static func nextIdentification() -> UInt16 {
    identificationCounter = identificationCounter &+ 1
    return identificationCounter
  }

  /// Converte um endereço IPv4 cru em texto (para logs e chaves de pool).
  static func ipv4String(_ bytes: [UInt8]) -> String {
    guard bytes.count == 4 else { return "?" }
    return "\(bytes[0]).\(bytes[1]).\(bytes[2]).\(bytes[3])"
  }
}
