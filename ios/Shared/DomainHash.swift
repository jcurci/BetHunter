import Foundation

/// FNV-1a 64 bits sobre bytes ASCII minúsculos.
///
/// Este é o CONTRATO entre o escritor (BlocklistStore, no app) e o leitor
/// (BlocklistIndex, na extensão). Os dois processos precisam produzir exatamente
/// o mesmo hash para o mesmo domínio.
///
/// NUNCA use `String.hashValue` ou `Hasher` do Swift aqui: eles são semeados por
/// processo, então app e extensão produziriam valores diferentes e o índice
/// inteiro deixaria de casar — silenciosamente, sem erro nenhum.
///
/// Risco de colisão: com n = 300.000 num espaço de 64 bits,
/// P(alguma colisão) ≈ n²/2^65 ≈ 2,4×10⁻⁹. E uma colisão só faz um domínio a
/// mais ser bloqueado — a direção benigna para um app de autoexclusão.
enum DomainHash {

  static let offsetBasis: UInt64 = 0xcbf2_9ce4_8422_2325
  static let prime: UInt64 = 0x0000_0100_0000_01B3

  /// Hash de um buffer de bytes já normalizado (minúsculo, sem espaços).
  @inline(__always)
  static func fnv1a64(_ bytes: UnsafeBufferPointer<UInt8>) -> UInt64 {
    var hash = offsetBasis
    for byte in bytes {
      hash ^= UInt64(byte)
      hash = hash &* prime
    }
    return hash
  }

  /// Overload para uma fatia de array — o caminho quente da caminhada de sufixo,
  /// que fatia o buffer do domínio sem alocar nada.
  @inline(__always)
  static func fnv1a64(_ bytes: ArraySlice<UInt8>) -> UInt64 {
    var hash = offsetBasis
    for byte in bytes {
      hash ^= UInt64(byte)
      hash = hash &* prime
    }
    return hash
  }

  /// Conveniência para o escritor e para os testes. Não usar no hot path da
  /// extensão: alocar String por query DNS é justamente o que queremos evitar.
  static func hash(domain: String) -> UInt64 {
    let bytes = Array(domain.lowercased().utf8)
    return bytes.withUnsafeBufferPointer { fnv1a64($0) }
  }
}
