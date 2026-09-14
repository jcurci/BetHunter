# O contador de tempo sem apostar

Como a Home sabe há quanto tempo o usuário não aposta, e por que o app não
participa dessa conta.

## O modelo

O contador vive **inteiro no backend**, a partir de `bet_free_since_at`: começa
no cadastro, cresce sozinho com o tempo e só volta a zero quando o usuário
informa que apostou. Não é preciso abrir o app nem confirmar nada para acumular
tempo.

O app é um leitor. Consulta a duração já calculada, desenha, e a única escrita
que faz é o reset.

```http
GET /users/bet-streak     → { "betStreak": { "days": 6, "hours": 5, "minutes": 28 } }
POST /users/bet-reset     → { "success": true }
```

**A API não devolve `bet_free_since_at`.** Só a duração, calculada no instante da
consulta. Não existe timestamp de início do lado do app — então não há como (nem
por que) recalcular nada localmente, e qualquer contador paralelo divergiria do
servidor no primeiro minuto.

### O que existia antes

Havia check-in diário: `POST /users/bet-checkin` incrementava um inteiro
`bet_streak`, e `GET /users/bet-checkin` devolvia também `canCheckIn` e
`nextCheckInAt` para um bloqueio de 24h. A tela tinha um modal "Você apostou
hoje?" com "Não apostei" / "Apostou", um aviso "Já marcado, aguarde 1 dia" e uma
dica "Toque para marcar se apostou hoje".

Nada disso existe mais. `canCheckIn` e `nextCheckInAt` não aparecem em tipo,
store nem tela, e `src/__tests__/betCheckinRemoved.test.ts` falha se voltarem.

## O caminho do dado

| Peça | Arquivo |
|---|---|
| Requisição, descoberta de rota, tradução de erro | `src/infrastructure/services/BetStreak.api.ts` |
| Estado, cache e TTL | `src/storage/dashboardStore.ts` |
| Quando consultar, marcos, avaliação na loja | `src/screens/Home/useBetStreakCounter.ts` |
| O número na tela | `src/screens/Home/BetStreakCounter.tsx` |
| Modais de reset e compartilhamento | `src/screens/Home/Home.tsx` |

Container → repositório → use case seguem o padrão do resto do app
(`GetBetStreakUseCase`, `ResetBetStreakUseCase`). Os dois getters dividem **uma**
instância de api/repositório, porque a descoberta de rota (abaixo) precisa de
memória compartilhada.

## Compatibilidade com o backend antigo

Enquanto houver ambiente rodando o modelo de check-in, a consulta cai para
`GET /users/bet-checkin` e aproveita **só** o `betStreak` de lá.

### Por que a detecção não pode olhar só o 404

Foi a primeira tentativa, e ela não funciona. No backend antigo
`GET /users/bet-streak` **não dá 404**. Não existe rota `bet-streak` alguma lá,
mas existe um `@Get(':id')` (`user.controller.ts:160`) que aceita qualquer
segmento: a URL casa com ele e vira `findOne({ where: { id: 'bet-streak' } })`
numa coluna `uuid` do Postgres — que estoura como **500**.

(É o mesmo defeito que já deixa `@Get('roulete')` inalcançável naquele
controller: está declarado depois do `:id`.)

A regra passou a ser por exclusão. Cai para a rota antiga em **qualquer** status
HTTP, **exceto**:

- **401** — sessão expirada. A rota antiga daria 401 igual, e a segunda
  requisição ainda atrasaria o logout automático que o `apiClient` dispara.
- **Erro sem resposta** (timeout, `ERR_NETWORK`) — offline é offline nas duas.

### A checagem de formato

Status 200 não basta. Se `:id` capturar a URL e responder, o corpo é um
`UserResponse` — sem `betStreak`. Como `parseBetStreak` transforma qualquer
entrada inválida em `{0,0,0}`, sem `pareceBetStreak()` o app leria um **usuário**
como se fosse duração e desenharia zero dia com toda a confiança.

### Memória de rota

A rota que funcionou fica lembrada na instância (`rotaConhecida`), senão toda
consulta pagaria a tentativa perdida. Uma falha na rota lembrada limpa o palpite
e refaz a descoberta — é o que faz o app migrar sozinho para a rota nova quando o
backend subir, sem precisar reiniciar.

### A ressalva que importa

No backend antigo o número vem de `bet_streak`, o inteiro que subia a cada
check-in, **não** de `bet_free_since_at`. Sem check-in na tela esse inteiro não
cresce mais sozinho: só as horas e minutos desde o último check-in avançam. E o
reset lá grava `bet_streak = 1`, então o contador cai em **1 dia**, não em 0.

O fallback mantém o app de pé nos dois ambientes. **Não iguala a semântica.** Ele
é uma ponte até `GET /users/bet-streak` + `bet_free_since_at` estarem publicados,
não um modo de operação permanente.

## Quando o app consulta

Nunca por conta própria em segundo plano, nunca num timer. Só nestes momentos:

| Momento | Forçado? |
|---|---|
| Boot da Home (`loadAll`) | respeita TTL |
| Foco da tela | respeita TTL |
| Volta do segundo plano (`AppState` → `active`) | respeita TTL |
| Antes de gerar o card de compartilhamento | **sim** |
| Depois de um reset | **sim** |

O TTL do contador é de **60 s**, separado dos 10 min do dashboard. O valor agora
é uma duração viva; com o cache longo a Home voltaria do segundo plano exibindo
um número velho.

Montar um componente **não** dispara reset nem inicialização. Tudo acima é
leitura.

## A tela

O contador principal mostra **só `days`**, exatamente como veio. Não soma um dia,
não arredonda para cima e não deduz nada de virada de data ou meia-noite. Horas e
minutos existem no mesmo objeto e são assunto exclusivo do card de
compartilhamento (ver `share-card-contador.md`).

O toque no número abre a mesma confirmação do botão "Resetar" — "Tem certeza? Seu
contador será completamente reinicializado." → `POST /users/bet-reset` → recarga
do contador. Essa ação não depende de disponibilidade diária nenhuma.

### "Não sei" nunca pode ser desenhado como "zero"

Esta é a regra que mais custou para acertar, e ela tem duas metades.

**`days: 0` sozinho é ambíguo.** Pode ser um usuário que acabou de resetar ou uma
consulta que nunca voltou — o estado inicial do store também é zero. O que
desempata é `lastFetchedBetStreak`, que só deixa de ser `null` quando uma
resposta chega.

Por isso a Home tem duas prontidões separadas:

```ts
const statsReady = !isLoading && dashboard !== null;          // energia, dashboard
const contadorPronto = statsReady && betStreakCarregado;      // contador, header, share
```

Usar `statsReady` para o contador foi um bug real: o dashboard carregava, a
consulta do contador falhava, e a tela desenhava "0 dias" — junto com o modal de
erro. Sem `contadorPronto` o mesmo vale para o "0d" ao lado do ícone de fogo no
cabeçalho, que tinha o defeito idêntico.

Enquanto não houver valor, aparece o **skeleton**. Se a consulta falhar de forma
permanente, o skeleton persiste em vez de um número inventado.

**Um erro nunca sobrescreve o valor bom.** `loadBetStreak` só grava no sucesso; a
exceção sobe e o último valor conhecido fica de pé.

### O erro que sobrevivia à própria correção

`loadError` era limpo apenas dentro de `loadAll`. Como as consultas de foco e de
retorno do segundo plano chamam `loadBetStreak` **direto**, o erro do boot
sobrevivia à carga que o resolveu: a Home mostrava o contador certo atrás de um
alerta de falha antigo, com a mensagem congelada de uma tentativa anterior.

Hoje cada carga bem-sucedida limpa o erro — mas **só quando as duas fontes estão
carregadas**. Se o dashboard continua quebrado, o alerta permanece à vista mesmo
com o contador funcionando; senão a correção teria trocado um alerta preso por um
alerta engolido. Na Home, o efeito que abre o modal também o fecha quando o erro
some: antes ele só espelhava a ida.

## Compartilhamento

`openShareCardModal` é o **único** ponto de abertura do card, e ele reconsulta
antes de abrir. O card mostra dias, horas e minutos, e a resposta é calculada no
instante da consulta — abrir com o que estava em memória mandaria uma imagem
defasada.

Se essa consulta falhar, **o card não abre**. Erro de rede não é zero dia, e
mandar o valor velho em silêncio seria pior do que não mandar.

## Marcos e avaliação na loja

Os marcos (1, 3, 7, 14, 21, 30, 60, 90, 180, 365) e o pedido de avaliação
disparavam no sucesso do check-in. Sem check-in, o gatilho passou a ser **a
chegada de um valor novo do contador**.

A troca é segura porque os dois já eram idempotentes e persistidos por usuário:
`lastCelebratedMilestone` guarda o **maior** marco comemorado (quem reseta e volta
a subir não repete o mesmo modal, mas recebe o próximo) e `maybeRequestReview`
pede avaliação uma vez por usuário, para sempre.

O efeito exige `carregouContador`. Sem esse guard ele rodaria com o zero do
estado inicial e trataria "ainda carregando" como "zero dia" — foi um bug que o
teste pegou antes de chegar na tela.

## Notificação diária

A chave continua `daily-checkin` **de propósito**, apesar de o check-in ter
acabado: é por ela que `cancelScheduledByKey` acha os agendamentos que já estão
nos aparelhos. Trocar a string deixaria a notificação antiga órfã e impossível de
cancelar em quem já tem o app instalado. Só o texto mudou.

## Testes

`npm test` (jest-expo). 70 casos. A orquestração e o visual foram extraídos da
Home justamente para não precisar montar uma tela de 2700 linhas com VPN,
RevenueCat e `view-shot` em volta — o `jest.setup.js` tem **um** mock, o do
`MaskedView`, que não renderiza sob o jsdom.

| Arquivo | Cobre |
|---|---|
| `infrastructure/services/__tests__/BetStreak.api.test.ts` | URL nova, fallback por 500/404/formato, o que **não** faz fallback, memória de rota |
| `storage/__tests__/dashboardStore.test.ts` | zero após reset, erro que não zera, ciclo de vida do `loadError` |
| `screens/Home/__tests__/BetStreakCounter.test.tsx` | só dias na tela, skeleton em vez de zero, toque |
| `screens/Home/__tests__/useBetStreakCounter.test.ts` | foco, `AppState`, refetch pré-share, marcos |
| `config/__tests__/shareCard.test.ts` | os três componentes no texto compartilhado |
| `__tests__/betCheckinRemoved.test.ts` | guard: nada de `canCheckIn`, `nextCheckInAt`, POST de check-in |

O guard ignora comentários antes de varrer — senão um comentário que **explica**
por que um campo antigo foi descartado seria lido como o campo tendo voltado.

### O que ainda não tem teste

Vale saber antes de confiar na suíte:

- **A recarga depois do reset.** O handler é JSX inline em `Home.tsx`, fora do
  alcance dos testes. O comportamento existe (`loadAll(true)` após o reset); o
  que falta é a prova. Mesma coisa para "um reset que falha não zera o contador".
- **A autenticação.** O teste da API mocka o `apiClient` inteiro, então o
  interceptor que injeta o `Bearer` (`apiClient.ts:75-79`) nunca roda. A URL está
  coberta; o header não.
- **A ligação Home → `ShareCardModal`.** Que o valor fresco chega ao card é
  testado no hook, não na passagem da prop.

`npx tsc --noEmit` continua sendo o gate principal do projeto.

## Pendências

- **`GET /users/bet-streak` não existe no `bethunter-api` deste repositório.** O
  controller só tem `bet-checkin` (GET e POST) e `bet-reset`; não há coluna
  `bet_free_since_at` no entity nem em nenhuma das migrations. Até subir, o app
  roda no modo de compatibilidade descrito acima.
- **`POST /users/bet-reset` grava `bet_streak = 1`**, não 0. Com o contrato novo o
  reset deve deixar o contador em 0 dias, 0 horas e 0 minutos.
- Quando a rota nova for publicada, vale conferir se `@Get(':id')` continua
  sombreando rotas declaradas depois dele — é o que quebrou a primeira tentativa
  de detecção e o que mantém `@Get('roulete')` inalcançável.
