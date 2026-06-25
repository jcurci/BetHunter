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
if (APP_ENV !== 'development') {
  const required = [
    'EXPO_PUBLIC_API_BASE_URL',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
    'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.warn(`[app.config.ts] Missing vars for ${APP_ENV}: ${missing.join(', ')}`);
  }
}

const GOOGLE_SIGNIN_PKG = '@react-native-google-signin/google-signin';
const IOS_SUFFIX = '.apps.googleusercontent.com';
const IOS_BUNDLE_IDENTIFIER = 'com.bethunter.app.rick';
const ANDROID_PACKAGE = 'com.bethunter.app';

function iosUrlSchemeFromClientId(clientId: string): string | null {
  if (!clientId || !clientId.endsWith(IOS_SUFFIX)) return null;
  const prefix = clientId.slice(0, -IOS_SUFFIX.length);
  return `com.googleusercontent.apps.${prefix}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
  const revenueCatLegacy = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';
  const revenueCatIosApiKey =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || revenueCatLegacy;
  const revenueCatAndroidApiKey =
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || revenueCatLegacy;
  const revenueCatDefaultOfferingIdentifier =
    process.env.EXPO_PUBLIC_REVENUECAT_DEFAULT_OFFERING_IDENTIFIER || '';

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
      ...(config.extra ?? {}),
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
