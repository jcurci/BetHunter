import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env';
import { useAuthStore } from '../../storage/authStore';


export const getToken = async (): Promise<string | null> => {
  try {
   
    return await AsyncStorage.getItem('@BetHunter:token');
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
};


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
      console.log('🔐 Token adicionado ao header:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('ℹ️ Nenhum token encontrado para adicionar ao header');
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
    // Se token expirou (401), limpar via authStore
    if (error.response?.status === 401) {
      console.log('⚠️ Token expirado (401), fazendo logout...');
      await useAuthStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
