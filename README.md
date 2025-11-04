# Nomes

- Felipe Hideki RM98323
- Guilherme Milheiro RM550295
- Jhonatan Curci RM94188
- Enzo Vasconcelos RM550702
- Ricardo Queiroz RM94241

# BetHunter

Aplicativo mobile educacional para transformar o comportamento de apostadores em investidores conscientes através de gamificação e educação financeira.

## 📱 Sobre o Projeto

O BetHunter é uma plataforma mobile que utiliza mecânicas de jogos (roleta de pontos, quizzes interativos) para engajar usuários que têm interesse em apostas, direcionando-os para o aprendizado sobre investimentos reais e educação financeira. O aplicativo oferece módulos educacionais, controle de gastos e um sistema de recompensas por aprendizado.

## ✨ Funcionalidades

### Autenticação

- Sistema completo de login e cadastro
- Autenticação JWT com Bearer Token
- Registro em duas etapas (dados pessoais + senha validada)
- Armazenamento seguro de token e dados do usuário

### Educação Financeira

- Módulos de aprendizado progressivo:
  - Fundamentos
  - Prática com Dinheiro
  - Conhecimento Aplicado
  - Objetivos e Planejamento
  - Investimentos de Baixo Risco
  - Investimentos de Alto Risco
- Sistema de progresso com lições completadas
- Quizzes interativos para validar conhecimento
- Integração com API REST para conteúdo dinâmico

### Gamificação

- Roleta de pontos (recompensas diárias)
- Sistema de pontuação
- Ranking de usuários
- Vidas limitadas para engajamento

### Gestão Financeira

- Controle de receitas e despesas
- Visualização de saldo
- Histórico de transações
- Gráficos de gastos
- Categorização automática

### Perfil do Usuário

- Visualização de dados pessoais
- Histórico de atividades
- Gerenciamento de conta
- Notificações personalizadas

## 🏗️ Arquitetura

O projeto utiliza **Clean Architecture** com separação clara de responsabilidades:

```
src/
├── domain/              # Camada de Domínio (Regras de Negócio)
│   ├── entities/        # Entidades (User, Lesson, Article, Roulette)
│   ├── repositories/    # Interfaces dos Repositories
│   └── usecases/        # Casos de Uso (Lógica de Negócio)
│
├── data/                # Camada de Dados
│   ├── datasources/     # Interfaces dos Data Sources
│   └── repositories/    # Implementações dos Repositories
│
├── infrastructure/      # Camada de Infraestrutura
│   ├── datasources/     # Implementações dos Data Sources (API calls)
│   ├── di/              # Dependency Injection Container
│   └── storage/         # Serviços de Storage
│
├── components/          # Camada de Apresentação
│   ├── pages/           # Telas do aplicativo
│   └── comum/           # Componentes reutilizáveis
│
├── services/            # Serviços externos
│   ├── api/             # Cliente HTTP (Axios)
│   └── auth/            # Serviço de Autenticação
│
├── storage/             # Estado Global (Zustand)
│   ├── authStore.ts     # Estado de autenticação
│   └── accountStore.ts  # Estado de contas/transações
│
└── types/               # Definições de tipos TypeScript
```

## 🔐 Autenticação e Segurança

- **JWT Bearer Token**: Todas as requisições autenticadas incluem token no header
- **Interceptor HTTP**: Adiciona automaticamente `Authorization: Bearer {token}`
- **AuthStorageService**: Gerenciamento de autenticação na camada Infrastructure
- **Estado Global**: Zustand sincronizado com AuthStorageService para UI reativa
- **Persistência**: Token e dados salvos em AsyncStorage
- **Logout Automático**: Em caso de token expirado (401)
- **Validações**: Regras de negócio validadas nos Use Cases

## 🚀 Tecnologias Utilizadas

### Frontend

- **React Native** - Framework mobile
- **Expo** - Toolchain e runtime
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas

### Estado e Dados

- **Zustand** - Gerenciamento de estado global
- **AsyncStorage** - Persistência local
- **Axios** - Cliente HTTP

### UI/UX

- **React Native Vector Icons** - Ícones
- **Expo Linear Gradient** - Gradientes
- **Masked View** - Efeitos visuais

### Arquitetura

- **Clean Architecture** - Separação de camadas
- **Dependency Injection** - Inversão de controle e hooks personalizados
- **Repository Pattern** - Abstração de dados
- **Use Cases** - Lógica de negócio isolada com validações
- **Custom Errors** - Tratamento de erros tipados (ValidationError, AuthenticationError, etc.)
- **Fallback Strategy** - DataSources com fallback para dados mockados se API falhar

## 🛠️ Requisitos

- Node.js (v16 ou superior)
- npm ou yarn
- Expo CLI
- iOS Simulator ou Android Emulator (ou Expo Go no dispositivo físico)

## 📦 Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/jcurci/BetHunter
   cd BetHunter/BetHunter
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:

   ```typescript
   // src/config/env.ts
   export const ENV = {
     API_BASE_URL: "http://SEU_IP:8080", // URL do backend
     TOKEN_KEY: "@BetHunter:token",
   };
   ```

4. Execute o projeto:

   ```bash
   npx expo start
   ```

5. Escolha a plataforma:
   - Pressione `i` para iOS Simulator
   - Pressione `a` para Android Emulator
   - Escaneie o QR code com Expo Go no dispositivo físico

## 🔌 Backend API

O aplicativo consome uma API REST com os seguintes endpoints:

### Autenticação

- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de novo usuário

### Lições

- `GET /lessons/user_lessons` - Lista de lições do usuário (requer autenticação)

### Artigos

- `GET /articles` - Lista de artigos educacionais

### Usuário

- `GET /user/profile` - Dados do usuário
- `PUT /user/points` - Atualizar pontos

## 📱 Estrutura de Navegação

```
Login
  ├── SignUp (Dados pessoais)
  └── SignUpPassword (Criar senha)
      └── Home (Tela principal)
          ├── Aprender (Módulos educacionais)
          │   └── Quiz (Questionários)
          │       └── QuizResult (Resultado)
          ├── Graficos (Visualização de dados)
          ├── Roulette (Roleta de pontos)
          ├── Config (Configurações)
          │   ├── Profile (Perfil)
          │   └── ChangePassword (Alterar senha)
          ├── Notifications (Notificações)
          ├── AccountOverview (Visão geral)
          ├── AccountHistory (Histórico)
          └── TransactionForm (Nova transação)
```

## 🎨 Design System

- **Cores Principais**:

  - Primary: `#7456C8` (Roxo)
  - Gradient: `["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]`
  - Background: `#000000` / `#1A1923`
  - Text: `#FFFFFF` / `#A09CAB`

- **Tipografia**:
  - Headers: Bold, 24-32px
  - Body: Regular, 14-16px
  - Captions: 12-14px

## 🧪 Desenvolvimento

### Limpar cache

```bash
rm -rf .expo node_modules/.cache
npm start -- --clear
```

### Verificar erros

```bash
npx tsc --noEmit
```

## 📄 Licença

MIT

## 🔄 Melhorias Recentes (Refatoração Clean Architecture)

### ✅ Problemas Corrigidos

1. **Separação de Camadas**

   - Criado `AuthStorageService` na camada Infrastructure
   - Removido acesso direto ao Zustand store nos DataSources
   - Zustand agora apenas para estado reativo da UI

2. **Container Duplicado**

   - Removido `Container.safe.ts`
   - Mantido apenas `Container.ts` como fonte única de dependências

3. **Padronização TypeScript**

   - Convertidos todos arquivos `.jsx` para `.tsx`
   - Projeto 100% TypeScript

4. **Validações nos Use Cases**

   - `UserUseCase`: Validação de email, senha, nome, telefone
   - `RouletteUseCase`: Validação de saldo, custo, userId
   - Classes de erro customizadas: `ValidationError`, `AuthenticationError`, `InsufficientBalanceError`

5. **APIs Reais**

   - `RouletteDataSourceImpl`: Implementada integração com API `/roulette/*`
   - `ArticleDataSourceImpl`: Implementada integração com API `/articles/*`
   - `LessonDataSourceImpl`: Já integrado com API `/lessons/*`
   - Fallback automático para dados mockados se API falhar

6. **Dependency Injection**
   - Criados hooks personalizados: `useUserUseCase()`, `useRouletteUseCase()`, etc.
   - Reduz acoplamento direto com Container nas telas

### 📊 Estrutura Final

```typescript
// Exemplo de uso correto da arquitetura:

// 1. Domain Layer - Validação
class UserUseCase {
  async login(credentials) {
    if (!credentials.email) throw new ValidationError("Email obrigatório");
    return await this.userRepository.login(credentials);
  }
}

// 2. Infrastructure Layer - Persistência
class AuthStorageService {
  async login(token, user) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

// 3. Presentation Layer - UI Reativa
const authStore = useAuthStore(); // Zustand para reatividade
```

## 👥 Equipe

Desenvolvido por estudantes da FIAP como projeto educacional para transformar comportamentos de risco em aprendizado financeiro consciente.
