export const ENV = {
  API_BASE_URL: __DEV__ ? 'http://localhost:8080' : 'https://api.bethunter.com',
  TOKEN_KEY: '@BetHunter:token',
} as const;


