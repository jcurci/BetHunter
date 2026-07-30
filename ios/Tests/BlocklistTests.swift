import Foundation

var failures = 0
func check(_ label: String, _ actual: Bool, _ expected: Bool = true) {
  let ok = actual == expected
  if !ok { failures += 1 }
  print("  \(ok ? "OK  " : "FALHA") \(label)")
}

// Diretório de trabalho: passado pelo scripts/verify-ios-blocking.sh, que baixa
// a blocklist real para lá. Cair para /tmp permite rodar à mão também.
let sp = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp"

print("=== Normalizador: lista real ===")
let text = try! String(contentsOfFile: "\(sp)/bl.txt", encoding: .utf8)
let t0 = Date()
let (domains, yield) = DomainNormalizer.normalizeAll(text: text)
print(String(format: "  %d dominios, aproveitamento %.4f, %.2fs", domains.count, yield, Date().timeIntervalSince(t0)))
check("aproveitamento >= portao", yield >= DomainNormalizer.minimumParseYield)
check("sem ^ ou | remanescente", !domains.contains { $0.contains("^") || $0.contains("|") })

print("=== Normalizador: casos ===")
let cases: [(String, String?)] = [
  ("vip.039-vip1.com^", "vip.039-vip1.com"),
  ("||exemplo.com^", "exemplo.com"),
  ("0.0.0.0 bet365.com", "bet365.com"),
  ("https://www.Blaze.com/path", "www.blaze.com"),
  ("exemplo.com // comentario", "exemplo.com"),
  ("*.betano.com", "betano.com"),
  ("# comentario", nil), ("", nil), ("semponto", nil), ("-invalido.com", nil),
]
for (input, expected) in cases {
  check("\(input.isEmpty ? "(vazio)" : input) -> \(DomainNormalizer.normalize(input) ?? "nil")",
        DomainNormalizer.normalize(input) == expected)
}

print("=== KeywordMatcher: paridade com Android ===")
for (d, exp) in [("bet.com", true), ("bet365.com", true), ("23bet36.com", true),
                 ("estrela-bet.com", true), ("www.bet365.com", true),
                 ("betterment.com", false), ("abet.com", false),
                 ("sportsbetting.com", true), ("blaze.com", true),
                 ("google.com", false), ("apple.com", false)] {
  check("keyword \(d)=\(exp)", GamblingKeywordMatcher.isGamblingDomain(d), exp)
}

print("=== Round-trip do indice (302k dominios reais) ===")
var hashes = Set<UInt64>(minimumCapacity: domains.count)
for d in domains { hashes.insert(DomainHash.hash(domain: d)) }
for h in DoHEndpoints.hostnames { hashes.insert(DomainHash.hash(domain: h)) }
var sorted = ContiguousArray(hashes); sorted.sort()

let payload = BlocklistStore.encode(sorted: sorted, sourceDigest: Data(repeating: 0xAB, count: 32))
check("tamanho == esperado pelo formato",
      payload.count == BlocklistFormat.expectedFileSize(entryCount: sorted.count))
print(String(format: "  %d entradas, %.2f MB", sorted.count, Double(payload.count) / 1_048_576))

let indexURL = URL(fileURLWithPath: "\(sp)/blocklist.v1.bin")
try! payload.write(to: indexURL)

let index = BlocklistIndex(fileURLOverride: indexURL)
index.reload()
check("leitor carregou sem fallback", !index.usingFallback)
check("contagem bate com o escritor", index.count == sorted.count)

var sampleMisses = 0
for d in domains.prefix(20000) where !index.contains(hash: DomainHash.hash(domain: d)) { sampleMisses += 1 }
check("20k dominios da lista todos encontrados (misses=\(sampleMisses))", sampleMisses == 0)

check("dominio listado bloqueia", index.shouldBlock(domainBytes: Array(domains[0].utf8)))
check("subdominio de dominio listado bloqueia",
      index.shouldBlock(domainBytes: Array("promo.\(domains[0])".utf8)))

check("infra propria nunca bloqueia", !index.shouldBlock(domainBytes: Array("bethunter-api.up.railway.app".utf8)))
check("revenuecat nunca bloqueia", !index.shouldBlock(domainBytes: Array("api.revenuecat.com".utf8)))
check("raw.githubusercontent nunca bloqueia", !index.shouldBlock(domainBytes: Array("raw.githubusercontent.com".utf8)))

for d in ["google.com", "www.google.com", "apple.com", "wikipedia.org", "nytimes.com", "gov.br"] {
  check("\(d) nao bloqueia", !index.shouldBlock(domainBytes: Array(d.utf8)))
}
check("TLD puro nao bloqueia", !index.shouldBlock(domainBytes: Array("com".utf8)))

check("dns.google bloqueia (DoH)", index.shouldBlock(domainBytes: Array("dns.google".utf8)))
check("use-application-dns.net bloqueia (canario Firefox)",
      index.shouldBlock(domainBytes: Array("use-application-dns.net".utf8)))
check("mirror 99bet77.xyz bloqueia por heuristica", index.shouldBlock(domainBytes: Array("99bet77.xyz".utf8)))

print("=== Desempenho do hot path ===")
let probes = (0..<200_000).map { Array("host\($0).exemplo\($0 % 997).com".utf8) }
let t1 = Date()
var blocked = 0
for p in probes where index.shouldBlock(domainBytes: p) { blocked += 1 }
let dt = Date().timeIntervalSince(t1)
print(String(format: "  200k consultas em %.3fs = %.0f ns/consulta (bloqueadas: %d)", dt, dt * 1e9 / 200_000, blocked))
check("< 10 us por consulta", dt / 200_000 < 10e-6)

print("=== Robustez ===")
var corrupted = payload
corrupted[0] = 0x00
let corruptURL = URL(fileURLWithPath: "\(sp)/corrupt.bin")
try! corrupted.write(to: corruptURL)
let badIndex = BlocklistIndex(fileURLOverride: corruptURL)
badIndex.reload()
check("magic invalido cai para fallback", badIndex.usingFallback)
check("fallback ainda bloqueia bet365.com", badIndex.shouldBlock(domainBytes: Array("bet365.com".utf8)))
check("fallback nao bloqueia google.com", !badIndex.shouldBlock(domainBytes: Array("google.com".utf8)))

let truncURL = URL(fileURLWithPath: "\(sp)/trunc.bin")
try! Data(payload.prefix(payload.count - 8)).write(to: truncURL)
let truncIndex = BlocklistIndex(fileURLOverride: truncURL)
truncIndex.reload()
check("arquivo truncado cai para fallback", truncIndex.usingFallback)

let missingIndex = BlocklistIndex(fileURLOverride: URL(fileURLWithPath: "\(sp)/naoexiste.bin"))
missingIndex.reload()
check("arquivo ausente cai para fallback", missingIndex.usingFallback)

print("")
print(failures == 0 ? "TODOS OS TESTES PASSARAM" : "\(failures) FALHA(S)")
exit(failures == 0 ? 0 : 1)
