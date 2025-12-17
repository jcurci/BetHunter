# BetHunter - Contexto Rápido

> **Anexe este arquivo em novas conversas para dar contexto sobre o projeto.**

## O que é

App mobile de **educação financeira** em React Native + Expo + TypeScript.

## Arquitetura: Clean Architecture

```
UI (Screens/Stores) → UseCases → Repositories → DataSources → API/Storage
```

## Estrutura Principal

```
src/
├── domain/           # Regras de negócio (entities, usecases, repositories interfaces)
├── data/             # Contratos (datasources interfaces, repository implementations)
├── infrastructure/   # Implementações (datasources impl, storage, DI container)
├── screens/          # Telas do app
├── components/       # Componentes reutilizáveis
├── services/api/     # apiClient (Axios com interceptors)
├── storage/          # Zustand stores (authStore, accountStore)
└── types/            # TypeScript types
```

## Como usar os recursos

### Login/Auth

```typescript
import { useAuthStore } from "../../storage/authStore";
import { toAuthUser } from "../../domain/entities/User";

// 1. UseCase retorna { user, token }
const container = Container.getInstance();
const userUseCase = container.getUserUseCase();
const { user, token } = await userUseCase.login({ email, password });

// 2. Atualiza estado reativo (Zustand)
const authStore = useAuthStore();
authStore.setToken(token);
authStore.setUser(toAuthUser(user));

// 3. Estado reativo
const { isAuthenticated, user, logout } = useAuthStore();
```

### Chamadas HTTP

```typescript
import { apiClient } from "../services/api/apiClient";
const response = await apiClient.get("/endpoint");
// Token é adicionado automaticamente pelo interceptor
```

### Navegação

```typescript
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";

const navigation = useNavigation<NavigationProp>();
navigation.navigate("Home");
```

## Entidades

| Entity      | Campos principais                                       |
| ----------- | ------------------------------------------------------- |
| User        | id, name, email, points, betcoins, createdAt, updatedAt |
| AuthUser    | id, name, email, points, betcoins (para Zustand)        |
| LoginResult | { user: User, token: string }                           |
| Course      | id, title, reward, stars                                |
| Module      | id, title, moduleNumber, courseId                       |
| Question    | id, statement, module_id                                |

### Conversão User → AuthUser

```typescript
import { toAuthUser } from "../domain/entities/User";
const authUser = toAuthUser(user); // Remove timestamps
```

## UseCases Disponíveis

- `UserUseCase` → login, register, logout, getCurrentUser
- `RouletteUseCase` → spin, getRewards
- `ArticleUseCase` → getArticles
- `LessonUseCase` → getLessons

## Stores (Zustand)

- `useAuthStore` → token, user, isAuthenticated, login(), logout()
- `useAccountStore` → balance, transactions

## Componentes Comuns

- `GradientButton` → Botão padrão com gradiente
- `CircularIconButton` → Botão circular (voltar, ações)
- `Modal` → Modal customizado
- `Avatar`, `Footer`, `IconCard`

## Rotas de Navegação

**Auth:** Login → SignUpName → SignUpContact → SignUpVerification → SignUpPassword

**Main:** Home, Roulette, MenuEducacional, Cursos, Quiz, Graficos

**Account:** AccountOverview, AccountHistory, TransactionForm

**Settings:** Config, Profile, ChangePassword

## API Backend

Base URL: `http://localhost:8080` (dev)

Principais endpoints:

- `POST /auth/login` → Login
- `POST /auth/register` → Cadastro
- `GET /users/:id` → Dados do usuário
- `GET /courses` → Listar cursos

Documentação completa: `/bethunter-api/API_DOCUMENTATION.md`

## Padrões do Projeto

1. **Validação no UseCase** (não na UI)
2. **Container para DI** (não instanciar diretamente)
3. **Stores para estado reativo** (Zustand)
4. **apiClient para HTTP** (tem interceptors automáticos)
5. **Componentes em common/** (reutilizáveis)
6. **LoginResult** (login retorna { user, token })

## Documentação

| Arquivo                              | Descrição                            |
| ------------------------------------ | ------------------------------------ |
| `ARCHITECTURE.md`                    | Arquitetura completa do projeto      |
| `CONTEXT.md`                         | Este arquivo (contexto rápido)       |
| `docs/LOGIN_JOURNEY.md`              | Jornada completa de login            |
| `docs/REFACTORING_LOGIN.md`          | Documentação da refatoração de login |
| `bethunter-api/API_DOCUMENTATION.md` | Documentação da API backend          |
