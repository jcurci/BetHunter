import Foundation

/// Porta de `KeywordMatcher.kt` (Android) como scanner de bytes.
///
/// Pega mirrors de casas de aposta que ainda não entraram na blocklist exata
/// (ex.: a família `23bet*`, rotacionada mais rápido do que a lista remota
/// consegue mapear).
///
/// Roda por query DNS. `NSRegularExpression` aqui significaria bridging de String
/// e alocação a cada consulta, então a regra `(^|[.-])(\d*bet\d*)([.-]|$)` do
/// Android está reimplementada como varredura de bytes, sem alocar nada.
///
/// Este matcher NÃO consulta allowlist. `NeverBlockAllowlist` tem prioridade
/// máxima e é checada antes dele na ordem de avaliação do provider.
enum GamblingKeywordMatcher {

  /// Marcas e tokens fortes de aposta, checados por substring no domínio
  /// normalizado. Vários já contêm "bet" grudado em letras (betano, betfair) e
  /// por isso não são pegos pela regra do `bet` — precisam estar aqui.
  ///
  /// Nota de paridade: "sportsbet" está na lista, então `sportsbetting.com`
  /// casa. É over-block, e é intencional — o Android se comporta assim.
  static let keywords: [[UInt8]] = [
    "aposta", "cassino", "casino",
    "betano", "betfair", "betnacional", "betsson", "betwarrior", "bet7k",
    "1xbet", "sportingbet", "sportsbet", "estrelabet", "vaidebet", "superbet",
    "novibet", "parimatch", "pixbet", "brazino", "blaze", "stake", "galera.bet",
  ].map { Array($0.utf8) }

  private static let dot = UInt8(ascii: ".")
  private static let hyphen = UInt8(ascii: "-")
  private static let zero = UInt8(ascii: "0")
  private static let nine = UInt8(ascii: "9")
  private static let b = UInt8(ascii: "b")
  private static let e = UInt8(ascii: "e")
  private static let t = UInt8(ascii: "t")

  /// `true` se o domínio normalizado tem cara de casa de aposta.
  static func isGamblingDomain(_ bytes: ArraySlice<UInt8>) -> Bool {
    guard !bytes.isEmpty else { return false }
    if matchesBetRule(bytes) { return true }
    return containsKeyword(bytes)
  }

  static func isGamblingDomain(_ domain: String) -> Bool {
    let bytes = Array(domain.lowercased().utf8)
    return isGamblingDomain(bytes[...])
  }

  // MARK: - Regra do "bet"

  /// Equivalente a `(^|[.-])(\d*bet\d*)([.-]|$)`.
  ///
  /// "bet" só conta quando é palavra isolada ou vem grudada em dígitos, delimitada
  /// por início/fim ou por ponto/hífen. Casa: bet.com, bet365, 23bet36,
  /// estrela-bet.com. Não casa: betterment.com, abet.com.
  private static func matchesBetRule(_ bytes: ArraySlice<UInt8>) -> Bool {
    let start = bytes.startIndex
    let end = bytes.endIndex
    guard bytes.count >= 3 else { return false }

    var i = start
    while i <= end - 3 {
      guard bytes[i] == b, bytes[i + 1] == e, bytes[i + 2] == t else {
        i += 1
        continue
      }

      // Anda para a esquerda sobre dígitos, depois exige fronteira.
      var left = i
      while left > start, isDigit(bytes[left - 1]) { left -= 1 }
      let leftOK = (left == start) || bytes[left - 1] == dot || bytes[left - 1] == hyphen

      // Anda para a direita sobre dígitos, depois exige fronteira.
      var right = i + 3
      while right < end, isDigit(bytes[right]) { right += 1 }
      let rightOK = (right == end) || bytes[right] == dot || bytes[right] == hyphen

      if leftOK && rightOK { return true }
      i += 1
    }
    return false
  }

  @inline(__always)
  private static func isDigit(_ byte: UInt8) -> Bool {
    byte >= zero && byte <= nine
  }

  // MARK: - Keywords

  private static func containsKeyword(_ bytes: ArraySlice<UInt8>) -> Bool {
    for keyword in keywords where contains(bytes, keyword) {
      return true
    }
    return false
  }

  private static func contains(_ haystack: ArraySlice<UInt8>, _ needle: [UInt8]) -> Bool {
    guard !needle.isEmpty, haystack.count >= needle.count else { return false }
    let last = haystack.endIndex - needle.count
    var i = haystack.startIndex
    while i <= last {
      var matched = true
      var j = 0
      while j < needle.count {
        if haystack[i + j] != needle[j] {
          matched = false
          break
        }
        j += 1
      }
      if matched { return true }
      i += 1
    }
    return false
  }
}
