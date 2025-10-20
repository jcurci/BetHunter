import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env';

// Funções para gerenciar token
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ENV.TOKEN_KEY, token);
  } catch (error) {
    console.error('Erro ao salvar token:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ENV.TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ENV.TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao remover token:', error);
    throw error;
  }
};

// Configuração do cliente HTTP
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Se token expirou (401), limpar token e redirecionar para login
    if (error.response?.status === 401) {
      await removeToken();
      // Aqui você pode adicionar lógica para redirecionar para login
      console.log('Token expirado, removendo do storage');
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
