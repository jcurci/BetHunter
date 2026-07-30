import Foundation
import os

/// Leitor do índice de blocklist dentro da extensão.
///
/// Só leitura, memory-mapped, sem locks. `Data(contentsOf:options:.mappedIfSafe)`
/// deixa as páginas file-backed e limpas: apenas as ~4 tocadas pela busca binária
/// ficam residentes, e o kernel pode despejá-las sob pressão sem matar o processo
/// — o que importa muito num orçamento de ~15 MB.
final class BlocklistIndex {

  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: SharedConstants.logCategoryBlocklist
  )

  private var mapped: Data?
  private(set) var count = 0
  private var loadedGeneration = -1
  private var queriesSinceCheck = 0

  /// Sobrescreve a localização do índice. Existe para os testes poderem exercitar
  /// a busca binária sem um App Group provisionado; em produção é sempre `nil`.
  private let fileURLOverride: URL?

  init(fileURLOverride: URL? = nil) {
    self.fileURLOverride = fileURLOverride
  }

  private var indexFileURL: URL? {
    fileURLOverride ?? SharedConstants.blocklistFileURL
  }

  /// A cada N consultas revalida a generation. 512 é barato (uma leitura de Int
  /// no UserDefaults) e garante que uma atualização de lista entre em vigor em
  /// segundos, sem precisar reiniciar o túnel — o defeito do DNSProxyProvider
  /// antigo, que só carregava a lista em startProxy.
  private static let generationCheckInterval = 512

  /// `true` quando não há índice em disco e estamos operando só com o fallback
  /// compilado. A UI usa isso para avisar que a proteção está reduzida.
  private(set) var usingFallback = true

  // MARK: - Carga

  /// Reabre o mmap se a generation mudou. Chamar em startTunnel, em wake() e
  /// periodicamente a partir do caminho de consulta.
  func reloadIfNeeded() {
    let generation = SharedConstants.defaults?.integer(forKey: SharedConstants.Keys.blocklistGeneration) ?? 0
    guard generation != loadedGeneration || mapped == nil else { return }
    load(generation: generation)
  }

  /// Força a (re)carga do índice, ignorando a generation. Usado no startup do
  /// túnel e nos testes.
  func reload() {
    let generation = SharedConstants.defaults?.integer(forKey: SharedConstants.Keys.blocklistGeneration) ?? 0
    load(generation: generation)
  }

  private func load(generation: Int) {
    guard let fileURL = indexFileURL else {
      useFallback(reason: "App Group indisponível")
      return
    }

    guard let attributes = try? FileManager.default.attributesOfItem(atPath: fileURL.path),
          let fileSize = attributes[.size] as? Int
    else {
      useFallback(reason: "índice ausente")
      return
    }

    guard let data = try? Data(contentsOf: fileURL, options: [.mappedIfSafe]) else {
      useFallback(reason: "falha ao mapear o índice")
      return
    }

    guard let header = BlocklistFormat.parseHeader(data, totalFileSize: fileSize) else {
      // Header inválido = arquivo corrompido, truncado ou de outra versão do
      // formato. Tratar como ausente, nunca tentar ler mesmo assim.
      useFallback(reason: "header inválido")
      return
    }

    mapped = data
    count = header.entryCount
    loadedGeneration = generation
    usingFallback = false
    queriesSinceCheck = 0
    log.info("Índice carregado: \(header.entryCount) domínios, geração \(generation)")
  }

  private func useFallback(reason: String) {
    mapped = nil
    count = DefaultBlockedDomains.hashes.count
    usingFallback = true
    // Não atualiza loadedGeneration: assim a próxima checagem tenta de novo,
    // cobrindo o caso de o app ainda estar construindo o índice.
    log.error("Sem índice em disco (\(reason, privacy: .public)) — usando fallback compilado")
  }

  // MARK: - Consulta

  /// Busca binária pelo hash. `false` se não houver índice mapeado — o chamador
  /// combina com o fallback compilado.
  @inline(__always)
  func contains(hash: UInt64) -> Bool {
    if usingFallback {
      return DefaultBlockedDomains.hashes.contains(hash)
    }
    guard let data = mapped, count > 0 else { return false }

    return data.withUnsafeBytes { raw -> Bool in
      guard let base = raw.baseAddress else { return false }
      let entries = base.advanced(by: BlocklistFormat.Offset.entries)
        .assumingMemoryBound(to: UInt64.self)

      var low = 0
      var high = count - 1
      while low <= high {
        let mid = (low + high) >> 1
        let value = entries[mid]
        if value == hash { return true }
        if value < hash { low = mid + 1 } else { high = mid - 1 }
      }
      return false
    }
  }

  /// Decide se um domínio deve ser bloqueado.
  ///
  /// Ordem de avaliação (espelha `DomainMatcher.isBlocked` do Android):
  ///   1. NeverBlockAllowlist  -> encaminhar (prioridade máxima)
  ///   2. índice, por sufixo   -> NXDOMAIN
  ///   3. heurística de keyword -> NXDOMAIN
  ///   4. senão                -> encaminhar
  ///
  /// Opera sobre bytes o tempo todo: alocar String por query DNS é justamente o
  /// que não pode acontecer aqui.
  func shouldBlock(domainBytes: [UInt8]) -> Bool {
    queriesSinceCheck += 1
    if queriesSinceCheck >= Self.generationCheckInterval {
      queriesSinceCheck = 0
      reloadIfNeeded()
    }

    guard !domainBytes.isEmpty, domainBytes.count <= 253 else { return false }

    // Posições dos pontos, para fatiar os domínios-pai sem alocar.
    var labelStarts: [Int] = [0]
    labelStarts.reserveCapacity(8)
    for (i, byte) in domainBytes.enumerated() where byte == UInt8(ascii: ".") {
      labelStarts.append(i + 1)
    }
    // Menos de 2 rótulos não é domínio consultável; e nunca testar TLD puro,
    // senão um "com" na lista derrubaria a internet inteira.
    guard labelStarts.count >= 2 else { return false }

    let maxCandidates = min(labelStarts.count - 1, 8)

    // 1 e 2 no mesmo laço: cada candidato de sufixo é hasheado uma única vez e
    // consultado nas duas estruturas.
    for i in 0..<maxCandidates {
      let candidate = domainBytes[labelStarts[i]...]
      let hash = DomainHash.fnv1a64(candidate)
      if NeverBlockAllowlist.contains(hash: hash) { return false }
      if contains(hash: hash) { return true }
    }

    // 3. Heurística, para mirrors que ainda não entraram na lista.
    return GamblingKeywordMatcher.isGamblingDomain(domainBytes[...])
  }
}
