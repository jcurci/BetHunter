export const ENV = {
  // Em desenvolvimento, usar IP local ao invés de localhost
  // localhost não funciona em dispositivos físicos ou emuladores
  // Backend roda na porta 3000 (veja bethunter-api/src/main.ts linha 29)
  // API_BASE_URL: __DEV__ ? 'http://192.168.1.18:3000' : ' http://192.168.0.108:3000',
  API_BASE_URL: __DEV__ ? 'http://192.168.0.108:3000' : ' http://192.168.0.108:3000',
  TOKEN_KEY: '@BetHunter:token',
} as const;






