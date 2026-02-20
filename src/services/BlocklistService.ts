/**
 * Serviço de atualização da blocklist Hagezi (Gambling).
 * Baixa, parseia e persiste a lista de domínios; fornece formatos para Android (array)
 * e iOS Content Blocker (regras JSON, limite 50k).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setBlockedDomainsCache,
  getBlockedDomainsCache,
  getBlocklistUpdatedAt,
} from '../native';

const HAGEZI_GAMBLING_URL =
  'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/gambling.txt';

const IOS_CONTENT_BLOCKER_MAX_RULES = 50000;

/**
 * Baixa o conteúdo da lista e retorna linhas (sem comentários/vazios)
 */
async function fetchBlocklistRaw(): Promise<string[]> {
  const response = await fetch(HAGEZI_GAMBLING_URL);
  if (!response.ok) {
    throw new Error(`Blocklist: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    out.push(trimmed.toLowerCase());
  }
  return out;
}

/**
 * Remove duplicatas e retorna array de domínios
 */
function parseAndDedupe(lines: string[]): string[] {
  const set = new Set<string>();
  for (const line of lines) {
    const domain = line.trim().toLowerCase();
    if (domain) set.add(domain);
  }
  return Array.from(set);
}

/**
 * Baixa a lista Hagezi Gambling, parseia, remove duplicatas e persiste.
 * Atualiza timestamp em AsyncStorage.
 */
export async function updateBlocklist(): Promise<string[]> {
  const lines = await fetchBlocklistRaw();
  const domains = parseAndDedupe(lines);
  await setBlockedDomainsCache(domains);
  return domains;
}

/**
 * Retorna a lista de domínios em cache (array para Android VPN / uso geral).
 */
export async function getBlocklistAsDomainArray(): Promise<string[]> {
  const cached = await getBlockedDomainsCache();
  if (cached.length > 0) return cached;
  return [];
}

/**
 * Converte domínios para regras do Safari Content Blocker (iOS).
 * Formato: { trigger: { "url-filter": ".*domain\\.com.*" }, action: { type: "block" } }
 * Limite iOS: 50.000 regras; retorna no máximo os primeiros 50k.
 */
export function getBlocklistAsContentBlockerRules(domains: string[]): object[] {
  const rules: object[] = [];
  const limit = Math.min(domains.length, IOS_CONTENT_BLOCKER_MAX_RULES);
  for (let i = 0; i < limit; i++) {
    const domain = domains[i];
    const escaped = domain.replace(/\./g, '\\.').replace(/\*/g, '.*');
    const urlFilter = escaped.startsWith('.*') ? escaped : `.*${escaped}.*`;
    rules.push({
      trigger: { 'url-filter': urlFilter },
      action: { type: 'block' },
    });
  }
  return rules;
}

/**
 * Retorna a lista em formato Content Blocker a partir do cache.
 */
export async function getCachedBlocklistAsContentBlockerRules(): Promise<object[]> {
  const domains = await getBlocklistAsDomainArray();
  return getBlocklistAsContentBlockerRules(domains);
}

/**
 * Timestamp da última atualização (ms) ou null
 */
export async function getLastUpdateTimestamp(): Promise<number | null> {
  return getBlocklistUpdatedAt();
}

/**
 * Tenta atualizar a lista; em falha de rede, retorna o cache existente.
 */
export async function updateBlocklistWithFallback(): Promise<string[]> {
  try {
    return await updateBlocklist();
  } catch (e) {
    const cached = await getBlockedDomainsCache();
    if (cached.length > 0) return cached;
    throw e;
  }
}
