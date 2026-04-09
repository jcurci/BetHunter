# Configuração de Ambiente — BetHunter

## Variáveis de ambiente

O app lê configurações via `expo-constants` (campo `extra` em `app.config.ts`).
Os valores são definidos em variáveis de ambiente prefixadas com `EXPO_PUBLIC_`.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `EXPO_PUBLIC_API_BASE_URL` | Sim (prod) | URL base do backend. Ex.: `http://192.168.0.135:3000` (dev) ou `https://api.bethunter.com` (prod). |

## Setup local (dev)

1. **Copie o ficheiro de exemplo:**

```bash
cp .env.example .env
```

2. **Descubra o IP do Mac na rede local:**

```bash
ipconfig getifaddr en0
```

3. **Edite `.env`** com o IP do Mac + porta do backend:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000
```

4. **Inicie o Metro:**

```bash
npx expo start
```

### Simulador iOS

```bash
npx expo run:ios
```

No simulador, `127.0.0.1` funciona (aponta para o próprio Mac).
Se não definir `EXPO_PUBLIC_API_BASE_URL`, o fallback é `http://127.0.0.1:3000`.

### iPhone físico

```bash
npx expo run:ios --device
```

O iPhone **não** resolve `127.0.0.1` para o Mac; tem de usar o IP real da LAN.
Garanta que Mac e iPhone estão na **mesma rede Wi-Fi**.

### Android emulador

```bash
npx expo run:android
```

No emulador Android, `10.0.2.2` mapeia para o host; pode usar esse IP se preferir.

## Produção

Para builds de produção, defina `EXPO_PUBLIC_API_BASE_URL` no ambiente de CI/CD
(ex.: EAS secrets, GitHub Actions, etc.) com o URL HTTPS definitivo.

**Nunca** coloque IPs internos ou segredos diretamente no código.

## Segurança

- O ficheiro `.env` está no `.gitignore` — **nunca** vai para o repositório.
- `.env.example` tem apenas placeholders e é seguro commitar.
- Segredos (API keys privadas, credenciais de DB, etc.) **nunca** devem estar no app.
  Esses devem ficar no **backend** e o app comunica via endpoints autenticados.

## Fluxo resumido

```
.env (local)
  └─ EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000
       │
       ▼
app.config.ts
  └─ extra.API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
       │
       ▼
src/config/env.ts
  └─ Constants.expoConfig.extra.API_BASE_URL
       │
       ▼
src/services/api/apiClient.ts
  └─ baseURL: ENV.API_BASE_URL
```
