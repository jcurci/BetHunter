import Foundation

/// Contramedidas a DNS criptografado.
///
/// Notícia boa específica do iOS: Chrome e Firefox no iOS **não** implementam DoH
/// próprio — as regras da App Store os obrigam a usar WKWebView e a stack de rede
/// do sistema. O buraco grande que existe no Android (Secure DNS do Chrome) não
/// existe aqui. As ameaças reais que sobram são perfis de DNS instalados pelo
/// usuário, apps dedicados de DoH e o iCloud Private Relay.
///
/// Duas camadas:
///
/// - **Nomes**: mesclados no índice pelo `BlocklistStore`, então resolver o
///   hostname de um provedor de DoH devolve NXDOMAIN.
/// - **Rotas blackhole**: adicionadas a `includedRoutes` do túnel. Tudo que é
///   roteado para dentro e não é UDP/53 ao resolver falso é descartado, então os
///   IPs conhecidos ficam inalcançáveis mesmo com o hostname em cache. É o
///   análogo das rotas /32 de `BetBlockerVpnService.kt`.
enum DoHEndpoints {

  /// Hostnames de resolvers criptografados e do Private Relay.
  static let hostnames: [String] = [
    // DoH/DoT públicos
    "dns.google",
    "cloudflare-dns.com",
    "mozilla.cloudflare-dns.com",
    "one.one.one.one",
    "dns.nextdns.io",
    "doh.opendns.com",
    "dns.adguard-dns.com",
    "dns.adguard.com",
    "doh.cleanbrowsing.org",
    "dns.controld.com",
    "doh.mullvad.net",
    "dns.digitale-gesellschaft.ch",

    // iCloud Private Relay. Os nomes de setup são resolvidos convencionalmente,
    // então NXDOMAIN aqui atrapalha o Relay — mas não o impede por completo.
    // Ver a matriz de bypass: Private Relay tem de ser desligado pelo usuário.
    "mask.icloud.com",
    "mask-h2.icloud.com",
    "mask-api.icloud.com",

    // Canário do Firefox: NXDOMAIN aqui desliga o Trusted Recursive Resolver.
    "use-application-dns.net",
  ]

  struct Route {
    let address: String
    /// Máscara para IPv4, comprimento de prefixo para IPv6.
    let mask: String
    let prefixLength: Int
  }

  /// Deliberadamente sem 9.9.9.9 / 149.112.112.112 (Quad9) — são os nossos
  /// upstreams. Ver `validateNoUpstreamCollision()`.
  static let blackholeIPv4: [Route] = [
    Route(address: "1.1.1.1", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "1.0.0.1", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "8.8.8.8", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "8.8.4.4", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "94.140.14.14", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "94.140.15.15", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "208.67.222.222", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "208.67.220.220", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "185.228.168.9", mask: "255.255.255.255", prefixLength: 32),
    Route(address: "76.76.2.0", mask: "255.255.255.0", prefixLength: 24),
    Route(address: "45.90.28.0", mask: "255.255.255.0", prefixLength: 24),
    Route(address: "45.90.30.0", mask: "255.255.255.0", prefixLength: 24),
  ]

  static let blackholeIPv6: [Route] = [
    Route(address: "2606:4700:4700::1111", mask: "", prefixLength: 128),
    Route(address: "2606:4700:4700::1001", mask: "", prefixLength: 128),
    Route(address: "2001:4860:4860::8888", mask: "", prefixLength: 128),
    Route(address: "2001:4860:4860::8844", mask: "", prefixLength: 128),
    Route(address: "2a10:50c0::ad1:ff", mask: "", prefixLength: 128),
    Route(address: "2a10:50c0::ad2:ff", mask: "", prefixLength: 128),
  ]

  /// Um IP que é ao mesmo tempo blackhole e upstream deixa o túnel incapaz de
  /// resolver qualquer coisa. Hoje a NE isenta os sockets do próprio provider das
  /// rotas que ele instala, mas depender disso é frágil — este check falha no
  /// startup do túnel e nos testes, em vez de virar um bug de campo.
  static func validateNoUpstreamCollision() -> [String] {
    let blackholed = Set(blackholeIPv4.map(\.address) + blackholeIPv6.map(\.address))
    return SharedConstants.Upstream.all.filter { blackholed.contains($0) }
  }
}
