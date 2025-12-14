# Jornada de Login - Documentação

## Visão Geral

Este documento explica o fluxo completo de autenticação no app BetHunter, desde o clique do usuário até a navegação para Home.

---

## Arquitetura do Fluxo

```
USUÁRIO clica "Logar"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           1. TELA (Login.tsx)                           │
│                                                                          │
│   handleLogin() {                                                       │
│     const { user, token } = await userUseCase.login({ email, password })│
│     authStore.setToken(token)                                           │
│     authStore.setUser(toAuthUser(user))                                 │
│     navigation.navigate("Home")                                         │
│   }                                                                     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        2. USE CASE (UserUseCase)                        │
│                                                                          │
│   login(credentials) {                                                  │
│     ✓ Valida: email não vazio?                                         │
│     ✓ Valida: email formato válido?                                    │
│     ✓ Valida: senha não vazia?                                         │
│     ✓ Valida: senha >= 6 caracteres?                                   │
│     return repository.login(credentials)                                │
│   }                                                                     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    3. REPOSITORY (UserRepositoryImpl)                   │
│                                                                          │
│   login(credentials) {                                                  │
│     return dataSource.login(credentials)  // Repassa                    │
│   }                                                                     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  4. DATA SOURCE (UserDataSourceImpl)                    │
│                                                                          │
│   login(credentials) {                                                  │
│     // 4.1 Chama API                                                    │
│     const response = await apiClient.post('/auth/login', credentials)  │
│                                                                          │
│     // 4.2 Decodifica JWT                                               │
│     const token = response.data.token                                   │
│     const decoded = decodeJWT(token)                                    │
│                                                                          │
│     // 4.3 Monta objeto User                                            │
│     const user = { id, name, email, points, betcoins, ... }            │
│                                                                          │
│     // 4.4 Salva no storage (persistência)                              │
│     await authStorageService.login(token, user)                         │
│                                                                          │
│     // 4.5 Retorna para a UI                                            │
│     return { user, token }                                              │
│   }                                                                     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                     ▼                             ▼
┌────────────────────────────────┐  ┌────────────────────────────────────┐
│      5. API CLIENT             │  │      6. AUTH STORAGE SERVICE       │
│                                │  │                                    │
│  - Adiciona token no header    │  │  - Salva token no AsyncStorage    │
│  - Envia para servidor         │  │  - Salva user no AsyncStorage     │
│  - Detecta erros 401           │  │  - Persistência local             │
└────────────────────────────────┘  └────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         7. SERVIDOR (API)                               │
│                                                                          │
│   POST /auth/login                                                      │
│   Body: { email, password }                                             │
│   Response: { token: "eyJhbG..." }                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Retorno

```
Servidor retorna { token }
          │
          ▼
DataSource decodifica JWT e monta User
          │
          ▼
DataSource salva no AsyncStorage (persistência)
          │
          ▼
DataSource retorna { user, token }
          │
          ▼
Repository repassa { user, token }
          │
          ▼
UseCase repassa { user, token }
          │
          ▼
Tela recebe { user, token }
          │
          ├──► authStore.setToken(token)      // Estado em memória
          ├──► authStore.setUser(authUser)    // Estado em memória
          │
          ▼
navigation.navigate("Home")
```

---

## Responsabilidades por Camada

| Camada | Responsabilidade | Não sabe sobre |
|--------|------------------|----------------|
| **Login.tsx** | Captura input, mostra erros, navega | Como validar, como chamar API |
| **UserUseCase** | Valida regras de negócio | HTTP, AsyncStorage, UI |
| **UserRepositoryImpl** | Conecta domínio com dados | Detalhes de implementação |
| **UserDataSourceImpl** | Chama API, decodifica JWT, salva dados | UI, regras de negócio |
| **apiClient** | Configura HTTP, adiciona headers | Lógica de negócio |
| **AuthStorageService** | Persiste no AsyncStorage | Rede, UI |

---

## Armazenamento de Dados

### Persistência (AsyncStorage - disco)

```
@BetHunter:token = "eyJhbGciOiJIUzI1NiIs..."
@BetHunter:user = { id, name, email, points, betcoins }
```

### Estado Reativo (Zustand - memória)

```typescript
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: { id, name, email, points, betcoins },
  isAuthenticated: true,
  isInitialized: true
}
```

---

## Estrutura do JWT

O token JWT contém informações do usuário codificadas em Base64:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGVtYWlsLmNvbSIsIm5hbWUiOiJKb2huIERvZSIsInBvaW50cyI6MTAwLCJiZXRjb2lucyI6NTB9.signature
```

### Payload decodificado:

```json
{
  "sub": "user@email.com",
  "name": "John Doe",
  "points": 100,
  "betcoins": 50,
  "iat": 1699999999,
  "exp": 1700086399
}
```

| Campo | Descrição |
|-------|-----------|
| `sub` | Subject - ID/Email do usuário |
| `name` | Nome do usuário |
| `points` | Pontos de ranking |
| `betcoins` | Moeda virtual |
| `iat` | Issued At - quando foi criado |
| `exp` | Expiration - quando expira |

---

## Tratamento de Erros

### Erros de Validação (UseCase)

| Erro | Causa |
|------|-------|
| `Email é obrigatório` | Campo email vazio |
| `Email inválido` | Formato de email incorreto |
| `Senha é obrigatória` | Campo senha vazio |
| `Senha deve ter no mínimo 6 caracteres` | Senha muito curta |

### Erros HTTP (DataSource/API)

| Status | Mensagem | Causa |
|--------|----------|-------|
| 401 | Email ou senha incorretos | Credenciais inválidas |
| 404 | Usuário não encontrado | Email não cadastrado |
| 400 | Dados inválidos | Payload malformado |
| Network Error | Erro de conexão | Sem internet |
| Timeout | Timeout. Tente novamente | Servidor lento |

---

## Código de Exemplo

### Login.tsx (Tela)

```typescript
import { useAuthStore } from "../../storage/authStore";
import { toAuthUser } from "../../domain/entities/User";
import { ValidationError } from "../../domain/errors/CustomErrors";

const handleLogin = async () => {
  setLoading(true);
  
  try {
    // 1. UseCase faz login e retorna { user, token }
    const userUseCase = container.getUserUseCase();
    const { user, token } = await userUseCase.login({ email, password });

    // 2. Atualiza estado reativo (Zustand)
    authStore.setToken(token);
    authStore.setUser(toAuthUser(user));

    // 3. Navega para Home
    navigation.navigate("Home");
  } catch (error) {
    // Tratamento de erros
    if (error instanceof ValidationError) {
      Alert.alert("Erro de validação", error.message);
    } else if (error.response?.status === 401) {
      Alert.alert("Erro", "Email ou senha incorretos");
    }
    // ... outros erros
  } finally {
    setLoading(false);
  }
};
```

### UserUseCase (Validação)

```typescript
async login(credentials: UserCredentials): Promise<LoginResult> {
  if (!credentials.email || credentials.email.trim() === '') {
    throw new ValidationError('Email é obrigatório');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(credentials.email)) {
    throw new ValidationError('Email inválido');
  }

  if (credentials.password.length < 6) {
    throw new ValidationError('Senha deve ter no mínimo 6 caracteres');
  }

  return await this.userRepository.login(credentials);
}
```

### UserDataSourceImpl (Chamada API)

```typescript
async login(credentials: UserCredentials): Promise<LoginResult> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  const token = response.data.token;
  const decoded = decodeJWT(token);
  
  const user: User = {
    id: decoded.sub,
    name: decoded.name,
    email: decoded.sub,
    points: decoded.points ?? 0,
    betcoins: decoded.betcoins ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await this.authStorageService.login(token, toAuthUser(user));
  
  return { user, token };
}
```

---

## Arquivos Envolvidos

| Arquivo | Camada | Função |
|---------|--------|--------|
| `screens/Login/Login.tsx` | Presentation | UI e navegação |
| `domain/usecases/UserUseCase.ts` | Domain | Validação |
| `domain/repositories/UserRepository.ts` | Domain | Interface |
| `data/repositories/UserRepositoryImpl.ts` | Data | Implementação |
| `data/datasources/UserDataSource.ts` | Data | Interface |
| `infrastructure/datasources/UserDataSourceImpl.ts` | Infrastructure | API calls |
| `infrastructure/storage/AuthStorageService.ts` | Infrastructure | Persistência |
| `services/api/apiClient.ts` | Infrastructure | HTTP client |
| `storage/authStore.ts` | Presentation | Estado reativo |
| `domain/entities/User.ts` | Domain | Tipos |

---

## Diagrama de Dependências

```
                    ┌─────────────────┐
                    │   Login.tsx     │
                    │  (Presentation) │
                    └────────┬────────┘
                             │ usa
                             ▼
                    ┌─────────────────┐
                    │  UserUseCase    │
                    │    (Domain)     │
                    └────────┬────────┘
                             │ usa interface
                             ▼
┌─────────────────┐  implements  ┌─────────────────────┐
│ UserRepository  │◄─────────────│ UserRepositoryImpl  │
│  (interface)    │              │       (Data)        │
└─────────────────┘              └──────────┬──────────┘
                                            │ usa interface
                                            ▼
┌─────────────────┐  implements  ┌─────────────────────┐
│ UserDataSource  │◄─────────────│ UserDataSourceImpl  │
│  (interface)    │              │  (Infrastructure)   │
└─────────────────┘              └──────────┬──────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │                 │                 │
                          ▼                 ▼                 ▼
                  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
                  │ apiClient   │  │AuthStorage  │  │    decodeJWT    │
                  │   (HTTP)    │  │  Service    │  │    (helper)     │
                  └─────────────┘  └─────────────┘  └─────────────────┘
```

---

## Sequência de Chamadas

```
┌──────────┐     ┌───────────┐     ┌────────────┐     ┌─────────────┐     ┌───────────┐
│  Login   │     │ UserUse   │     │ UserRepo   │     │ UserData    │     │    API    │
│  .tsx    │     │   Case    │     │   Impl     │     │ SourceImpl  │     │  Server   │
└────┬─────┘     └─────┬─────┘     └──────┬─────┘     └──────┬──────┘     └─────┬─────┘
     │                 │                  │                  │                  │
     │  login(creds)   │                  │                  │                  │
     │────────────────>│                  │                  │                  │
     │                 │                  │                  │                  │
     │                 │  validate        │                  │                  │
     │                 │  ───────>        │                  │                  │
     │                 │                  │                  │                  │
     │                 │  login(creds)    │                  │                  │
     │                 │─────────────────>│                  │                  │
     │                 │                  │                  │                  │
     │                 │                  │  login(creds)    │                  │
     │                 │                  │─────────────────>│                  │
     │                 │                  │                  │                  │
     │                 │                  │                  │  POST /auth/login│
     │                 │                  │                  │─────────────────>│
     │                 │                  │                  │                  │
     │                 │                  │                  │    { token }     │
     │                 │                  │                  │<─────────────────│
     │                 │                  │                  │                  │
     │                 │                  │                  │  decodeJWT()     │
     │                 │                  │                  │  saveToStorage() │
     │                 │                  │                  │                  │
     │                 │                  │  {user, token}   │                  │
     │                 │                  │<─────────────────│                  │
     │                 │                  │                  │                  │
     │                 │  {user, token}   │                  │                  │
     │                 │<─────────────────│                  │                  │
     │                 │                  │                  │                  │
     │  {user, token}  │                  │                  │                  │
     │<────────────────│                  │                  │                  │
     │                 │                  │                  │                  │
     │  setToken()     │                  │                  │                  │
     │  setUser()      │                  │                  │                  │
     │  navigate()     │                  │                  │                  │
     │                 │                  │                  │                  │
```

---

## Resumo

1. **Usuário** digita email/senha e clica "Logar"
2. **Tela** chama `userUseCase.login()`
3. **UseCase** valida regras de negócio
4. **Repository** repassa para DataSource
5. **DataSource** chama API, decodifica JWT, salva no storage
6. **Tela** recebe `{ user, token }`, atualiza Zustand, navega para Home


