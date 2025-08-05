# BetHunter - Clean Architecture

## Estrutura do Projeto

```
src/
├── domain/                    # Camada de Domínio
│   ├── entities/             # Entidades de negócio
│   │   ├── User.ts
│   │   ├── Roulette.ts
│   │   └── Article.ts
│   ├── repositories/         # Interfaces dos repositórios
│   │   ├── UserRepository.ts
│   │   ├── RouletteRepository.ts
│   │   └── ArticleRepository.ts
│   ├── usecases/            # Casos de uso
│   │   ├── UserUseCase.ts
│   │   ├── RouletteUseCase.ts
│   │   └── ArticleUseCase.ts
│   └── index.ts
├── data/                     # Camada de Dados
│   ├── repositories/         # Implementações dos repositórios
│   │   ├── UserRepositoryImpl.ts
│   │   ├── RouletteRepositoryImpl.ts
│   │   └── ArticleRepositoryImpl.ts
│   └── datasources/         # Interfaces dos data sources
│       ├── UserDataSource.ts
│       ├── RouletteDataSource.ts
│       └── ArticleDataSource.ts
├── infrastructure/           # Camada de Infraestrutura
│   ├── datasources/         # Implementações dos data sources
│   │   ├── UserDataSourceImpl.ts
│   │   ├── RouletteDataSourceImpl.ts
│   │   └── ArticleDataSourceImpl.ts
│   ├── storage/             # Serviços de storage
│   │   ├── StorageService.ts
│   │   └── AsyncStorageService.ts
│   ├── di/                  # Injeção de dependência
│   │   └── Container.ts
│   └── services/            # Outros serviços
├── presentation/            # Camada de Apresentação
│   ├── screens/            # Telas do app
│   │   ├── Login-screens/
│   │   ├── Config-screens/
│   │   ├── Home.jsx
│   │   ├── Roulette.jsx
│   │   ├── Aprender.jsx
│   │   └── Graficos.jsx
│   ├── components/         # Componentes reutilizáveis
│   │   ├── Footer.jsx
│   │   ├── EventForm.tsx
│   │   ├── Navbar.jsx
│   │   └── RecommendationSection.tsx
│   └── navigation/        # Configuração de navegação
├── assets/                # Recursos estáticos
└── types/                 # Definições de tipos
```

## Princípios da Clean Architecture

### 1. **Separação de Responsabilidades**
- **Domain**: Contém as regras de negócio e entidades
- **Data**: Gerencia dados e implementa repositórios
- **Infrastructure**: Fornece implementações concretas
- **Presentation**: Interface do usuário

### 2. **Inversão de Dependência**
- As camadas internas não dependem das externas
- Interfaces definem contratos entre camadas
- Implementações concretas ficam nas camadas externas

### 3. **Injeção de Dependência**
- Container gerencia dependências
- Facilita testes e manutenção
- Reduz acoplamento entre componentes

## Fluxo de Dados

```
Presentation → UseCase → Repository → DataSource → Infrastructure
```

### Exemplo: Login do Usuário

1. **Presentation** (Login.jsx)
   - Captura dados do usuário
   - Chama UserUseCase.login()

2. **UseCase** (UserUseCase.ts)
   - Contém regras de negócio
   - Chama UserRepository.login()

3. **Repository** (UserRepositoryImpl.ts)
   - Orquestra fontes de dados
   - Chama UserDataSource.login()

4. **DataSource** (UserDataSourceImpl.ts)
   - Implementa acesso a dados
   - Usa StorageService para persistência

## Benefícios

### ✅ **Testabilidade**
- Cada camada pode ser testada independentemente
- Mocks facilitam testes unitários

### ✅ **Manutenibilidade**
- Mudanças em uma camada não afetam outras
- Código organizado e fácil de entender

### ✅ **Escalabilidade**
- Fácil adicionar novas funcionalidades
- Estrutura preparada para crescimento

### ✅ **Flexibilidade**
- Fácil trocar implementações (ex: API, Storage)
- Desacoplamento entre camadas

## Como Usar

### 1. **Acessando Use Cases**
```javascript
import { Container } from '../infrastructure/di/Container';

const container = Container.getInstance();
const userUseCase = container.getUserUseCase();
```

### 2. **Adicionando Nova Funcionalidade**
1. Criar entidade no `domain/entities/`
2. Criar interface do repositório em `domain/repositories/`
3. Criar caso de uso em `domain/usecases/`
4. Implementar repositório em `data/repositories/`
5. Implementar data source em `infrastructure/datasources/`
6. Registrar no Container

### 3. **Testando**
```javascript
// Mock do repositório para testes
const mockUserRepository = {
  login: jest.fn().mockResolvedValue(mockUser)
};

const userUseCase = new UserUseCase(mockUserRepository);
```

## Tecnologias Utilizadas

- **React Native**: Framework mobile
- **TypeScript**: Tipagem estática
- **React Navigation**: Navegação
- **AsyncStorage**: Persistência local
- **React Native SVG**: Gráficos SVG
- **React Native Vector Icons**: Ícones

## Próximos Passos

1. **Implementar testes unitários**
2. **Adicionar validações de entrada**
3. **Implementar tratamento de erros robusto**
4. **Adicionar logging e monitoramento**
5. **Implementar cache de dados**
6. **Adicionar autenticação real** 