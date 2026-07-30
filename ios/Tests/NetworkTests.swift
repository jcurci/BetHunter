import Foundation

var failures = 0
func check(_ label: String, _ ok: Bool) {
  if !ok { failures += 1 }
  print("  \(ok ? "OK  " : "FALHA") \(label)")
}

// Monta uma query DNS wire-format.
func makeQuery(id: UInt16, name: String, qtype: UInt16 = 1, edns: Bool = false,
               compressed: Bool = false) -> [UInt8] {
  var q: [UInt8] = []
  q += [UInt8(id >> 8), UInt8(id & 0xFF)]
  q += [0x01, 0x00]                                  // RD=1
  q += [0x00, 0x01]                                  // QDCOUNT
  q += [0x00, 0x00, 0x00, 0x00]                      // ANCOUNT, NSCOUNT
  q += edns ? [0x00, 0x01] : [0x00, 0x00]            // ARCOUNT
  if compressed {
    // "www" + ponteiro para offset 12+4 (onde escreveremos "exemplo.com")
    q += [3] + Array("www".utf8)
    q += [0xC0, 0x16]                                // ponteiro -> offset 22
    q += [UInt8(qtype >> 8), UInt8(qtype & 0xFF), 0x00, 0x01]
    // offset 22: exemplo.com
    for label in ["exemplo", "com"] { q += [UInt8(label.utf8.count)] + Array(label.utf8) }
    q += [0x00]
  } else {
    for label in name.split(separator: ".") { q += [UInt8(label.utf8.count)] + Array(label.utf8) }
    q += [0x00]
    q += [UInt8(qtype >> 8), UInt8(qtype & 0xFF), 0x00, 0x01]
  }
  if edns { q += [0x00, 0x00, 0x29, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] }
  return q
}

// Encapsula um payload UDP num pacote IPv4.
func makeIPv4UDP(src: [UInt8], dst: [UInt8], sport: UInt16, dport: UInt16, payload: [UInt8]) -> [UInt8] {
  let total = 20 + 8 + payload.count
  var p = [UInt8](repeating: 0, count: total)
  p[0] = 0x45; p[2] = UInt8(total >> 8); p[3] = UInt8(total & 0xFF)
  p[8] = 64; p[9] = 17
  p.replaceSubrange(12..<16, with: src); p.replaceSubrange(16..<20, with: dst)
  p[20] = UInt8(sport >> 8); p[21] = UInt8(sport & 0xFF)
  p[22] = UInt8(dport >> 8); p[23] = UInt8(dport & 0xFF)
  let ulen = 8 + payload.count
  p[24] = UInt8(ulen >> 8); p[25] = UInt8(ulen & 0xFF)
  p.replaceSubrange(28..<total, with: payload)
  return p
}

func makeIPv6UDP(src: [UInt8], dst: [UInt8], sport: UInt16, dport: UInt16, payload: [UInt8]) -> [UInt8] {
  let ulen = 8 + payload.count
  var p = [UInt8](repeating: 0, count: 40 + ulen)
  p[0] = 0x60; p[4] = UInt8(ulen >> 8); p[5] = UInt8(ulen & 0xFF); p[6] = 17; p[7] = 64
  p.replaceSubrange(8..<24, with: src); p.replaceSubrange(24..<40, with: dst)
  p[40] = UInt8(sport >> 8); p[41] = UInt8(sport & 0xFF)
  p[42] = UInt8(dport >> 8); p[43] = UInt8(dport & 0xFF)
  p[44] = UInt8(ulen >> 8); p[45] = UInt8(ulen & 0xFF)
  p.replaceSubrange(48..<(40 + ulen), with: payload)
  return p
}

print("=== Checksum: vetores conhecidos ===")
// RFC 1071, exemplo classico: soma de [0x00,0x01,0xf2,0x03,0xf4,0xf5,0xf6,0xf7] = 0xddf2
check("RFC1071 vetor (complemento de 0xddf2)", IPPacket.onesComplementChecksum([0x00,0x01,0xf2,0x03,0xf4,0xf5,0xf6,0xf7][...]) == 0x220d)
// Header IPv4 real: checksum recalculado sobre header com campo zerado deve bater
let hdr: [UInt8] = [0x45,0x00,0x00,0x73,0x00,0x00,0x40,0x00,0x40,0x11,
                    0x00,0x00, 0xc0,0xa8,0x00,0x01, 0xc0,0xa8,0x00,0xc7]
check("header IPv4 -> 0xb861", IPPacket.onesComplementChecksum(hdr[...]) == 0xb861)

print("=== Parsing IPv4 ===")
let q1 = makeQuery(id: 0x1234, name: "bet365.com")
let pkt4 = makeIPv4UDP(src: [198,18,0,1], dst: [198,18,0,2], sport: 5353, dport: 53, payload: q1)
guard let d4 = IPPacket.parseUDP(pkt4) else { print("FALHA parse IPv4"); exit(1) }
check("versao v4", d4.version == .v4)
check("porta destino 53", d4.destinationPort == 53)
check("porta origem 5353", d4.sourcePort == 5353)
check("endereco origem", d4.sourceAddress == [198,18,0,1])
check("payload intacto", Array(d4.payload) == q1)

print("=== Parsing IPv6 ===")
let v6src = [UInt8](repeating: 0xfd, count: 16)
let v6dst: [UInt8] = [0xfd,0x6e,0xa8,0x1b,0x70,0x4f,0x12,0x11,0,0,0,0,0,0,0,2]
let pkt6 = makeIPv6UDP(src: v6src, dst: v6dst, sport: 5353, dport: 53, payload: q1)
guard let d6 = IPPacket.parseUDP(pkt6) else { print("FALHA parse IPv6"); exit(1) }
check("versao v6", d6.version == .v6)
check("porta destino 53", d6.destinationPort == 53)
check("endereco destino v6", d6.destinationAddress == v6dst)
check("payload intacto v6", Array(d6.payload) == q1)

print("=== Rejeicoes ===")
var frag = pkt4; frag[6] = 0x20   // MF setado
check("fragmento IPv4 descartado", IPPacket.parseUDP(frag) == nil)
var tcp = pkt4; tcp[9] = 6        // TCP
check("TCP descartado", IPPacket.parseUDP(tcp) == nil)
check("pacote curto descartado", IPPacket.parseUDP([0x45, 0x00]) == nil)
check("versao invalida descartada", IPPacket.parseUDP([0x35] + [UInt8](repeating: 0, count: 40)) == nil)
var frag6 = pkt6; frag6[6] = 44   // fragment header
check("fragmento IPv6 descartado", IPPacket.parseUDP(frag6) == nil)

print("=== Parsing DNS ===")
guard let query = DNSMessage.parseQuery(d4.payload) else { print("FALHA parse DNS"); exit(1) }
check("transaction ID", query.transactionID == 0x1234)
check("nome", String(decoding: query.name, as: UTF8.self) == "bet365.com")
check("qtype A", query.qtype == 1)
check("RD preservado", query.isRecursionDesired)
check("sem EDNS0", !query.hasEDNS0)

let qUpper = makeQuery(id: 1, name: "BET365.COM")
check("nome normalizado para minusculo",
      String(decoding: DNSMessage.parseQuery(qUpper[...])!.name, as: UTF8.self) == "bet365.com")

let qEdns = makeQuery(id: 2, name: "bet365.com", edns: true)
let pe = DNSMessage.parseQuery(qEdns[...])!
check("EDNS0 detectado", pe.hasEDNS0)
check("payload size EDNS0 = 4096", pe.ednsPayloadSize == 4096)

let qComp = makeQuery(id: 3, name: "", compressed: true)
let pc = DNSMessage.parseQuery(qComp[...])
check("ponteiro de compressao seguido", pc != nil && String(decoding: pc!.name, as: UTF8.self) == "www.exemplo.com")
check("compressao sinalizada", pc?.questionUsedCompression == true)

// Resposta (QR=1) nao e query
var resp = q1; resp[2] = 0x81
check("resposta rejeitada como query", DNSMessage.parseQuery(resp[...]) == nil)
check("truncado rejeitado", DNSMessage.parseQuery(q1.prefix(8)[...]) == nil)
// Ponteiro que aponta para fora
var badPtr = q1; badPtr[12] = 0xC0; badPtr[13] = 0xFF
check("ponteiro fora dos limites rejeitado", DNSMessage.parseQuery(badPtr[...]) == nil)

print("=== NXDOMAIN ===")
let nx = DNSMessage.buildNXDOMAIN(for: query)
check("ID preservado", nx[0] == 0x12 && nx[1] == 0x34)
check("QR=1", nx[2] & 0x80 != 0)
check("RCODE=3", nx[3] & 0x0F == 3)
check("RA=1", nx[3] & 0x80 != 0)
check("RD ecoado", nx[2] & 0x01 != 0)
check("AA=0", nx[2] & 0x04 == 0)
check("TC=0", nx[2] & 0x02 == 0)
check("QDCOUNT preservado", nx[4] == 0 && nx[5] == 1)
check("ANCOUNT zerado", nx[6] == 0 && nx[7] == 0)
check("NSCOUNT zerado", nx[8] == 0 && nx[9] == 0)   // era o bug antigo
check("ARCOUNT zerado sem EDNS0", nx[10] == 0 && nx[11] == 0)  // era o bug antigo
check("pergunta ecoada", Array(nx[12...]) == Array(query.rawQuestionSection))

let nxEdns = DNSMessage.buildNXDOMAIN(for: pe)
check("ARCOUNT=1 com EDNS0", nxEdns[10] == 0 && nxEdns[11] == 1)
check("OPT RR presente (type 41)", nxEdns.suffix(11).prefix(3) == [0x00, 0x00, 0x29])
check("OPT ecoa payload size", Array(nxEdns.suffix(11))[3] == 0x10 && Array(nxEdns.suffix(11))[4] == 0x00)

// Com compressao a pergunta e re-codificada, nao copiada
let nxComp = DNSMessage.buildNXDOMAIN(for: pc!)
check("pergunta re-codificada sem ponteiro", !Array(nxComp[12...]).contains { $0 & 0xC0 == 0xC0 })

print("=== Sintese de resposta IPv4 ===")
guard let r4 = IPPacket.buildUDPResponse(to: d4, payload: nx, mtu: 1400) else { print("FALHA build v4"); exit(1) }
check("tamanho total", r4.count == 20 + 8 + nx.count)
check("total length no header", Int(UInt16(r4[2]) << 8 | UInt16(r4[3])) == r4.count)
check("origem/destino invertidos", Array(r4[12..<16]) == [198,18,0,2] && Array(r4[16..<20]) == [198,18,0,1])
check("porta origem 53", (UInt16(r4[20]) << 8 | UInt16(r4[21])) == 53)
check("porta destino = origem do cliente", (UInt16(r4[22]) << 8 | UInt16(r4[23])) == 5353)
// Checksum do header tem de validar: soma sobre o header completo da 0
check("checksum IPv4 valido", IPPacket.onesComplementChecksum(r4[0..<20]) == 0)
check("checksum UDP zero (opcional em v4)", r4[26] == 0 && r4[27] == 0)
check("payload preservado", Array(r4[28...]) == nx)

print("=== Sintese de resposta IPv6 ===")
guard let r6 = IPPacket.buildUDPResponse(to: d6, payload: nx, mtu: 1400) else { print("FALHA build v6"); exit(1) }
check("tamanho total v6", r6.count == 40 + 8 + nx.count)
check("origem/destino invertidos v6", Array(r6[8..<24]) == v6dst && Array(r6[24..<40]) == v6src)
check("checksum UDP v6 nao-zero (obrigatorio)", !(r6[46] == 0 && r6[47] == 0))
// Verifica recomputando sobre o segmento ja preenchido: tem de dar zero
let verify = IPPacket.udpChecksumIPv6(source: v6dst, destination: v6src, udpSegment: r6[40...])
var seg = Array(r6[40...])
let stored = UInt16(seg[6]) << 8 | UInt16(seg[7])
seg[6] = 0; seg[7] = 0
var full = v6dst + v6src
let l = UInt32(seg.count)
full += [UInt8(l >> 24), UInt8(l >> 16), UInt8(l >> 8), UInt8(l & 0xFF), 0, 0, 0, 17] + seg
let recomputed = IPPacket.onesComplementChecksum(full[...])
check("checksum UDP v6 confere", (recomputed == 0 ? 0xFFFF : recomputed) == stored)
_ = verify

print("=== Guarda de MTU ===")
let big = [UInt8](repeating: 0x41, count: 1500)
check("resposta acima da MTU rejeitada", IPPacket.buildUDPResponse(to: d4, payload: big, mtu: 1400) == nil)
let trunc = DNSMessage.buildTruncated(for: query)
check("resposta truncada tem TC=1", trunc[2] & 0x02 != 0)
check("resposta truncada sem answers", trunc[6] == 0 && trunc[7] == 0)
check("truncada cabe na MTU", IPPacket.buildUDPResponse(to: d4, payload: trunc, mtu: 1400) != nil)

print("=== Remapeamento de transaction ID ===")
var msg = q1
DNSMessage.rewriteTransactionID(&msg, to: 0xABCD)
check("ID reescrito", DNSMessage.transactionID(of: msg[...]) == 0xABCD)
check("resto da mensagem intacto", Array(msg[2...]) == Array(q1[2...]))

print("")
print(failures == 0 ? "TODOS OS TESTES PASSARAM" : "\(failures) FALHA(S)")
exit(failures == 0 ? 0 : 1)
