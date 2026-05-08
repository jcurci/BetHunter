# Alterações na app móvel BetHunter

Documento de referência com o que foi alterado em `BetHunter/` (React Native / Expo) ao longo das iterações recentes: API de cursos, tela **Cursos**, modal de pré-visualização, componente **Modal** partilhado e formatação de títulos.

---

## 1. Tratamento de erros na listagem de cursos

**Problema:** respostas HTTP 500 do backend eram mapeadas como `AuthenticationError` com mensagem genérica, o que fazia parecer falha de login.

**Alterações:**

| Ficheiro | O que mudou |
|----------|-------------|
| [`src/domain/errors/CustomErrors.ts`](src/domain/errors/CustomErrors.ts) | Nova classe `ServerError` (erros 5xx / servidor). |
| [`src/infrastructure/services/Course.api.ts`](src/infrastructure/services/Course.api.ts) | Em `500`, lança `ServerError` com texto claro; tenta extrair `message` do JSON do Nest quando existir (`nestErrorMessage`). Re-lança `ServerError` igual a `AuthenticationError` no `catch` interno. |
| [`src/screens/Educacional/Cursos.tsx`](src/screens/Educacional/Cursos.tsx) | Em falha de `loadData`, `setError` usa `error.message` quando o erro é `ServerError` ou `AuthenticationError`; caso contrário mantém mensagem genérica. |

**Nota (API, fora de `BetHunter/`):** o 500 em `GET /courses` vinha do Postgres/TypeORM quando a coluna no banco era `module_type` e a entidade não mapeava o nome — correção na API: `ModuleCourse` com `@Column({ name: 'module_type', ... })`.

---

## 2. Tela Cursos — cartões do grid

**Problema:** títulos longos cortavam ou comprimiam; barra de progresso alta; percentual com `position: absolute` dentro da barra.

**Alterações em** [`src/screens/Educacional/Cursos.tsx`](src/screens/Educacional/Cursos.tsx):

- Largura dos cartões com `useWindowDimensions()`: `cardWidth = floor((largura - padding scroll 2×20 - gap colunas) / 2)`.
- `moduleCard`: `minHeight` em vez de altura fixa; `alignItems: 'stretch'`; `marginBottom` entre linhas do grid.
- `containerTitle`: largura `100%`; `minHeight` + `flexGrow: 1`; removida altura fixa que clipava texto.
- `moduleTitle`: `fontSize` ~15, `lineHeight` 20; `numberOfLines={3}` + `ellipsizeMode="tail"`; `MaskedView` com `width: '100%'`.
- Barra de progresso: altura reduzida (~32px); linha em `flexDirection: 'row'` com faixa `flex: 1` e texto da **%** à direita, sem `absolute`.
- Espaçamentos: `progressText` com `marginTop` / `marginBottom` para separar fração (ex. `6/12`) da barra.

---

## 3. Modal de pré-visualização do curso (Cursos)

**Problema:** modal baixo (`small` = 30% altura), descrição como `subtitle` no header absoluto (sobreposição com conteúdo), stats a mais (estrelas e pontos/fogo).

**Alterações em** [`src/screens/Educacional/Cursos.tsx`](src/screens/Educacional/Cursos.tsx):

- `size` do `Modal` aumentado (ex.: `big` / `medium` conforme versão atual no ficheiro — preferência: altura suficiente para título + descrição + stats + botão).
- **Sem** passar a descrição longa em `subtitle` do Modal: descrição renderizada no **corpo** (filhos), primeira coisa dentro do conteúdo rolável, estilo `modalCourseDescription` alinhado ao subtítulo visual do Modal (cor `#A7A3AE`, ~14px).
- `modalStatsRow`: apenas progresso **livro** (`X/Y` + ícone); removidos bloco de estrelas e bloco pontos/ícone de fogo.
- Removidos imports/assets só usados por esses blocos (`IconMaterial`, `IconFire`), mantendo `IconBook` / `Image` onde aplicável.

---

## 4. Componente Modal (partilhado)

**Problema:** `headerCenter` com `position: 'absolute'` fazia títulos multilinha desenharem por cima da área do `ScrollView`, sobrepondo texto (ex.: descrição no modal de cursos).

**Alterações em** [`src/components/common/Modal/Modal.tsx`](src/components/common/Modal/Modal.tsx):

- `headerCenter`: deixou de ser absoluto; passou a **`flex: 1`**, `minWidth: 0`, texto centrado mas no **fluxo normal** da linha entre botão fechar e ações à direita — o header ganha altura real e o `ScrollView` começa por baixo do título.
- `title` / `subtitle`: `width: '100%'`, `flexShrink`, `lineHeight`; `subtitle` com `marginTop: 8`.
- Mantém comportamento especial `headerCenterSmaller` para `size === 'smaller'`.

**Impacto:** qualquer ecrã que use este `Modal` com título longo deixa de ter essa sobreposição.

---

## 5. Formatação do título no modal do curso

**Objetivo:** exibir sempre o mesmo padrão visual no modal: **primeira letra maiúscula**, **resto minúsculo**, independentemente do formato vindo da API (ex.: tudo em maiúsculas).

**Alterações em** [`src/screens/Educacional/Cursos.tsx`](src/screens/Educacional/Cursos.tsx):

- Função `formatCourseModalTitle(raw: string)` após `mapCourseProgressToLearningModule`: faz `trim()`; string vazia → `""`; caso contrário `charAt(0).toUpperCase() + slice(1).toLowerCase()`.
- `Modal`: `title={formatCourseModalTitle(selectedModule?.title || "")}`.
- Estado e navegação (`LearningModule.title`, slug para `Quiz`, etc.) continuam com o texto original da API salvo onde já estava — só muda **a string mostrada no título do modal**.

---

## Ficheiros resumidos (app `BetHunter/`)

| Área | Ficheiros |
|------|-----------|
| Erros / cursos API | `src/domain/errors/CustomErrors.ts`, `src/infrastructure/services/Course.api.ts` |
| Tela Cursos + modal curso + formatação título | `src/screens/Educacional/Cursos.tsx` |
| Modal partilhado | `src/components/common/Modal/Modal.tsx` |

---

## Como validar rapidamente

1. Abrir **Cursos**, confirmar cartões sem truncamento extremo e barra/percentagem legíveis.
2. Abrir modal de um curso: descrição abaixo do título sem sobreposição; só stat de progresso com livro; botão **Conferir**.
3. Título do modal com capitalização tipo frase (`Crenças que...`).
4. Com backend a responder 500 em `/courses`: mensagem de erro coerente (não confundir com token inválido se for `ServerError`).

---

*Documento gerado para arquivo da equipa; ajustar datas/commit quando integrar na wiki interna.*
