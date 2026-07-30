import Foundation

/// Parsing de query DNS e síntese de NXDOMAIN.
///
/// Porta de `DnsPacketParser.kt` / `DnsResponseBuilder.kt` (Android), que já
/// tratam os casos que o `DNSProxyProvider.extractDomain` antigo ignorava por
/// completo: ponteiros de compressão (lia bytes >= 0xC0 como comprimento
/// literal), QDCOUNT, e validação de que é mesmo uma query.
enum DNSMessage {

  static let headerSize = 12

  enum QType: UInt16 {
    case a = 1
    case aaaa = 28
    /// HTTPS/SVCB. Não tratar este tipo deixa o caminho ECH/HTTPS funcionando no
    /// iOS 16+, e o bloqueio vaza mesmo com A e AAAA negados.
    case https = 65
  }

  struct Query {
    let transactionID: UInt16
    let flags: UInt16
    let questionCount: UInt16
    let additionalCount: UInt16
    /// Nome consultado em bytes ASCII minúsculos, sem ponto final.
    let name: [UInt8]
    let qtype: UInt16
    let qclass: UInt16
    /// Bytes verbatim da seção de perguntas, para ecoar na resposta.
    let rawQuestionSection: ArraySlice<UInt8>
    /// `true` se alguma pergunta usou ponteiro de compressão. Nesse caso a seção
    /// não pode ser copiada crua para uma resposta mais curta — o ponteiro
    /// ficaria pendurado apontando para fora da mensagem.
    let questionUsedCompression: Bool
    /// `true` se a query trouxe um OPT RR (EDNS0).
    let hasEDNS0: Bool
    /// Tamanho de payload UDP anunciado no OPT RR (campo CLASS).
    let ednsPayloadSize: UInt16

    var isRecursionDesired: Bool { flags & 0x0100 != 0 }
    var opcode: UInt16 { (flags >> 11) & 0x0F }
  }

  // MARK: - Parsing

  static func parseQuery(_ message: ArraySlice<UInt8>) -> Query? {
    let bytes = Array(message)
    guard bytes.count >= headerSize else { return nil }

    let transactionID = be16(bytes, 0)
    let flags = be16(bytes, 2)
    let questionCount = be16(bytes, 4)
    let additionalCount = be16(bytes, 10)

    // QR precisa ser 0 (é uma pergunta) e tem de haver ao menos uma pergunta.
    guard flags & 0x8000 == 0, questionCount >= 1 else { return nil }

    var cursor = headerSize
    var usedCompression = false
    guard let parsed = readName(bytes, cursor: &cursor, usedCompression: &usedCompression) else {
      return nil
    }
    guard cursor + 4 <= bytes.count else { return nil }

    let qtype = be16(bytes, cursor)
    let qclass = be16(bytes, cursor + 2)
    cursor += 4

    // Perguntas adicionais (raríssimo, mas QDCOUNT > 1 é legal): avança o cursor
    // para que rawQuestionSection cubra todas.
    if questionCount > 1 {
      for _ in 1..<questionCount {
        guard readName(bytes, cursor: &cursor, usedCompression: &usedCompression) != nil,
              cursor + 4 <= bytes.count
        else { return nil }
        cursor += 4
      }
    }

    let (hasEDNS0, payloadSize) = findOPTRecord(bytes, from: cursor, additionalCount: additionalCount)

    return Query(
      transactionID: transactionID,
      flags: flags,
      questionCount: questionCount,
      additionalCount: additionalCount,
      name: parsed,
      qtype: qtype,
      qclass: qclass,
      rawQuestionSection: message[(message.startIndex + headerSize)..<(message.startIndex + cursor)],
      questionUsedCompression: usedCompression,
      hasEDNS0: hasEDNS0,
      ednsPayloadSize: payloadSize
    )
  }

  /// Lê um nome no formato wire, seguindo ponteiros de compressão.
  ///
  /// Ao seguir um ponteiro, o cursor do chamador para logo depois dos 2 bytes do
  /// ponteiro — a leitura continua no destino, mas a posição na mensagem não.
  private static func readName(
    _ bytes: [UInt8], cursor: inout Int, usedCompression: inout Bool
  ) -> [UInt8]? {
    var name = [UInt8]()
    name.reserveCapacity(64)

    var position = cursor
    var jumped = false
    var depth = 0
    let maxDepth = 10

    while position < bytes.count {
      let length = bytes[position]

      if length == 0 {
        if !jumped { cursor = position + 1 }
        // Nome vazio (root) não é consultável.
        return name.isEmpty ? nil : name
      }

      if length & 0xC0 == 0xC0 {
        // Ponteiro de compressão: 2 bytes, 14 bits de offset.
        guard position + 1 < bytes.count else { return nil }
        let offset = (Int(length & 0x3F) << 8) | Int(bytes[position + 1])
        guard offset < bytes.count, depth < maxDepth else { return nil }
        if !jumped {
          cursor = position + 2
          jumped = true
        }
        usedCompression = true
        depth += 1
        position = offset
        continue
      }

      // Rótulo literal.
      let labelLength = Int(length)
      guard labelLength <= 63, position + 1 + labelLength <= bytes.count else { return nil }
      // Nome completo limitado a 255 (com os bytes de comprimento).
      guard name.count + labelLength + 1 <= 255 else { return nil }

      if !name.isEmpty { name.append(UInt8(ascii: ".")) }
      for i in 0..<labelLength {
        name.append(asciiLowercase(bytes[position + 1 + i]))
      }
      position += 1 + labelLength
    }
    return nil
  }

  /// Procura o OPT RR (tipo 41) na seção adicional, para saber se o cliente usa
  /// EDNS0 e qual tamanho de payload ele anuncia.
  private static func findOPTRecord(
    _ bytes: [UInt8], from start: Int, additionalCount: UInt16
  ) -> (Bool, UInt16) {
    guard additionalCount > 0 else { return (false, 0) }
    // O OPT costuma ser o único registro adicional e vem logo após as perguntas,
    // com NAME = root (0x00). Não vale percorrer answer/authority aqui: se o
    // formato for inesperado, tratamos como sem EDNS0 (conservador).
    var position = start
    guard position < bytes.count, bytes[position] == 0x00, position + 11 <= bytes.count else {
      return (false, 0)
    }
    position += 1
    let type = be16(bytes, position)
    guard type == 41 else { return (false, 0) }
    let payloadSize = be16(bytes, position + 2)
    return (true, payloadSize)
  }

  // MARK: - Síntese de NXDOMAIN

  /// Constrói a resposta NXDOMAIN para uma query.
  ///
  /// Corrige três bugs da implementação anterior, que fazia
  /// `response[2] = 0x81` / `response[3] = 0x83` cegamente e zerava só o ANCOUNT:
  ///   - o opcode e o bit RD da query eram sobrescritos em vez de preservados;
  ///   - NSCOUNT ficava com o valor da query;
  ///   - ARCOUNT também — com EDNS0 o cliente tentava ler um OPT RR que não estava
  ///     mais lá.
  ///
  /// NXDOMAIN (e não sinkhole 0.0.0.0) por paridade com o Android e porque faz o
  /// cliente parar de tentar o nome durante o TTL de cache negativo. Não emitimos
  /// SOA na autoridade de propósito: sem SOA o cache negativo é curto, então
  /// despausar a proteção volta a valer rápido.
  static func buildNXDOMAIN(for query: Query) -> [UInt8] {
    var response = [UInt8]()
    response.reserveCapacity(headerSize + query.rawQuestionSection.count + 11)

    var flags: UInt16 = 0
    flags |= 0x8000                        // QR = 1 (resposta)
    flags |= (query.opcode & 0x0F) << 11   // preserva o opcode da query
    if query.isRecursionDesired { flags |= 0x0100 }  // RD ecoado
    flags |= 0x0080                        // RA = 1
    flags |= 0x0003                        // RCODE = 3 (NXDOMAIN)
    // AA = 0 (não somos autoritativos), TC = 0, AD = 0 (resposta não assinada).

    appendBE16(&response, query.transactionID)
    appendBE16(&response, flags)
    appendBE16(&response, query.questionCount)
    appendBE16(&response, 0)   // ANCOUNT
    appendBE16(&response, 0)   // NSCOUNT
    appendBE16(&response, query.hasEDNS0 ? 1 : 0)  // ARCOUNT

    if query.questionUsedCompression {
      // Re-codifica em vez de copiar: um ponteiro apontaria para um offset que
      // não existe mais nesta mensagem, mais curta que a original.
      appendEncodedName(&response, query.name)
      appendBE16(&response, query.qtype)
      appendBE16(&response, query.qclass)
    } else {
      response.append(contentsOf: query.rawQuestionSection)
    }

    if query.hasEDNS0 {
      // RFC 6891 §6.1.1: resposta a uma query com OPT deve trazer OPT. 11 bytes.
      response.append(0x00)                    // NAME = root
      appendBE16(&response, 41)                // TYPE = OPT
      appendBE16(&response, query.ednsPayloadSize)  // CLASS = payload size
      response.append(contentsOf: [0, 0, 0, 0])     // TTL: extRCODE, versão, flags (DO = 0)
      appendBE16(&response, 0)                 // RDLENGTH
    }

    return response
  }

  /// Resposta com TC=1 e sem answers, para quando a resposta real não cabe na MTU.
  /// O cliente re-tenta por TCP/53.
  static func buildTruncated(for query: Query) -> [UInt8] {
    var response = [UInt8]()
    var flags: UInt16 = 0x8000
    flags |= (query.opcode & 0x0F) << 11
    flags |= 0x0200  // TC = 1
    if query.isRecursionDesired { flags |= 0x0100 }
    flags |= 0x0080  // RA = 1

    appendBE16(&response, query.transactionID)
    appendBE16(&response, flags)
    appendBE16(&response, query.questionCount)
    appendBE16(&response, 0)
    appendBE16(&response, 0)
    appendBE16(&response, 0)

    if query.questionUsedCompression {
      appendEncodedName(&response, query.name)
      appendBE16(&response, query.qtype)
      appendBE16(&response, query.qclass)
    } else {
      response.append(contentsOf: query.rawQuestionSection)
    }
    return response
  }

  /// Sobrescreve o transaction ID de uma mensagem DNS já serializada.
  /// Usado pelo pool de upstream para remapear IDs.
  static func rewriteTransactionID(_ message: inout [UInt8], to newID: UInt16) {
    guard message.count >= 2 else { return }
    message[0] = UInt8((newID >> 8) & 0xFF)
    message[1] = UInt8(newID & 0xFF)
  }

  static func transactionID(of message: ArraySlice<UInt8>) -> UInt16? {
    guard message.count >= 2 else { return nil }
    let start = message.startIndex
    return (UInt16(message[start]) << 8) | UInt16(message[start + 1])
  }

  // MARK: - Helpers

  @inline(__always)
  private static func be16(_ bytes: [UInt8], _ offset: Int) -> UInt16 {
    guard offset + 1 < bytes.count else { return 0 }
    return (UInt16(bytes[offset]) << 8) | UInt16(bytes[offset + 1])
  }

  @inline(__always)
  private static func appendBE16(_ buffer: inout [UInt8], _ value: UInt16) {
    buffer.append(UInt8((value >> 8) & 0xFF))
    buffer.append(UInt8(value & 0xFF))
  }

  private static func appendEncodedName(_ buffer: inout [UInt8], _ name: [UInt8]) {
    var labelStart = 0
    for i in 0...name.count {
      if i == name.count || name[i] == UInt8(ascii: ".") {
        let length = i - labelStart
        if length > 0, length <= 63 {
          buffer.append(UInt8(length))
          buffer.append(contentsOf: name[labelStart..<i])
        }
        labelStart = i + 1
      }
    }
    buffer.append(0x00)
  }

  @inline(__always)
  private static func asciiLowercase(_ byte: UInt8) -> UInt8 {
    (byte >= 65 && byte <= 90) ? byte + 32 : byte
  }
}
