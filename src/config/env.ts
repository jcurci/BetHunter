import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function resolveApiBaseUrl(): string {
  if (extra.API_BASE_URL && typeof extra.API_BASE_URL === 'string') {
    return extra.API_BASE_URL.trim().replace(/\/$/, '');
  }

  if (__DEV__) {
    console.warn(
      '[ENV] EXPO_PUBLIC_API_BASE_URL não definida. Usando fallback localhost:3000.',
    );
    return 'http://127.0.0.1:3000';
  }

  // Soft-fail: throw no import derruba o app no launch (App Store Review).
  // Requests falham de forma controlada na camada de API.
  console.warn(
    '[ENV] API_BASE_URL não configurada para produção. Defina EXPO_PUBLIC_API_BASE_URL no build.',
  );
  return '';
}

function resolveGoogleWebClientId(): string {
  const value = extra.GOOGLE_WEB_CLIENT_ID;
  if (value && typeof value === 'string') {
    return value.trim();
  }

  if (__DEV__) {
    console.warn(
      '[ENV] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não definida. Google Sign-In não funcionará.',
    );
  }
  return '';
}

function resolveGoogleIosClientId(): string {
  const value = extra.GOOGLE_IOS_CLIENT_ID;
  if (value && typeof value === 'string') {
    return value.trim();
  }

  if (__DEV__) {
    console.warn(
      '[ENV] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID não definida. Google Sign-In no iOS não funcionará.',
    );
  }
  return '';
}

function resolveGoogleAndroidClientId(): string {
  const value = extra.GOOGLE_ANDROID_CLIENT_ID;
  if (value && typeof value === 'string') {
    return value.trim();
  }
  return '';
}

function resolveRevenueCatIosApiKey(): string {
  const value = extra.REVENUECAT_IOS_API_KEY;
  if (value && typeof value === 'string') {
    return value.trim();
  }

  if (__DEV__) {
    console.warn(
      '[ENV] Defina EXPO_PUBLIC_REVENUECAT_IOS_API_KEY (appl_…) ou o legado EXPO_PUBLIC_REVENUECAT_API_KEY.',
    );
  }
  return '';
}

function resolveRevenueCatAndroidApiKey(): string {
  const value = extra.REVENUECAT_ANDROID_API_KEY;
  if (value && typeof value === 'string') {
    return value.trim();
  }

  if (__DEV__) {
    console.warn(
      '[ENV] Defina EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY (goog_…) ou o legado EXPO_PUBLIC_REVENUECAT_API_KEY.',
    );
  }
  return '';
}

function resolveRevenueCatDefaultOfferingIdentifier(): string {
  const value = extra.REVENUECAT_DEFAULT_OFFERING_IDENTIFIER;
  if (value && typeof value === 'string') {
    return value.trim();
  }
  return '';
}

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  GOOGLE_WEB_CLIENT_ID: resolveGoogleWebClientId(),
  GOOGLE_IOS_CLIENT_ID: resolveGoogleIosClientId(),
  GOOGLE_ANDROID_CLIENT_ID: resolveGoogleAndroidClientId(),
  REVENUECAT_IOS_API_KEY: resolveRevenueCatIosApiKey(),
  REVENUECAT_ANDROID_API_KEY: resolveRevenueCatAndroidApiKey(),
  REVENUECAT_DEFAULT_OFFERING_IDENTIFIER: resolveRevenueCatDefaultOfferingIdentifier(),
  TOKEN_KEY: '@BetHunter:token',
} as const;
