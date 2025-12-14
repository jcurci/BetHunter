# BetHunter Mobile - Documentação da Arquitetura

## Visão Geral

O **BetHunter** é um aplicativo mobile de educação financeira desenvolvido com React Native e Expo. O projeto segue os princípios de **Clean Architecture**, separando responsabilidades em camadas bem definidas.

---

## Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| React Native | Framework mobile |
| Expo | Tooling e build |
| TypeScript | Tipagem estática |
| Zustand | Gerenciamento de estado |
| Axios | Cliente HTTP |
| React Navigation | Navegação |
| AsyncStorage | Persistência local |

---

## Estrutura de Pastas

```
src/
├── assets/              # Imagens, ícones, SVGs
├── components/          # Componentes reutilizáveis
│   └── common/          # Componentes compartilhados
├── config/              # Configurações (env, colors)
├── data/                # Contratos de dados
│   ├── datasources/     # Interfaces de DataSource
│   └── repositories/    # Implementações de Repository
├── domain/              # Regras de negócio (CORE)
│   ├── entities/        # Modelos de domínio
│   ├── errors/          # Erros customizados
│   ├── repositories/    # Interfaces de Repository
│   └── usecases/        # Casos de uso
├── infrastructure/      # Implementações concretas
│   ├── datasources/     # Implementações de DataSource
│   ├── di/              # Injeção de dependência
│   └── storage/         # Serviços de storage
├── screens/             # Telas do app
├── services/            # Serviços externos
│   └── api/             # Cliente HTTP (apiClient)
├── storage/             # Estado reativo (Zustand)
└── types/               # Tipos TypeScript
```

---

## Arquitetura Clean Architecture

### Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Screens   │     │ Components  │     │   Stores    │        │
│  │  (UI/Views) │     │  (Widgets)  │     │  (Zustand)  │        │
│  └──────┬──────┘     └─────────────┘     └──────┬──────┘        │
└─────────┼──────────────────────────────────────┼────────────────┘
          │                                      │
          │ usa Container.getUserUseCase()       │ usa authStore
          ▼                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DOMAIN LAYER                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  UseCases   │────▶│ Repositories│     │  Entities   │        │
│  │ (Regras)    │     │ (Interfaces)│     │  (Modelos)  │        │
│  └─────────────┘     └──────┬──────┘     └─────────────┘        │
│                             │                                    │
│  ┌─────────────┐            │                                    │
│  │   Errors    │            │                                    │
│  │(Exceptions) │            │                                    │
│  └─────────────┘            │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ implementa
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │RepositoryImpl   │────▶│   DataSource    │                    │
│  │(Implementação)  │     │  (Interface)    │                    │
│  └─────────────────┘     └────────┬────────┘                    │
└────────────────────────────────────┼────────────────────────────┘
                                     │ implementa
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │DataSourceImpl   │────▶│   apiClient     │────▶ API Externa   │
│  │(Implementação)  │     │   (Axios)       │                    │
│  └────────┬────────┘     └─────────────────┘                    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ StorageService  │────▶ AsyncStorage (Local)                  │
│  │(AuthStorage)    │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados

### Exemplo: Login

```
1. Tela Login.tsx
       │
       ▼
2. Container.getInstance().getUserUseCase()
       │
       ▼
3. UserUseCase.login(credentials)
   - Valida email e senha
       │
       ▼
4. UserRepository.login(credentials)
       │
       ▼
5. UserRepositoryImpl → UserDataSource.login()
       │
       ▼
6. UserDataSourceImpl
   - Chama apiClient.post('/auth/login')
   - Decodifica JWT
   - Salva token via AuthStorageService
       │
       ▼
7. Retorna User para a tela
       │
       ▼
8. Tela atualiza authStore.login(token, user)
```

---

## Componentes Principais

### 1. Container (Injeção de Dependência)

```typescript
// Localização: src/infrastructure/di/Container.ts

// Singleton que inicializa todas as dependências
const container = Container.getInstance();

// Uso:
const userUseCase = container.getUserUseCase();
const rouletteUseCase = container.getRouletteUseCase();
```

### 2. UseCases (Regras de Negócio)

```typescript
// Localização: src/domain/usecases/

// Disponíveis:
- UserUseCase      → login, register, logout, getCurrentUser
- RouletteUseCase  → spin, getRewards
- ArticleUseCase   → getArticles, getArticleById
- LessonUseCase    → getLessons, completeLesson
```

### 3. Stores (Estado Reativo)

```typescript
// Localização: src/storage/

// authStore.ts - Autenticação
useAuthStore.getState().login(token, user)
useAuthStore.getState().logout()
useAuthStore.getState().isAuthenticated

// accountStore.ts - Dados financeiros
useAccountStore.getState().balance
useAccountStore.getState().transactions
```

### 4. apiClient (HTTP)

```typescript
// Localização: src/services/api/apiClient.ts

// Recursos:
- Interceptor de Request: Adiciona token automaticamente
- Interceptor de Response: Logout automático em 401
- TokenProvider: Injeção de dependência para testes

// Uso:
import { apiClient } from '../services/api/apiClient';
const response = await apiClient.get('/users');
```

---

## Entidades de Domínio

### User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  points: number;      // Pontos de ranking
  betcoins: number;    // Moeda virtual
  createdAt: Date;
  updatedAt: Date;
}

interface UserCredentials {
  email: string;
  password: string;
}

interface UserRegistration extends UserCredentials {
  name: string;
  cellphone: string;
}
```

### Errors

```typescript
// Disponíveis em: src/domain/errors/CustomErrors.ts

ValidationError        // Dados inválidos
AuthenticationError    // Credenciais inválidas
NotFoundError         // Recurso não encontrado
InsufficientBalanceError // Pontos insuficientes
BusinessRuleError     // Regra de negócio violada
```

---

## Navegação

### Rotas Disponíveis

```typescript
// Definidas em: src/types/navigation.ts

// Auth
Login               // Tela de login
SignUpName          // Cadastro: nome + username
SignUpContact       // Cadastro: email + telefone
SignUpVerification  // Cadastro: código SMS
SignUpPassword      // Cadastro: senha

// Main
Home                // Tela principal
Roulette            // Roleta de prêmios
MenuEducacional     // Menu de cursos
Cursos              // Lista de cursos
Ranking             // Ranking de usuários
Quiz                // Quiz educacional
QuizResult          // Resultado do quiz
Graficos            // Gráficos financeiros

// Account
AccountOverview     // Visão geral da conta
AccountHistory      // Histórico de transações
TransactionForm     // Formulário de transação

// Settings
Config              // Configurações
Profile             // Perfil do usuário
ChangePassword      // Alterar senha
Notifications       // Notificações

// Other
Acessor             // Assessor financeiro
EmConstrucao        // Tela placeholder
```

---

## Componentes Reutilizáveis

```typescript
// Localização: src/components/common/

CircularIconButton   // Botão circular com gradiente
GradientButton       // Botão com gradiente (estilo padrão)
Avatar              // Avatar do usuário
DayCounter          // Contador de dias
Footer              // Rodapé de navegação
HomeAccountButton   // Botão da conta na home
IconCard            // Card com ícone
Modal               // Modal customizado
StatsDisplay        // Exibição de estatísticas
```

---

## Configuração

### Variáveis de Ambiente

```typescript
// src/config/env.ts

ENV.API_BASE_URL    // URL da API (localhost:8080 em dev)
ENV.TOKEN_KEY       // Chave do token no storage
```

### Cores

```typescript
// src/config/colors.ts
// Paleta de cores do app
```

---

## Como Usar Esta Documentação

### Para adicionar nova funcionalidade:

1. **Criar Entity** em `domain/entities/`
2. **Criar Repository Interface** em `domain/repositories/`
3. **Criar UseCase** em `domain/usecases/`
4. **Criar DataSource Interface** em `data/datasources/`
5. **Criar DataSourceImpl** em `infrastructure/datasources/`
6. **Criar RepositoryImpl** em `data/repositories/`
7. **Registrar no Container** em `infrastructure/di/Container.ts`

### Para criar nova tela:

1. Criar arquivo em `screens/NomeDaTela/`
2. Adicionar rota em `types/navigation.ts`
3. Registrar no `App.tsx`

### Para criar novo componente:

1. Criar em `components/common/NomeDoComponente/`
2. Exportar em `components/common/index.ts`

---

## API Backend

A API está documentada em:
- `/bethunter-api/API_DOCUMENTATION.md`

### Endpoints principais:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastrar usuário |
| POST | `/auth/login` | Login |
| PUT | `/auth/password` | Alterar senha |
| GET | `/users/:id` | Buscar usuário |
| GET | `/users/roulete` | Girar roleta |
| GET | `/courses` | Listar cursos |
| GET | `/modules/course/:id` | Módulos de um curso |

---

## Boas Práticas

1. **Sempre use UseCases** - Nunca acesse DataSource diretamente da UI
2. **Valide no UseCase** - Regras de negócio ficam no domínio
3. **Use os Stores** - Estado reativo via Zustand
4. **Componentes reutilizáveis** - Crie em `components/common/`
5. **Tipagem forte** - Use TypeScript corretamente
6. **Erros customizados** - Use os erros do domínio

---

## Contato

Para dúvidas sobre a arquitetura, consulte esta documentação ou peça explicações detalhadas sobre qualquer parte do código.

