import { ExpoConfig, ConfigContext } from 'expo/config';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadDotenv(): void {
  const paths = [
    resolve(__dirname, '.env'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      if (!key.startsWith('EXPO_PUBLIC_')) continue;
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}

loadDotenv();

const APP_ENV = process.env.APP_ENV || 'development';
const IS_STORE_LIKE = APP_ENV === 'production' || APP_ENV === 'staging';

const GOOGLE_SIGNIN_PKG = '@react-native-google-signin/google-signin';
const IOS_SUFFIX = '.apps.googleusercontent.com';
const IOS_BUNDLE_IDENTIFIER = 'com.bethunter.app.rick';
const ANDROID_PACKAGE = 'com.bethunter.app';

function iosUrlSchemeFromClientId(clientId: string): string | null {
  if (!clientId || !clientId.endsWith(IOS_SUFFIX)) return null;
  const prefix = clientId.slice(0, -IOS_SUFFIX.length);
  return `com.googleusercontent.apps.${prefix}`;
}

function extraString(extra: Record<string, unknown> | undefined, key: string): string {
  const value = extra?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

/** Public SDK keys only. Skip Test Store (`test_`) when a valid appl_/goog_ exists. */
function resolvePublicSdkKey(
  preferred: string | undefined,
  legacy: string | undefined,
  fromExtra: string,
  expectedPrefix: 'appl_' | 'goog_',
  label: string,
): string {
  const candidates = [preferred, legacy, fromExtra]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);

  // Dev/simulador: se o desenvolvedor definiu EXPLICITAMENTE uma chave test_
  // (RevenueCat Test Store) na fonte preferida (.env), respeita a intenção.
  // Em builds de loja (IS_STORE_LIKE) o test_ continua bloqueado logo abaixo.
  if (!IS_STORE_LIKE) {
    const preferredTrim = typeof preferred === 'string' ? preferred.trim() : '';
    if (preferredTrim.startsWith('test_')) return preferredTrim;
  }

  for (const key of candidates) {
    // Sempre ignora test_ — não aborta só porque um fallback legado ainda é test_.
    if (key.startsWith('test_')) continue;
    if (key.startsWith(expectedPrefix)) return key;
  }

  if (IS_STORE_LIKE) {
    throw new Error(
      `[app.config.ts] ${label} ausente ou inválida para ${APP_ENV}. ` +
        `Defina EXPO_PUBLIC_… com prefixo ${expectedPrefix} (não use test_…).`,
    );
  }

  // Dev: permite test_ se for a única opção (SDK só crasha em Release).
  const testKey = candidates.find((k) => k.startsWith('test_'));
  return testKey ?? candidates[0] ?? '';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const existingExtra = (config.extra ?? {}) as Record<string, unknown>;

  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    extraString(existingExtra, 'API_BASE_URL') ||
    'http://127.0.0.1:3000';

  if (IS_STORE_LIKE && (!apiBaseUrl || apiBaseUrl.includes('127.0.0.1') || apiBaseUrl.includes('10.0.2.2'))) {
    throw new Error(
      `[app.config.ts] EXPO_PUBLIC_API_BASE_URL inválida para ${APP_ENV}: "${apiBaseUrl}". Use a URL pública da API.`,
    );
  }

  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    extraString(existingExtra, 'GOOGLE_WEB_CLIENT_ID');
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    extraString(existingExtra, 'GOOGLE_IOS_CLIENT_ID');
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    extraString(existingExtra, 'GOOGLE_ANDROID_CLIENT_ID');

  if (IS_STORE_LIKE) {
    const required = {
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: googleWebClientId,
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: googleIosClientId,
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: googleAndroidClientId,
    };
    const missing = Object.entries(required)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      throw new Error(
        `[app.config.ts] Variáveis obrigatórias ausentes para ${APP_ENV}: ${missing.join(', ')}`,
      );
    }
  }

  const revenueCatIosApiKey = resolvePublicSdkKey(
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    extraString(existingExtra, 'REVENUECAT_IOS_API_KEY'),
    'appl_',
    'REVENUECAT_IOS_API_KEY',
  );
  const revenueCatAndroidApiKey = resolvePublicSdkKey(
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    extraString(existingExtra, 'REVENUECAT_ANDROID_API_KEY'),
    'goog_',
    'REVENUECAT_ANDROID_API_KEY',
  );
  const revenueCatDefaultOfferingIdentifier =
    process.env.EXPO_PUBLIC_REVENUECAT_DEFAULT_OFFERING_IDENTIFIER ||
    extraString(existingExtra, 'REVENUECAT_DEFAULT_OFFERING_IDENTIFIER') ||
    'default';

  const iosUrlScheme = iosUrlSchemeFromClientId(googleIosClientId);

  const existingPlugins = (config.plugins ?? []).filter(
    (p) =>
      p !== GOOGLE_SIGNIN_PKG &&
      !(Array.isArray(p) && p[0] === GOOGLE_SIGNIN_PKG),
  );

  const googlePlugin: [string, Record<string, string>] | string = iosUrlScheme
    ? [GOOGLE_SIGNIN_PKG, { iosUrlScheme }]
    : GOOGLE_SIGNIN_PKG;

  return {
    ...config,
    name: config.name ?? 'BetHunter',
    slug: config.slug ?? 'bethunter',
    ios: {
      ...(config.ios ?? {}),
      bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
    },
    android: {
      ...(config.android ?? {}),
      package: ANDROID_PACKAGE,
    },
    plugins: [...existingPlugins, googlePlugin],
    extra: {
      ...existingExtra,
      API_BASE_URL: apiBaseUrl,
      GOOGLE_WEB_CLIENT_ID: googleWebClientId,
      GOOGLE_IOS_CLIENT_ID: googleIosClientId,
      GOOGLE_ANDROID_CLIENT_ID: googleAndroidClientId,
      REVENUECAT_IOS_API_KEY: revenueCatIosApiKey,
      REVENUECAT_ANDROID_API_KEY: revenueCatAndroidApiKey,
      REVENUECAT_DEFAULT_OFFERING_IDENTIFIER: revenueCatDefaultOfferingIdentifier,
    },
  };
};
