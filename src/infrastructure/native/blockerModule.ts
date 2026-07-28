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
  refreshBlockedDomains?: () => Promise<number>;
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
