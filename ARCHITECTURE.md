# Arquitetura do Projeto BetHunter

## 📁 Estrutura de Pastas

```
src/
├── features/                    # Módulos de funcionalidades
│   ├── auth/                   # Autenticação
│   │   ├── Login.jsx
│   │   ├── SiginUp.jsx
│   │   └── index.ts
│   ├── home/                   # Tela principal
│   │   ├── Home.jsx
│   │   └── index.ts
│   ├── learn/                  # Módulo de aprendizado
│   │   ├── Aprender.jsx
│   │   └── index.ts
│   ├── charts/                 # Módulo de gráficos
│   │   ├── Graficos.jsx
│   │   └── index.ts
│   ├── game/                   # Módulo de jogos
│   │   ├── Roulette.jsx
│   │   └── index.ts
│   └── config/                 # Configurações
│       ├── Config.jsx
│       ├── Profile.jsx
│       ├── ChangePassword.jsx
│       ├── Notifications.jsx
│       └── index.ts
├── shared/                     # Recursos compartilhados
│   ├── components/             # Componentes reutilizáveis
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   ├── RecommendationSection.tsx
│   │   └── index.ts
│   ├── constants/              # Constantes do app
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── hooks/                  # Hooks customizados
│   │   ├── useAuth.ts
│   │   └── index.ts
│   ├── utils/                  # Utilitários
│   │   ├── validation.ts
│   │   └── index.ts
│   └── services/               # Serviços externos
│       ├── api.ts
│       └── index.ts
├── core/                       # Funcionalidades core
│   ├── navigation/             # Navegação
│   │   ├── AppNavigator.tsx
│   │   └── index.ts
│   ├── storage/                # Armazenamento
│   │   └── eventStorage.ts
│   ├── types/                  # Tipos TypeScript
│   │   ├── navigation.ts
│   │   └── index.ts
│   ├── AuthContext.tsx         # Contexto de autenticação
│   └── index.ts
└── assets/                     # Recursos estáticos
    ├── icon-home.svg
    ├── image-bitcoin.svg
    ├── image-grafico.svg
    ├── image-moeda.svg
    ├── login_background.png
    └── logo-img/
        ├── logo_white.svg
        └── text_white.svg
```

## 🏗️ Princípios da Arquitetura

### 1. **Feature-Based Organization**

- Cada funcionalidade tem sua própria pasta
- Módulos independentes e autocontidos
- Fácil manutenção e escalabilidade

### 2. **Shared Resources**

- Componentes reutilizáveis em `shared/components`
- Constantes centralizadas em `shared/constants`
- Hooks customizados em `shared/hooks`
- Utilitários em `shared/utils`
- Serviços em `shared/services`

### 3. **Core Functionality**

- Navegação centralizada
- Contextos globais
- Tipos TypeScript
- Armazenamento local

## 📦 Imports Organizados

### Antes:

```javascript
import Login from "../screens/Login-screens/Login";
import Footer from "../components/Footer";
```

### Depois:

```javascript
import { Login } from "../../features/auth";
import { Footer } from "../../shared/components";
```

## 🎯 Benefícios

1. **Escalabilidade**: Fácil adicionar novas features
2. **Manutenibilidade**: Código organizado e previsível
3. **Reutilização**: Componentes e utilitários compartilhados
4. **Testabilidade**: Módulos isolados facilitam testes
5. **Performance**: Imports otimizados com barrel exports

## 🚀 Como Usar

### Adicionar Nova Feature:

1. Criar pasta em `features/`
2. Adicionar arquivos da feature
3. Criar `index.ts` com exports
4. Importar via barrel export

### Adicionar Componente Compartilhado:

1. Adicionar em `shared/components/`
2. Exportar no `index.ts`
3. Usar em qualquer lugar do app

### Adicionar Constante:

1. Adicionar em `shared/constants/`
2. Exportar no `index.ts`
3. Importar onde necessário

## 🔧 Configuração

O projeto mantém a mesma funcionalidade, apenas com melhor organização. Todos os imports foram atualizados automaticamente.
