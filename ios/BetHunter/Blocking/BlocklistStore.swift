import Foundation
import CryptoKit
import os

/// Escritor do índice de blocklist. Roda **somente no processo do app**.
///
/// A extensão nunca constrói o índice: normalizar 311 mil linhas e ordenar 300
/// mil hashes tem pico de ~12 MB, e o orçamento de um packet tunnel provider é de
/// ~15 MB. Fazer isso lá é jetsam garantido. O refresh acontece sempre no app
/// (BGTask de 24 h + didBecomeActive); a extensão só lê.
@available(iOS 16.0, *)
enum BlocklistStore {

  private static let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: SharedConstants.logCategoryBlocklist
  )

  enum StoreError: Error, LocalizedError {
    case appGroupUnavailable
    case lowParseYield(Double)
    case suspiciousShrink(previous: Int, new: Int)
    case emptyResult
    case writeFailed(Error)

    var errorDescription: String? {
      switch self {
      case .appGroupUnavailable:
        return "App Group indisponível — a extensão não conseguiria ler o índice."
      case .lowParseYield(let yield):
        return String(format: "Formato da blocklist mudou (aproveitamento %.1f%%).", yield * 100)
      case .suspiciousShrink(let previous, let new):
        return "Lista encolheu de \(previous) para \(new) domínios — rejeitada."
      case .emptyResult:
        return "Nenhum domínio válido na lista."
      case .writeFailed(let error):
        return "Falha ao gravar o índice: \(error.localizedDescription)"
      }
    }
  }

  // MARK: - Construção do índice

  /// Normaliza, valida e grava o índice de forma atômica.
  ///
  /// `sourceText` é o corpo cru baixado. A normalização acontece aqui (e não no
  /// chamador) porque o portão de aproveitamento precisa ver a contagem de linhas.
  static func rebuildIndex(from sourceText: String) -> Result<Int, StoreError> {
    guard let directoryURL = SharedConstants.blocklistDirectoryURL,
          let fileURL = SharedConstants.blocklistFileURL
    else { return .failure(.appGroupUnavailable) }

    let (domains, yield) = DomainNormalizer.normalizeAll(text: sourceText)

    // Portão de sanidade. Esta é a guarda que teria pego o bug do `^` sozinha:
    // com o normalizador quebrado o aproveitamento era 0, e teríamos rejeitado a
    // lista em vez de gravar um índice vazio por cima de um bom.
    guard yield >= DomainNormalizer.minimumParseYield else {
      log.error("Aproveitamento de parsing \(yield, format: .fixed(precision: 4)) abaixo do mínimo — lista rejeitada")
      return .failure(.lowParseYield(yield))
    }
    guard !domains.isEmpty else { return .failure(.emptyResult) }

    // Domínios de DoH entram no índice para que resolver o hostname de um
    // provedor de DNS criptografado devolva NXDOMAIN.
    var hashes = Set<UInt64>(minimumCapacity: domains.count + DoHEndpoints.hostnames.count)
    for domain in domains { hashes.insert(DomainHash.hash(domain: domain)) }
    for hostname in DoHEndpoints.hostnames { hashes.insert(DomainHash.hash(domain: hostname)) }

    // Guarda de encolhimento suspeito (porta de BlocklistManager.kt). Protege
    // contra o mantenedor publicar uma lista truncada ou vazia por engano.
    let previousCount = count
    if previousCount >= 1000, hashes.count < previousCount / 2 {
      log.error("Lista encolheu de \(previousCount) para \(hashes.count) — rejeitada")
      return .failure(.suspiciousShrink(previous: previousCount, new: hashes.count))
    }

    var sorted = ContiguousArray(hashes)
    sorted.sort()

    let digest = SHA256.hash(data: Data(sourceText.utf8))
    let payload = encode(sorted: sorted, sourceDigest: Data(digest))

    do {
      try writeAtomically(payload, to: fileURL, directory: directoryURL)
    } catch {
      log.error("Falha ao gravar índice: \(error.localizedDescription, privacy: .public)")
      return .failure(.writeFailed(error))
    }

    let defaults = SharedConstants.defaults
    defaults?.set(sorted.count, forKey: SharedConstants.Keys.blocklistCount)
    defaults?.set(Date().timeIntervalSince1970, forKey: SharedConstants.Keys.blocklistBuiltAt)
    // O bump de generation é o ÚLTIMO passo: só depois de o arquivo estar no
    // lugar é que a extensão pode ser instruída a reabrir o mmap.
    let generation = (defaults?.integer(forKey: SharedConstants.Keys.blocklistGeneration) ?? 0) + 1
    defaults?.set(generation, forKey: SharedConstants.Keys.blocklistGeneration)

    log.info("Índice reconstruído: \(sorted.count) domínios, geração \(generation)")
    return .success(sorted.count)
  }

  // MARK: - Serialização

  /// `internal` em vez de `private` para os testes poderem gerar um índice e
  /// verificar o round-trip com BlocklistIndex sem um App Group provisionado.
  static func encode(sorted: ContiguousArray<UInt64>, sourceDigest: Data) -> Data {
    var data = Data(capacity: BlocklistFormat.expectedFileSize(entryCount: sorted.count))

    data.append(contentsOf: BlocklistFormat.magic)
    appendLE(&data, BlocklistFormat.version)
    appendLE(&data, BlocklistFormat.flagSorted)
    appendLE(&data, UInt64(sorted.count))
    appendLE(&data, UInt64(Date().timeIntervalSince1970))
    appendLE(&data, DomainHash.offsetBasis)

    var digest = sourceDigest.prefix(32)
    if digest.count < 32 { digest.append(contentsOf: [UInt8](repeating: 0, count: 32 - digest.count)) }
    data.append(digest)

    assert(data.count == BlocklistFormat.headerSize, "header tem de ter exatamente 64 bytes")

    sorted.withUnsafeBufferPointer { buffer in
      buffer.baseAddress.map {
        data.append(UnsafeBufferPointer(start: UnsafeRawPointer($0).assumingMemoryBound(to: UInt8.self),
                                        count: buffer.count * MemoryLayout<UInt64>.size))
      }
    }
    return data
  }

  private static func appendLE<T: FixedWidthInteger>(_ data: inout Data, _ value: T) {
    withUnsafeBytes(of: value.littleEndian) { data.append(contentsOf: $0) }
  }

  // MARK: - Escrita atômica

  private static func writeAtomically(_ data: Data, to fileURL: URL, directory: URL) throws {
    let fm = FileManager.default
    if !fm.fileExists(atPath: directory.path) {
      try fm.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    // O temporário tem de ficar no MESMO diretório: replaceItemAt exige mesmo
    // volume, e um rename entre volumes não é atômico.
    let tempURL = directory.appendingPathComponent(".\(SharedConstants.blocklistFileName).tmp-\(UUID().uuidString)")

    // FileProtectionType.none é deliberado e load-bearing. Com on-demand ligado o
    // túnel sobe ANTES do primeiro desbloqueio pós-reboot; com .complete (ou até
    // .completeUntilFirstUserAuthentication) o arquivo seria ilegível e o túnel
    // subiria com índice vazio. O conteúdo é uma blocklist pública do GitHub —
    // zero valor de privacidade.
    try data.write(to: tempURL, options: [.atomic])
    try fm.setAttributes([.protectionKey: FileProtectionType.none], ofItemAtPath: tempURL.path)

    if fm.fileExists(atPath: fileURL.path) {
      // Troca de inode. Um mmap já aberto na extensão continua lendo o arquivo
      // antigo, íntegro e autoconsistente, até reabrir por causa da generation —
      // por isso não é preciso NSFileCoordinator.
      _ = try fm.replaceItemAt(fileURL, withItemAt: tempURL)
    } else {
      try fm.moveItem(at: tempURL, to: fileURL)
    }
    try? fm.setAttributes([.protectionKey: FileProtectionType.none], ofItemAtPath: fileURL.path)
  }

  // MARK: - Consulta (lado do app, para a UI)

  /// Contagem de domínios no índice. Leitura de um Int no UserDefaults —
  /// substitui o `loadBlockedDomains().count` antigo, que desserializava um
  /// NSArray de 300 mil itens a cada avaliação de body do SwiftUI.
  static var count: Int {
    SharedConstants.defaults?.integer(forKey: SharedConstants.Keys.blocklistCount) ?? 0
  }

  static var builtAt: Date? {
    guard let timestamp = SharedConstants.defaults?.double(forKey: SharedConstants.Keys.blocklistBuiltAt),
          timestamp > 0
    else { return nil }
    return Date(timeIntervalSince1970: timestamp)
  }

  /// `true` se existe um índice utilizável em disco.
  static var hasUsableIndex: Bool {
    guard let fileURL = SharedConstants.blocklistFileURL,
          let attributes = try? FileManager.default.attributesOfItem(atPath: fileURL.path),
          let size = attributes[.size] as? Int,
          size > BlocklistFormat.headerSize,
          let handle = try? FileHandle(forReadingFrom: fileURL)
    else { return false }
    defer { try? handle.close() }
    guard let header = try? handle.read(upToCount: BlocklistFormat.headerSize) else { return false }
    return BlocklistFormat.parseHeader(header, totalFileSize: size) != nil
  }

  // MARK: - Migração

  /// Remove o array legado de ~300 mil strings do UserDefaults do App Group.
  ///
  /// Instalações existentes têm essa chave, e o plist inteiro é re-serializado a
  /// cada acesso ao suite — inclusive dentro da extensão, com orçamento de 15 MB.
  static func migrateLegacyStorage() {
    guard let defaults = SharedConstants.defaults,
          defaults.object(forKey: SharedConstants.Keys.legacyBlockedDomainsList) != nil
    else { return }
    defaults.removeObject(forKey: SharedConstants.Keys.legacyBlockedDomainsList)
    log.info("Removida a lista legada de domínios do UserDefaults do App Group")
  }
}
