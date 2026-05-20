import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../../config/env';
import { AuthStorageService } from '../../infrastructure/storage/AuthStorageService';

/**
 * Token Provider Interface
 * Permite injeção de dependência para obter token
 */
interface TokenProvider {
  getToken(): Promise<string | null>;
}

/**
 * Callback para quando o token expirar (401)
 * Permite que a camada de UI reaja sem violar Clean Architecture
 */
type OnTokenExpiredCallback = () => void;

let onTokenExpiredCallback: OnTokenExpiredCallback | null = null;

/**
 * Registra callback para quando token expirar
 * Usado pela camada de UI (authStore) para fazer logout
 */
export const setOnTokenExpired = (callback: OnTokenExpiredCallback): void => {
  onTokenExpiredCallback = callback;
};

/**
 * Remove callback de token expirado
 */
export const clearOnTokenExpired = (): void => {
  onTokenExpiredCallback = null;
};

// Instância do AuthStorageService (Infrastructure Layer)
const authStorageService = new AuthStorageService();

/**
 * Provider padrão que usa AuthStorageService
 */
const defaultTokenProvider: TokenProvider = {
  getToken: () => authStorageService.getToken(),
};

// Token provider atual (permite substituição para testes)
let currentTokenProvider: TokenProvider = defaultTokenProvider;

/**
 * Permite injetar um TokenProvider customizado (útil para testes)
 */
export const setTokenProvider = (provider: TokenProvider): void => {
  currentTokenProvider = provider;
};

/**
 * Reseta para o provider padrão
 */
export const resetTokenProvider = (): void => {
  currentTokenProvider = defaultTokenProvider;
};

/**
 * API Client configurado com interceptors
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await currentTokenProvider.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token adicionado ao header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Se token expirou (401), notificar via callback
    if (error.response?.status === 401) {
      console.log('⚠️ Token expirado (401)');
      if (onTokenExpiredCallback) {
        onTokenExpiredCallback();
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
