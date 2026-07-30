import Foundation
import os

/// Disjuntor de segurança do túnel.
///
/// O pior desfecho deste projeto **não** é "não bloqueia" — é **"o iPhone ficou
/// sem internet"**. Um erro na síntese de pacote, no checksum de pseudo-header
/// IPv6 ou no forwarding mata todo o DNS do aparelho. O usuário não associa a
/// causa, culpa a operadora e desinstala o app. Isso é estritamente pior que o
/// bug que estamos consertando, e por isso precisa de uma trava explícita.
///
/// Em modo passthrough o túnel para de filtrar e apenas encaminha tudo verbatim,
/// mantendo-se de pé. O shield de apps do ManagedSettings continua ativo, então
/// nunca se cai a zero de proteção.
final class CircuitBreaker {

  private let log = Logger(
    subsystem: SharedConstants.logSubsystem,
    category: SharedConstants.logCategoryTunnel
  )

  /// Falhas consecutivas de upstream que disparam o passthrough.
  private static let consecutiveFailureThreshold = 20
  /// Volume mínimo antes de avaliar taxa de sucesso.
  private static let minimumVolumeForRate = 50
  private static let minimumSuccessRate = 0.10
  private static let windowDuration: TimeInterval = 60
  private static let probeInterval: TimeInterval = 60

  private(set) var isPassthrough = false

  private var consecutiveFailures = 0
  private var windowSuccesses = 0
  private var windowFailures = 0
  private var windowStart = Date()
  private var trippedAt: Date?

  /// Chamado quando o app pede explicitamente que o túnel não filtre
  /// (kill switch remoto). Independente da lógica de falha.
  var forcedPassthrough = false {
    didSet {
      if forcedPassthrough != oldValue {
        log.notice("Passthrough forçado: \(self.forcedPassthrough)")
      }
    }
  }

  var shouldFilter: Bool { !isPassthrough && !forcedPassthrough }

  // MARK: - Registro de resultados

  func recordSuccess() {
    consecutiveFailures = 0
    windowSuccesses += 1
    rollWindowIfNeeded()

    if isPassthrough {
      // Um sucesso do canário basta para voltar a filtrar: o upstream respondeu.
      reset()
    }
  }

  func recordFailure() {
    consecutiveFailures += 1
    windowFailures += 1
    rollWindowIfNeeded()

    guard !isPassthrough else { return }

    if consecutiveFailures >= Self.consecutiveFailureThreshold {
      trip(reason: "\(consecutiveFailures) falhas consecutivas de upstream")
      return
    }

    let total = windowSuccesses + windowFailures
    if total >= Self.minimumVolumeForRate {
      let rate = Double(windowSuccesses) / Double(total)
      if rate < Self.minimumSuccessRate {
        trip(reason: String(format: "taxa de sucesso %.1f%% em %d consultas", rate * 100, total))
      }
    }
  }

  /// `true` se está na hora de mandar uma query canário para testar a volta.
  func shouldProbe() -> Bool {
    guard isPassthrough, let trippedAt else { return false }
    return Date().timeIntervalSince(trippedAt) >= Self.probeInterval
  }

  func markProbeSent() {
    trippedAt = Date()
  }

  // MARK: - Transições

  private func trip(reason: String) {
    isPassthrough = true
    trippedAt = Date()
    log.error("Disjuntor aberto — passthrough ativado (\(reason, privacy: .public))")

    let defaults = SharedConstants.defaults
    defaults?.set(true, forKey: SharedConstants.Keys.tunnelDegraded)
    defaults?.set(Date().timeIntervalSince1970, forKey: SharedConstants.Keys.tunnelDegradedAt)
  }

  private func reset() {
    isPassthrough = false
    trippedAt = nil
    consecutiveFailures = 0
    windowSuccesses = 0
    windowFailures = 0
    windowStart = Date()
    log.notice("Disjuntor fechado — voltando a filtrar")
    SharedConstants.defaults?.set(false, forKey: SharedConstants.Keys.tunnelDegraded)
  }

  private func rollWindowIfNeeded() {
    guard Date().timeIntervalSince(windowStart) >= Self.windowDuration else { return }
    windowStart = Date()
    windowSuccesses = 0
    windowFailures = 0
  }
}
