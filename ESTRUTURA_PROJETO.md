# 📐 Estrutura do Projeto BetHunter

## 🏗️ Arquitetura Geral

O projeto utiliza **Clean Architecture** com separação clara de responsabilidades em 3 camadas principais:

```
src/
├── domain/              # Camada de Domínio (Regras de Negócio)
│   ├── entities/        # Entidades (User, Lesson, Article, Roulette)
│   ├── repositories/    # Interfaces dos Repositories
│   ├── usecases/        # Casos de Uso (Lógica de Negócio)
│   └── errors/          # Erros customizados
│
├── data/                # Camada de Dados
│   ├── datasources/     # Interfaces dos Data Sources
│   └── repositories/    # Implementações dos Repositories
│
├── infrastructure/      # Camada de Infraestrutura
│   ├── datasources/     # Implementações dos Data Sources (API)
│   ├── storage/         # Serviços de Storage (AsyncStorage)
│   └── di/              # Dependency Injection (Container)
│
├── components/          # Componentes React Native
│   └── common/          # Componentes Reutilizáveis
│
└── screens/             # Telas/Páginas da Aplicação
```

---

## 🔄 Componentes Reutilizáveis

### 📍 Localização: `src/components/common/`

Os componentes reutilizáveis estão organizados em `src/components/common/` e são exportados através de um arquivo `index.ts` centralizado.

### 1. **Footer** (`Footer/Footer.tsx`)

**Propósito**: Barra de navegação inferior fixa em todas as telas principais.

**Características:**
- Navegação entre 4 abas principais: Home, Aprender, Gráficos, Jogar (Roulette)
- Indicador visual de aba ativa (fundo roxo com ícone preenchido)
- Usa `react-native-vector-icons` para ícones
- Integrado com React Navigation para navegação

**Uso:**
```tsx
import { Footer } from '../../components';

// No final do componente da tela
<Footer />
```

**Telas que utilizam:**
- ✅ `Home.tsx`
- ✅ `Aprender.tsx`
- ✅ `Graficos.tsx`
- ✅ `Roulette.tsx`

**Props**: Nenhuma (usa `useRoute` e `useNavigation` internamente)

---

### 2. **StatsDisplay** (`StatsDisplay/StatsDisplay.tsx`)

**Propósito**: Exibe estatísticas do usuário (energia e streak) com ícones SVG.

**Características:**
- Mostra energia (raio) e streak (fogo)
- Aceita valores customizáveis via props
- Layout vertical com ícones SVG customizados

**Interface:**
```typescript
interface StatsDisplayProps {
  energy?: number;      // Default: 10
  streak?: string;      // Default: "3d"
  style?: ViewStyle;    // Estilos customizados
}
```

**Uso:**
```tsx
import { StatsDisplay } from '../../components';

<StatsDisplay energy={10} streak="3d" />
```

**Telas que utilizam:**
- ✅ `Home.tsx` (no header)

---

### 3. **IconCard** (`IconCard/IconCard.tsx`)

**Propósito**: Card genérico para exibir ícones com título, usado em grids de funcionalidades.

**Características:**
- Layout flexível (usa `flex: 1` para grid)
- Aceita qualquer ReactNode como ícone
- Efeito de toque (onPress)
- Estilo consistente com tema dark

**Interface:**
```typescript
interface IconCardProps {
  icon: React.ReactNode;    // Qualquer componente React (SVG, Icon, etc)
  title: string;             // Título do card
  onPress?: () => void;      // Callback opcional ao tocar
}
```

**Uso:**
```tsx
import { IconCard } from '../../components';
import BetHunterIcon from '../../assets/home/bethunter.svg';

<IconCard 
  icon={<BetHunterIcon width={24} height={24} />} 
  title="Conta" 
  onPress={() => navigation.navigate('AccountOverview')}
/>
```

**Telas que utilizam:**
- ✅ `Home.tsx` (múltiplos usos em diferentes abas: conta, parceiros, social)

**Exemplos de uso na Home:**
- **Aba "Conta"**: Conta, Acessor, Jornada
- **Aba "Parceiros"**: Consultas, Eventos, Cursos
- **Aba "Social"**: Fóruns, Artigos, Vídeos

---

### 4. **HomeAccountButton** (`HomeAccountButton/HomeAccountButton.tsx`)

**Propósito**: Botão destacado para navegar para gestão financeira.

**Características:**
- Animação de escala ao pressionar (Animated API)
- Design com gradiente roxo
- Ícones com MaterialCommunityIcons
- Navega automaticamente para `AccountOverview`

**Uso:**
```tsx
import { HomeAccountButton } from '../../components';

<HomeAccountButton />
```

**Telas que utilizam:**
- ⚠️ **Não encontrado em uso atual** (pode estar planejado ou removido)

---

## 📦 Sistema de Exportação

### Arquivo Central: `src/components/common/index.ts`

```typescript
export { default as Footer } from './Footer/Footer';
export { default as HomeAccountButton } from './HomeAccountButton/HomeAccountButton';
export { default as StatsDisplay } from './StatsDisplay/StatsDisplay';
export { default as IconCard } from './IconCard/IconCard';
```

### Arquivo Principal: `src/components/index.ts`

```typescript
export * from './common';
```

**Benefício**: Importação simplificada em qualquer lugar do projeto:

```tsx
// ✅ Importação simples
import { Footer, StatsDisplay, IconCard } from '../../components';

// ❌ Não precisa fazer:
import Footer from '../../components/common/Footer/Footer';
import StatsDisplay from '../../components/common/StatsDisplay/StatsDisplay';
```

---

## 🎯 Padrões de Reutilização Identificados

### 1. **Componentes de Layout**
- **Footer**: Reutilizado em 4+ telas principais
- Padrão fixo no bottom da tela

### 2. **Componentes de Dados**
- **StatsDisplay**: Reutilizado para mostrar estatísticas
- **IconCard**: Altamente reutilizado (9+ instâncias na Home)

### 3. **Componentes de Navegação**
- **Footer**: Navegação principal
- **HomeAccountButton**: Navegação específica para conta

---

## 🔧 Dependency Injection (DI)

### Container Pattern (`src/infrastructure/di/Container.ts`)

**Singleton** que gerencia todas as dependências:

```typescript
Container.getInstance()
  .getUserUseCase()
  .getRouletteUseCase()
  .getArticleUseCase()
  .getLessonUseCase()
```

### Hooks Customizados (`src/infrastructure/di/useContainer.ts`)

Simplificam acesso aos use cases:

```typescript
import { useUserUseCase, useArticleUseCase } from '../../infrastructure/di/useContainer';

const userUseCase = useUserUseCase();
const articles = await userUseCase.getArticles();
```

**Uso nas telas:**
```tsx
// Opção 1: Hook customizado (recomendado)
const userUseCase = useUserUseCase();

// Opção 2: Container direto
const container = Container.getInstance();
const userUseCase = container.getUserUseCase();
```

---

## 📱 Estrutura de Telas

### Navegação Principal (`App.tsx`)

Stack Navigator com 15+ telas:
- **Autenticação**: Login, SignUp, SignUpPassword
- **Principais**: Home, Aprender, Roulette, Graficos
- **Configurações**: Config, Profile, ChangePassword, Notifications
- **Conta**: AccountOverview, AccountHistory, TransactionForm
- **Quiz**: Quiz, QuizResult

### Telas que usam componentes comuns:

| Tela | Footer | StatsDisplay | IconCard | HomeAccountButton |
|------|--------|--------------|----------|-------------------|
| Home | ✅ | ✅ | ✅ (9x) | ❌ |
| Aprender | ✅ | ❌ | ❌ | ❌ |
| Graficos | ✅ | ❌ | ❌ | ❌ |
| Roulette | ✅ | ❌ | ❌ | ❌ |

---

## 🗄️ Gerenciamento de Estado

### Zustand Stores (`src/storage/`)

1. **authStore.ts**: Estado de autenticação
   - Token, usuário, isAuthenticated
   - Sincronizado com `AuthStorageService`

2. **accountStore.ts**: Estado de transações financeiras

### Storage Services (`src/infrastructure/storage/`)

- **AsyncStorageService**: Implementação genérica de storage
- **AuthStorageService**: Gerenciamento específico de auth (token + user)

---

## 🎨 Padrões de Estilo

### Cores Principais
- **Roxo**: `#7456C8` (primária)
- **Fundo escuro**: `#1C1C1C`, `#1A1923`
- **Texto**: `#FFFFFF`, `#A09CAB`

### Gradientes
- **Text Gradient**: `["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]`
- **Background Gradient**: `["#443570", "#443045", "#2F2229", "#1A1923"]`

### Bibliotecas de UI
- `expo-linear-gradient`: Gradientes
- `react-native-vector-icons`: Ícones (Ionicons, MaterialCommunityIcons, Feather)
- `react-native-svg`: SVG customizado
- `@react-native-masked-view/masked-view`: Texto com gradiente

---

## 📊 Fluxo de Dados

### Fluxo Completo (Exemplo: Carregar Artigos)

```
Screen (Home.tsx)
  ↓
useContainer() → Container.getInstance()
  ↓
getArticleUseCase()
  ↓
ArticleUseCase
  ↓
ArticleRepository (interface)
  ↓
ArticleRepositoryImpl
  ↓
ArticleDataSource (interface)
  ↓
ArticleDataSourceImpl (API call)
  ↓
AsyncStorageService (cache)
```

---

## 🚀 Como Adicionar um Novo Componente Reutilizável

### 1. Criar estrutura de pasta:
```
src/components/common/MeuComponente/
  └── MeuComponente.tsx
```

### 2. Criar componente:
```tsx
// MeuComponente.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface MeuComponenteProps {
  title: string;
}

const MeuComponente: React.FC<MeuComponenteProps> = ({ title }) => {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};

export default MeuComponente;
```

### 3. Exportar em `src/components/common/index.ts`:
```typescript
export { default as MeuComponente } from './MeuComponente/MeuComponente';
```

### 4. Usar em qualquer tela:
```tsx
import { MeuComponente } from '../../components';

<MeuComponente title="Hello" />
```

---

## 📝 Resumo

### Componentes Reutilizáveis (4)
1. ✅ **Footer** - Navegação inferior (4+ telas)
2. ✅ **StatsDisplay** - Estatísticas do usuário (1 tela)
3. ✅ **IconCard** - Cards de ícones (9+ instâncias)
4. ⚠️ **HomeAccountButton** - Botão de conta (não em uso)

### Arquitetura
- ✅ Clean Architecture bem implementada
- ✅ Dependency Injection (Container pattern)
- ✅ Separação clara de responsabilidades

### Pontos de Atenção
- ⚠️ `HomeAccountButton` não está sendo usado
- 💡 Oportunidade de criar mais componentes reutilizáveis (ex: botões, cards, inputs)

---

**Última atualização**: Baseado na análise do código atual do projeto




