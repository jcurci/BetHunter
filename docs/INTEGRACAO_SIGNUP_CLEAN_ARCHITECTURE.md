# Integração SignUp (Cadastro) - Clean Architecture

## 📋 Visão Geral

Este documento descreve a integração completa do serviço de cadastro (SignUp) seguindo os princípios da **Clean Architecture** do projeto BetHunter. A implementação segue o mesmo padrão estabelecido no serviço de Login, garantindo consistência e manutenibilidade.

---

## 🏗️ Estrutura Implementada

### Organização Híbrida (Camada + Subpastas por Feature)

A estrutura segue a organização por camada da Clean Architecture, com subpastas para agrupar arquivos relacionados quando há múltiplos arquivos da mesma feature:

```
src/
├── domain/
│   ├── entities/
│   │   └── signup/                              # Subpasta para entities relacionadas
│   │       ├── RegisterRequest.ts
│   │       ├── RegisterVerification.ts
│   │       └── RegisterResult.ts
│   ├── repositories/
│   │   └── RegisterRepository.ts                # Interface (apenas 1 arquivo)
│   ├── data/
│   │   └── repositories/
│   │       └── RegisterRepositoryImpl.ts        # Implementação
│   └── usercases/
│       └── signup/                              # Subpasta para UseCases relacionados
│           ├── StartRegistrationUseCase.ts
│           ├── VerifyRegistrationCodeUseCase.ts
│           └── CreatePasswordUseCase.ts
│
├── infrastructure/
│   ├── services/
│   │   └── Register.api.ts                      # API Service
│   └── di/
│       └── Container.ts                         # Dependency Injection (atualizado)
│
└── screens/
    └── SignUp/
        ├── SignUpName.tsx                       # Sem integração (apenas navegação)
        ├── SignUpContact.tsx                    # ✅ Integrado StartRegistrationUseCase
        ├── SignUpVerification.tsx               # ✅ Integrado VerifyRegistrationCodeUseCase
        └── SignUpPassword.tsx                   # ✅ Integrado CreatePasswordUseCase
```

---

## 📦 Arquivos Criados

### Domain Layer

#### 1. Entities (`domain/entities/signup/`)

**RegisterRequest.ts:**
```typescript
export interface RegisterRequest {
  email: string;
  name: string;
  username: string;
  cellphone: string;
  gambler?: boolean;
}
```

**RegisterVerification.ts:**
```typescript
export interface RegisterVerification {
  email: string;
  code: string;
}
```

**RegisterResult.ts:**
```typescript
export interface RegisterResult {
  id: string;
  email: string;
  name: string;
  cellphone: string;
  betcoins: number;
  ranking_points: number;
  gambler: boolean;
}
```

#### 2. Repository Interface (`domain/repositories/`)

**RegisterRepository.ts:**
```typescript
export interface RegisterRepository {
  startRegistration(request: RegisterRequest): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  createPassword(email: string, password: string): Promise<RegisterResult>;
}
```

#### 3. UseCases (`domain/usercases/signup/`)

**StartRegistrationUseCase.ts:**
- Valida campos obrigatórios (email, name, username, cellphone)
- Valida formato de email
- Delega para `RegisterRepository.startRegistration()`

**VerifyRegistrationCodeUseCase.ts:**
- Valida email e código
- Valida que código tem 6 dígitos
- Delega para `RegisterRepository.verifyCode()`

**CreatePasswordUseCase.ts:**
- Valida email e senha
- Valida que senha tem mínimo 8 caracteres
- Valida que senha contém caractere especial
- Delega para `RegisterRepository.createPassword()`

### Infrastructure Layer

#### 4. API Service (`infrastructure/services/`)

**Register.api.ts:**
- `startRegistration()` - POST `/auth/register`
- `verifyCode()` - POST `/auth/register/verify`
- `createPassword()` - POST `/auth/register/password`
- Tratamento de erros HTTP (400, 401, 404, 500, 503)
- Conversão de erros HTTP para `AuthenticationError`

#### 5. Repository Implementation (`domain/data/repositories/`)

**RegisterRepositoryImpl.ts:**
- Implementa `RegisterRepository`
- Delega chamadas para `RegisterApi`

#### 6. Dependency Injection (`infrastructure/di/`)

**Container.ts (atualizado):**
- `getStartRegistrationUseCase()` - Retorna `StartRegistrationUseCase`
- `getVerifyRegistrationCodeUseCase()` - Retorna `VerifyRegistrationCodeUseCase`
- `getCreatePasswordUseCase()` - Retorna `CreatePasswordUseCase`
- Orquestra dependências: `RegisterApi → RegisterRepositoryImpl → UseCase`

### Presentation Layer

#### 7. Telas (`screens/SignUp/`)

**SignUpContact.tsx:**
- Integra `StartRegistrationUseCase` via Container
- Chama UseCase ao clicar em "Próximo"
- Tratamento de erros com Alert
- Estado de loading

**SignUpVerification.tsx:**
- Integra `VerifyRegistrationCodeUseCase` via Container
- Integra `StartRegistrationUseCase` para reenvio de código
- Chama UseCase ao clicar em "Próximo" ou "Reenviar"
- Tratamento de erros com Alert
- Estado de loading

**SignUpPassword.tsx:**
- Integra `CreatePasswordUseCase` via Container
- Chama UseCase ao clicar em "Próximo"
- Navega para Login após sucesso
- Tratamento de erros com Alert
- Estado de loading

---

## 🔄 Fluxo Completo de Dados

### 1. SignUpContact → StartRegistrationUseCase

```
SignUpContact.tsx
  ↓ handleNext()
  ↓ Container.getInstance().getStartRegistrationUseCase()
  ↓ StartRegistrationUseCase.execute({ email, name, username, cellphone })
  ↓ Validações (email, campos obrigatórios)
  ↓ RegisterRepository.startRegistration()
  ↓ RegisterRepositoryImpl.startRegistration()
  ↓ RegisterApi.startRegistration()
  ↓ POST /auth/register
  ↓ Resposta: 200 OK
  ↓ Navega para SignUpVerification
```

### 2. SignUpVerification → VerifyRegistrationCodeUseCase

```
SignUpVerification.tsx
  ↓ handleNext()
  ↓ Container.getInstance().getVerifyRegistrationCodeUseCase()
  ↓ VerifyRegistrationCodeUseCase.execute(email, code)
  ↓ Validações (email, código 6 dígitos)
  ↓ RegisterRepository.verifyCode()
  ↓ RegisterRepositoryImpl.verifyCode()
  ↓ RegisterApi.verifyCode()
  ↓ POST /auth/register/verify
  ↓ Resposta: 200 OK
  ↓ Navega para SignUpPassword
```

### 3. SignUpPassword → CreatePasswordUseCase

```
SignUpPassword.tsx
  ↓ handleSubmit()
  ↓ Container.getInstance().getCreatePasswordUseCase()
  ↓ CreatePasswordUseCase.execute(email, password)
  ↓ Validações (email, senha >= 8, caractere especial)
  ↓ RegisterRepository.createPassword()
  ↓ RegisterRepositoryImpl.createPassword()
  ↓ RegisterApi.createPassword()
  ↓ POST /auth/register/password
  ↓ Resposta: 201 Created { id, email, name, ... }
  ↓ Alert "Cadastro realizado com sucesso!"
  ↓ Navega para Login
```

---

## 📊 Diagrama de Sequência

```
┌──────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐  ┌─────────┐
│ SignUp   │  │Container│  │ UseCase  │  │ Repo    │  │  API   │  │ Backend │
│ Contact  │  │   (DI)  │  │(Domain)  │  │ Impl    │  │Service │  │         │
└────┬─────┘  └────┬────┘  └────┬─────┘  └────┬────┘  └────┬───┘  └────┬────┘
     │            │            │            │            │           │
     │1. getStartRegistrationUseCase()                    │           │
     │───────────>│            │            │            │           │
     │            │            │            │            │           │
     │            │2. new RegisterApi()     │            │           │
     │            │──────────────────────────────────────>│           │
     │            │            │            │            │           │
     │            │3. new Repo(api)         │            │           │
     │            │────────────────────────>│            │           │
     │            │            │            │            │           │
     │            │4. new UseCase(repo)     │            │           │
     │            │──────────────────>│     │            │           │
     │            │            │            │            │           │
     │            │<──────────────────┘     │            │           │
     │            │5. return UseCase        │            │           │
     │<───────────┘                         │            │           │
     │            │            │            │            │           │
     │6. execute(request)                   │            │           │
     │──────────────────────────────────────>│            │           │
     │            │            │            │            │           │
     │            │            │7. validate()            │           │
     │            │            │            │            │           │
     │            │            │8. repo.startRegistration()        │
     │            │            │────────────────────────>│           │
     │            │            │            │            │           │
     │            │            │            │9. api.startRegistration()
     │            │            │            │──────────────────────>│
     │            │            │            │            │           │
     │            │            │            │            │10. POST /auth/register
     │            │            │            │            │──────────────────────>│
     │            │            │            │            │           │
     │            │            │            │            │<──────────┘
     │            │            │            │            │11. 200 OK
     │            │            │            │<───────────┘           │
     │            │            │            │12. void                │
     │            │            │<───────────┘                        │
     │            │            │13. void                             │
     │<───────────────────────────────────────────────────────────────┘
     │14. Sucesso → Navega SignUpVerification
```

---

## 🎯 Endpoints da API Utilizados

### 1. POST /auth/register
**Chamado em:** `SignUpContact.tsx`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "username": "JohnDoe123",
  "cellphone": "11987654321",
  "gambler": true
}
```

**Response:**
- `200 OK` - Código de verificação enviado
- `400 Bad Request` - Email ou telefone já cadastrado

---

### 2. POST /auth/register/verify
**Chamado em:** `SignUpVerification.tsx`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
- `200 OK` - Email verificado com sucesso
- `401 Unauthorized` - Código inválido ou expirado

---

### 3. POST /auth/register/password
**Chamado em:** `SignUpPassword.tsx`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "cellphone": "11987654321",
  "betcoins": 0,
  "ranking_points": 0,
  "gambler": true
}
```

- `201 Created` - Usuário registrado com sucesso
- `401 Unauthorized` - Email não verificado

---

## ✅ Validações Implementadas

### UseCase: StartRegistrationUseCase
- ✅ Email obrigatório e formato válido
- ✅ Nome obrigatório
- ✅ Username obrigatório
- ✅ Cellphone obrigatório

### UseCase: VerifyRegistrationCodeUseCase
- ✅ Email obrigatório
- ✅ Código obrigatório
- ✅ Código com exatamente 6 dígitos

### UseCase: CreatePasswordUseCase
- ✅ Email obrigatório
- ✅ Senha obrigatória
- ✅ Senha com mínimo 8 caracteres
- ✅ Senha com pelo menos um caractere especial (!, @, #, $, %)

---

## 🔧 Tratamento de Erros

### API Service (Register.api.ts)

**Erros de Rede:**
- Timeout → `AuthenticationError('Timeout. O servidor demorou muito para responder.')`
- Network Error → `AuthenticationError('Erro de conexão. Verifique sua internet.')`

**Erros HTTP:**
- `400 Bad Request` → Mensagem da API ou "Email ou telefone já cadastrado"
- `401 Unauthorized` → "Código inválido ou expirado" / "Email não verificado"
- `404 Not Found` → "Endpoint não encontrado"
- `500 Internal Server Error` → "Erro no servidor. Tente novamente mais tarde"
- `503 Service Unavailable` → "Serviço temporariamente indisponível"

### Presentation Layer (Telas)

- Captura `ValidationError` e `AuthenticationError`
- Exibe Alert com mensagem amigável
- Mantém estado de loading durante requisições

---

## 📚 Arquivos Criados/Modificados

### Novos Arquivos (9)

**Domain Layer:**
1. `src/domain/entities/signup/RegisterRequest.ts`
2. `src/domain/entities/signup/RegisterVerification.ts`
3. `src/domain/entities/signup/RegisterResult.ts`
4. `src/domain/repositories/RegisterRepository.ts`
5. `src/domain/data/repositories/RegisterRepositoryImpl.ts`
6. `src/domain/usercases/signup/StartRegistrationUseCase.ts`
7. `src/domain/usercases/signup/VerifyRegistrationCodeUseCase.ts`
8. `src/domain/usercases/signup/CreatePasswordUseCase.ts`

**Infrastructure Layer:**
9. `src/infrastructure/services/Register.api.ts`

### Arquivos Modificados (4)

1. `src/infrastructure/di/Container.ts` - Adicionados 3 métodos para UseCases
2. `src/screens/SignUp/SignUpContact.tsx` - Integrado `StartRegistrationUseCase`
3. `src/screens/SignUp/SignUpVerification.tsx` - Integrado `VerifyRegistrationCodeUseCase` e reenvio
4. `src/screens/SignUp/SignUpPassword.tsx` - Integrado `CreatePasswordUseCase`

---

## 🔄 Comparação com o Padrão do Login

A integração do SignUp segue **exatamente o mesmo padrão** do Login:

| Aspecto | Login | SignUp |
|---------|-------|--------|
| **Entities** | `AuthSession` | `RegisterRequest`, `RegisterVerification`, `RegisterResult` |
| **Repository Interface** | `AuthRepository` | `RegisterRepository` |
| **UseCase** | `LoginUseCase` | `StartRegistrationUseCase`, `VerifyRegistrationCodeUseCase`, `CreatePasswordUseCase` |
| **API Service** | `Auth.api.ts` | `Register.api.ts` |
| **Repository Impl** | `AuthRepositoryImpl` | `RegisterRepositoryImpl` |
| **Container** | `getLoginUseCase()` | `getStartRegistrationUseCase()`, etc. |
| **Tela** | `Login.tsx` | `SignUpContact.tsx`, etc. |
| **Tratamento de Erros** | `ValidationError`, `AuthenticationError` | `ValidationError`, `AuthenticationError` |

---

## 🎯 Princípios Aplicados

### ✅ Dependency Inversion
- Domain Layer define interfaces (`RegisterRepository`)
- Infrastructure Layer implementa interfaces (`RegisterRepositoryImpl`)
- UseCases dependem de abstração, não de implementação

### ✅ Separation of Concerns
- **Domain**: Regras de negócio e validações
- **Infrastructure**: Detalhes técnicos (HTTP, transformação de dados)
- **Presentation**: UI e interação do usuário

### ✅ Single Responsibility
- Cada classe tem uma responsabilidade única
- UseCases coordenam uma única ação de negócio
- Repository apenas delega para API

### ✅ Open/Closed Principle
- Fácil adicionar novos UseCases sem modificar existentes
- Interfaces permitem extensão sem alteração

---

## 📝 Checklist de Implementação

- [x] Entities criadas em `domain/entities/signup/`
- [x] Interface Repository criada em `domain/repositories/`
- [x] UseCases criados em `domain/usercases/signup/` com validações
- [x] API Service criado em `infrastructure/services/` com tratamento de erros
- [x] Repository Implementation criada em `domain/data/repositories/`
- [x] Métodos adicionados ao Container em `infrastructure/di/Container.ts`
- [x] Erros customizados usados (`ValidationError`, `AuthenticationError`)
- [x] Tipos corretos (Promise<Entidade>, não dados HTTP brutos)
- [x] SignUpContact integrado com `StartRegistrationUseCase`
- [x] SignUpVerification integrado com `VerifyRegistrationCodeUseCase`
- [x] SignUpPassword integrado com `CreatePasswordUseCase`

---

## 💡 Dicas e Boas Práticas Aplicadas

1. **Organização Híbrida**: Subpastas `signup/` para agrupar arquivos relacionados quando há múltiplos arquivos (entities, usecases)

2. **Reutilização de Erros**: Uso de `ValidationError` e `AuthenticationError` do Domain Layer

3. **Tratamento Consistente**: Mesmo padrão de tratamento de erros do Login

4. **Validações no UseCase**: Regras de negócio centralizadas no UseCase, não na UI

5. **Loading States**: Feedback visual durante requisições assíncronas

6. **Navegação Após Sucesso**: Fluxo completo até Login após cadastro bem-sucedido

---

## 🚀 Fluxo do Usuário Final

1. **SignUpName** → Usuário informa nome e username (sem API)
2. **SignUpContact** → Usuário informa email e telefone → Chama `/auth/register` → Código enviado
3. **SignUpVerification** → Usuário informa código de 6 dígitos → Chama `/auth/register/verify` → Email verificado
4. **SignUpPassword** → Usuário cria senha → Chama `/auth/register/password` → Cadastro finalizado → Navega para Login

---

## 📚 Referências

- Documentação base: `docs/INTEGRACAO_SERVICOS_CLEAN_ARCHITECTURE.md`
- Padrão seguido: `src/screens/Login/Login.tsx`
- API Documentation: `bethunter-api/docs/API_DOCUMENTATION.md`

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0
