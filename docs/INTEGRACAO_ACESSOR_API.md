# Integração do Acessor com a API

## Visão Geral

Este documento descreve a integração da tela `Acessor.tsx` (Meu Assessor Financeiro) com a API do BetHunter, seguindo os princípios de **Clean Architecture**.

---

## Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI (Screens)                            │
│                   Acessor.tsx / HistoryList.tsx                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Use Cases                               │
│  GetFinancialCategoriesUseCase / GetFinancialEntriesUseCase     │
│                  CreateFinancialEntryUseCase                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Repositories                             │
│  FinancialCategoryRepositoryImpl / FinancialEntryRepositoryImpl │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Sources (APIs)                        │
│        FinancialCategory.api.ts / FinancialEntry.api.ts         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Backend                              │
│                  bethunter-api (NestJS)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos Criados/Modificados

### 1. Entidades (Domain Layer)

#### `src/domain/entities/FinancialCategory.ts`
Define a estrutura de categoria financeira e mappers entre API e frontend.

```typescript
// Interface do Frontend
export interface FinancialCategory {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  icone: string;
}

// Interface da API
export interface FinancialCategoryApiResponse {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  icon_src: string;
}

// Mappers
mapApiTypeToFrontend()  // INCOME → entrada, EXPENSE → saida
mapFrontendTypeToApi()  // entrada → INCOME, saida → EXPENSE
mapCategoryFromApi()    // Converte resposta da API para entidade do frontend
```

#### `src/domain/entities/FinancialEntry.ts`
Define a estrutura de entrada/saída financeira.

```typescript
// Interface do Frontend
export interface FinancialEntry {
  id: string;
  descricao: string;
  valor: string;
  data: Date;
  tipo: 'entrada' | 'saida';
  categoria: {
    id: string;
    nome: string;
    icone: string;
  };
  createdAt: string;
}

// Request para criar entrada
export interface CreateFinancialEntryRequest {
  category_id: string;
  balance: number;
  description: string;
  created_at: Date;
}

// Filtros para busca
export interface FinancialEntryFilters {
  start_date?: string;
  end_date?: string;
  type?: 'INCOME' | 'EXPENSE';
  category_id?: string;
}
```

---

### 2. Repositórios (Domain Layer)

#### `src/domain/repositories/FinancialCategoryRepository.ts`
```typescript
export interface FinancialCategoryRepository {
  findAll(): Promise<FinancialCategory[]>;
}
```

#### `src/domain/repositories/FinancialEntryRepository.ts`
```typescript
export interface FinancialEntryRepository {
  findAll(filters?: FinancialEntryFilters): Promise<FinancialEntry[]>;
  create(request: CreateFinancialEntryRequest): Promise<FinancialEntry>;
}
```

---

### 3. Implementação dos Repositórios (Data Layer)

#### `src/domain/data/repositories/FinancialCategoryRepositoryImpl.ts`
Implementa `FinancialCategoryRepository` usando `FinancialCategory.api.ts`.

#### `src/domain/data/repositories/FinancialEntryRepositoryImpl.ts`
Implementa `FinancialEntryRepository` usando `FinancialEntry.api.ts`.

---

### 4. Serviços de API (Infrastructure Layer)

#### `src/infrastructure/services/FinancialCategory.api.ts`
```typescript
export class FinancialCategoryApi {
  async findAll(): Promise<FinancialCategory[]>
  // GET /financial_categories
}
```

#### `src/infrastructure/services/FinancialEntry.api.ts`
```typescript
export class FinancialEntryApi {
  async findAll(filters?: FinancialEntryFilters): Promise<FinancialEntry[]>
  // GET /financial_entries ou GET /financial_entries/filter?...

  async create(request: CreateFinancialEntryRequest): Promise<FinancialEntry>
  // POST /financial_entries
}
```

---

### 5. Use Cases (Domain Layer)

#### `src/domain/usercases/GetFinancialCategoriesUseCase.ts`
```typescript
export class GetFinancialCategoriesUseCase {
  constructor(private repository: FinancialCategoryRepository)
  
  async execute(): Promise<FinancialCategory[]>
}
```

#### `src/domain/usercases/GetFinancialEntriesUseCase.ts`
```typescript
export class GetFinancialEntriesUseCase {
  constructor(private repository: FinancialEntryRepository)
  
  async execute(filters?: FinancialEntryFilters): Promise<FinancialEntry[]>
}
```

#### `src/domain/usercases/CreateFinancialEntryUseCase.ts`
```typescript
export class CreateFinancialEntryUseCase {
  constructor(private repository: FinancialEntryRepository)
  
  async execute(request: CreateFinancialEntryRequest): Promise<FinancialEntry>
  // Inclui validações de valor mínimo e categoria obrigatória
}
```

---

### 6. Container de Injeção de Dependências

#### `src/infrastructure/di/Container.ts`
Atualizado para registrar e fornecer instâncias dos novos use cases:

```typescript
// Novos métodos adicionados:
getFinancialCategoriesUseCase(): GetFinancialCategoriesUseCase
getFinancialEntriesUseCase(): GetFinancialEntriesUseCase
createFinancialEntryUseCase(): CreateFinancialEntryUseCase
```

---

### 7. Telas Modificadas

#### `src/screens/Acessor/Acessor.tsx`
- Removido uso de `AsyncStorage` para categorias e entradas
- Integrado com `GetFinancialCategoriesUseCase`
- Integrado com `GetFinancialEntriesUseCase`
- Integrado com `CreateFinancialEntryUseCase`
- Adicionados estados de loading e erro
- Filtro de transações por mês (start_date, end_date)

#### `src/screens/Acessor/HistoryList.tsx`
- Removido uso de `AsyncStorage`
- Integrado com `GetFinancialEntriesUseCase`
- Integrado com `GetFinancialCategoriesUseCase`
- Adicionado `ActivityIndicator` para loading
- Adicionado tratamento de erros com `Alert`

---

## Endpoints da API Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/financial_categories` | Lista todas as categorias do usuário |
| GET | `/financial_entries` | Lista todas as entradas do usuário |
| GET | `/financial_entries/filter` | Filtra entradas por data, tipo ou categoria |
| POST | `/financial_entries` | Cria nova entrada financeira |

### Exemplo de Request - Criar Entrada

```json
POST /financial_entries
Authorization: Bearer <token>

{
  "category_id": "uuid-da-categoria",
  "balance": 150.00,
  "description": "Salário do mês",
  "created_at": "2026-01-24"
}
```

### Exemplo de Response

```json
{
  "id": "uuid-da-entrada",
  "user_id": "uuid-do-usuario",
  "category_id": "uuid-da-categoria",
  "category_type": "INCOME",
  "category_icon_src": "cash",
  "category_description": "Salário",
  "balance": 150,
  "description": "Salário do mês",
  "created_at": "2026-01-24T00:00:00.000Z"
}
```

---

## Fluxo de Dados

### Carregar Categorias
```
1. Acessor.tsx chama loadCategories()
2. GetFinancialCategoriesUseCase.execute()
3. FinancialCategoryRepositoryImpl.findAll()
4. FinancialCategoryApi.findAll()
5. GET /financial_categories
6. Resposta mapeada de FinancialCategoryApiResponse → FinancialCategory
7. Categorias exibidas nos dropdowns de Entrada/Saída
```

### Criar Entrada Financeira
```
1. Usuário preenche formulário e clica "Salvar"
2. handleSaveEntry() ou handleSaveSaida()
3. CreateFinancialEntryUseCase.execute(request)
4. Validação (valor > 0, categoria obrigatória)
5. FinancialEntryRepositoryImpl.create(request)
6. FinancialEntryApi.create(request)
7. POST /financial_entries
8. Resposta mapeada e entrada adicionada à lista local
9. UI atualizada com nova entrada
```

---

## Correção de Bug no Backend

### Problema Identificado
O relacionamento `User ↔ FinancialEntry` estava como `@OneToOne`, permitindo apenas UMA entrada por usuário.

### Arquivos Corrigidos

#### `bethunter-api/src/financial-entry/entity/financial-entry.entity.ts`
```typescript
// ANTES (incorreto)
@OneToOne(() => User, (user) => user.financialEntry, { onDelete: 'CASCADE' })

// DEPOIS (correto)
@ManyToOne(() => User, (user) => user.financialEntries, { onDelete: 'CASCADE' })
```

#### `bethunter-api/src/user/entity/user.entity.ts`
```typescript
// ANTES (incorreto)
@OneToOne(() => FinancialEntry, (financialEntry) => financialEntry.user)
financialEntry: FinancialEntry;

// DEPOIS (correto)
@OneToMany(() => FinancialEntry, (financialEntry) => financialEntry.user, { cascade: true })
financialEntries: FinancialEntry[];
```

### Ação Necessária no Banco
Após a correção, é necessário remover a constraint UNIQUE no banco:
```sql
DROP TABLE financial_entry;
-- Reiniciar o servidor para recriar a tabela
```

---

## Mapeamento de Tipos

| API | Frontend |
|-----|----------|
| `INCOME` | `entrada` |
| `EXPENSE` | `saida` |
| `balance` | `valor` |
| `created_at` | `data` |
| `description` | `descricao` |

---

## Estados de Loading e Erro

A tela `Acessor.tsx` gerencia os seguintes estados:

```typescript
const [isLoadingCategories, setIsLoadingCategories] = useState(false);
const [isLoadingEntries, setIsLoadingEntries] = useState(false);
const [isSavingEntry, setIsSavingEntry] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

---

## Próximos Passos Sugeridos

1. **Edição de Entradas**: Implementar PUT `/financial_entries/:id`
2. **Exclusão de Entradas**: Implementar DELETE `/financial_entries/:id`
3. **Criação de Categorias Personalizadas**: POST `/financial_categories`
4. **Gráficos com Dados Reais**: Integrar o componente de gráfico com dados da API
5. **Cache Local**: Implementar cache com AsyncStorage para offline-first

---

## Autenticação

Todas as chamadas à API utilizam o token JWT armazenado no `AsyncStorage` e gerenciado pelo `authStore` (Zustand).

O `apiClient` (Axios) possui um interceptor que:
1. Busca o token do `AsyncStorage`
2. Adiciona automaticamente no header `Authorization: Bearer <token>`
3. Trata erros 401 (token expirado)

---

*Documento gerado em: Janeiro/2026*
