# Sistema de Navegação - BetHunter

## Estrutura Implementada

### 1. **AuthContext** (`src/contexts/AuthContext.tsx`)

- Gerencia o estado de autenticação global
- Fornece funções `login()` e `logout()`
- Controla qual stack de navegação será exibido

### 2. **AppNavigator** (`src/navigation/AppNavigator.tsx`)

- **AuthStack**: Telas de login e cadastro
- **MainStack**: Telas principais do app
- **MainTabNavigator**: Navegação por abas

### 3. **Estrutura de Navegação**

#### Telas de Autenticação (quando não logado)

- `Login` - Tela de login
- `SiginUp` - Tela de cadastro

#### Telas Principais (quando logado)

- **Tab Navigator com 4 abas:**
  - `Home` - Tela principal com notícias e resumo
  - `Aprender` - Tela de cursos e aprendizado
  - `Gráficos` - Tela de análise técnica e dados de mercado
  - `Jogar` - Tela da roleta

#### Telas de Configuração (Stack)

- `Config` - Configurações gerais
- `Profile` - Perfil do usuário
- `ChangePassword` - Alterar senha
- `Notifications` - Notificações

## Como Usar

### 1. **Navegação entre abas**

```javascript
// No Footer.jsx (já implementado)
navigation.navigate("Home");
navigation.navigate("Aprender");
navigation.navigate("Gráficos");
navigation.navigate("Jogar");
```

### 2. **Navegação para telas de configuração**

```javascript
// De qualquer tela principal
navigation.navigate("Config");
navigation.navigate("Profile");
navigation.navigate("ChangePassword");
navigation.navigate("Notifications");
```

### 3. **Autenticação**

```javascript
// No Login.jsx
const { login } = useAuth();
login(); // Navega automaticamente para as telas principais

// Para logout (implementar onde necessário)
const { logout } = useAuth();
logout(); // Volta para as telas de autenticação
```

## Funcionalidades

### ✅ **Implementado**

- Sistema de autenticação com contexto
- Navegação por abas com Footer customizado
- Stack navigation para telas de configuração
- Separação clara entre telas autenticadas e não autenticadas
- Tipagem TypeScript para navegação

### 🔄 **Para Implementar**

- Persistência do estado de autenticação (AsyncStorage)
- Validação real de credenciais
- Integração com biblioteca de gráficos (ex: react-native-chart-kit)
- Lógica de logout nas telas de configuração
- Dados reais de mercado via API

## Estrutura de Arquivos

```
src/
├── contexts/
│   └── AuthContext.tsx          # Contexto de autenticação
├── navigation/
│   └── AppNavigator.tsx         # Navegador principal
├── types/
│   └── navigation.ts            # Tipos de navegação
├── screens/
│   ├── Login-screens/           # Telas de autenticação
│   ├── Config-screens/          # Telas de configuração
│   ├── Main-screens/            # Telas principais
│   │   ├── Aprender.jsx         # Tela de aprendizado
│   │   └── Graficos.jsx         # Tela de gráficos
│   ├── Home.jsx                 # Tela principal
│   └── Roulette.jsx             # Tela da roleta
└── components/
    └── Footer.jsx               # Footer customizado
```

## Testando

1. **Para testar o login**: Clique no botão "Logar" na tela de login
2. **Para testar as abas**: Use o Footer para navegar entre as telas
3. **Para testar configurações**: Clique no ícone de configurações na Home
4. **Para voltar ao login**: Implemente logout nas telas de configuração
