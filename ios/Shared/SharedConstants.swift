import Foundation

/// Constantes compartilhadas entre o app e a extensão PacketTunnel.
///
/// Este arquivo é compilado nos DOIS targets e por isso não pode importar
/// FamilyControls, ManagedSettings nem qualquer framework que a extensão não
/// linke. É por isso que as chaves do App Group vivem aqui como strings cruas em
/// vez de virem do `AppGroupHelper` (que importa FamilyControls e é exclusivo do
/// target do app).
enum SharedConstants {

  // MARK: - App Group

  static let appGroupID = "group.com.bethunter.app.rick"

  /// Bundle ID do target da extensão. Tem de coincidir com
  /// PRODUCT_BUNDLE_IDENTIFIER de PacketTunnel no pbxproj.
  static let tunnelBundleID = "com.bethunter.app.rick.PacketTunnel"

  enum Keys {
    /// Intenção do usuário: a proteção deve estar ligada.
    /// Continua `true` durante uma pausa por assinatura.
    static let protectionEnabled = "protectionEnabled"
    /// Pausa temporária por assinatura expirada. Preserva `protectionEnabled`.
    static let premiumPaused = "premium_paused"
    /// Incrementado a cada reconstrução do índice; a extensão compara para
    /// decidir se re-abre o mmap.
    static let blocklistGeneration = "blocklist_generation"
    static let blocklistCount = "blocklist_count"
    static let blocklistBuiltAt = "blocklist_built_at"
    static let blocklistETag = "blocklist_etag"
    /// Marcado pela extensão quando o disjuntor entra em passthrough.
    static let tunnelDegraded = "tunnel_degraded"
    static let tunnelDegradedAt = "tunnel_degraded_at"
    /// Só para diagnóstico na UI — nunca usado para decidir bloqueio.
    static let tunnelLastStart = "tunnel_last_start"

    static let familyActivitySelection = "familyActivitySelectionData"
    static let authAPIBaseURL = "auth_api_base_url"

    /// Chave legada: array de ~300k strings que inflava o plist do App Group.
    /// Mantida só para a migração de remoção. Ver BlocklistStore.migrateLegacyStorage().
    static let legacyBlockedDomainsList = "blocked_domains_list"
  }

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupID)
  }

  // MARK: - Arquivo do índice de blocklist

  static let blocklistDirectoryName = "Blocklist"
  static let blocklistFileName = "blocklist.v1.bin"

  /// Container compartilhado. `nil` se o App Group não estiver provisionado —
  /// o chamador tem de tratar, não force-unwrap.
  static var containerURL: URL? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID)
  }

  static var blocklistDirectoryURL: URL? {
    containerURL?.appendingPathComponent(blocklistDirectoryName, isDirectory: true)
  }

  static var blocklistFileURL: URL? {
    blocklistDirectoryURL?.appendingPathComponent(blocklistFileName)
  }

  // MARK: - Endereçamento do túnel

  /// Faixa RFC 2544 (benchmark). Nunca é roteada na internet pública e, ao
  /// contrário de 10/8 ou 192.168/16, não colide com a LAN de casa nem com CGNAT
  /// de operadora — o que evita quebrar a rede do usuário.
  enum Tunnel {
    static let remoteAddress = "127.0.0.1"

    static let ipv4Address = "198.18.0.1"
    static let ipv4SubnetMask = "255.255.255.252"
    static let ipv4DNSServer = "198.18.0.2"

    /// ULA (fd00::/8) com prefixo global aleatório fixo.
    /// IPv6 não é opcional: Vivo, Claro e TIM rodam IPv6/NAT64 amplamente, e num
    /// trecho IPv6-only um túnel só-IPv4 vaza TODAS as queries em silêncio.
    static let ipv6Address = "fd6e:a81b:704f:1211::1"
    static let ipv6PrefixLength: NSNumber = 64
    static let ipv6DNSServer = "fd6e:a81b:704f:1211::2"

    /// Conservador de propósito: evita jogos de PMTU discovery em celular.
    static let mtu: NSNumber = 1400
  }

  // MARK: - Upstreams

  /// Quad9. Deliberadamente NÃO 1.1.1.1 / 8.8.8.8: esses estão no conjunto de
  /// rotas blackhole (DoHEndpoints), e usar o mesmo IP como blackhole e como
  /// upstream é uma armadilha mesmo que a isenção de socket do provider salve
  /// hoje. Há um assert em DoHEndpoints.validateNoUpstreamCollision().
  enum Upstream {
    static let primaryIPv4 = "9.9.9.9"
    static let secondaryIPv4 = "149.112.112.112"
    static let primaryIPv6 = "2620:fe::fe"
    static let secondaryIPv6 = "2620:fe::9"
    static let port: UInt16 = 53

    static var allIPv4: [String] { [primaryIPv4, secondaryIPv4] }
    static var allIPv6: [String] { [primaryIPv6, secondaryIPv6] }
    static var all: [String] { allIPv4 + allIPv6 }
  }

  // MARK: - Logging

  static let logSubsystem = "com.bethunter.app"
  static let logCategoryTunnel = "PacketTunnel"
  static let logCategoryBlocklist = "Blocklist"
}
