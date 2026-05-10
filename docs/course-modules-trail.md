# Course Modules Trail — Documentação Técnica

## Visão Geral

Implementação da tela de trilha gamificada de módulos de um curso. O usuário acessa a tela a partir da listagem de cursos (`Cursos`), e vê os módulos do curso selecionado dispostos em um mapa/trilha com posicionamento dinâmico, baseado inteiramente nos dados retornados pela API.

---

## Fluxo de Navegação

```
Cursos (lista de cursos)
  → [modal "Conferir!"]
    → CourseModules (trilha de módulos)
```

**Parâmetros passados na navegação:**

| Parâmetro          | Tipo     | Origem                                          |
|--------------------|----------|-------------------------------------------------|
| `courseId`         | `string` | `id` do curso selecionado                       |
| `courseTitle`      | `string` | `title` do curso selecionado                    |
| `modulesCompleted` | `number` | Parsed do campo `progress` ("6/12" → `6`)       |

---

## Endpoints Utilizados

| Tela           | Endpoint                    | Método |
|----------------|-----------------------------|--------|
| Cursos         | `/courses`                  | GET    |
| CourseModules  | `/modules/course/:courseId` | GET    |

**Resposta de `/modules/course/:id`:**
```json
[
  {
    "id": "12cd557f-...",
    "title": "Tempo é Dinheiro",
    "moduleNumber": 1,
    "moduleType": "MATERIAL",
    "courseId": "c8acb6bc-..."
  }
]
```

---

## Arquitetura — Arquivos Criados

Segue o padrão Clean Architecture já estabelecido no projeto.

### Domain Layer

```
src/domain/entities/CourseModule.ts
```
- `CourseModule` — entidade de domínio
- `ModuleType` — union type: `'MATERIAL' | 'QUIZ' | 'REWARD'`
- `CourseModuleApiResponse` — shape da resposta da API (snake_case)
- `mapCourseModuleFromApi()` — mapper API → entidade

```
src/domain/repositories/CourseModuleRepository.ts
```
- Interface com método `findByCourseId(courseId: string): Promise<CourseModule[]>`

```
src/domain/usercases/GetCourseModulesUseCase.ts
```
- Use case que recebe o `courseId` e delega ao repositório

### Data Layer

```
src/domain/data/repositories/CourseModuleRepositoryImpl.ts
```
- Implementação concreta da interface `CourseModuleRepository`
- Delega para `CourseModuleApi`

### Infrastructure Layer

```
src/infrastructure/services/CourseModule.api.ts
```
- Realiza `GET /modules/course/:courseId` via `apiClient` (Axios)
- Trata erros de rede, 401 e 404 com as exceções do domínio (`AuthenticationError`, `ServerError`)

### DI Container

`src/infrastructure/di/Container.ts` — adicionado:

```typescript
getGetCourseModulesUseCase(): GetCourseModulesUseCase
```
Lazy singleton — instancia `CourseModuleApi` → `CourseModuleRepositoryImpl` → `GetCourseModulesUseCase` apenas na primeira chamada.

### Presentation Layer

```
src/screens/Educacional/CourseModules.tsx
```
Tela principal. Detalhes abaixo.

---

## Arquivos Modificados

| Arquivo                              | Alteração                                                   |
|--------------------------------------|-------------------------------------------------------------|
| `src/types/navigation.ts`            | Adicionada rota `CourseModules` com seus parâmetros         |
| `App.tsx`                            | Import + `<Stack.Screen name="CourseModules" />`            |
| `src/screens/Educacional/Cursos.tsx` | `handleConfirmCourse` navega para `CourseModules`           |
| `src/infrastructure/di/Container.ts` | Import e getter do novo use case                            |

---

## Algoritmo da Trilha

O posicionamento dos nós é 100% dinâmico — nenhuma coordenada é hardcoded.

### Posição horizontal (onda senoidal)

```typescript
const HORIZONTAL_AMPLITUDE = 52; // px de desvio do centro

function getNodeCenterX(index: number, screenWidth: number): number {
  return screenWidth / 2 + Math.sin(index * (Math.PI / 2)) * HORIZONTAL_AMPLITUDE;
}
```

Padrão resultante para os índices 0–7:

| Índice | sin(n × π/2) | Posição         |
|--------|-------------|-----------------|
| 0      | 0           | Centro          |
| 1      | +1          | Direita         |
| 2      | 0           | Centro          |
| 3      | −1          | Esquerda        |
| 4      | 0           | Centro          |
| 5      | +1          | Direita         |
| ...    | ...         | Repete          |

### Posição vertical

```typescript
const VERTICAL_SPACING = 130; // px entre centros de nós consecutivos
const TOP_PADDING = 40;

function getNodeCenterY(index: number): number {
  return TOP_PADDING + index * VERTICAL_SPACING;
}
```

### Altura total do ScrollView

```typescript
const totalHeight = TOP_PADDING + modules.length * VERTICAL_SPACING + BOTTOM_PADDING;
```

Calculada dinamicamente — funciona com qualquer quantidade de módulos.

---

## Sistema de Status dos Módulos

O status de cada módulo é derivado dos dados já disponíveis (sem chamada extra à API):

```typescript
type ModuleStatus = 'completed' | 'active' | 'locked';

function getStatus(moduleNumber: number, modulesCompleted: number): ModuleStatus {
  if (moduleNumber <= modulesCompleted) return 'completed';
  if (moduleNumber === modulesCompleted + 1) return 'active';
  return 'locked';
}
```

| Status      | Comportamento visual                          | Interação   |
|-------------|-----------------------------------------------|-------------|
| `completed` | Cores vivas, borda colorida                   | Clicável    |
| `active`    | Anel pulsante azul (animação Reanimated)       | Clicável    |
| `locked`    | Cores apagadas, texto cinza escuro             | Bloqueado   |

---

## Dimensões dos Nós por Tipo

```typescript
const NODE_DIMS: Record<ModuleType, { w: number; h: number }> = {
  MATERIAL: { w: 172, h: 72 },  // pílula retangular
  QUIZ:     { w: 86,  h: 86  }, // círculo
  REWARD:   { w: 92,  h: 92  }, // círculo (gradiente colorido)
};
```

### Estilos por tipo + status

| Tipo       | Locked                       | Active / Completed                    |
|------------|------------------------------|---------------------------------------|
| `MATERIAL` | Fundo `#1E1C2C`, borda escura | Fundo `#2B2740`, borda roxa           |
| `QUIZ`     | Fundo `#1A1825`, borda escura | Borda azul `#4E8EFF` (2.5px no active)|
| `REWARD`   | Fundo `#1A1825`, borda escura | Gradiente `LinearGradient` warm colors|

---

## Conectores entre Nós

Pontos pequenos interpolados linearmente entre o centro inferior de um nó e o centro superior do próximo:

```typescript
// Gera CONNECTOR_DOTS = 5 pontos equidistantes entre dois nós
const t = (i + 1) / (CONNECTOR_DOTS + 1);
x = fromX + (toX - fromX) * t
y = fromY + (toY - fromY) * t
```

Os pontos acompanham a curva da trilha automaticamente (inclusive nas diagonais esquerda↔direita).

---

## Animações

Biblioteca: `react-native-reanimated` v4 (já presente no projeto).

### Entrada dos nós (FadeInDown escalonado)

```typescript
entering={FadeInDown.delay(index * 80).duration(400).springify()}
```

Cada nó entra com 80ms de atraso em relação ao anterior, criando efeito cascata de baixo para cima.

### Anel pulsante (nó ativo)

```typescript
scale.value = withRepeat(
  withSequence(
    withTiming(1.18, { duration: 900 }),
    withTiming(1,    { duration: 900 }),
  ),
  -1, // infinito
);
```

A opacidade é derivada do scale (`opacity = 1.8 - scale`) para criar efeito de "respiração".

---

## Sistema de Ícones

### Arquivo de mapeamento central

```
src/screens/Educacional/moduleIconMap.ts
```

Todo o mapeamento de ícones vive aqui. Nenhum outro arquivo precisa ser alterado ao evoluir os assets.

### Assets disponíveis (`src/assets/icon-ilha/`)

| Arquivo            | Uso atual                        | Estado futuro            |
|--------------------|----------------------------------|--------------------------|
| `Ler.svg`          | MATERIAL — todos os estados      | base                     |
| `LerDone.svg`      | —                                | MATERIAL + completed     |
| `LerBlock.svg`     | —                                | MATERIAL + locked        |
| `Done.svg`         | QUIZ — todos os estados          | base                     |
| `DoneClick.svg`    | —                                | QUIZ + clicked           |
| `Recompensa.svg`   | REWARD — todos os estados        | base                     |
| `RecompensaVazia.svg` | —                             | REWARD + clicked/empty   |
| `RecompensaBlock.svg` | —                             | REWARD + locked          |
| `Fim.svg`          | FIM (reservado)                  | base                     |
| `FimClick.svg`     | FIM (reservado)                  | FIM + clicked            |
| `Fimblock.svg`     | FIM (reservado)                  | FIM + locked             |
| `Locked.svg`       | —                                | QUIZ + locked            |

### Estrutura do mapeamento

```typescript
// Fase 1 — todos os estados usam o ícone base
// Para evoluir: substitua o valor na célula correspondente

MODULE_ICONS = {
  MATERIAL: {
    default:   LerIcon,
    active:    LerIcon,
    completed: LerIcon,    // → LerDoneIcon
    locked:    LerIcon,    // → LerBlockIcon
    clicked:   LerIcon,
  },
  QUIZ: {
    default:   DoneIcon,
    active:    DoneIcon,
    completed: DoneIcon,
    locked:    DoneIcon,   // → LockedIcon
    clicked:   DoneIcon,   // → DoneClickIcon
  },
  REWARD: {
    default:   RecompensaIcon,
    active:    RecompensaIcon,
    completed: RecompensaIcon,
    locked:    RecompensaIcon, // → RecompensaBlockIcon
    clicked:   RecompensaIcon,
  },
  FIM: { ... },  // reservado para tipo futuro
};
```

### Resolver (único ponto de entrada)

```typescript
const Icon = resolveModuleIcon(module.moduleType, statusToVisualState(status));
// → retorna o SVG Component correto, com fallback para LerIcon
```

`statusToVisualState` converte o status de domínio (`completed` / `locked` / `active`) para o estado visual (`ModuleVisualState`).

### Dimensões dos SVGs

```typescript
NODE_SVG_DIMS = {
  MATERIAL: { renderW: 78, renderH: 76, bodyH: 57 },
  QUIZ:     { renderW: 78, renderH: 76, bodyH: 57 },
  REWARD:   { renderW: 87, renderH: 81, bodyH: 69 },
};
```

- `renderW/renderH`: dimensões passadas para `<Icon width=… height=…>` (viewBox completo)
- `bodyH`: altura da ilha sem a sombra inferior — usado para centralizar o nó e calcular os conectores

### Efeito visual do nó ativo

Como os SVGs são pílulas (não círculos), o efeito de "ativo" é uma borda pulsante em formato de pílula:

```typescript
<ActiveGlow bodyW={dims.renderW} bodyH={dims.bodyH} />
// borderRadius: 34, borderColor: '#4E8EFF'
// animação: opacity 0.35 ↔ 1.0, período de 1.6s
```

### Adicionando novo `moduleType`

1. Adicionar o tipo em `src/domain/entities/CourseModule.ts` → `ModuleType`
2. Adicionar entrada em `NODE_SVG_DIMS` com as dimensões do SVG
3. Adicionar entrada em `MODULE_ICONS` com os assets por estado
4. Nenhuma outra alteração necessária na tela

---

## Próximos Passos

- [ ] Definir e injetar ícones/imagens para cada `moduleType` em `NodeIcon`
- [ ] Implementar navegação do `handleModulePress` para as telas corretas por tipo:
  - `MATERIAL` → tela de conteúdo do módulo
  - `QUIZ` → tela de quiz (`QuizPage`)
  - `REWARD` → tela/modal de recompensa
- [ ] Adicionar indicador de progresso geral (ex: "6 de 12 módulos") no header
