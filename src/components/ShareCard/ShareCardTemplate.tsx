/**
 * O card 1080x1350 que vira imagem.
 *
 * Não existe canvas: é uma View com a arte do design embaixo e o número por
 * cima. `react-native-view-shot` tira um print dela.
 *
 * O app desenha UM elemento: o contador, no vão que a arte deixa entre
 * "Estou há" e "livre de apostas.". Todo o resto — fundo, logo, textos fixos,
 * lettering e CTA — vem achatado no PNG.
 *
 * Duas escolhas de implementação que valem a explicação:
 *
 * 1. A `<Image>` leva largura e altura EXPLÍCITAS, não `StyleSheet.absoluteFill`.
 *    Com absoluteFill ela ignorava as âncoras e se desenhava no tamanho
 *    intrínseco (1080x1350 dp num card de 540x675 dp), aparecendo em 2x e
 *    ancorada no canto superior esquerdo — só o canto da arte entrava na foto.
 *
 * 2. O número é desenhado em SVG, não com `<Text>` + `MaskedView`. O SVG aceita
 *    `viewBox`, então as coordenadas abaixo são as MEDIDAS DA ARTE em pixels e
 *    escalam sozinhas para qualquer tamanho de render. E `<TSpan>` alinha
 *    dígito e unidade pela mesma linha de base com fills diferentes — que é
 *    exatamente o desenho do template, e algo que `MaskedView` não faz.
 *
 * Ver docs/share-card-contador.md.
 */

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  TSpan,
  Text as SvgText,
} from 'react-native-svg';

import {
  SHARE_CARD_ASPECT,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from '../../config/shareCard';
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from '../../config/colors';
import { FundoId, fundoSource } from './backgrounds';
import { BetStreakDuration } from '../../domain/entities/BetStreakDuration';
import {
  BASELINE_Y,
  SOMBRA,
  corDaUnidade,
  gradienteDoContador,
  layoutDoContador,
} from './shareCardLayout';

export interface ShareCardTemplateProps {
  /** Largura do card em dp. A altura sai da proporção 4:5 da arte. */
  width: number;
  /** Tempo sem apostar. Vem do `betStreak` do dashboardStore. */
  duracao: BetStreakDuration;
  /** Fundo sorteado. */
  fundoId: FundoId | null;
}

export function ShareCardTemplate({
  width,
  duracao,
  fundoId,
}: ShareCardTemplateProps) {
  const height = width / SHARE_CARD_ASPECT;
  const fundo = fundoSource(fundoId);
  const { spans, x0, x1, yTopo } = layoutDoContador(duracao);
  const gradiente = gradienteDoContador(x0, x1, yTopo, BASELINE_Y);
  const corUnidade = corDaUnidade(fundoId);

  return (
    <View style={[styles.card, { width, height }]}>
      {fundo && (
        <Image
          source={fundo}
          style={{ position: 'absolute', left: 0, top: 0, width, height }}
          resizeMode="cover"
          fadeDuration={0}
        />
      )}

      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${SHARE_CARD_WIDTH} ${SHARE_CARD_HEIGHT}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/*
            `userSpaceOnUse` com os pontos que o layout calculou, e não o
            objectBoundingBox padrão: assim a rampa não depende de o
            react-native-svg medir a caixa de um <Text> com seis spans de
            corpos diferentes — ela é fixada nas coordenadas da arte.

            A rampa é quase vertical (ver `gradienteDoContador`), que é o que
            faz a cor descer POR DENTRO de cada número, como no template. Ligar
            canto a canto da linha deixava a diagonal quase deitada — a caixa é
            bem mais larga que alta — e cada número saía de uma cor chapada
            diferente.
          */}
          <SvgLinearGradient
            id="gradienteContador"
            gradientUnits="userSpaceOnUse"
            x1={gradiente.x1}
            y1={gradiente.y1}
            x2={gradiente.x2}
            y2={gradiente.y2}
          >
            {HORIZONTAL_GRADIENT_COLORS.map((cor, i) => (
              <Stop
                key={cor}
                offset={HORIZONTAL_GRADIENT_LOCATIONS[i]}
                stopColor={cor}
              />
            ))}
          </SvgLinearGradient>
        </Defs>

        {/*
          A sombra é o mesmo contador desenhado por baixo, deslocado — não um
          filtro. Ver `SOMBRA`: aplicar `<FeDropShadow>` no <Text> fez o
          contador sumir inteiro no device.
        */}
        {SOMBRA.deslocamentos.map((off, i) => (
          <SvgText
            key={`sombra-${i}`}
            y={BASELINE_Y + off.dy}
            textAnchor="start"
            fill={SOMBRA.cor}
            opacity={SOMBRA.opacidade}
          >
            {spans.map((span, j) => (
              <TSpan
                key={`${j}-${span.texto}`}
                x={span.x + off.dx}
                fontFamily={span.fontFamily}
                fontSize={span.fontSize}
              >
                {span.texto}
              </TSpan>
            ))}
          </SvgText>
        ))}

        {/*
          Um <Text> só, com um <TSpan> por CARACTERE: o SVG resolve a linha de
          base compartilhada sozinho, então cada unidade assenta no pé do seu
          dígito mesmo com os corpos todos diferentes.

          Cada span leva x ABSOLUTO e `textAnchor="start"`. O react-native-svg
          ancora só o primeiro TSpan — com "middle", ou deixando ele somar os
          avanços sozinho, o resto da linha sai deslocado. Separar por caractere
          é também o que permite aplicar o tracking do design. Ver
          `layoutDoContador`.
        */}
        <SvgText y={BASELINE_Y} textAnchor="start">
          {spans.map((span, i) => (
            <TSpan
              key={`${i}-${span.texto}`}
              x={span.x}
              fontFamily={span.fontFamily}
              fontSize={span.fontSize}
              fill={span.isDigito ? 'url(#gradienteContador)' : corUnidade}
            >
              {span.texto}
            </TSpan>
          ))}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#000000',
    flexGrow: 0,
    flexShrink: 0,
  },
});
