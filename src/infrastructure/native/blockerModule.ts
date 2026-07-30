import { NativeModules, Platform } from 'react-native';

/**
 * Superfície tipada dos módulos nativos do bloqueador.
 *
 * O JS falava com os módulos via `NativeModules.X?.metodo?.()` espalhado por
 * ~15 ramos de `Platform.OS` em Home.tsx, sem tipos. Como tudo usa optional
 * chaining, um método que não exista no bridge nativo falha em silêncio — foi
 * exatamente assim que `syncAuthSession` ficou morto no iOS por vários commits
 * sem ninguém perceber.
 *
 * Esta interface é a fonte da verdade do contrato. Ao adicionar um método aqui,
 * ele precisa existir em:
 *   - Android: `BetBlockerModule.kt` com `@ReactMethod`
 *   - iOS:     `BetBlockingModule.swift` **e** `BetBlockingModule.m`
 */
export interface ProtectionStatus {
  supported: boolean;
  enabled?: boolean;
  /** Pausado por assinatura inativa. A intenção do usuário está preservada. */
  paused?: boolean;
  /** Disjuntor abriu: o filtro está em passthrough por problema técnico. */
  degraded?: boolean;
  tunnelStatus?: string;
  blockedDomains?: number;
  strictMode?: boolean;
}

/**
 * Estado da "VPN sempre ativa" (Android always-on VPN).
 *
 * `state` tem TRÊS valores de propósito: não existe API pública para ler
 * always-on, então a detecção é heurística (Settings.Secure + o sistema tendo
 * subido o serviço + autoatestado do usuário). `unknown` significa "não foi
 * possível determinar" e NUNCA deve ser tratado como desligado — só
 * `not_enabled` é uma negativa provada pelo sistema.
 */
export interface AlwaysOnVpnStatus {
  state: 'confirmed' | 'not_enabled' | 'unknown';
  /** Confirmado por Settings.Secure — a evidência mais forte. */
  detectedBySetting: boolean;
  /** O sistema subiu o VpnService por conta própria (só o always-on faz isso). */
  detectedBySystemStart: boolean;
  /** O usuário afirmou ter ativado, sem confirmação do sistema. */
  userAttested: boolean;
  /** "Bloquear conexões sem VPN". Só confiável quando `lockdownKnown`. */
  lockdown: boolean;
  lockdownKnown: boolean;
  /** Outro app é a VPN sempre ativa — impede a nossa de rodar. */
  blockedByOtherApp: boolean;
}

export interface OpenAlwaysOnResult {
  opened: boolean;
  /**
   * Sempre `false` hoje: não existe intent público para a página por-app da VPN.
   * Ver o comentário de `openAlwaysOnVpnSettings` em BetBlockerModule.kt.
   */
  deepLinked: boolean;
  target: 'vpn_settings' | 'settings' | 'app_details' | 'none';
}

interface BlockerNativeModule {
  openBlockingFlow?: () => void;
  /** iOS: no-op (autoexclusão). Android: desativação explícita. */
  stopBlocking?: () => void;
  /** Pausa por assinatura — preserva a intenção para religar sozinho. */
  pauseBlocking?: () => void;
  resumeBlocking?: () => void;
  /**
   * Renova a licença que o próprio serviço de VPN confere para continuar
   * filtrando, em epoch millis absolutos. Separado de [resumeBlocking], que sai
   * cedo quando o usuário não estava pausado e por isso não serve como caminho
   * de renovação de quem está com tudo em dia.
   */
  renewPremiumLease?: (untilMs: number) => void;
  openVpnSettings?: () => void;
  syncAuthSession?: (token: string, apiBaseUrl: string) => void;
  clearAuthSession?: () => void;
  setTunnelEnabled?: (enabled: boolean) => void;
  isBlockingEnabled?: () => Promise<boolean>;
  getProtectionStatus?: () => Promise<ProtectionStatus>;
  checkAndSyncBlockingStatus?: () => Promise<boolean>;
  /** Android resolve `boolean` (mudou/não mudou); iOS resolve a contagem. */
  refreshBlockedDomains?: () => Promise<number | boolean>;

  // ── Android-only (`BetBlockerModule.kt`) ──────────────────────────────────
  // Declarados aqui porque a omissão fazia esta interface mentir por silêncio:
  // Home.tsx consome todos eles via `NativeModules.BetBlocker` sem tipo algum.
  startBlocking?: () => Promise<boolean>;
  isDeviceAdminActive?: () => Promise<boolean>;
  requestDeviceAdmin?: () => Promise<boolean>;
  isBatteryOptimizationExempt?: () => Promise<boolean>;
  requestBatteryExemption?: () => Promise<boolean>;
  isBatteryExemptionRequested?: () => Promise<boolean>;
  confirmBatteryExceptionManually?: () => Promise<boolean>;
  isBatteryWarningSuppressed?: () => Promise<boolean>;
  getManufacturerInfo?: () => Promise<{ isXiaomi: boolean }>;
  openAutoStartSettings?: () => Promise<boolean>;
  getVpnEventLog?: () => Promise<string>;

  // VPN sempre ativa — passo obrigatório da jornada de ativação.
  // Ver docs/jornada-unica-ativacao-bloqueio.md §3.7.
  openAlwaysOnVpnSettings?: () => Promise<OpenAlwaysOnResult>;
  getAlwaysOnVpnStatus?: () => Promise<AlwaysOnVpnStatus>;
  /** Resolve `false` quando o sistema prova que a opção está desligada. */
  confirmAlwaysOnManually?: () => Promise<boolean>;
}

export function blockerModule(): BlockerNativeModule | undefined {
  return Platform.OS === 'android'
    ? NativeModules.BetBlocker
    : NativeModules.BetBlocking;
}

/** `true` se o módulo nativo está presente. Útil para diagnosticar bridge quebrado. */
export function isBlockerAvailable(): boolean {
  return blockerModule() != null;
}

export async function getProtectionStatus(): Promise<ProtectionStatus> {
  try {
    const status = await blockerModule()?.getProtectionStatus?.();
    return status ?? { supported: false };
  } catch (e) {
    if (__DEV__) console.warn('[blockerModule] getProtectionStatus failed', e);
    return { supported: false };
  }
}

/**
 * Estado da VPN sempre ativa. FAIL-CLOSED: qualquer falha vira `unknown` com
 * todos os sinais negativos, e o passo obrigatório é pedido de novo — repetir um
 * pedido cumprido é melhor que declarar protegido quem não está.
 */
export async function getAlwaysOnVpnStatus(): Promise<AlwaysOnVpnStatus> {
  const fallback: AlwaysOnVpnStatus = {
    state: 'unknown',
    detectedBySetting: false,
    detectedBySystemStart: false,
    userAttested: false,
    lockdown: false,
    lockdownKnown: false,
    blockedByOtherApp: false,
  };
  try {
    const status = await blockerModule()?.getAlwaysOnVpnStatus?.();
    return status ?? fallback;
  } catch (e) {
    if (__DEV__) console.warn('[blockerModule] getAlwaysOnVpnStatus failed', e);
    return fallback;
  }
}

/** Abre a tela de VPN do sistema, devolvendo qual nível de tela foi alcançado. */
export async function openAlwaysOnVpnSettings(): Promise<OpenAlwaysOnResult> {
  try {
    const result = await blockerModule()?.openAlwaysOnVpnSettings?.();
    return result ?? { opened: false, deepLinked: false, target: 'none' };
  } catch (e) {
    if (__DEV__) console.warn('[blockerModule] openAlwaysOnVpnSettings failed', e);
    return { opened: false, deepLinked: false, target: 'none' };
  }
}

/** Registra o autoatestado. `false` = o sistema provou que está desligada. */
export async function confirmAlwaysOnManually(): Promise<boolean> {
  try {
    return !!(await blockerModule()?.confirmAlwaysOnManually?.());
  } catch (e) {
    if (__DEV__) console.warn('[blockerModule] confirmAlwaysOnManually failed', e);
    return false;
  }
}

/**
 * Kill switch remoto: desliga a filtragem sem desinstalar o túnel.
 *
 * É o que permite estancar um bug em campo sem esperar review da Apple, e a
 * razão para o rollout não ir direto de 0 a 100%.
 */
export function setTunnelEnabled(enabled: boolean): void {
  try {
    blockerModule()?.setTunnelEnabled?.(enabled);
  } catch (e) {
    if (__DEV__) console.warn('[blockerModule] setTunnelEnabled failed', e);
  }
}
