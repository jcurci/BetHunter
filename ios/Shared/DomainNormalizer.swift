import Foundation

/// Porta fiel de `BlockedDomainsRepository.normalizeDomain` (Android).
///
/// A versão anterior desta lógica vivia em `BlocklistSyncService` e se dizia um
/// "espelho do Android", mas tinha perdido duas linhas na portabilidade:
/// `removePrefix("||")` e `removeSuffix("^")`. Como a blocklist usa sintaxe
/// AdGuard — 100% das ~311 mil linhas terminam em `^` — o `^` reprovava a
/// validação de charset e TODAS as linhas eram descartadas. O bloqueador iOS
/// rodava com os 5 domínios do fallback compilado.
///
/// Qualquer mudança aqui tem de ser espelhada em
/// `android/.../repository/BlockedDomainsRepository.kt`.
enum DomainNormalizer {

  /// Fração mínima de linhas que precisam virar domínio válido para a lista ser
  /// aceita. É a guarda que teria pego o bug do `^` sozinha, e que protege contra
  /// o mantenedor da lista mudar de formato no futuro.
  static let minimumParseYield = 0.5

  /// Normaliza uma linha da blocklist. Retorna `nil` se a linha não for um
  /// domínio válido (comentário, linha vazia, lixo).
  static func normalize(_ input: String?) -> String? {
    guard let input else { return nil }

    var candidate = input.trimmingCharacters(in: .whitespaces).lowercased()

    // Comentário com #
    if let range = candidate.range(of: "#") {
      candidate = String(candidate[..<range.lowerBound])
    }

    // Protocolo sai ANTES do corte de comentário `//`.
    //
    // Divergência deliberada do Android: `BlockedDomainsRepository.kt` faz
    // `.substringBefore("//")` antes de `.removePrefix("https://")`, então
    // "https://exemplo.com" vira "https:" e é descartado — e o removePrefix de
    // lá é código morto. A lista atual não usa esquema (aproveitamento 100%),
    // mas se passar a usar as linhas sumiriam em silêncio. Invertendo a ordem,
    // os dois casos funcionam: URL com esquema e comentário com `//`.
    for prefix in ["https://", "http://"] where candidate.hasPrefix(prefix) {
      candidate = String(candidate.dropFirst(prefix.count))
      break
    }

    if let range = candidate.range(of: "//") {
      candidate = String(candidate[..<range.lowerBound])
    }
    candidate = candidate.trimmingCharacters(in: .whitespaces)
    guard !candidate.isEmpty else { return nil }

    // Formato hosts file: "0.0.0.0 dominio.com" / "127.0.0.1 dominio.com"
    let tokens = candidate.components(separatedBy: .whitespaces).filter { !$0.isEmpty }
    guard let first = tokens.first else { return nil }
    if tokens.count > 1, first == "0.0.0.0" || first == "127.0.0.1" {
      candidate = tokens[1]
    } else {
      candidate = first
    }

    // Sintaxe AdGuard (||), wildcard, ponto inicial.
    // A ordem importa: "||exemplo.com^" -> "exemplo.com".
    for prefix in ["||", "*.", "."] where candidate.hasPrefix(prefix) {
      candidate = String(candidate.dropFirst(prefix.count))
    }

    // Path
    if let slashIndex = candidate.firstIndex(of: "/") {
      candidate = String(candidate[..<slashIndex])
    }

    // Separador de regra do AdGuard. Presente em 100% das linhas da lista atual.
    if candidate.hasSuffix("^") {
      candidate = String(candidate.dropLast())
    }

    // Pontos sobrando no fim (FQDN com root label explícito)
    candidate = candidate.trimmingCharacters(in: CharacterSet(charactersIn: "."))

    guard !candidate.isEmpty,
          candidate.count <= 253,
          candidate.contains(".")
    else { return nil }

    // Charset permitido: só ASCII minúsculo, dígitos, ponto e hífen.
    // Domínios IDN já chegam em punycode (xn--) da lista, então cabem aqui.
    let allowed = CharacterSet.lowercaseLetters
      .union(.decimalDigits)
      .union(CharacterSet(charactersIn: ".-"))
    guard candidate.unicodeScalars.allSatisfy({ allowed.contains($0) }) else { return nil }

    for label in candidate.components(separatedBy: ".") {
      guard !label.isEmpty,
            label.count <= 63,
            !label.hasPrefix("-"),
            !label.hasSuffix("-")
      else { return nil }
    }

    return candidate
  }

  /// Normaliza um texto inteiro de blocklist.
  ///
  /// Retorna os domínios e a taxa de aproveitamento, para o chamador poder
  /// aplicar `minimumParseYield` e rejeitar uma lista cujo formato mudou em vez
  /// de gravar um índice vazio por cima de um bom.
  static func normalizeAll(text: String) -> (domains: [String], yield: Double) {
    var domains: [String] = []
    var consideredLines = 0

    text.enumerateLines { line, _ in
      let trimmed = line.trimmingCharacters(in: .whitespaces)
      // Linhas vazias e comentários puros não contam contra o aproveitamento —
      // senão uma lista bem-formada com cabeçalho grande reprovaria à toa.
      guard !trimmed.isEmpty, !trimmed.hasPrefix("#"), !trimmed.hasPrefix("!") else { return }
      consideredLines += 1
      if let domain = normalize(trimmed) {
        domains.append(domain)
      }
    }

    guard consideredLines > 0 else { return ([], 0) }
    return (domains, Double(domains.count) / Double(consideredLines))
  }
}
