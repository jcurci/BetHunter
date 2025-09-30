# 🎯 BetHunter

Um aplicativo mobile desenvolvido em React Native 

## 👥 Equipe

- **Felipe Hideki** - RM98323
- **Guilherme Milheiro** - RM550295
- **Jhonatan Curci** - RM94188
- **Enzo Vasconcelos** - RM550702
- **Ricardo Queiroz** - RM94241

## 📱 Sobre o Projeto

O BetHunter é uma aplicação mobile que oferece ferramentas para aprender financas de um jeito divertido e gameficado.

## 🚀 Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Linguagem de programação tipada
- **React Navigation** - Navegação entre telas
- **AsyncStorage** - Armazenamento local de dados
- **React Native Vector Icons** - Ícones
- **React Native Chart Kit** - Gráficos
- **Zustand** - Gerenciamento de estado
- **Expo Linear Gradient** - Gradientes

## 🏗️ Arquitetura

O projeto segue os princípios da **Clean Architecture** com separação clara de responsabilidades:

```
src/
├── components/          # Componentes da interface
│   ├── comum/          # Componentes reutilizáveis
│   └── pages/          # Telas da aplicação
├── domain/             # Regras de negócio
│   ├── entities/       # Entidades do domínio
│   ├── repositories/   # Interfaces dos repositórios
│   └── usecases/       # Casos de uso
├── data/               # Camada de dados
│   ├── datasources/    # Fontes de dados
│   └── repositories/   # Implementação dos repositórios
├── infrastructure/     # Infraestrutura
│   ├── datasources/    # Implementação das fontes de dados
│   ├── di/            # Injeção de dependência
│   └── storage/       # Serviços de armazenamento
└── types/             # Definições de tipos TypeScript
```

## 🔐 Sistema de Autenticação

### Funcionalidades Implementadas

#### 📝 Cadastro de Usuário

- **Campos obrigatórios**: Nome completo, email, senha e confirmação de senha
- **Validações**:
  - Todos os campos são obrigatórios
  - Senha deve ter pelo menos 6 caracteres
  - Confirmação de senha deve coincidir com a senha
- **Segurança**: Senhas são ocultas com opção de visualização
- **Persistência**: Dados salvos automaticamente no AsyncStorage
- **Navegação**: Redirecionamento automático para a tela Home após cadastro

#### 🔑 Login de Usuário

- **Campos**: Email e senha
- **Validação**: Campos obrigatórios
- **Verificação**: Busca usuário existente no AsyncStorage
- **Persistência**: Mantém sessão do usuário
- **Navegação**: Redirecionamento automático para a tela Home

#### 🚪 Logout

- **Localização**: Tela de Configurações
- **Confirmação**: Modal de confirmação antes de sair
- **Limpeza**: Remove dados do usuário do AsyncStorage
- **Navegação**: Retorna para tela de Login

#### 🔄 Verificação Automática de Sessão

- **AuthChecker**: Componente que verifica se usuário está logado
- **Navegação Inteligente**:
  - Se logado → Vai direto para Home
  - Se não logado → Vai para Login
- **Persistência**: Mantém sessão entre aberturas do app

## 📱 Telas e Funcionalidades

### 🏠 Tela Principal (Home)

- Dashboard com informações da conta
- Navegação para outras funcionalidades
- Exibição de pontos do usuário

### ⚙️ Configurações

- **Perfil**: Gerenciamento de dados pessoais
- **Notificações**: Configuração de alertas
- **Logout**: Sair da conta com confirmação

### 👤 Perfil do Usuário

- Visualização e edição de dados pessoais
- Alteração de senha
- Gestão de informações da conta

### 🎰 Roleta de Apostas

- Interface para jogos de roleta
- Sistema de apostas integrado

### 📊 Gráficos

- Visualização de dados de apostas
- Análise de performance
- Relatórios estatísticos

### 📚 Aprender

- Artigos educativos sobre apostas
- Dicas e estratégias
- Conteúdo de aprendizado

### 🔔 Notificações

- Configuração de alertas
- Histórico de notificações
- Preferências de comunicação

### 💰 Gestão Financeira

- **Visão Geral da Conta**: Resumo financeiro
- **Histórico**: Transações realizadas
- **Formulário de Transação**: Registro de movimentações

## 🗄️ Armazenamento de Dados

### AsyncStorage

- **Usuário Atual**: Dados da sessão ativa
- **Persistência**: Mantém dados entre sessões
- **Segurança**: Dados armazenados localmente no dispositivo

### Estrutura de Dados do Usuário

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎨 Interface do Usuário

### Design System

- **Cores Principais**:
  - Roxo: `#7456C8` (botões principais)
  - Laranja: `#FFA500` (botões secundários)
  - Preto: `#000` (fundo principal)
  - Cinza: `#1C1C1C` (inputs e cards)

### Componentes Reutilizáveis

- **Navbar**: Navegação principal
- **Footer**: Rodapé da aplicação
- **ThemeToggle**: Alternância de tema
- **EventForm**: Formulário de eventos
- **RecommendationSection**: Seção de recomendações

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Dispositivo móvel ou emulador

### Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Navegue para o diretório
cd BetHunter

# Instale as dependências
npm install

# Inicie o projeto
npm start
```

### Executar no Dispositivo

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📦 Dependências Principais

```json
{
  "@react-native-async-storage/async-storage": "1.21.0",
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/native-stack": "^6.11.0",
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.6",
  "react-native-chart-kit": "^6.12.0",
  "react-native-vector-icons": "^10.0.3",
  "zustand": "^5.0.7"
}
```

## 🔧 Funcionalidades Técnicas

### Injeção de Dependência

- **Container**: Gerenciamento centralizado de dependências
- **Singleton Pattern**: Instância única do container
- **Loose Coupling**: Baixo acoplamento entre camadas

### Gerenciamento de Estado

- **Zustand**: Estado global da aplicação
- **AsyncStorage**: Persistência local
- **Context API**: Estado local dos componentes

### Navegação

- **Stack Navigator**: Navegação em pilha
- **Navegação Programática**: Controle via código
- **Deep Linking**: Suporte a links profundos

## 🧪 Testes e Qualidade

### Validações Implementadas

- **Campos Obrigatórios**: Todos os formulários
- **Formato de Email**: Validação de email válido
- **Tamanho de Senha**: Mínimo de 6 caracteres
- **Confirmação de Senha**: Coincidência de senhas

### Tratamento de Erros

- **Try-Catch**: Captura de exceções
- **Alertas**: Feedback visual para o usuário
- **Logs**: Console.log para debugging

## 📈 Próximas Funcionalidades

- [ ] Integração com APIs de apostas
- [ ] Sistema de notificações push
- [ ] Análise de odds em tempo real
- [ ] Histórico detalhado de apostas
- [ ] Sistema de recomendações
- [ ] Modo offline
- [ ] Backup na nuvem

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ pela equipe BetHunter**
