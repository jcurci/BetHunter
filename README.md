# BetHunter

Aplicativo mobile para fazer as pessoas pararem de apostar e aprenderem sobre investimentos.

## Funcionalidades

- Tela de login e cadastro
- Tela principal com roleta de pontos
- Sistema de navegação entre telas

## Requisitos

- Node.js
- npm ou yarn
- Expo CLI
- React Native

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/jcurci/BetHunter
   cd betHunter
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute o projeto:
   ```bash
   npx expo start
   ```

## Estrutura do Projeto

```
├── App.jsx
├── src
│   ├── components
│   │   └── Footer.jsx
│   ├── screens
│   │   ├── Home.jsx
│   │   ├── Roulette.jsx
│   │   └── Login-screens
│   │       ├── Login.jsx
│   │       └── SiginUp.jsx
│   └── navigation
│       └── AppNavigator.tsx
├── assets
│   └── ...
├── package.json
└── README.md
```

## Tecnologias Utilizadas

- React Native
- Expo
- React Navigation
- JavaScript/TypeScript

## Licença

MIT
