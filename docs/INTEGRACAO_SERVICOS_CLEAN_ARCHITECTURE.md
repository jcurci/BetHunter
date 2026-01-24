# Integração de Serviços - Clean Architecture

## 📋 Visão Geral

Este documento explica como integrar um novo serviço seguindo a arquitetura Clean Architecture do projeto BetHunter. O exemplo prático utiliza o fluxo de **Login** como referência.

---

## 🏗️ Estrutura de Camadas

A Clean Architecture organiza o código em camadas concêntricas, onde:

- **Camadas externas dependem das internas** (não o contrário)
- **Domain Layer** é independente de frameworks e bibliotecas
- **Infrastructure Layer** implementa as interfaces definidas no Domain

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                   (Telas/Screens/UI)                         │
│                                                              │
│  - Login.tsx                                                 │
│  - Captura inputs do usuário                                 │
│  - Gerencia estado local (loading, erros)                    │
│  - Chama UseCase via Container                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   DEPENDENCY INJECTION                       │
│                        (Container)                           │
│                                                              │
│  - Container.getInstance()                                   │
│  - Orquestra dependências                                    │
│  - Instancia UseCase, Repository, API                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│                  (Regras de Negócio)                         │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │   UseCase       │  │  Repository      │  │ Entities │  │
│  │                 │  │  (Interface)     │  │          │  │
│  │ LoginUseCase    │→ │ AuthRepository   │  │AuthSession│ │
│  └─────────────────┘  └──────────────────┘  └──────────┘  │
│                                                              │
│  - Regras de negócio                                         │
│  - Validações                                                │
│  - Interfaces (contratos)                                    │
│  - Entidades                                                 │
│  - Erros customizados                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│              (Implementações Concretas)                      │
│                                                              │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────┐  │
│  │ Repository       │  │  API Service    │  │   HTTP   │  │
│  │ Implementation   │→ │  AuthApi        │→ │ apiClient│  │
│  │                  │  │                 │  │          │  │
│  │AuthRepositoryImpl│  │                 │  │          │  │
│  └──────────────────┘  └─────────────────┘  └──────────┘  │
│                                                              │
│  - Implementa interfaces do Domain                           │
│  - Chamadas HTTP                                             │
│  - Tratamento de erros de rede                               │
│  - Transformação de dados                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Completo: Login

### 1️⃣ **Presentation Layer** → `screens/Login/Login.tsx`

**Responsabilidade:**
- Captura inputs do usuário (email, senha)
- Gerencia estado de loading
- Tratamento de erros na UI
- Navegação após sucesso

**Código:**

```43:63:BetHunter/src/screens/Login/Login.tsx
    try {
      const container = Container.getInstance();
      const loginUseCase = container.getLoginUseCase();

      const session = await loginUseCase.execute(email, password);

      // Salvar token no authStore
      authStore.setToken(session.accessToken);

      // Navegar para Home
      navigation.navigate("Home");
    } catch (error: unknown) {
      console.error("Erro ao fazer login:", error);
      if (error instanceof ValidationError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Erro ao fazer login. Verifique suas credenciais e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
```

**Passos:**
1. Obtém instância do `Container` (Dependency Injection)
2. Solicita `LoginUseCase` do container
3. Chama `execute()` passando email e senha
4. Recebe `AuthSession` com token
5. Salva token no `authStore` (Zustand)
6. Navega para tela Home

---

### 2️⃣ **Dependency Injection** → `infrastructure/di/Container.ts`

**Responsabilidade:**
- Singleton pattern para gerenciar instâncias
- Orquestra criação de dependências
- Conecta camadas (UseCase → Repository → API)

**Código:**

```6:27:BetHunter/src/infrastructure/di/Container.ts
export class Container {
  private static instance: Container;

  private loginUseCase: LoginUseCase | null = null;

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getLoginUseCase(): LoginUseCase {
    if (!this.loginUseCase) {
      const authApi = new AuthApi();
      const authRepository = new AuthRepositoryImpl(authApi);
      this.loginUseCase = new LoginUseCase(authRepository);
    }

    return this.loginUseCase;
  }
}
```

**Passos:**
1. Cria instância do `AuthApi` (Infrastructure)
2. Cria `AuthRepositoryImpl` passando `AuthApi`
3. Cria `LoginUseCase` passando `AuthRepository`
4. Retorna UseCase pronto para uso

**Ordem de criação (bottom-up):**
```
AuthApi → AuthRepositoryImpl → LoginUseCase
```

---

### 3️⃣ **Domain Layer: UseCase** → `domain/usercases/LoginUseCase.ts`

**Responsabilidade:**
- Implementa lógica de negócio
- Valida dados de entrada
- Coordena chamada ao Repository
- Lança erros customizados do Domain

**Código:**

```1:14:BetHunter/src/domain/usercases/LoginUseCase.ts
import { AuthRepository } from "../repositories/AuthRepository"
import { ValidationError } from "../errors/CustomErrors"

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string) {
    if (!email || !password) {
      throw new ValidationError('Credenciais inválidas')
    }

    return this.authRepository.login(email, password)
  }
}
```

**Passos:**
1. Valida se email e senha foram fornecidos
2. Lança `ValidationError` se inválido
3. Delega para `AuthRepository.login()`
4. Retorna `AuthSession` (entidade do Domain)

**Observação:** O UseCase **não conhece** como o Repository está implementado, apenas usa a interface.

---

### 4️⃣ **Domain Layer: Repository Interface** → `domain/repositories/AuthRepository.ts`

**Responsabilidade:**
- Define **contrato** (interface) que deve ser implementado
- Especifica tipos de entrada e saída
- Permite que Domain Layer seja independente de implementação

**Código:**

```1:5:BetHunter/src/domain/repositories/AuthRepository.ts
import { AuthSession } from "../entities/AuthSession"

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>
}
```

**Benefícios:**
- Domain Layer não depende de detalhes de implementação
- Pode trocar implementação sem alterar UseCase
- Facilita testes (mock da interface)

---

### 5️⃣ **Domain Layer: Entity** → `domain/entities/AuthSession.ts`

**Responsabilidade:**
- Define estrutura de dados do domínio
- Independente de frameworks
- Tipo de retorno do login

**Código:**

```1:5:BetHunter/src/domain/entities/AuthSession.ts
export interface AuthSession {
  user: string;
  accessToken: string;
}
```

---

### 6️⃣ **Domain Layer: Error** → `domain/errors/CustomErrors.ts`

**Responsabilidade:**
- Define erros customizados do domínio
- Permite tratamento específico na UI

**Código:**

```1:14:BetHunter/src/domain/errors/CustomErrors.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Credenciais inválidas') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
```

---

### 7️⃣ **Infrastructure Layer: Repository Implementation** → `domain/data/repositories/AuthRepositoryImpl.ts`

**Responsabilidade:**
- **Implementa** interface `AuthRepository`
- Delega chamadas para API Service
- Pode transformar dados se necessário

**Código:**

```1:10:BetHunter/src/domain/data/repositories/AuthRepositoryImpl.ts
import { AuthRepository } from '../../repositories/AuthRepository';
import { AuthApi } from '../../../infrastructure/services/Auth.api';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private authApi: AuthApi) {}

  async login(email: string, password: string) {
    return await this.authApi.login(email, password);
  }
}
```

**Observação:** O arquivo está em `domain/data/repositories/`, mas é uma **implementação** (Infrastructure). Isso é comum em alguns projetos Clean Architecture.

---

### 8️⃣ **Infrastructure Layer: API Service** → `infrastructure/services/Auth.api.ts`

**Responsabilidade:**
- Faz chamadas HTTP para backend
- Trata erros de rede e HTTP
- Transforma respostas HTTP em entidades do Domain
- Lança erros customizados do Domain

**Código (resumido):**

```6:28:BetHunter/src/infrastructure/services/Auth.api.ts
export class AuthApi {
  async login(email: string, password: string): Promise<AuthSession> {
    try {
      // Log para debug - verificar URL completa
      const url = '/auth/login';
      console.log('🔗 AuthApi.login - Fazendo requisição para:', url);
      console.log('🔗 Base URL configurada:', (apiClient as any).defaults?.baseURL);
      console.log('🔗 URL completa:', `${(apiClient as any).defaults?.baseURL}${url}`);
      
      const response = await apiClient.post(url, {
        email,
        password,
      });

      const token = response.data.token || response.data.accessToken;

      if (!token) {
        throw new AuthenticationError('Token não recebido do servidor');
      }

      return {
        user: response.data.user || email,
        accessToken: token,
      };
```

**Passos:**
1. Faz POST para `/auth/login` via `apiClient`
2. Extrai token da resposta
3. Valida se token existe
4. Transforma resposta HTTP em `AuthSession`
5. Trata erros HTTP e converte para `AuthenticationError`

---

### 9️⃣ **Infrastructure Layer: HTTP Client** → `services/api/apiClient.ts`

**Responsabilidade:**
- Configura instância Axios
- Adiciona interceptors (token, erros)
- Base URL e headers padrão

**Código (resumido):**

```66:87:BetHunter/src/services/api/apiClient.ts
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await currentTokenProvider.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token adicionado ao header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

---

## 📊 Diagrama de Sequência

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Login   │  │Container│  │UseCase  │  │ Repo    │  │  API    │  │Backend  │
│ (UI)    │  │   (DI)  │  │ (Domain)│  │ Impl    │  │ Service │  │         │
└────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
     │           │           │           │           │           │
     │ 1. getUserCase()      │           │           │           │
     │───────────>│           │           │           │           │
     │           │           │           │           │           │
     │           │ 2. new AuthApi()      │           │           │
     │           │───────────────────────────────────>│           │
     │           │           │           │           │           │
     │           │ 3. new Repo(api)      │           │           │
     │           │────────────────────────>│          │           │
     │           │           │           │           │           │
     │           │ 4. new UseCase(repo)  │           │           │
     │           │──────────────────>│   │           │           │
     │           │           │           │           │           │
     │           │<──────────┘           │           │           │
     │           │ 5. return UseCase     │           │           │
     │<──────────┘                       │           │           │
     │           │           │           │           │           │
     │ 6. execute(email, pwd)            │           │           │
     │──────────────────────────────────────>│        │           │
     │           │           │           │           │           │
     │           │           │ 7. validate()         │           │
     │           │           │           │           │           │
     │           │           │ 8. repo.login()       │           │
     │           │           │──────────────────────>│           │
     │           │           │           │           │           │
     │           │           │           │ 9. api.login()        │
     │           │           │           │──────────────────────>│
     │           │           │           │           │           │
     │           │           │           │           │ 10. POST /auth/login
     │           │           │           │           │──────────────────────>│
     │           │           │           │           │           │
     │           │           │           │           │<──────────┘
     │           │           │           │           │ 11. { token }
     │           │           │           │<──────────┘           │
     │           │           │           │ 12. AuthSession       │
     │           │           │<──────────┘                       │
     │           │           │ 13. AuthSession                   │
     │<──────────────────────────────────────────────────────────┘
     │ 14. session.accessToken
     │
```

---

## 🔧 Como Integrar um Novo Serviço

### Passo a Passo

#### **1. Criar Entity (Domain)**

```typescript
// domain/entities/MeuNovoDado.ts
export interface MeuNovoDado {
  id: string;
  nome: string;
  // ... outros campos
}
```

---

#### **2. Criar Interface Repository (Domain)**

```typescript
// domain/repositories/MeuNovoRepository.ts
import { MeuNovoDado } from "../entities/MeuNovoDado";

export interface MeuNovoRepository {
  buscarTodos(): Promise<MeuNovoDado[]>;
  buscarPorId(id: string): Promise<MeuNovoDado>;
  criar(dados: Partial<MeuNovoDado>): Promise<MeuNovoDado>;
}
```

---

#### **3. Criar UseCase (Domain)**

```typescript
// domain/usercases/MeuNovoUseCase.ts
import { MeuNovoRepository } from "../repositories/MeuNovoRepository";
import { ValidationError } from "../errors/CustomErrors";

export class MeuNovoUseCase {
  constructor(private meuNovoRepository: MeuNovoRepository) {}

  async buscarTodos() {
    return this.meuNovoRepository.buscarTodos();
  }

  async buscarPorId(id: string) {
    if (!id) {
      throw new ValidationError('ID é obrigatório');
    }
    return this.meuNovoRepository.buscarPorId(id);
  }

  async criar(dados: Partial<MeuNovoDado>) {
    // Validações de negócio
    if (!dados.nome) {
      throw new ValidationError('Nome é obrigatório');
    }
    return this.meuNovoRepository.criar(dados);
  }
}
```

---

#### **4. Criar API Service (Infrastructure)**

```typescript
// infrastructure/services/MeuNovo.api.ts
import { apiClient } from '../../services/api/apiClient';
import { MeuNovoDado } from '../../domain/entities/MeuNovoDado';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class MeuNovoApi {
  async buscarTodos(): Promise<MeuNovoDado[]> {
    try {
      const response = await apiClient.get('/meu-novo-endpoint');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AuthenticationError('Não autorizado');
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<MeuNovoDado> {
    try {
      const response = await apiClient.get(`/meu-novo-endpoint/${id}`);
      return response.data;
    } catch (error: any) {
      // Tratamento de erros
      throw error;
    }
  }

  async criar(dados: Partial<MeuNovoDado>): Promise<MeuNovoDado> {
    try {
      const response = await apiClient.post('/meu-novo-endpoint', dados);
      return response.data;
    } catch (error: any) {
      // Tratamento de erros
      throw error;
    }
  }
}
```

---

#### **5. Criar Repository Implementation (Infrastructure)**

```typescript
// domain/data/repositories/MeuNovoRepositoryImpl.ts
import { MeuNovoRepository } from '../../repositories/MeuNovoRepository';
import { MeuNovoApi } from '../../../infrastructure/services/MeuNovo.api';
import { MeuNovoDado } from '../../entities/MeuNovoDado';

export class MeuNovoRepositoryImpl implements MeuNovoRepository {
  constructor(private meuNovoApi: MeuNovoApi) {}

  async buscarTodos(): Promise<MeuNovoDado[]> {
    return await this.meuNovoApi.buscarTodos();
  }

  async buscarPorId(id: string): Promise<MeuNovoDado> {
    return await this.meuNovoApi.buscarPorId(id);
  }

  async criar(dados: Partial<MeuNovoDado>): Promise<MeuNovoDado> {
    return await this.meuNovoApi.criar(dados);
  }
}
```

---

#### **6. Adicionar ao Container (Dependency Injection)**

```typescript
// infrastructure/di/Container.ts
import { MeuNovoUseCase } from "../../domain/usercases/MeuNovoUseCase";
import { MeuNovoRepositoryImpl } from "../../domain/data/repositories/MeuNovoRepositoryImpl";
import { MeuNovoApi } from "../services/MeuNovo.api";

export class Container {
  // ... código existente ...

  private meuNovoUseCase: MeuNovoUseCase | null = null;

  getMeuNovoUseCase(): MeuNovoUseCase {
    if (!this.meuNovoUseCase) {
      const meuNovoApi = new MeuNovoApi();
      const meuNovoRepository = new MeuNovoRepositoryImpl(meuNovoApi);
      this.meuNovoUseCase = new MeuNovoUseCase(meuNovoRepository);
    }

    return this.meuNovoUseCase;
  }
}
```

---

#### **7. Usar na Tela (Presentation)**

```typescript
// screens/MinhaTela/MinhaTela.tsx
import { Container } from "../../infrastructure/di/Container";
import { ValidationError } from "../../domain/errors/CustomErrors";

const MinhaTela: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleBuscarDados = async () => {
    setLoading(true);
    try {
      const container = Container.getInstance();
      const meuNovoUseCase = container.getMeuNovoUseCase();
      
      const dados = await meuNovoUseCase.buscarTodos();
      // Usar dados...
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Erro ao buscar dados");
      }
    } finally {
      setLoading(false);
    }
  };

  // ... resto do componente
};
```

---

## 📝 Checklist de Integração

Ao integrar um novo serviço, verifique:

- [ ] **Entity criada** em `domain/entities/`
- [ ] **Interface Repository** criada em `domain/repositories/`
- [ ] **UseCase criado** em `domain/usercases/` com validações
- [ ] **API Service criado** em `infrastructure/services/` com tratamento de erros
- [ ] **Repository Implementation** criada em `domain/data/repositories/`
- [ ] **Método adicionado ao Container** em `infrastructure/di/Container.ts`
- [ ] **Erros customizados** usados quando necessário
- [ ] **Tipos corretos** (Promise<Entidade>, não dados HTTP brutos)

---

## 🎯 Princípios Aplicados

### **Dependency Inversion**
- Domain Layer define interfaces
- Infrastructure Layer implementa interfaces
- UseCase depende de abstração (interface), não de implementação

### **Separation of Concerns**
- Cada camada tem responsabilidade única
- Domain: regras de negócio
- Infrastructure: detalhes técnicos (HTTP, storage)
- Presentation: UI e interação

### **Independência de Frameworks**
- Domain Layer não importa React Native, Axios, etc.
- Pode testar UseCase sem dependências externas

### **Testabilidade**
- Interfaces permitem mocks fáceis
- UseCase pode ser testado isoladamente

---

## 📚 Arquivos Referenciados

- **Tela:** `src/screens/Login/Login.tsx`
- **Container:** `src/infrastructure/di/Container.ts`
- **UseCase:** `src/domain/usercases/LoginUseCase.ts`
- **Repository Interface:** `src/domain/repositories/AuthRepository.ts`
- **Repository Implementation:** `src/domain/data/repositories/AuthRepositoryImpl.ts`
- **API Service:** `src/infrastructure/services/Auth.api.ts`
- **HTTP Client:** `src/services/api/apiClient.ts`
- **Entity:** `src/domain/entities/AuthSession.ts`
- **Errors:** `src/domain/errors/CustomErrors.ts`

---

## 💡 Dicas

1. **Sempre comece pelo Domain Layer**: Defina entities, interfaces e UseCases primeiro
2. **Use tipos do Domain**: Não vaze tipos HTTP (AxiosResponse) para camadas superiores
3. **Trate erros adequadamente**: Converta erros HTTP em erros do Domain
4. **Mantenha Container simples**: Apenas orquestra dependências
5. **Validações no UseCase**: Regras de negócio devem estar no UseCase, não na UI

---

**Última atualização:** 2024
