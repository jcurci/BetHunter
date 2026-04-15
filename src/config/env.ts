import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function resolveApiBaseUrl(): string {
  if (extra.API_BASE_URL && typeof extra.API_BASE_URL === 'string') {
    return extra.API_BASE_URL.trim();
  }

  if (__DEV__) {
    console.warn(
      '[ENV] EXPO_PUBLIC_API_BASE_URL não definida. Usando fallback localhost:3000.',
    );
    return 'http://127.0.0.1:3000';
  }

  throw new Error(
    '[ENV] API_BASE_URL não configurada para produção. Defina EXPO_PUBLIC_API_BASE_URL.',
  );
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

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  GOOGLE_WEB_CLIENT_ID: resolveGoogleWebClientId(),
  GOOGLE_IOS_CLIENT_ID: resolveGoogleIosClientId(),
  GOOGLE_ANDROID_CLIENT_ID: resolveGoogleAndroidClientId(),
  TOKEN_KEY: '@BetHunter:token',
} as const;
