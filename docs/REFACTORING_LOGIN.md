# Refatoração da Jornada de Login

**Data:** Dezembro 2024  
**Objetivo:** Corrigir o fluxo de autenticação para seguir Clean Architecture corretamente

---

## Problemas Identificados

### 1. Código de Login Comentado
O `Login.tsx` tinha todo o código de autenticação comentado e navegava direto para Home sem fazer login real.

### 2. Token não retornava para a UI
O `UserDataSourceImpl.login()` salvava o token no storage mas não o retornava, impossibilitando a atualização do estado reativo (Zustand).

### 3. Interface User duplicada
Havia duas definições de `User`:
- Uma em `domain/entities/User.ts` (com timestamps)
- Uma local em `storage/authStore.ts` (sem timestamps)

### 4. Estado reativo desatualizado
Após login via UseCase, o `authStore.isAuthenticated` permanecia `false` porque ninguém atualizava o Zustand.

---

## Solução Implementada

### Novo Tipo: `LoginResult`

```typescript
// domain/entities/User.ts

export interface LoginResult {
  user: User;
  token: string;
}
```

Permite que o login retorne tanto o usuário quanto o token para a camada de UI.

### Novo Tipo: `AuthUser`

```typescript
// domain/entities/User.ts

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
}

export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  points: user.points,
  betcoins: user.betcoins,
});
```

Versão simplificada de `User` para uso no estado reativo, sem timestamps.

---

## Fluxo Atualizado

```
┌─────────────────────────────────────────────────────────────────┐
│                         Login.tsx                                │
│                                                                  │
│  handleLogin() {                                                │
│    const { user, token } = await userUseCase.login(credentials) │
│    authStore.setToken(token)                                    │
│    authStore.setUser(toAuthUser(user))                          │
│    navigation.navigate("Home")                                  │
│  }                                                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       UserUseCase                                │
│                                                                  │
│  login(credentials): Promise<LoginResult>                       │
│    - Valida email (formato, não vazio)                         │
│    - Valida senha (mínimo 6 caracteres)                        │
│    - Chama repository.login()                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UserRepositoryImpl                            │
│                                                                  │
│  login(credentials): Promise<LoginResult>                       │
│    - Repassa para dataSource.login()                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   UserDataSourceImpl                             │
│                                                                  │
│  login(credentials): Promise<LoginResult>                       │
│    1. apiClient.post('/auth/login', credentials)               │
│    2. Decodifica JWT para extrair dados do usuário             │
│    3. Salva token e user via authStorageService (persistência) │
│    4. Retorna { user, token }                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos Modificados

### `domain/entities/User.ts`

**Adicionado:**
- `AuthUser` interface (sem timestamps)
- `LoginResult` interface (user + token)
- `toAuthUser()` função helper

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
}

export interface LoginResult {
  user: User;
  token: string;
}

export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  points: user.points,
  betcoins: user.betcoins,
});
```

---

### `data/datasources/UserDataSource.ts`

**Alterado:** Tipo de retorno do `login()`

```typescript
// Antes
login(credentials: UserCredentials): Promise<User>;

// Depois
login(credentials: UserCredentials): Promise<LoginResult>;
```

---

### `domain/repositories/UserRepository.ts`

**Alterado:** Tipo de retorno do `login()`

```typescript
// Antes
login(credentials: UserCredentials): Promise<User>;

// Depois
login(credentials: UserCredentials): Promise<LoginResult>;
```

---

### `data/repositories/UserRepositoryImpl.ts`

**Alterado:** Tipo de retorno do `login()`

```typescript
async login(credentials: UserCredentials): Promise<LoginResult> {
  return await this.userDataSource.login(credentials);
}
```

---

### `domain/usecases/UserUseCase.ts`

**Alterado:** Tipo de retorno do `login()`

```typescript
async login(credentials: UserCredentials): Promise<LoginResult> {
  // Validações...
  return await this.userRepository.login(credentials);
}
```

---

### `infrastructure/datasources/UserDataSourceImpl.ts`

**Alterado:** Retorna `LoginResult` ao invés de apenas `User`

```typescript
async login(credentials: UserCredentials): Promise<LoginResult> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  const token = response.data.token;
  const decoded = decodeJWT(token);
  
  const user: User = {
    id: decoded?.sub || credentials.email,
    // ... outros campos
  };
  
  // Salva no storage (persistência)
  await this.authStorageService.login(token, {...});
  
  // Retorna AMBOS para a UI
  return { user, token };
}
```

---

### `storage/authStore.ts`

**Alterado:** Usa `AuthUser` importado ao invés de interface local

```typescript
import { AuthUser } from '../domain/entities/User';

interface AuthStore {
  user: AuthUser | null;  // Antes era User local
  // ...
  setUser: (user: AuthUser) => void;
  login: (token: string, user: AuthUser) => Promise<void>;
}
```

---

### `screens/Login/Login.tsx`

**Alterado:** Implementação completa do fluxo de login

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
    // Tratamento de erros (ValidationError, HTTP errors, etc)
  } finally {
    setLoading(false);
  }
};
```

---

## Benefícios da Refatoração

| Antes | Depois |
|-------|--------|
| Login não funcionava | Login completo funcionando |
| Token não chegava na UI | Token retornado via `LoginResult` |
| `authStore` não atualizava | Estado reativo sincronizado |
| Interface `User` duplicada | `User` e `AuthUser` unificados |
| Sem tratamento de erros | Erros tipados e tratados |

---

## Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                                │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   User      │  │ LoginResult │  │     UserUseCase         │  │
│  │   AuthUser  │  │ {user,token}│  │ login(): LoginResult    │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
│                                                │                 │
│                                    ┌───────────▼─────────────┐  │
│                                    │    UserRepository       │  │
│                                    │  (interface)            │  │
│                                    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                │ implements
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│                                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │   UserRepositoryImpl    │───▶│      UserDataSource         │ │
│  │                         │    │      (interface)            │ │
│  └─────────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                │ implements
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  UserDataSourceImpl                         ││
│  │                                                             ││
│  │  login(credentials):                                        ││
│  │    → apiClient.post('/auth/login')                         ││
│  │    → decodeJWT(token)                                      ││
│  │    → authStorageService.login(token, user)                 ││
│  │    → return { user, token }                                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Login.tsx                              ││
│  │                                                             ││
│  │  const { user, token } = await userUseCase.login(...)      ││
│  │  authStore.setToken(token)                                 ││
│  │  authStore.setUser(toAuthUser(user))                       ││
│  │  navigation.navigate("Home")                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    authStore (Zustand)                      ││
│  │                                                             ││
│  │  token: string | null                                      ││
│  │  user: AuthUser | null                                     ││
│  │  isAuthenticated: boolean                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Como Testar

1. Inicie o backend em `localhost:8080`
2. Abra o app e vá para tela de Login
3. Digite email e senha válidos
4. Clique em "Logar"
5. Deve navegar para Home com usuário autenticado

### Verificar estado:
```typescript
// Em qualquer componente
const { isAuthenticated, user, token } = useAuthStore();
console.log({ isAuthenticated, user, token });
```

---

## Próximos Passos Sugeridos

1. **Implementar refresh token** - Renovar token antes de expirar
2. **Adicionar loading global** - Mostrar spinner durante requisições
3. **Persistir navegação** - Manter usuário logado ao reabrir app
4. **Testes unitários** - Testar UseCase e DataSource isoladamente


