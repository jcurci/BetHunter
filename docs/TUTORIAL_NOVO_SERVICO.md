# Tutorial: Implementando um Novo Serviço (Clean Architecture)

Este tutorial mostra como implementar um novo serviço seguindo os padrões da Clean Architecture estabelecidos no projeto BetHunter.

---

## Visão Geral

Para implementar um novo serviço, seguimos a estrutura de **4 camadas**:

1. **Domain Layer** - Regras de negócio (entities, usecases, repositories interfaces)
2. **Data Layer** - Contratos e implementações (datasources interfaces, repository implementations)
3. **Infrastructure Layer** - Implementações concretas (datasources impl, DI container)
4. **Presentation Layer** - UI (screens, stores)

---

## Passo a Passo

### Exemplo: Implementar Serviço de Artigos

Vamos usar como exemplo a implementação de um serviço para listar artigos, mas você pode adaptar para qualquer outro serviço (Cursos, Módulos, Questões, etc.).

---

## 1. Domain Layer

### 1.1 Criar/Verificar Entity

**Arquivo:** `src/domain/entities/Article.ts`

```typescript
export interface Article {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Responsabilidade:**
- Define a estrutura dos dados do domínio
- Sem dependências externas
- Tipagem forte

---

### 1.2 Criar Errors (se necessário)

**Arquivo:** `src/domain/errors/CustomErrors.ts` (adicionar se necessário)

```typescript
export class NotFoundError extends Error {
  constructor(message: string = 'Recurso não encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

---

### 1.3 Criar Repository Interface

**Arquivo:** `src/domain/repositories/ArticleRepository.ts`

```typescript
import { Article } from '../entities/Article';

export interface ArticleRepository {
  getArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
}
```

**Responsabilidade:**
- Define o **contrato** que o repositório deve seguir
- Usa apenas entidades do domínio
- Não especifica **como** buscar os dados (API, banco, etc.)

---

### 1.4 Criar UseCase

**Arquivo:** `src/domain/usecases/ArticleUseCase.ts`

```typescript
import { ArticleRepository } from '../repositories/ArticleRepository';
import { Article } from '../entities/Article';
import { ValidationError, NotFoundError } from '../errors/CustomErrors';

export class ArticleUseCase {
  constructor(private articleRepository: ArticleRepository) {}

  async getArticles(): Promise<Article[]> {
    // Validações de negócio (se necessário)
    return await this.articleRepository.getArticles();
  }

  async getArticleById(id: string): Promise<Article> {
    // Validações
    if (!id || id.trim() === '') {
      throw new ValidationError('ID do artigo é obrigatório');
    }

    const article = await this.articleRepository.getArticleById(id);
    
    if (!article) {
      throw new NotFoundError('Artigo não encontrado');
    }

    return article;
  }
}
```

**Responsabilidade:**
- Regras de negócio
- Validações
- Tratamento de erros
- Não conhece detalhes de implementação (HTTP, storage, etc.)

---

### 1.5 Exportar no Index

**Arquivo:** `src/domain/index.ts`

```typescript
// Entities
export * from './entities/Article';

// Repositories
export * from './repositories/ArticleRepository';

// Use Cases
export * from './usecases/ArticleUseCase';

// Errors (se necessário)
export * from './errors/CustomErrors';
```

---

## 2. Data Layer

### 2.1 Criar DataSource Interface

**Arquivo:** `src/data/datasources/ArticleDataSource.ts`

```typescript
import { Article } from '../../domain/entities/Article';

export interface ArticleDataSource {
  getArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
}
```

**Responsabilidade:**
- Define o contrato para acesso a dados externos
- Usa entidades do domínio
- Não especifica a tecnologia (REST, GraphQL, banco, etc.)

---

### 2.2 Criar Repository Implementation

**Arquivo:** `src/data/repositories/ArticleRepositoryImpl.ts`

```typescript
import { ArticleRepository } from '../../domain/repositories/ArticleRepository';
import { ArticleDataSource } from '../datasources/ArticleDataSource';
import { Article } from '../../domain/entities/Article';

export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(private articleDataSource: ArticleDataSource) {}

  async getArticles(): Promise<Article[]> {
    return await this.articleDataSource.getArticles();
  }

  async getArticleById(id: string): Promise<Article | null> {
    return await this.articleDataSource.getArticleById(id);
  }
}
```

**Responsabilidade:**
- Implementa a interface `ArticleRepository`
- Delega para o `ArticleDataSource`
- Pode adicionar lógica de transformação se necessário

---

## 3. Infrastructure Layer

### 3.1 Criar DataSource Implementation

**Arquivo:** `src/infrastructure/datasources/ArticleDataSourceImpl.ts`

```typescript
import { ArticleDataSource } from '../../data/datasources/ArticleDataSource';
import { Article } from '../../domain/entities/Article';
import { apiClient } from '../../services/api/apiClient';
import { NotFoundError } from '../../domain/errors/CustomErrors';

export class ArticleDataSourceImpl implements ArticleDataSource {
  async getArticles(): Promise<Article[]> {
    try {
      const response = await apiClient.get('/articles');
      
      // Transformar dados da API para entidades do domínio
      const articles: Article[] = response.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        createdAt: new Date(item.createdAt || Date.now()),
        updatedAt: new Date(item.updatedAt || Date.now()),
      }));

      return articles;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundError('Artigos não encontrados');
      }
      throw error;
    }
  }

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const response = await apiClient.get(`/articles/${id}`);
      const item = response.data;

      // Transformar dados da API para entidade do domínio
      const article: Article = {
        id: item.id,
        title: item.title,
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        createdAt: new Date(item.createdAt || Date.now()),
        updatedAt: new Date(item.updatedAt || Date.now()),
      };

      return article;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}
```

**Responsabilidade:**
- Integração com API (HTTP)
- Transformação de dados da API para entidades do domínio
- Tratamento de erros HTTP
- Pode usar storage para cache se necessário

---

### 3.2 Registrar no Container (DI)

**Arquivo:** `src/infrastructure/di/Container.ts`

```typescript
import { ArticleUseCase } from '../../domain/usecases/ArticleUseCase';
import { ArticleRepositoryImpl } from '../../data/repositories/ArticleRepositoryImpl';
import { ArticleDataSourceImpl } from '../datasources/ArticleDataSourceImpl';

export class Container {
  // ... código existente ...

  private articleUseCase: ArticleUseCase | null = null;

  getArticleUseCase(): ArticleUseCase {
    if (!this.articleUseCase) {
      const articleDataSource = new ArticleDataSourceImpl();
      const articleRepository = new ArticleRepositoryImpl(articleDataSource);
      this.articleUseCase = new ArticleUseCase(articleRepository);
    }
    return this.articleUseCase;
  }
}
```

**Responsabilidade:**
- Criação e configuração de dependências
- Singleton para evitar múltiplas instâncias
- Injeção de dependências

---

## 4. Presentation Layer

### 4.1 Usar na Tela/Componente

**Arquivo:** `src/screens/Articles/Articles.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Container } from '../../infrastructure/di/Container';
import { Article } from '../../domain/entities/Article';
import { NotFoundError } from '../../domain/errors/CustomErrors';

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const container = Container.getInstance();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const articleUseCase = container.getArticleUseCase();
      const data = await articleUseCase.getArticles();
      setArticles(data);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        setError('Nenhum artigo encontrado');
      } else {
        setError('Erro ao carregar artigos');
      }
      console.error('Erro ao carregar artigos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Text>Carregando...</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <View>
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </View>
  );
};
```

**Responsabilidade:**
- Chamar o use case
- Gerenciar estado da UI (loading, error)
- Renderizar dados
- Tratamento de erros na UI

---

### 4.2 Criar Store (Opcional - se precisar de estado reativo)

**Arquivo:** `src/storage/articleStore.ts`

```typescript
import { create } from 'zustand';
import { Article } from '../domain/entities/Article';

interface ArticleStore {
  articles: Article[];
  selectedArticle: Article | null;
  setArticles: (articles: Article[]) => void;
  setSelectedArticle: (article: Article | null) => void;
  clearArticles: () => void;
}

export const useArticleStore = create<ArticleStore>((set) => ({
  articles: [],
  selectedArticle: null,
  setArticles: (articles) => set({ articles }),
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  clearArticles: () => set({ articles: [], selectedArticle: null }),
}));
```

**Uso na tela:**

```typescript
const { articles, setArticles } = useArticleStore();

// Após carregar
const data = await articleUseCase.getArticles();
setArticles(data);
```

---

## Checklist de Implementação

### Domain Layer
- [ ] Criar/verificar entity (`domain/entities/`)
- [ ] Criar errors se necessário (`domain/errors/`)
- [ ] Criar repository interface (`domain/repositories/`)
- [ ] Criar use case (`domain/usecases/`)
- [ ] Exportar no `domain/index.ts`

### Data Layer
- [ ] Criar data source interface (`data/datasources/`)
- [ ] Criar repository implementation (`data/repositories/`)

### Infrastructure Layer
- [ ] Criar data source implementation (`infrastructure/datasources/`)
- [ ] Registrar no Container (`infrastructure/di/Container.ts`)

### Presentation Layer
- [ ] Usar na tela/componente
- [ ] Criar store (se necessário)
- [ ] Tratamento de erros na UI

---

## Padrões e Boas Práticas

### 1. Validações no UseCase

```typescript
// ✅ CORRETO - Validação no UseCase
async getArticleById(id: string): Promise<Article> {
  if (!id || id.trim() === '') {
    throw new ValidationError('ID é obrigatório');
  }
  // ...
}

// ❌ ERRADO - Validação na UI
const handleClick = () => {
  if (!id) {
    Alert.alert('Erro', 'ID é obrigatório');
    return;
  }
  // ...
}
```

---

### 2. Tratamento de Erros

```typescript
// ✅ CORRETO - Erros específicos do domínio
try {
  const article = await articleUseCase.getArticleById(id);
} catch (error) {
  if (error instanceof NotFoundError) {
    Alert.alert('Erro', 'Artigo não encontrado');
  } else if (error instanceof ValidationError) {
    Alert.alert('Erro', error.message);
  } else {
    Alert.alert('Erro', 'Erro inesperado');
  }
}
```

---

### 3. Transformação de Dados

```typescript
// ✅ CORRETO - Transformação no DataSourceImpl
const article: Article = {
  id: item.id,
  title: item.title,
  // Backend retorna "created_at", domain usa "createdAt"
  createdAt: new Date(item.created_at),
  // ...
};

// ❌ ERRADO - Transformação na UI
const article = response.data; // Usa dados do backend diretamente
```

---

### 4. Dependency Injection

```typescript
// ✅ CORRETO - Usar Container
const container = Container.getInstance();
const articleUseCase = container.getArticleUseCase();

// ❌ ERRADO - Instanciar diretamente
const dataSource = new ArticleDataSourceImpl();
const repository = new ArticleRepositoryImpl(dataSource);
const useCase = new ArticleUseCase(repository);
```

---

## Exemplo Completo: Serviço de Cursos

### 1. Entity

```typescript
// domain/entities/Course.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  reward: number;
  stars: number;
}
```

### 2. Repository Interface

```typescript
// domain/repositories/CourseRepository.ts
export interface CourseRepository {
  getCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | null>;
}
```

### 3. UseCase

```typescript
// domain/usecases/CourseUseCase.ts
export class CourseUseCase {
  constructor(private courseRepository: CourseRepository) {}

  async getCourses(): Promise<Course[]> {
    return await this.courseRepository.getCourses();
  }

  async getCourseById(id: string): Promise<Course> {
    if (!id) throw new ValidationError('ID é obrigatório');
    
    const course = await this.courseRepository.getCourseById(id);
    if (!course) throw new NotFoundError('Curso não encontrado');
    
    return course;
  }
}
```

### 4. DataSource Interface

```typescript
// data/datasources/CourseDataSource.ts
export interface CourseDataSource {
  getCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | null>;
}
```

### 5. Repository Implementation

```typescript
// data/repositories/CourseRepositoryImpl.ts
export class CourseRepositoryImpl implements CourseRepository {
  constructor(private courseDataSource: CourseDataSource) {}

  async getCourses(): Promise<Course[]> {
    return await this.courseDataSource.getCourses();
  }

  async getCourseById(id: string): Promise<Course | null> {
    return await this.courseDataSource.getCourseById(id);
  }
}
```

### 6. DataSource Implementation

```typescript
// infrastructure/datasources/CourseDataSourceImpl.ts
export class CourseDataSourceImpl implements CourseDataSource {
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get('/courses');
    return response.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      reward: item.reward,
      stars: item.stars,
    }));
  }

  async getCourseById(id: string): Promise<Course | null> {
    try {
      const response = await apiClient.get(`/courses/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }
}
```

### 7. Container

```typescript
// infrastructure/di/Container.ts
getCourseUseCase(): CourseUseCase {
  if (!this.courseUseCase) {
    const courseDataSource = new CourseDataSourceImpl();
    const courseRepository = new CourseRepositoryImpl(courseDataSource);
    this.courseUseCase = new CourseUseCase(courseRepository);
  }
  return this.courseUseCase;
}
```

### 8. Uso na Tela

```typescript
const container = Container.getInstance();
const courseUseCase = container.getCourseUseCase();
const courses = await courseUseCase.getCourses();
```

---

## Estrutura de Diretórios Final

```
src/
├── domain/
│   ├── entities/
│   │   └── Course.ts
│   ├── repositories/
│   │   └── CourseRepository.ts
│   ├── usecases/
│   │   └── CourseUseCase.ts
│   └── index.ts
│
├── data/
│   ├── datasources/
│   │   └── CourseDataSource.ts
│   └── repositories/
│       └── CourseRepositoryImpl.ts
│
└── infrastructure/
    ├── datasources/
    │   └── CourseDataSourceImpl.ts
    └── di/
        └── Container.ts
```

---

## Dicas e Observações

1. **Sempre comece pela Domain Layer** - É a camada mais importante e não depende de nada
2. **Use TypeScript** - Tipagem forte evita erros
3. **Teste cada camada isoladamente** - Facilita debug e manutenção
4. **Siga os padrões existentes** - Mantém consistência no código
5. **Documente casos especiais** - Comentários ajudam futuras manutenções

---

## Referências

- [Documentação da API](../../bethunter-api/docs/API_DOCUMENTATION.md)
- [Arquitetura do Projeto](./ARCHITECTURE.md)
- [Implementação do Login](./LOGIN_IMPLEMENTATION.md)

---

*Tutorial criado em: Janeiro 2025*
*Versão: 1.0.0*
