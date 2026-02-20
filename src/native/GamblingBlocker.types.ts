/**
 * Tipos do módulo de bloqueio de apostas (bridge nativo + persistência)
 */

export interface BlockerConfig {
  enabled: boolean;
  blockedDomains: string[];
  blockedApps: string[];
  useVPN: boolean;
  useDNS: boolean;
  useAppBlocker: boolean;
  useScreenTime: boolean;
}

export interface BlockAttempt {
  timestamp: number;
  domain?: string;
  appIdentifier?: string;
  layer?: string;
}

export interface BlockerStatus {
  active: boolean;
  layers: string[];
}

export interface PermissionStatus {
  vpn: 'granted' | 'denied' | 'unknown';
  accessibility?: 'granted' | 'denied' | 'unknown';
  usageStats?: 'granted' | 'denied' | 'unknown';
  notification?: 'granted' | 'denied' | 'unknown';
}

export const BLOCKER_STORAGE_KEYS = {
  enabled: '@BetHunter:blocker:enabled',
  blockedDomainsCache: '@BetHunter:blocker:blocked_domains_cache',
  blockedAppsList: '@BetHunter:blocker:blocked_apps_list',
  blocklistUpdatedAt: '@BetHunter:blocker:blocklist_updated_at',
} as const;
