/**
 * Tipografia e posição do número no card de compartilhamento.
 *
 * Todos os valores estão em **pixels da arte** (1080x1350), não em frações: o
 * template desenha dentro de um `<Svg viewBox="0 0 1080 1350">`, então essas
 * coordenadas são usadas literalmente e escalam sozinhas para qualquer tamanho
 * de render (preview pequeno ou captura em resolução cheia).
 *
 * Os números saíram de medição direta dos PNGs, não de estimativa:
 *
 *   y  244– 265   "Estou há"              (na arte)
 *   y  426– 568   dígitos do contador     ← o app desenha aqui
 *   y  513– 575   unidades ("dias"…)      ← o app desenha aqui
 *   y  750– 777   "livre de apostas."     (na arte)
 *
 * O contador tem TRÊS grupos numa linha só — "33dias 19horas 32min" — que
 * dividem a mesma linha de base e encolhem da esquerda para a direita. Os
 * corpos por segmento saíram de leitura de pixel do templatePreto.png; ver
 * CORPO_DIGITO / CORPO_UNIDADE.
 *   y 1005–1111   lettering "Bethunter"   (na arte)
 *   y 1160–1217   CTA, duas linhas        (na arte)
 *
 * Ver docs/share-card-contador.md.
 */

/** Linha de base compartilhada pelo dígito e pela unidade. */
export const BASELINE_Y = 568;

/** Centro horizontal — o grupo "3dias" é centralizado no card. */
export const CENTRO_X = 540;

/**
 * Corpo dos dígitos, por segmento (dias, horas, min).
 *
 * O primeiro veio da calibração original: no template os dígitos de "dias" têm
 * ~142px de altura, e a Inter Tight Bold entrega isso com corpo 190. Os outros
 * dois saíram da mesma medição no templatePreto.png — o topo dos dígitos fica
 * em y=426 / 449 / 486 sobre a base 568, ou seja alturas de 142 / 120 / 83 px,
 * que é a razão 1 : 0,84 : 0,58 aplicada sobre 190.
 *
 * A escala decrescente é intencional no design: cria a hierarquia dias > horas
 * > minutos sem precisar de peso ou cor diferente.
 */
export const CORPO_DIGITO = [190, 159, 110] as const;

/** Corpo da unidade de cada segmento, medido do mesmo jeito. */
export const CORPO_UNIDADE = [70, 55, 40] as const;

/**
 * Vão entre um grupo e o próximo, em px de arte.
 *
 * No template os dois vãos medem 1,4px e 12,3px em nível de avanço — o design
 * espaçou no olho. O primeiro deixa "dias" quase encostando no "19" e parece
 * deslize; o segundo é o deliberado.
 *
 * Este valor ficou bem acima do segundo: no card renderizado os grupos liam
 * como grudados mesmo com o vão do design. Ajustado no olho contra o card
 * renderizado, não medido na referência.
 *
 * Este vão é POSITIVO enquanto o de dentro do grupo é negativo (ver
 * `ENCAIXE_DA_UNIDADE`), e é isso que faz os três pares se lerem como três
 * grupos e não como seis elementos soltos.
 */
export const VAO_ENTRE_GRUPOS = 26;

/**
 * Quanto a unidade recua para dentro do último dígito, em fração do corpo do
 * DÍGITO, por grupo e por dígito.
 *
 * O design encaixa a unidade no número, e o encaixe é uma sobreposição de
 * verdade: medindo a área de interseção dos contornos no template dá 265, 214 e
 * 107 px² nos três grupos — ~7,5e-3 do corpo do dígito ao quadrado.
 *
 * O recuo NÃO pode ser uma fração fixa, e foi esse o erro das duas tentativas
 * anteriores. Um valor único encaixa bonito no "3", cujo lado direito é curvo e
 * abre espaço embaixo, e invade a haste reta do "1" (450px² de interseção,
 * contra os 265 do design). Zerar a sobreposição resolve a colisão mas afasta a
 * unidade e desmancha o agrupamento do Figma.
 *
 * Então cada dígito recebe o recuo que a forma dele comporta para chegar na
 * MESMA área de interseção. Daí o "7" recuar quase o triplo do "1": a diagonal
 * dele deixa um vazio embaixo que a unidade ocupa.
 *
 * Resolvido por varredura contra os TTFs reais, um índice por grupo porque cada
 * grupo tem a sua inicial de unidade ("d", "h", "m") e o encaixe muda com ela.
 */
const ENCAIXE_DA_UNIDADE: ReadonlyArray<Record<string, number>> = [
  // grupo 0 — "dia"/"dias"
  {
    '0': 0.168, '1': 0.111, '2': 0.116, '3': 0.137, '4': 0.153,
    '5': 0.142, '6': 0.142, '7': 0.295, '8': 0.132, '9': 0.174,
  },
  // grupo 1 — "hora"/"horas"
  {
    '0': 0.145, '1': 0.101, '2': 0.182, '3': 0.119, '4': 0.132,
    '5': 0.126, '6': 0.119, '7': 0.289, '8': 0.113, '9': 0.151,
  },
  // grupo 2 — "min"
  {
    '0': 0.173, '1': 0.100, '2': 0.173, '3': 0.136, '4': 0.155,
    '5': 0.155, '6': 0.145, '7': 0.291, '8': 0.127, '9': 0.173,
  },
];

/** Recuo usado se o caractere não estiver na tabela. */
const ENCAIXE_PADRAO = 0.14;

/**
 * Entrelinha horizontal (tracking) do design, em fração do corpo.
 *
 * O Figma aperta os glifos além do que os avanços da fonte dão. Medindo a
 * tinta na referência e comparando com o avanço natural: -0,0565 / -0,0566 /
 * -0,0537 em nos três pares de dígitos, e -0,047 / -0,045 em nas unidades.
 *
 * Sem isso a composição inteira sai solta — não só a distância entre número e
 * unidade, mas entre todos os algarismos.
 */
const TRACKING_DIGITO = -0.055;
const TRACKING_UNIDADE = -0.046;

/**
 * Largura máxima da linha do contador, em px de arte.
 *
 * 1080 menos 60 de margem de cada lado. Passando disso o layout encolhe tudo
 * proporcionalmente: "999dias 23horas 59min" dá ~1066px e vazaria o card.
 */
export const LARGURA_MAXIMA = 860;

/** Dígitos: reto. */
export const FONT_FAMILY_DIGITO = 'InterTight_700Bold';

/**
 * Unidades: itálico.
 *
 * No template as unidades são inclinadas e os dígitos não — são duas famílias
 * diferentes, não um `fontStyle` aplicado por cima. Precisa estar no `useFonts`
 * do App.tsx junto com a reta.
 */
export const FONT_FAMILY_UNIDADE = 'InterTight_700Bold_Italic';

/**
 * Cor da unidade, por fundo.
 *
 * Amostrada do núcleo dos glifos já achatados na arte, para a unidade parecer
 * parte da mesma peça que "Estou há" e "livre de apostas.". Só os dígitos
 * levam gradiente.
 */
export const COR_UNIDADE_POR_FUNDO: Record<string, string> = {
  bgColorido: '#EFEDE7',
  bgPreto: '#EFEDE7',
  bgBranco: '#2D2C2C',
};

export const COR_UNIDADE_PADRAO = '#EFEDE7';

export function corDaUnidade(fundoId: string | null): string {
  if (!fundoId) return COR_UNIDADE_PADRAO;
  return COR_UNIDADE_POR_FUNDO[fundoId] ?? COR_UNIDADE_PADRAO;
}

/**
 * Unidades de em da Inter Tight Bold (`unitsPerEm` do `head`).
 */
const UNITS_PER_EM = 2048;

/**
 * Altura da caixa alta da Inter Tight, em fração do em (`sCapHeight` 1490 do
 * OS/2). Serve para achar o topo dos dígitos a partir da linha de base.
 */
const ALTURA_DA_CAIXA_ALTA = 1490 / UNITS_PER_EM;

/**
 * Fração da rampa de cor percorrida ao DESCER a altura da caixa alta.
 *
 * Medido no template: amostrando o núcleo dos glifos (erodido 4px, senão a
 * antialiasing com o fundo contamina a cor) e convertendo cada amostra para a
 * sua posição na rampa da marca, o ajuste linear deu
 * `t = -2,0530 + 0,000750x + 0,004380y`, com resíduo médio de 0,044.
 */
const AVANCO_VERTICAL = 0.62;

/** Fração percorrida ao ATRAVESSAR a linha, da esquerda para a direita. */
const AVANCO_HORIZONTAL = 0.6;

/**
 * Sombra projetada do contador.
 *
 * NÃO usa filtro SVG. A primeira tentativa aplicou `<FeDropShadow>` no
 * `<Text>` e o contador sumiu inteiro no device — o `react-native-svg` não
 * renderiza nada quando o filtro não vinga, sem erro nenhum. Filtros são
 * recentes na lib e nenhuma outra parte do app usa; não vale o risco de o card
 * sair vazio.
 *
 * Em vez disso, a sombra é o próprio contador desenhado de novo por baixo,
 * deslocado, em cor chapada e opacidade baixa. Uma réplica só deixa a borda
 * dura; estas cinco (o centro do deslocamento mais quatro a 8px em volta)
 * aproximam o desfoque com opacidade somada.
 *
 * Os valores vêm do perfil de escurecimento medido na referência de fundo
 * claro, que cai de 0,072 a 0,005 em 18px fora dos glifos.
 *
 * Nos fundos escuros a sombra quase não aparece — o que também vale no design,
 * já que preto sobre preto não tem o que mostrar.
 */
export const SOMBRA = {
  cor: '#14091B',
  /** Opacidade de CADA réplica. Elas se somam onde se sobrepõem. */
  opacidade: 0.03,
  deslocamentos: [
    { dx: 6, dy: 4 },
    { dx: -2, dy: 4 },
    { dx: 14, dy: 4 },
    { dx: 6, dy: -4 },
    { dx: 6, dy: 12 },
  ],
} as const;

/**
 * Pontas do `linearGradient` do contador, em px de arte.
 *
 * A rampa do design é quase vertical — 80,3° abaixo da horizontal —, e é isso
 * que faz a cor descer POR DENTRO de cada número. Ligar simplesmente canto a
 * canto da linha não serve: a caixa é muito mais larga que alta (~850 x 140),
 * então a diagonal sai a ~9° e o SVG, que projeta cada ponto sobre o vetor,
 * praticamente ignora a altura — cada número vira uma cor chapada diferente.
 *
 * Os dois avanços não podem ser aplicados separadamente pelo mesmo motivo (a
 * projeção mistura os dois eixos), então aqui se resolve o vetor `d` que
 * satisfaz os dois ao mesmo tempo. Com os números do template (W=795, H=142)
 * isso dá d = (38, 222) e cantos em t = -0,11 e 1,11, contra os -0,086 e 1,132
 * do ajuste.
 *
 * A conta sai de `W` e `H` em vez de um `d` fixo porque a linha muda de largura
 * com o conteúdo: "1dia 1hora 1min" tem 525px e "999dias 23horas 59min" entra
 * escalado pela guarda de overflow. Com `d` fixo a rampa não completaria nas
 * linhas curtas.
 */
export function gradienteDoContador(
  x0: number,
  x1: number,
  yTopo: number,
  baseline: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const largura = x1 - x0;
  const altura = baseline - yTopo;

  // k = 1 / |d|²
  const k =
    (AVANCO_HORIZONTAL / largura) ** 2 + (AVANCO_VERTICAL / altura) ** 2;
  const dx = AVANCO_HORIZONTAL / (largura * k);
  const dy = AVANCO_VERTICAL / (altura * k);

  // Centrada na caixa: no template o centro cai em t = 0,52.
  const cx = (x0 + x1) / 2;
  const cy = (yTopo + baseline) / 2;

  return {
    x1: cx - dx / 2,
    y1: cy - dy / 2,
    x2: cx + dx / 2,
    y2: cy + dy / 2,
  };
}

/**
 * Largura de avanço de cada glifo, em unidades de em.
 *
 * Extraída da `hmtx` dos próprios arquivos que o app carrega
 * (`@expo-google-fonts/inter-tight/700Bold/…` e `…/700Bold_Italic/…`), não
 * estimada. Cobre só os caracteres que o contador consegue produzir: os dez
 * dígitos na reta, e as letras de "dia(s)"/"hora(s)"/"min" na itálica.
 *
 * Nenhuma das duas fontes tem par de kerning para as combinações que aparecem
 * aqui — verificado na GPOS, formatos 1 e 2, para `di ia as ho or ra mi in`.
 * Então somar os avanços dá a largura exata da linha, não uma aproximação.
 */
export const AVANCO_RETO: Record<string, number> = {
  '0': 1342,
  '1': 818,
  '2': 1223,
  '3': 1284,
  '4': 1321,
  '5': 1257,
  '6': 1290,
  '7': 1129,
  '8': 1293,
  '9': 1290,
  d: 1224,
  i: 491,
  a: 1128,
  s: 1083,
};

/**
 * Itálica. Os valores NÃO são os da reta: `d` 1226 vs 1224, `r` 772 vs 770,
 * `m` 1804 vs 1805 — usar a tabela errada desalinha a linha em alguns px.
 */
export const AVANCO_ITALICO: Record<string, number> = {
  d: 1226,
  i: 490,
  a: 1128,
  s: 1083,
  h: 1216,
  o: 1190,
  r: 772,
  m: 1804,
  n: 1210,
};

/** Avanço usado quando o caractere não está na tabela. Larguras de dígito. */
const AVANCO_PADRAO = 1224;

/**
 * Largura de `texto` em pixels da arte, no corpo informado.
 */
export function larguraDoTexto(
  texto: string,
  fontSize: number,
  avancos: Record<string, number> = AVANCO_RETO,
  tracking = 0,
): number {
  let unidades = 0;
  for (const ch of texto) {
    unidades += avancos[ch] ?? AVANCO_PADRAO;
  }
  const vaos = Math.max(0, [...texto].length - 1);
  return (unidades / UNITS_PER_EM) * fontSize + vaos * tracking * fontSize;
}

/** Um pedaço já posicionado da linha do contador. */
export interface SpanDoContador {
  texto: string;
  /** X absoluto em px de arte. */
  x: number;
  fontSize: number;
  fontFamily: string;
  /** Dígito leva gradiente; unidade leva cor chapada. */
  isDigito: boolean;
}

export interface LayoutDoContador {
  spans: SpanDoContador[];
  /** Extremos da linha, para o gradiente em userSpaceOnUse. */
  x0: number;
  x1: number;
  /** Topo do maior dígito — o outro extremo do gradiente. */
  yTopo: number;
  /** 1 quando coube; < 1 quando a linha precisou encolher. */
  escala: number;
}

/**
 * Deslocamento entre o fim do AVANÇO dos dígitos e o início do avanço da
 * unidade, em px de arte. Sempre negativo: a unidade encaixa no dígito.
 */
function deslocamentoDaUnidade(
  grupo: number,
  ultimoDigito: string,
  corpoDigito: number,
): number {
  const fracao = ENCAIXE_DA_UNIDADE[grupo]?.[ultimoDigito] ?? ENCAIXE_PADRAO;
  return -fracao * corpoDigito;
}

/**
 * Inteiro >= 0 que vai ser desenhado. O plural sai DESTE valor, não do bruto,
 * senão número e unidade podem discordar ("1dias" com 1,5 dia).
 */
function inteiroExibido(valor: number): number {
  return Number.isFinite(valor) ? Math.max(0, Math.trunc(valor)) : 0;
}

/** Plural das unidades. "min" não flexiona. */
function unidadeDe(indice: number, valor: number): string {
  if (indice === 0) return valor === 1 ? 'dia' : 'dias';
  if (indice === 1) return valor === 1 ? 'hora' : 'horas';
  return 'min';
}

/**
 * Posiciona os três grupos "N unidade" numa linha centralizada em CENTRO_X.
 *
 * Cada span recebe um `x` ABSOLUTO em vez de depender do avanço automático
 * entre `<TSpan>`. É o mesmo motivo que já obrigava a calcular a origem à mão
 * na versão de um grupo só: o react-native-svg ancora apenas o primeiro TSpan,
 * e com seis spans de corpos diferentes não há como confiar no que ele soma
 * sozinho. Com o x explícito não sobra nenhuma matemática de âncora para ele
 * errar.
 *
 * Os três segmentos aparecem sempre, mesmo zerados ("0dias 5horas 12min"), para
 * a largura do card não dançar entre um compartilhamento e outro.
 */
export function layoutDoContador(duracao: {
  days: number;
  hours: number;
  minutes: number;
}): LayoutDoContador {
  const valores = [duracao.days, duracao.hours, duracao.minutes];

  const grupos = valores.map((valor, i) => {
    const exibido = inteiroExibido(valor);
    const digitos = String(exibido);
    const unidade = unidadeDe(i, exibido);
    return {
      digitos,
      unidade,
      corpoDigito: CORPO_DIGITO[i],
      corpoUnidade: CORPO_UNIDADE[i],
      largura:
        larguraDoTexto(digitos, CORPO_DIGITO[i], AVANCO_RETO, TRACKING_DIGITO) +
        deslocamentoDaUnidade(i, digitos[digitos.length - 1], CORPO_DIGITO[i]) +
        larguraDoTexto(
          unidade,
          CORPO_UNIDADE[i],
          AVANCO_ITALICO,
          TRACKING_UNIDADE,
        ),
    };
  });

  const larguraCrua =
    grupos.reduce((soma, g) => soma + g.largura, 0) +
    VAO_ENTRE_GRUPOS * (grupos.length - 1);

  // Encolhe a linha inteira — corpos e vãos — quando ela não cabe.
  const escala = larguraCrua > LARGURA_MAXIMA ? LARGURA_MAXIMA / larguraCrua : 1;

  const larguraFinal = larguraCrua * escala;
  const x0 = CENTRO_X - larguraFinal / 2;

  const spans: SpanDoContador[] = [];
  let cursor = x0;

  grupos.forEach((g, i) => {
    const corpoDigito = g.corpoDigito * escala;
    const corpoUnidade = g.corpoUnidade * escala;

    // Um span por CARACTERE. O tracking do design é mais apertado que os
    // avanços da fonte, e posicionar cada glifo à mão é o jeito de aplicá-lo
    // sem depender de o react-native-svg honrar `letterSpacing` — o mesmo
    // motivo que já obrigava o x absoluto por span. Como nenhuma das duas
    // fontes tem par de kerning para estas strings (ver AVANCO_RETO), separar
    // os caracteres não muda o desenho.
    for (const ch of g.digitos) {
      spans.push({
        texto: ch,
        x: cursor,
        fontSize: corpoDigito,
        fontFamily: FONT_FAMILY_DIGITO,
        isDigito: true,
      });
      cursor +=
        ((AVANCO_RETO[ch] ?? AVANCO_PADRAO) / UNITS_PER_EM) * corpoDigito +
        TRACKING_DIGITO * corpoDigito;
    }
    // o último dígito não leva vão de tracking
    cursor -= TRACKING_DIGITO * corpoDigito;
    cursor += deslocamentoDaUnidade(
      i,
      g.digitos[g.digitos.length - 1],
      corpoDigito,
    );

    for (const ch of g.unidade) {
      spans.push({
        texto: ch,
        x: cursor,
        fontSize: corpoUnidade,
        fontFamily: FONT_FAMILY_UNIDADE,
        isDigito: false,
      });
      cursor +=
        ((AVANCO_ITALICO[ch] ?? AVANCO_PADRAO) / UNITS_PER_EM) * corpoUnidade +
        TRACKING_UNIDADE * corpoUnidade;
    }
    cursor -= TRACKING_UNIDADE * corpoUnidade;

    if (i < grupos.length - 1) cursor += VAO_ENTRE_GRUPOS * escala;
  });

  return {
    spans,
    x0,
    x1: x0 + larguraFinal,
    yTopo: BASELINE_Y - ALTURA_DA_CAIXA_ALTA * CORPO_DIGITO[0] * escala,
    escala,
  };
}
