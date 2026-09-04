# Card de compartilhamento do contador

Como o usuário transforma o "X dias sem apostar" numa imagem e manda pelo WhatsApp.

## Fluxo

Três entradas, todas passando por `openShareCardModal` na Home:

1. **Botão "Compartilhar"** na Home — só com `statsReady`.
2. **Notificação** com `data.action: 'share'` → o listener do `App.tsx` navega
   `Home({ openShareCard: true })` → `useFocusEffect` abre o card.
3. **Modal de marco**, logo depois de um check-in que bate um marco.

Daí em diante o caminho é um só:

`ShareCardModal`
→ `generateCardImage()` captura uma cópia offscreen do `ShareCardTemplate`
→ `shareToWhatsApp(uri, buildShareMessage(texto, link))`

Tudo local: não há servidor, upload nem rede em nenhuma etapa.

| Peça | Arquivo |
|---|---|
| Modal (preview, seleção de fundo, destinos) | `src/screens/Home/ShareCardModal.tsx` |
| Captura e entrega aos apps | `src/services/shareCard.ts` |
| Copy, link rastreável e dimensões | `src/config/shareCard.ts` |
| A arte em si | `src/components/ShareCard/` |
| Convites, marcos e deep link | `src/services/notifications.ts` |
| Flags de descoberta | `src/services/shareDiscovery.ts` |

## Como o usuário descobre o card

O card ficou meses pronto sem ninguém chegar nele: o único acesso era um pill
cinza embaixo do contador, e nenhuma notificação do app abria tela nenhuma.

### O CTA na Home

Mesmo pill de antes, na cor padrão, mas com a moldura em gradiente da marca no
lugar da borda `#373344` chapada — ele precisa competir com o contador logo
acima, que é o maior elemento da tela. A moldura é um `LinearGradient` com
`padding` da espessura da borda e um miolo `BUTTON_INNER_BACKGROUND` por cima; o
miolo **precisa ser opaco**, senão o gradiente vaza pelo meio e o botão vira um
preenchimento.

Enquanto o usuário nunca tiver aberto o card, leva um selo "NOVO" e um pulso
lento de escala; os dois somem no primeiro toque, não no primeiro envio.

### Notificações

| Chave | Quando | Abre o card? |
|---|---|---|
| `milestone-<n>` | 4h depois de bater um marco | sim |
| `share-invite` | a cada 7 dias, enquanto nunca tiver compartilhado | sim |
| `daily-checkin` | 20h, todo dia — corpo menciona o card se nunca compartilhou | não |

Marcos: **1, 3, 7, 14, 21, 30, 60, 90, 180, 365** (`MILESTONE_DAYS`). A Home usa
a mesma lista para decidir o modal, então tela e notificação não divergem.

O atraso de 4h no marco é o ponto: o check-in só acontece com o app em primeiro
plano, então a notificação imediata (como era antes) aparecia por cima do próprio
app. O modal cobre o "agora, no app"; a notificação cobre o "depois, fora dele".

`share-invite` só é agendado com streak ≥ 3 (`SHARE_INVITE_MIN_STREAK`, na Home,
que é onde o contador existe) e é cancelado no primeiro envio bem-sucedido.

`scheduleShareInvite` é **idempotente**, ao contrário dos outros agendamentos do
arquivo: a Home chama a cada carga do contador, e um cancela-e-reagenda cego
reiniciaria a contagem de 7 dias toda visita — quem abre o app diariamente nunca
receberia o convite.

### O deep link

Toda notificação que deve abrir o card leva `data.action: 'share'`. O `App.tsx`
registra `addNotificationResponseReceivedListener` **e**
`getLastNotificationResponseAsync` — o segundo cobre o toque que acorda o app do
zero, caso em que a resposta nunca passa pelo listener. Ambos só depois de
`isReady`: antes disso o `NavigationContainer` não montou e o toque se perderia.

O handler checa `isPremium` antes de navegar. Não é decoração: quem não assina é
mandado para o `CouponScreen` no boot, e sem essa linha a notificação viraria um
atalho para dentro da Home por cima do paywall.

### Flags (`shareDiscovery.ts`)

| Chave | Governa |
|---|---|
| `@bethunter_share_seen_<userId>` | selo "NOVO" — cai ao **abrir** o card |
| `@bethunter_share_done_<userId>` | convite recorrente — para ao **enviar** |
| `@bethunter_share_milestone_<userId>` | maior marco comemorado; o modal não repete |

Abrir não é compartilhar, e as duas flags são separadas por isso: quem abriu,
olhou e fechou já sabe que a feature existe (selo sai), mas continua sendo um
bom alvo do convite. O `ShareCardModal` avisa o envio pelo prop `onShared`, que
dispara só em `'direto' | 'sistema'` ou salvamento na galeria — `'cancelado'` e
`'falhou'` não contam.

Guardar o **maior** marco (e não uma flag por marco) resolve sozinho o usuário
que reseta o contador e sobe de novo: não repete o mesmo modal, e volta a
comemorar quando ultrapassar.

## A imagem

1080x1350 (4:5) — a proporção vem dos PNGs entregues pelo design, não de uma
escolha do código. É o formato retrato que ocupa mais tela de quem recebe.

O app desenha **um** elemento: o contador, em SVG, no vão que a arte deixa entre
"Estou há" e "livre de apostas.". Fundo, logo, textos fixos, lettering e CTA vêm
achatados no PNG. Trocar o copy do CTA exige reexportar a arte **e** atualizar
`SHARE_CARD_CTA` — senão o card e a mensagem passam a dizer coisas diferentes.

### O contador

Três grupos numa linha só — `33dias 19horas 32min` — vindos do
`betStreak: { days, hours, minutes }` que a API devolve. Os três aparecem
**sempre**, mesmo zerados, para a largura do card não dançar entre um
compartilhamento e outro.

Toda a geometria está em `shareCardLayout.ts`, em pixels da arte (o SVG tem
`viewBox="0 0 1080 1350"`, então as coordenadas escalam sozinhas para qualquer
tamanho de render). Os valores saíram de leitura de pixel do template do design
e da `hmtx` dos TTFs — não são estimativa:

| | dias | horas | min |
|---|---|---|---|
| corpo do dígito | 190 | 159 | 110 |
| corpo da unidade | 70 | 55 | 40 |

- **Uma linha de base para todos** (`BASELINE_Y` 568). A escala decrescente é
  intencional: cria a hierarquia dias > horas > minutos sem mudar peso ou cor.
- **Dígitos na reta, unidades na itálica** — são duas famílias
  (`InterTight_700Bold` e `InterTight_700Bold_Italic`), não um `fontStyle`
  aplicado por cima. Ambas precisam estar no `useFonts` do `App.tsx`.
- **A unidade encaixa DENTRO do último dígito** (`ENCAIXE_DA_UNIDADE`). No
  Figma isso é uma sobreposição de verdade: a área de interseção dos contornos
  mede 265, 214 e 107 px² nos três grupos, ~7,5e-3 do corpo do dígito ao
  quadrado.

  O recuo **não pode ser uma fração fixa do corpo** — foi o erro de duas
  tentativas anteriores. Um valor único encaixa bem no "3", cujo lado direito é
  curvo e abre espaço embaixo, e invade a haste reta do "1" (450px² contra os
  265 do design). Zerar a sobreposição corrige a colisão mas afasta a unidade e
  desmancha o agrupamento. Por isso cada dígito recebe o recuo que a forma dele
  comporta para chegar na MESMA área de interseção — o "7" recua quase o triplo
  do "1", porque a diagonal dele deixa um vazio embaixo.

  A tabela tem um índice por grupo, já que cada grupo tem a sua inicial de
  unidade ("d", "h", "m") e o encaixe muda com ela.
- **Tracking negativo** (`TRACKING_DIGITO` -0,055, `TRACKING_UNIDADE` -0,046 do
  corpo). O Figma aperta os glifos além dos avanços da fonte; medido na
  referência deu -0,0565/-0,0566/-0,0537 em nos pares de dígitos e
  -0,047/-0,045 em nas unidades. Sem isso a linha inteira sai solta — não só a
  distância número↔unidade, mas entre todos os algarismos.

  É por causa do tracking que o layout emite **um span por caractere**: aplicar
  à mão não depende de o react-native-svg honrar `letterSpacing`. Como nenhuma
  das fontes tem par de kerning para estas strings, separar os caracteres não
  muda o desenho.
- **Sombra projetada** (`SOMBRA`), ajustada contra a referência de fundo claro,
  que é onde ela aparece: o escurecimento fora dos glifos cai de 0,072 a 0,005
  em 18px. Nos fundos escuros quase não aparece — o que também vale no design.

  **Não é filtro SVG.** A primeira tentativa aplicou `<FeDropShadow>` no
  `<Text>` e o contador **sumiu inteiro no device**, sem erro nenhum: quando o
  filtro não vinga, o react-native-svg simplesmente não desenha. Filtros são
  recentes na lib e nenhuma outra parte do app usa — não vale arriscar o card
  sair vazio.

  A sombra é o próprio contador desenhado de novo por baixo, deslocado, em cor
  chapada (`#14091B`) e opacidade baixa. Uma réplica só deixa a borda dura; são
  cinco (o centro do deslocamento mais quatro a 8px em volta, 0,03 cada) para
  somar num desfoque aproximado.

- **Vão entre grupos positivo** (`VAO_ENTRE_GRUPOS`, 26) contra o recuo negativo
  dentro do grupo. É esse contraste que faz os três pares se lerem como três
  grupos, e não como seis elementos soltos. Ficou bem acima dos 12,3px da
  referência: no card renderizado os grupos liam como grudados mesmo com o vão
  do design. Este valor foi ajustado no olho contra o card, não medido.
- **Cada `<TSpan>` leva x absoluto**, calculado por `layoutDoContador`. O
  react-native-svg ancora só o primeiro TSpan — deixar ele somar os avanços dos
  seis sozinho desloca o resto da linha.
- **Gradiente quase vertical em `userSpaceOnUse`** (`gradienteDoContador`). No
  template a rampa está a **80,3° da horizontal** — ela desce por dentro de cada
  número. Amostrando o núcleo dos glifos (erodido 4px, senão a antialiasing com
  o fundo contamina a cor) e convertendo cada amostra para sua posição na rampa,
  o ajuste linear dá `t = -2,0530 + 0,000750x + 0,004380y`, resíduo médio 0,044:
  Δt de 0,62 ao descer a caixa alta, 0,60 ao atravessar a linha, centro em
  t≈0,52.

  Ligar canto a canto da linha **não** reproduz isso: a caixa é muito mais larga
  que alta (~850 x 140), a diagonal sai a ~9° e, como o SVG projeta cada ponto
  sobre o vetor, a altura deixa de contar — cada número vira uma cor chapada
  diferente. Foi o defeito que apareceu no device antes desta correção.

  Os dois avanços não podem ser aplicados em separado (a projeção mistura os
  eixos), então `gradienteDoContador` resolve o vetor que satisfaz os dois e o
  centra na caixa. A conta parte da largura e da altura da linha, e não de um
  vetor fixo, porque o conteúdo muda de largura — com vetor fixo a rampa não
  completaria em "1dia 1hora 1min".

  O `userSpaceOnUse` evita depender de o renderer medir a caixa de um `<Text>`
  com seis spans de corpos diferentes.
- **Guarda de overflow**: passando de `LARGURA_MAXIMA` (860, ou seja 110px de
  margem de cada lado), corpos e vãos encolhem juntos. É o que mantém a linha
  dentro da mesma caixa em qualquer conteúdo: "1dia 1hora 1min" cabe inteiro em
  corpo 190, e "999dias 23horas 59min" desce para 148 em vez de vazar.

As tabelas de avanço (`AVANCO_RETO`, `AVANCO_ITALICO`) saíram da `hmtx` dos
próprios arquivos que o app carrega. Nenhuma das duas fontes tem par de kerning
para as combinações que o contador produz (verificado na GPOS, formatos 1 e 2),
então somar avanços dá a largura exata — não é aproximação. Os valores das duas
tabelas **diferem** (`d` 1226 vs 1224, `r` 772 vs 770): usar a errada desalinha
a linha em alguns px.

A captura sai de uma segunda cópia do card renderizada fora da tela, em
resolução cheia, com `collapsable={false}` (sem isso o Android achata a View na
hierarquia nativa e o `view-shot` não acha o que capturar).

### O PNG precisa ficar no cache interno

`react-native-view-shot` grava o arquivo no cache **externo** sempre que ele
tiver mais espaço livre que o interno (`RNViewShotModule.java:169-191`). Só que
o FileProvider do `react-native-share` mapeia apenas `cache-path "/"` (interno)
e `external-path "Download/"`. Um arquivo no cache externo não é resolvível por
nenhum dos dois: `ShareFile.getURI()` devolve `null` e o compartilhamento sai
**sem imagem**, sem erro nenhum.

Por isso `generateCardImage` move a captura para `Paths.cache` no Android antes
de devolver o caminho.

## A mensagem

A mensagem é **fixa**. `buildShareText` monta "Estou há 33 dias, 19 horas e 32
min livre de apostas." — os mesmos três segmentos da imagem, para texto e card
não dizerem coisas diferentes — seguido do `SHARE_CARD_CTA`.

A mensagem **não aparece na interface** — ela só vai junto no envio. Já foi um
campo editável, depois um bloco somente leitura; saiu de vez para todo
compartilhamento sair com o mesmo texto e com o CTA intacto, sem virar mais uma
decisão para o usuário.

`buildShareMessage` monta `texto + \n\n + link`. O link (`buildShareLink`) é a
ficha da Play Store com `utm_*` e `ref=<user.id>` dentro do parâmetro
`referrer` — que sobrevive à instalação e pode ser lido depois pela Install
Referrer API. É como a conversão é medida sem domínio próprio.

O link é anexado só na hora de enviar.

## Entrega aos apps

### Android — direto, com legenda

`Share.shareSingle` monta um `ACTION_SEND` com `EXTRA_STREAM` (a imagem, via
FileProvider) + `EXTRA_TEXT` (a mensagem) e `FLAG_GRANT_READ_URI_PERMISSION`
(`ShareIntent.java:177-190`). O WhatsApp abre o seletor de contatos e mostra a
foto com o texto já na legenda.

**Checar o pacote antes é obrigatório.** Quando o app de destino não está
instalado, o `shareSingle` troca silenciosamente o intent por
`market://details?id=…` e **resolve como sucesso** (`SingleShareIntent.java:44-52`)
— o usuário ia parar na Play Store e o app fechava o modal comemorando. Daí o
`Share.isPackageInstalled` antes de cada tentativa, na ordem WhatsApp →
WhatsApp Business → seletor do sistema.

### iOS — pelo share sheet do sistema

`shareSingle` com imagem **descarta a mensagem** no iOS: `tryToSendImage`
(`WhatsAppShare.m:59-88`) manda só o arquivo por `UIDocumentInteractionController`
e nunca lê `options.message`. O texto e o link com `ref`/UTM sumiam — e a
promise ainda resolvia como sucesso.

Por isso o iOS usa `Share.open` (o `UIActivityViewController`), que entrega
imagem **e** texto ao WhatsApp e mantém a legenda. Custa um toque a mais para
escolher o app; é o único caminho que preserva a atribuição.

### Instagram

O Instagram não aceita legenda por intent — o `InstagramShare` só passa a
imagem. Por isso `ShareCardModal` copia o texto para a área de transferência
**antes** de abrir o app e avisa o usuário para colar.

## Dependências de configuração nativa

Mexer nestes pontos quebra o compartilhamento em silêncio:

- `android/app/src/main/AndroidManifest.xml` → `<queries>` com
  `com.whatsapp`, `com.whatsapp.w4b`, `com.instagram.android` e o `<intent>` de
  `ACTION_SEND` de imagem. Sem isso o Android 11+ esconde os apps e tudo
  responde "não instalado".
- `ios/BetHunter/Info.plist` → `LSApplicationQueriesSchemes` com `whatsapp`.
- O FileProvider vem do próprio `react-native-share`
  (`${applicationId}.rnshare.fileprovider`); **não** precisa ser declarado no
  manifesto do app.

## Decisões que costumam ser questionadas

- **Card sempre anônimo.** A arte não tem espaço para nome, então não existe
  seletor de "aparecer com o nome".
- **Fundo sorteado a cada abertura**, e o texto recomposto junto — o usuário não
  reencontra o que editou numa sessão anterior.
- **`WHATSAPP_TEST_NUMBER` só em `__DEV__`**: manda a conversa direto para um
  contato de teste em vez de abrir o seletor. Em produção é ignorado.
- **Só a Play Store no link.** Quando o iOS for publicado, trocar
  `PLAY_STORE_URL` por uma página de redirect que detecte a plataforma; só essa
  constante muda.
