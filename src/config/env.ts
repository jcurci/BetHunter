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

export const ENV = {
  API_BASE_URL: resolveApiBaseUrl(),
  TOKEN_KEY: '@BetHunter:token',
} as const;
