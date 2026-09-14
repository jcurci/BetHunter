# Build de produção Android (AAB) para a Google Play

Runbook para gerar o pacote que sobe na Play. Do bump de versão ao arquivo na mão.

## O caminho curto

```bash
cd BetHunter

# 1. Gate — nunca empacote sem isso passar
npx tsc --noEmit
npm test

# 2. Bump de versão nos DOIS arquivos (ver abaixo — é onde se erra)

# 3. Build
npx eas-cli build --platform android --profile production
```

Sai um `.aab` assinado, em ~20 min. O link do artefato aparece no fim; o mesmo link
está na página do build em `expo.dev`.

---

## A armadilha dos arquivos duplicados

**Existem dois `eas.json` e dois `app.json` neste repositório.** Os da raiz são
obsoletos — mesma situação do `package.json` da raiz. Quem vale é `BetHunter/`, que
é onde mora o `projectId` do EAS.

| | Raiz (**ignorar**) | `BetHunter/` (**vale**) |
|---|---|---|
| `appVersionSource` | `remote` + `autoIncrement: true` | **`local`** |
| profile `production` | vazio | `app-bundle`, `credentialsSource: local` |

Isso não é detalhe cosmético. O arquivo da raiz afirma que o `versionCode` é remoto e
**incrementa sozinho**. É falso para este projeto. Quem acreditar nele gera um AAB com
o `versionCode` repetido, e a Play recusa o upload com "Version code N has already been
used".

Enquanto essas duplicatas existirem, confira sempre que está lendo o arquivo de
`BetHunter/`.

## Versão: sempre nos dois lugares

Com `appVersionSource: "local"`, **o EAS não incrementa nada**. O bump é manual, e tem
de ser feito nos dois arquivos:

**`android/app/build.gradle`** — é este que a Play valida:
```gradle
versionCode 32
versionName "1.2.0"
```

**`app.json`**:
```json
"version": "1.2.0",
"android": { "versionCode": 32 }
```

Se os dois divergirem, vale o `build.gradle` — mas deixar divergente é pedir confusão na
próxima release.

**Não mexa no iOS aqui.** `ios.buildNumber` no `app.json` não é a fonte da verdade: a
versão real do iOS vive no `Info.plist` e no `pbxproj`, porque o `prebuild` não roda
neste projeto (`ios/` é commitado).

### Regra do versionCode

Só precisa ser **maior** que o último publicado — não precisa ser sequencial. O
histórico deste app tem buracos, e está tudo bem:

| versionName | versionCode | data |
|---|---|---|
| 1.1.2 | 19 | 2026-07-12 |
| 1.1.3 | 20 | 2026-07-16 |
| 1.1.6 | 23 | 2026-07-31 |
| 1.1.8 | 31 | 2026-08-25 |
| 1.2.0 | 32 | 2026-09-07 |

Para saber o último de verdade antes de bumpar:

```bash
npx eas-cli build:list --platform android --limit 5
```

## Assinatura

O profile `production` usa `credentialsSource: "local"` — ou seja, o EAS **não** guarda
a chave; ela sai daqui:

- `BetHunter/credentials.json` — caminho do keystore e senhas
- `/Users/ricardo/minha-chave.jks` — o keystore, **fora do repositório**

Ambos estão fora do git (`.gitignore` cobre `credentials.json` e `*.jks`; verificado que
nunca foram commitados). Isso significa que **eles não se recuperam de um clone**: se a
máquina se perder e não houver backup do `.jks`, não há mais como publicar atualizações
deste app — a Play só aceita pacotes assinados com a mesma chave. Vale um backup em cofre.

## O que exatamente vai para o build

**O EAS empacota o working tree, não o HEAD do git.** Qualquer alteração pendente entra
no pacote, commitada ou não. Já aconteceu de dois builds saírem com o mesmo
`gitCommitHash` e conteúdos diferentes (versionCode 18 e 19).

Consequência prática: **rode `git status` antes de buildar** e confira que o que está
pendente é só o que você quer publicar.

```bash
git status --short
```

Não é preciso commitar para buildar — mas é preciso saber o que está indo.

## Acompanhar e baixar

O comando fica preso no terminal enquanto a fila anda. Para acompanhar de fora:

```bash
npx eas-cli build:list --platform android --limit 1
```

Estados: `NEW` → `IN_QUEUE` → `IN_PROGRESS` → `FINISHED` (ou `ERRORED` / `CANCELED`).

O `.aab` fica em `https://expo.dev/artifacts/eas/<hash>.aab` e **expira em 30 dias**. Se
for precisar dele depois, baixe e guarde.

O arquivo tem ~77 MB — acima do limite de anexo de várias ferramentas, então o normal é
passar o link em vez do arquivo.

## Subir na Play

A publicação é manual: Play Console → Produção (ou a faixa desejada) → Criar versão →
enviar o `.aab`.

Existe um `submit.production.android.track: "alpha"` configurado no `eas.json`, para quem
quiser usar `eas submit`. **Não é o fluxo usado hoje** — e note que ele publicaria em
`alpha`, não em produção.

## Erros que aparecem

| Sintoma | Causa |
|---|---|
| "Version code N has already been used" | Esqueceu o bump, ou leu o `eas.json` da raiz e achou que era automático |
| Build falha na assinatura | `credentials.json` ou o `.jks` sumiram do lugar |
| O pacote não tem sua última alteração | Alteração estava fora do diretório `BetHunter/`, ou você buildou da raiz |
| `build:version:get` diz "not configured for remote version source" | Esperado — este projeto é `local`. Use `build:list` |

## Antes de qualquer release

- `npx tsc --noEmit` — gate principal do projeto
- `npm test`
- `git status --short` — saber o que está sendo embarcado
- Conferir se alguma pendência de backend acompanha a versão (ex.: na 1.2.0, o
  `GET /users/bet-streak` ainda não estava publicado; ver `contador-sem-apostar.md`)
