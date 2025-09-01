# 📚 Documentação Completa - BetHunter

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Entidades do Domínio](#entidades-do-domínio)
6. [Casos de Uso](#casos-de-uso)
7. [Componentes da Interface](#componentes-da-interface)
8. [Telas do Sistema](#telas-do-sistema)
9. [Gerenciamento de Estado](#gerenciamento-de-estado)
10. [Instalação e Configuração](#instalação-e-configuração)
11. [Scripts Disponíveis](#scripts-disponíveis)
12. [Contribuidores](#contribuidores)
13. [Licença](#licença)

---

## 🎯 Visão Geral

O **BetHunter** é um aplicativo mobile desenvolvido em React Native com o objetivo de ajudar pessoas a pararem de apostar e aprenderem sobre investimentos. O app utiliza uma abordagem gamificada com sistema de pontos e roleta para engajar os usuários no aprendizado financeiro.

### 🎮 Funcionalidades Principais

- **Sistema de Autenticação**: Login e cadastro de usuários
- **Sistema de Pontos**: Acúmulo e gasto de pontos através de atividades
- **Roleta Interativa**: Jogo de roleta para ganhar pontos
- **Artigos Educativos**: Conteúdo sobre investimentos e educação financeira
- **Controle Financeiro**: Acompanhamento de receitas e despesas
- **Gráficos e Relatórios**: Visualização de dados financeiros
- **Sistema de Notificações**: Lembretes e dicas personalizadas

---

## 🏗️ Arquitetura do Sistema

O BetHunter implementa a **Clean Architecture** (Arquitetura Limpa), seguindo os princípios de separação de responsabilidades e inversão de dependência.

### 📐 Estrutura em Camadas

```
┌─────────────────────────────────────┐
│           Presentation              │ ← Interface do Usuário
├─────────────────────────────────────┤
│             Domain                  │ ← Regras de Negócio
├─────────────────────────────────────┤
│              Data                   │ ← Gerenciamento de Dados
├─────────────────────────────────────┤
│          Infrastructure             │ ← Implementações Concretas
└─────────────────────────────────────┘
```

### 🔄 Fluxo de Dados

```
Presentation → UseCase → Repository → DataSource → Infrastructure
```

### 🎯 Princípios Aplicados

1. **Separação de Responsabilidades**: Cada camada tem uma responsabilidade específica
2. **Inversão de Dependência**: Camadas internas não dependem das externas
3. **Injeção de Dependência**: Gerenciamento centralizado de dependências
4. **Testabilidade**: Estrutura preparada para testes unitários

---

## 📁 Estrutura do Projeto

```
BetHunter/
├── App.jsx                          # Ponto de entrada da aplicação
├── package.json                     # Dependências e scripts
├── tsconfig.json                    # Configuração TypeScript
├── metro.config.js                  # Configuração Metro bundler
├── README.md                        # Documentação básica
├── ARCHITECTURE.md                  # Documentação da arquitetura
├── DOCUMENTACAO_COMPLETA.md         # Esta documentação
└── src/
    ├── domain/                      # Camada de Domínio
    │   ├── entities/                # Entidades de negócio
    │   │   ├── User.ts
    │   │   ├── Roulette.ts
    │   │   └── Article.ts
    │   ├── repositories/            # Interfaces dos repositórios
    │   │   ├── UserRepository.ts
    │   │   ├── RouletteRepository.ts
    │   │   └── ArticleRepository.ts
    │   ├── usecases/               # Casos de uso
    │   │   ├── UserUseCase.ts
    │   │   ├── RouletteUseCase.ts
    │   │   └── ArticleUseCase.ts
    │   └── index.ts
    ├── data/                       # Camada de Dados
    │   ├── repositories/           # Implementações dos repositórios
    │   │   ├── UserRepositoryImpl.ts
    │   │   ├── RouletteRepositoryImpl.ts
    │   │   └── ArticleRepositoryImpl.ts
    │   └── datasources/           # Interfaces dos data sources
    │       ├── UserDataSource.ts
    │       ├── RouletteDataSource.ts
    │       └── ArticleDataSource.ts
    ├── infrastructure/            # Camada de Infraestrutura
    │   ├── datasources/          # Implementações dos data sources
    │   │   ├── UserDataSourceImpl.ts
    │   │   ├── RouletteDataSourceImpl.ts
    │   │   └── ArticleDataSourceImpl.ts
    │   ├── storage/              # Serviços de storage
    │   │   ├── StorageService.ts
    │   │   └── AsyncStorageService.ts
    │   └── di/                   # Injeção de dependência
    │       └── Container.ts
    ├── presentation/             # Camada de Apresentação
    │   ├── screens/             # Telas do aplicativo
    │   │   ├── Login-screens/
    │   │   │   ├── Login.jsx
    │   │   │   └── SiginUp.jsx
    │   │   ├── Profile-configs/
    │   │   │   ├── Profile.jsx
    │   │   │   └── ChangePassword.jsx
    │   │   ├── Home.jsx
    │   │   ├── Roulette.jsx
    │   │   ├── Aprender.jsx
    │   │   ├── Graficos.jsx
    │   │   ├── Config.jsx
    │   │   ├── Notifications.jsx
    │   │   ├── AccountOverview.jsx
    │   │   ├── AccountHistory.jsx
    │   │   └── TransactionForm.jsx
    │   └── components/          # Componentes reutilizáveis
    │       ├── Footer.jsx
    │       ├── Navbar.jsx
    │       ├── EventForm.tsx
    │       ├── HomeAccountButton.jsx
    │       └── RecommendationSection.tsx
    ├── storage/                 # Gerenciamento de estado
    │   ├── accountStore.ts      # Store para transações financeiras
    │   └── eventStorage.ts
    ├── assets/                  # Recursos estáticos
    │   ├── icon-home.svg
    │   ├── image-bitcoin.svg
    │   ├── image-grafico.svg
    │   ├── image-moeda.svg
    │   ├── login_background.png
    │   └── logo-img/
    │       ├── logo_white.svg
    │       └── text_white.svg
    └── types/                   # Definições de tipos
        ├── index.ts
        └── svg.d.ts
```

---

## 🛠️ Tecnologias Utilizadas

### 📱 Framework Principal
- **React Native 0.73.4**: Framework para desenvolvimento mobile multiplataforma
- **Expo ~50.0.0**: Plataforma para desenvolvimento React Native
- **TypeScript ^5.3.0**: Superset do JavaScript com tipagem estática

### 🧭 Navegação
- **React Navigation 7.x**: Biblioteca de navegação para React Native
- **@react-navigation/native**: Navegação nativa
- **@react-navigation/native-stack**: Stack navigator

### 🎨 Interface e Gráficos
- **React Native SVG ^14.1.0**: Renderização de gráficos SVG
- **React Native Chart Kit ^6.12.0**: Biblioteca para gráficos
- **React Native Vector Icons ^10.0.3**: Ícones vetoriais

### 💾 Armazenamento e Estado
- **AsyncStorage ^2.2.0**: Armazenamento local assíncrono
- **Zustand ^5.0.7**: Gerenciamento de estado global

### 🔧 Ferramentas de Desenvolvimento
- **Babel ^7.20.0**: Transpilador JavaScript
- **Metro**: Bundler para React Native

---

## 🏛️ Entidades do Domínio

### 👤 User (Usuário)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCredentials {
  email: string;
  password: string;
}

interface UserRegistration extends UserCredentials {
  name: string;
}
```

**Responsabilidades:**
- Representar dados do usuário
- Gerenciar credenciais de autenticação
- Controlar sistema de pontos

### 🎰 Roulette (Roleta)

```typescript
interface RouletteSector {
  id: number;
  label: string;
  color: string;
  points: number;
}

interface RouletteResult {
  sector: RouletteSector;
  pointsWon: number;
  timestamp: Date;
}

interface RouletteGame {
  id: string;
  userId: string;
  cost: number;
  result: RouletteResult;
  createdAt: Date;
}
```

**Responsabilidades:**
- Definir setores da roleta
- Gerenciar resultados dos jogos
- Controlar custos e premiações

### 📰 Article (Artigo)

```typescript
interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  publishedAt: Date;
  readTime: number; // em minutos
}
```

**Responsabilidades:**
- Representar conteúdo educativo
- Organizar artigos por categoria
- Controlar tempo de leitura

### 💰 Transaction (Transação)

```typescript
interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryIcon: string;
  description: string;
  date: Date;
}
```

**Responsabilidades:**
- Representar movimentações financeiras
- Categorizar receitas e despesas
- Controlar histórico financeiro

---

## 🎯 Casos de Uso

### 👤 UserUseCase

```typescript
class UserUseCase {
  async login(credentials: UserCredentials): Promise<User>
  async register(userData: UserRegistration): Promise<User>
  async getCurrentUser(): Promise<User | null>
  async updateUserPoints(userId: string, points: number): Promise<User>
  async logout(): Promise<void>
}
```

**Funcionalidades:**
- Autenticação de usuários
- Registro de novos usuários
- Gerenciamento de sessão
- Controle de pontos

### 🎰 RouletteUseCase

```typescript
class RouletteUseCase {
  async getSectors(): Promise<RouletteSector[]>
  async playGame(userId: string, cost: number): Promise<RouletteGame>
  async getUserGames(userId: string): Promise<RouletteGame[]>
}
```

**Funcionalidades:**
- Obter setores da roleta
- Executar jogos
- Histórico de jogos do usuário

### 📰 ArticleUseCase

```typescript
class ArticleUseCase {
  async getArticles(): Promise<Article[]>
  async getArticlesByCategory(category: string): Promise<Article[]>
  async getArticleById(id: string): Promise<Article | null>
}
```

**Funcionalidades:**
- Listar artigos disponíveis
- Filtrar por categoria
- Obter artigo específico

---

## 🧩 Componentes da Interface

### 🏠 HomeAccountButton

Componente para exibir informações da conta na tela inicial.

**Props:**
- Nenhuma prop específica

**Funcionalidades:**
- Exibe saldo atual
- Navega para visão geral da conta

### 🎰 EventForm

Formulário para criação de eventos/transações.

**Props:**
- `onSubmit`: Função callback para submissão
- `initialData`: Dados iniciais do formulário

**Funcionalidades:**
- Captura dados de transação
- Validação de campos
- Submissão de dados

### 📊 RecommendationSection

Seção de recomendações personalizadas.

**Props:**
- `recommendations`: Array de recomendações
- `onItemPress`: Callback para seleção de item

**Funcionalidades:**
- Exibe recomendações
- Navegação para detalhes

### 🦶 Footer

Componente de rodapé com navegação principal.

**Props:**
- Nenhuma prop específica

**Funcionalidades:**
- Navegação entre telas principais
- Indicador de tela ativa

### 🧭 Navbar

Barra de navegação superior.

**Props:**
- Nenhuma prop específica

**Funcionalidades:**
- Exibe título da aplicação
- Estilização consistente

---

## 📱 Telas do Sistema

### 🔐 Autenticação

#### Login.jsx
- **Função**: Autenticação de usuários existentes
- **Campos**: Email e senha
- **Navegação**: Home (sucesso) | SignUp (cadastro)

#### SiginUp.jsx
- **Função**: Cadastro de novos usuários
- **Campos**: Nome, email e senha
- **Navegação**: Home (sucesso) | Login (voltar)

### 🏠 Tela Principal

#### Home.jsx
- **Função**: Dashboard principal do aplicativo
- **Componentes**:
  - Header com saudação personalizada
  - Card de pontos com acesso à roleta
  - Seção de iniciativa financeira
  - Carrossel de artigos educativos
  - Seção de continuidade de aprendizado
- **Navegação**: Todas as outras telas

### 🎰 Jogos

#### Roulette.jsx
- **Função**: Jogo de roleta interativo
- **Funcionalidades**:
  - Roleta SVG animada
  - Sistema de pontos
  - Animações e efeitos visuais
  - Modal de resultados
- **Modo**: Teste (giros ilimitados)

### 📚 Educação

#### Aprender.jsx
- **Função**: Centro de aprendizado
- **Conteúdo**: Artigos e materiais educativos
- **Categorias**: Investimentos, finanças pessoais, etc.

### 📊 Financeiro

#### AccountOverview.jsx
- **Função**: Visão geral das finanças
- **Dados**: Saldo, receitas, despesas
- **Gráficos**: Visualizações de dados

#### AccountHistory.jsx
- **Função**: Histórico de transações
- **Funcionalidades**: Lista, filtros, busca

#### TransactionForm.jsx
- **Função**: Adicionar/editar transações
- **Campos**: Valor, tipo, categoria, descrição, data

#### Graficos.jsx
- **Função**: Gráficos e relatórios financeiros
- **Tipos**: Gráficos de pizza, barras, linhas

### ⚙️ Configurações

#### Config.jsx
- **Função**: Configurações gerais do app
- **Opções**: Perfil, notificações, preferências

#### Profile.jsx
- **Função**: Gerenciamento de perfil
- **Campos**: Nome, email, foto

#### ChangePassword.jsx
- **Função**: Alteração de senha
- **Campos**: Senha atual, nova senha, confirmação

#### Notifications.jsx
- **Função**: Gerenciamento de notificações
- **Configurações**: Tipos, frequência, horários

---

## 🗃️ Gerenciamento de Estado

### 📊 AccountStore (Zustand)

```typescript
interface AccountStore {
  transactions: Transaction[];
  balance: number;
  totalIncome: number;
  totalExpense: number;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  loadTransactions: () => Promise<void>;
  saveTransactions: () => Promise<void>;
}
```

**Funcionalidades:**
- Gerenciamento de transações financeiras
- Cálculo automático de saldo
- Persistência com AsyncStorage
- Dados mock para demonstração

### 🏗️ Container (Injeção de Dependência)

```typescript
class Container {
  private static instance: Container;
  
  public static getInstance(): Container
  public getUserUseCase(): UserUseCase
  public getRouletteUseCase(): RouletteUseCase
  public getArticleUseCase(): ArticleUseCase
}
```

**Funcionalidades:**
- Singleton pattern
- Inicialização de dependências
- Acesso centralizado aos use cases

---

## 🚀 Instalação e Configuração

### 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **npm** ou **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **React Native CLI** (opcional)

### 📱 Dispositivos Suportados

- **Android**: API 21+ (Android 5.0+)
- **iOS**: iOS 11.0+
- **Web**: Navegadores modernos

### 🔧 Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/jcurci/BetHunter
   cd BetHunter
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Execute o projeto:**
   ```bash
   npx expo start
   ```

4. **Acesse no dispositivo:**
   - **Android**: Abra o Expo Go e escaneie o QR code
   - **iOS**: Abra o Expo Go e escaneie o QR code
   - **Web**: Pressione `w` no terminal

### 🛠️ Configuração Adicional

#### TypeScript
O projeto já está configurado com TypeScript. Para verificar tipos:
```bash
npx tsc --noEmit
```

#### Metro Bundler
Configuração personalizada em `metro.config.js` para suporte a SVG.

---

## 📜 Scripts Disponíveis

### 🚀 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npx expo start

# Executar no Android
npm run android
# ou
npx expo start --android

# Executar no iOS
npm run ios
# ou
npx expo start --ios

# Executar na Web
npm run web
# ou
npx expo start --web
```

### 🔧 Utilitários

```bash
# Limpar cache
npx expo start --clear

# Verificar tipos TypeScript
npx tsc --noEmit

# Instalar dependências
npm install

# Atualizar dependências
npm update
```

---

## 👥 Contribuidores

### 🎓 Equipe de Desenvolvimento

- **Felipe Hideki** - RM98323
- **Guilherme Milheiro** - RM550295
- **Jhonatan Curci** - RM94188
- **Enzo Vasconcelos** - RM550702
- **Ricardo Queiroz** - RM94241

### 🎯 Responsabilidades

- **Arquitetura**: Clean Architecture e estrutura do projeto
- **Frontend**: Componentes React Native e interface
- **Backend**: Lógica de negócio e casos de uso
- **Design**: UX/UI e experiência do usuário
- **Testes**: Qualidade e validação

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**.

```
MIT License

Copyright (c) 2024 BetHunter Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔮 Próximos Passos

### 🚀 Funcionalidades Futuras

1. **Autenticação Real**: Integração com backend
2. **Notificações Push**: Lembretes e dicas
3. **Gamificação Avançada**: Conquistas e badges
4. **Análise de Dados**: IA para recomendações
5. **Social**: Compartilhamento e competições
6. **Offline**: Funcionamento sem internet

### 🛠️ Melhorias Técnicas

1. **Testes Automatizados**: Unitários e integração
2. **CI/CD**: Pipeline de deploy
3. **Monitoramento**: Analytics e crash reporting
4. **Performance**: Otimizações e lazy loading
5. **Acessibilidade**: Suporte a leitores de tela
6. **Internacionalização**: Múltiplos idiomas

### 📱 Expansão de Plataformas

1. **Desktop**: Versão para Windows/Mac/Linux
2. **Smartwatch**: Extensão para wearables
3. **TV**: Interface para smart TVs
4. **API**: Backend público para integrações

---

## 📞 Suporte

Para dúvidas, sugestões ou problemas:

- **Issues**: [GitHub Issues](https://github.com/jcurci/BetHunter/issues)
- **Email**: [Contato da Equipe]
- **Documentação**: Este arquivo e `ARCHITECTURE.md`

---

*Documentação gerada automaticamente - BetHunter v1.0.0*
