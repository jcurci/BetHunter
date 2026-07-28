import Foundation

/// Layout do arquivo `blocklist.v1.bin`.
///
/// Por que um array de hashes em mmap e não SQLite na extensão:
///
/// 1. `0xdead10cc`. Um packet tunnel provider é suspenso rotineiramente pelo SO
///    (entre sleep/wake, sob pressão de memória, no bloqueio do aparelho). Um
///    processo suspenso segurando lock de arquivo num container compartilhado é
///    morto com 0xdead10cc. SQLite num App Group, lido por uma extensão que é
///    suspensa o tempo todo, é exatamente esse modo de falha documentado. O
///    Android não tem esse problema — por isso BlockedDomainsDb.kt é adequado lá
///    e não aqui.
/// 2. Orçamento de memória. NE providers têm ~15 MB. 300k × 8 B = 2,4 MB de
///    memória limpa e file-backed: só as ~4 páginas tocadas pela busca binária
///    ficam residentes, e o kernel pode despejá-las sem matar o processo.
/// 3. A extensão nunca escreve — sem lock, sem WAL, sem journal, sem busy timeout.
/// 4. Velocidade: ~19 passos de busca binária em UnsafePointer<UInt64> ≈ 100 ns,
///    contra ~20 µs do SQLite, por query DNS.
///
/// Header de 64 bytes mantém o array de entradas alinhado a 8 e 16 bytes, então o
/// leitor pode fazer `bindMemory(to: UInt64.self)` e indexar direto, sem parsing.
/// Little-endian é nativo em arm64 — zero byte swapping.
enum BlocklistFormat {

  /// "BHBL"
  static let magic: [UInt8] = [0x42, 0x48, 0x42, 0x4C]
  static let version: UInt16 = 1
  static let headerSize = 64

  /// bit 0 — entradas ordenadas de forma crescente (sempre 1 nesta versão)
  static let flagSorted: UInt16 = 1 << 0

  enum Offset {
    static let magic = 0          // 4 bytes
    static let version = 4        // UInt16 LE
    static let flags = 6          // UInt16 LE
    static let entryCount = 8     // UInt64 LE
    static let builtAt = 16       // UInt64 LE, unix seconds
    static let hashSeed = 24      // UInt64 LE (offset basis do FNV-1a)
    static let sourceDigest = 32  // 32 bytes, SHA-256 do texto baixado
    static let entries = 64       // entryCount × UInt64 LE
  }

  static func expectedFileSize(entryCount: Int) -> Int {
    headerSize + entryCount * MemoryLayout<UInt64>.size
  }

  /// Header validado, já lido do arquivo.
  struct Header {
    let entryCount: Int
    let builtAt: UInt64
    let hashSeed: UInt64
  }

  /// Valida e decodifica o header. Retorna `nil` para qualquer inconsistência —
  /// o chamador trata arquivo inválido como ausente e cai para o fallback
  /// compilado, nunca fail-open.
  static func parseHeader(_ data: Data, totalFileSize: Int) -> Header? {
    guard data.count >= headerSize else { return nil }

    return data.withUnsafeBytes { raw -> Header? in
      for (i, expected) in magic.enumerated() {
        guard raw.load(fromByteOffset: Offset.magic + i, as: UInt8.self) == expected else {
          return nil
        }
      }
      guard raw.loadUnaligned(fromByteOffset: Offset.version, as: UInt16.self) == version else {
        return nil
      }
      let flags = raw.loadUnaligned(fromByteOffset: Offset.flags, as: UInt16.self)
      guard flags & flagSorted != 0 else { return nil }

      let count = raw.loadUnaligned(fromByteOffset: Offset.entryCount, as: UInt64.self)
      guard count > 0, count <= UInt64(Int.max) else { return nil }
      let entryCount = Int(count)
      guard totalFileSize == expectedFileSize(entryCount: entryCount) else { return nil }

      let seed = raw.loadUnaligned(fromByteOffset: Offset.hashSeed, as: UInt64.self)
      // Um seed diferente significa que o arquivo foi gravado por uma versão do
      // app com outra função de hash — as buscas dariam falso negativo em tudo.
      guard seed == DomainHash.offsetBasis else { return nil }

      return Header(
        entryCount: entryCount,
        builtAt: raw.loadUnaligned(fromByteOffset: Offset.builtAt, as: UInt64.self),
        hashSeed: seed
      )
    }
  }
}
