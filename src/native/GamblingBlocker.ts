/**
 * Interface unificada do bloqueio de apostas.
 * Usa NativeModules.GamblingBlocker quando disponível (dev build);
 * fallback para stubs + AsyncStorage em Expo Go ou quando o módulo nativo não existe.
 */

import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BlockerConfig,
  BlockAttempt,
  BlockerStatus,
  PermissionStatus,
} from './GamblingBlocker.types';
import { BLOCKER_STORAGE_KEYS } from './GamblingBlocker.types';

const { GamblingBlocker: NativeBlocker } = NativeModules;

const hasNativeModule = NativeBlocker != null;

async function getStoredEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.enabled);
    return v === 'true';
  } catch {
    return false;
  }
}

async function setStoredEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BLOCKER_STORAGE_KEYS.enabled, String(enabled));
}

async function getStoredDomains(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.blockedDomainsCache);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getStoredApps(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.blockedAppsList);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getStoredBlocklistUpdatedAt(): Promise<number | null> {
  try {
    const v = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.blocklistUpdatedAt);
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function enableBlocker(config: BlockerConfig): Promise<boolean> {
  if (hasNativeModule && typeof NativeBlocker.enableBlocker === 'function') {
    const result = await NativeBlocker.enableBlocker(config);
    await setStoredEnabled(!!result);
    return !!result;
  }
  await setStoredEnabled(config.enabled);
  return config.enabled;
}

export async function disableBlocker(): Promise<boolean> {
  if (hasNativeModule && typeof NativeBlocker.disableBlocker === 'function') {
    const result = await NativeBlocker.disableBlocker();
    await setStoredEnabled(false);
    return !!result;
  }
  await setStoredEnabled(false);
  return true;
}

export async function getStatus(): Promise<BlockerStatus> {
  if (hasNativeModule && typeof NativeBlocker.getStatus === 'function') {
    return NativeBlocker.getStatus();
  }
  const enabled = await getStoredEnabled();
  return {
    active: enabled,
    layers: enabled ? ['storage'] : [],
  };
}

export async function updateBlocklist(): Promise<void> {
  if (hasNativeModule && typeof NativeBlocker.updateBlocklist === 'function') {
    await NativeBlocker.updateBlocklist();
    return;
  }
  // Sem módulo nativo: a lista é atualizada pelo BlocklistService e salva em AsyncStorage
  // O nativo lerá daqui quando existir
  return;
}

export async function addCustomDomain(domain: string): Promise<void> {
  const domains = await getStoredDomains();
  const normalized = domain.trim().toLowerCase();
  if (normalized && !domains.includes(normalized)) {
    domains.push(normalized);
    await AsyncStorage.setItem(
      BLOCKER_STORAGE_KEYS.blockedDomainsCache,
      JSON.stringify(domains),
    );
  }
  if (hasNativeModule && typeof NativeBlocker.addCustomDomain === 'function') {
    await NativeBlocker.addCustomDomain(domain);
  }
}

export async function addCustomApp(identifier: string): Promise<void> {
  const apps = await getStoredApps();
  const id = identifier.trim();
  if (id && !apps.includes(id)) {
    apps.push(id);
    await AsyncStorage.setItem(
      BLOCKER_STORAGE_KEYS.blockedAppsList,
      JSON.stringify(apps),
    );
  }
  if (hasNativeModule && typeof NativeBlocker.addCustomApp === 'function') {
    await NativeBlocker.addCustomApp(identifier);
  }
}

export async function getBlockedAttempts(): Promise<BlockAttempt[]> {
  if (hasNativeModule && typeof NativeBlocker.getBlockedAttempts === 'function') {
    return NativeBlocker.getBlockedAttempts();
  }
  return [];
}

export async function requestPermissions(): Promise<PermissionStatus> {
  if (hasNativeModule && typeof NativeBlocker.requestPermissions === 'function') {
    return NativeBlocker.requestPermissions();
  }
  return {
    vpn: 'unknown',
    accessibility: 'unknown',
    usageStats: 'unknown',
    notification: 'unknown',
  };
}

export async function checkPermissions(): Promise<PermissionStatus> {
  if (hasNativeModule && typeof NativeBlocker.checkPermissions === 'function') {
    return NativeBlocker.checkPermissions();
  }
  return {
    vpn: 'unknown',
    accessibility: 'unknown',
    usageStats: 'unknown',
    notification: 'unknown',
  };
}

/** Persistência: salvar lista de domínios (após download da blocklist) */
export async function setBlockedDomainsCache(domains: string[]): Promise<void> {
  await AsyncStorage.setItem(
    BLOCKER_STORAGE_KEYS.blockedDomainsCache,
    JSON.stringify(domains),
  );
  await AsyncStorage.setItem(
    BLOCKER_STORAGE_KEYS.blocklistUpdatedAt,
    String(Date.now()),
  );
}

export async function getBlockedDomainsCache(): Promise<string[]> {
  return getStoredDomains();
}

export async function getBlocklistUpdatedAt(): Promise<number | null> {
  return getStoredBlocklistUpdatedAt();
}

export function isNativeBlockerAvailable(): boolean {
  return hasNativeModule;
}

export { BLOCKER_STORAGE_KEYS };
export type { BlockerConfig, BlockAttempt, BlockerStatus, PermissionStatus };
