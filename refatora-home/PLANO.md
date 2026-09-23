# Plano — Refatoração da Home

Base de medidas: as referências têm 1572 px de largura (393 pt @4x). Todas as
medidas abaixo estão em dp para 393 de largura e são escaladas por
`useWindowDimensions` (largura para fontes/tamanhos, altura para respiros verticais).

## 1. Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/screens/Home/Home.tsx` | Troca apenas o JSX de apresentação e os estilos da tela. Toda a lógica (bloqueador/VPN, jornada, modais, share, reset, cursos) fica intacta. Modais não mudam. |
| `src/screens/Home/BetStreakCounter.tsx` | Estado A do contador: mesmo contrato e mesmos testes; texto em gradiente único (novo gradiente), tipografia Inter Tight e glow. |
| `src/components/common/Footer/Footer.tsx` | Taskbar liquid glass (pílula flutuante, 4 slots, pílula de estado ativo, avatar). Continua em fluxo (não absoluto), então as outras 7 telas que a usam não sofrem sobreposição. |
| `src/config/colors.ts` | Adiciona `BRAND_GRADIENT_*` (#5026C7 → #DE57DF → #E07085 → #FF4C33), gradiente de fundo da Home e tokens de glass. Os gradientes antigos continuam existindo para as outras telas. |
| `App.tsx` | Registra os pesos `InterTight_400Regular`, `InterTight_500Medium` e `InterTight_800ExtraBold` no `useFonts` já existente (o pacote já está instalado). |

## 2. Arquivos criados (`src/screens/Home/components/`)
- `homeLayout.ts` — hook `useHomeLayout()` com escala responsiva (largura/altura) e todas as medidas da composição.
- `GradientText.tsx` — texto em gradiente reutilizável (MaskedView + LinearGradient, o mesmo padrão já usado na Home).
- `GlassSurface.tsx` — superfície liquid glass (camadas de gradiente + borda iluminada + highlight + sombra).
- `HomeHeader.tsx` — saudação + primeiro nome + `StatsDisplay` existente.
- `Betty/BettyIdle.tsx` + `Betty/bettyShapes.tsx` — Betty em camadas com o loop do `bettyIdle.svg`.
- `HomeCounter.tsx` — alternância tempo ↔ economia + barra de progresso do ciclo.
- `CounterProgress.tsx` — a barra.
- `QuickActions.tsx` — Bloqueador / Resetar / Meditar / Suporte.
- `HomeCarousel.tsx` + `carouselPages.ts` — 3 páginas mockadas + indicadores.
- `StudyCard.tsx` — seção "Estude".
- `BetHunterLogoSlot.tsx` — placeholder do logo do card "Minha Conta" (ponto de integração único).
- `useHomeSavings.ts` — fonte do valor economizado (mock, ponto de integração único).
- `firstName.ts` — extração do primeiro nome.

## 3/4. Dependências reutilizadas
`react-native` Animated (driver nativo), `expo-linear-gradient`, `@react-native-masked-view/masked-view`,
`react-native-svg`, `react-native-vector-icons` (MaterialCommunityIcons / Ionicons),
`react-native-safe-area-context`, `@expo-google-fonts/inter-tight`, assets SVG já existentes
(`assessor.svg`, `cursos.svg`, `raio.svg`, `fogo.svg`), `Avatar`, `StatsDisplay`.

## 5. Novas dependências
Nenhuma.

## 6. Layout
Coluna flex dentro de `ScrollView` (mantida porque os banners de pendência do bloqueador
podem aparecer). Em telas ≥ ~800 dp de altura tudo cabe sem rolar; em telas menores o
conteúdo rola e a taskbar nunca cobre nada, porque fica em fluxo abaixo do ScrollView.
Medidas-chave (393×852): padding lateral 22 · saudação 30/26 · Betty ~140 de altura ·
número 58 · barra 89×6 · botões Ø58 a cada 66 · cards 105×105 raio 22, gap 16 ·
dots Ø10 · card Estude 78 de altura raio 22 · taskbar 52 de altura raio 26.
Fundo: gradiente vertical roxo → vinho → quase preto cobrindo a tela inteira, com vinheta lateral.

## 7. Animação
Tudo com `Animated` + `useNativeDriver: true` (nenhum re-render por frame).
- Betty: um `Animated.Value` em loop de 3,8 s; cada grupo do SVG vira uma camada com
  `translateY`/`opacity` interpolados com as curvas `ease-in`/`ease-out` amostradas dos keyframes.
- Contador: valor monotônico + `Animated.modulo` → o conteúdo sempre "flui para cima"
  (sai subindo e esmaecendo, o próximo entra de baixo com leve escala). Um `setState` por ciclo.

## 8. Liquid glass
Sem blur real no Android (expo-blur é experimental lá): camadas — fundo escuro translúcido,
gradiente interno sutil, borda de 1 px com gradiente claro→transparente (luz vinda de cima),
highlight no topo, sombra colorida suave. Bloqueador com anel em gradiente da marca.

## 9. Carrossel
`ScrollView` horizontal paginado, 3 páginas × 3 cards, dados em `carouselPages.ts`.
Página 1 = design (Minha Conta, Meu Assessor, Menu Educacional). Páginas 2 e 3 são mocks
com a mesma composição apontando para telas existentes (a 2 recebe o SOS, que saiu da fileira de ações).
Indicadores interpolados a partir do `scrollX` (cor e escala suaves).

## 10. Contador
`HomeCounter` recebe o estado A (`BetStreakCounter`, dias reais do backend) e o estado B
(valor de `useHomeSavings`). Duração em `COUNTER_HOLD_MS` / `COUNTER_TRANSITION_MS`.

## 11. Betty
Origem: `refatora-home/bettyIdle.svg` (CSS keyframes, que o react-native-svg ignora).
Convertido para componente em `src/screens/Home/components/Betty/`. O blur das bochechas
(`feGaussianBlur`) vira elipse com gradiente radial — mesmo visual, sem filtro.

## 12. Primeiro nome
`useAuthStore().user.name` → `getFirstName()` (primeira palavra, trim). Fallback "Usuário".

## 13. Logo BetHunter
`BetHunterLogoSlot.tsx`: placeholder neutro. Para ativar o asset final basta trocar o
conteúdo marcado com `TODO(asset)` (ex.: `assets/home/bethunter.svg` já existe).

## 14. Riscos / limitações
- Não há fonte de dados para "valor economizado": mock em `useHomeSavings.ts`.
- `node_modules` ausente: não foi possível rodar `tsc` nem os testes nesta máquina.
- O design não tem SOS, o pill "Compartilhar" nem os selos verdes de proteção. SOS vai para a
  página 2 do carrossel; compartilhar vira o ícone ao lado do número; o estado da proteção
  aparece como um ponto verde no botão Bloqueador. Os banners de pendência (ações necessárias) continuam.
- Os cards usam os ícones SVG já existentes do projeto (não havia ícones da lib nesses cards).
- A pose da Betty no design (acenando) não existe no SVG fornecido; é usada a animação idle.
- Blur da transição da referência não é reproduzido (sem blur animável sem dependência nova).

## Atualizações após a primeira entrega
- **Taskbar global:** o Footer deixou de ser montado por tela. É um componente único no `App.tsx`,
  por cima do `Stack.Navigator`, que lê a rota atual pelo `NavigationContainer`, flutua por cima
  do conteúdo (blur no iOS, película translúcida no Android), desliza a pílula ativa entre as abas
  e some com fade fora das telas de aba (`TAB_BAR_ROUTES` em `Footer.tsx`). As telas reservam
  `useFooterHeight()` no fim do scroll.
- **Gradiente em todo o app:** `HORIZONTAL_GRADIENT_*` passou a ser o gradiente novo e os tons
  antigos soltos no código foram mapeados para os equivalentes saturados.
- **Ajuste fino no emulador (Pixel 8):** respiros verticais calibrados contra as referências;
  telas mais altas distribuem a sobra entre as ações e o carrossel.
