import { BetStreakDuration } from '../domain/entities/BetStreakDuration';

/**
 * Constantes do card de compartilhamento do contador.
 *
 * Ver docs/share-card-contador.md
 */

/**
 * CTA usado no texto do WhatsApp.
 *
 * ATENÇÃO: o CTA que aparece **na imagem** vem achatado dentro dos PNGs do
 * design — não é desenhado por código. Esta constante existe só para a mensagem
 * que acompanha a imagem, e foi mantida igual à arte de propósito. Se o produto
 * trocar o copy, a arte precisa ser reexportada junto, senão card e mensagem
 * passam a dizer coisas diferentes.
 */
export const SHARE_CARD_CTA =
  'Baixe o Bethunter e comece a bloquear bets e aprender sobre educação financeira você também.';

/**
 * Dimensões do card, em px — ditadas pelos PNGs entregues pelo design.
 *
 * São 4:5 (não quadrado, como o brief original supunha). É o formato retrato do
 * Instagram/WhatsApp, que ocupa mais tela do celular de quem recebe.
 */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;
export const SHARE_CARD_ASPECT = SHARE_CARD_WIDTH / SHARE_CARD_HEIGHT;

/**
 * Número de teste do compartilhamento, com DDI 55.
 *
 * Usado SÓ em `__DEV__`: manda a conversa direto para este contato, em vez de
 * abrir o seletor de contatos do WhatsApp. Em build de produção é ignorado e o
 * usuário escolhe o destino normalmente.
 */
export const WHATSAPP_TEST_NUMBER = '5511997274798';

/**
 * Só a Play Store está publicada. O `referrer` da Play sobrevive à instalação e
 * pode ser lido depois pela Install Referrer API — é o que permite medir a
 * conversão sem domínio próprio nem deep link.
 *
 * Quando o iOS for publicado, trocar por uma página de redirect que detecte a
 * plataforma (ex.: bethunter.com.br/app). Só esta constante muda.
 */
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.bethunter.app';

/**
 * Monta o link rastreável.
 *
 * O `referrer` da Play Store é um único parâmetro cujo valor é uma query string
 * encodada — daí o encode do conjunto inteiro, e não parâmetro a parâmetro.
 *
 * @param ref Identificador anônimo de quem compartilhou (`user.id`, um UUID v4).
 *            Se vazio, o link sai sem `ref` mas mantém os UTM de canal.
 */
export function buildShareLink(ref: string | null | undefined): string {
  const params = [
    'utm_source=share_card',
    'utm_medium=whatsapp',
    'utm_campaign=contador',
  ];

  if (ref) {
    params.push(`ref=${ref}`);
  }

  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(params.join('&'))}`;
}

/**
 * Frase que acompanha a imagem. É o valor inicial do campo editável.
 *
 * Deliberadamente **sem** o link: a URL da Play Store com os UTM tem mais de
 * 130 caracteres e, dentro de um campo de poucas linhas, o usuário abria o
 * modal encarando `%3Dshare_card%26utm_medium…` — parecia defeito. Além disso,
 * link editável é link que quebra, e com ele quebrado a atribuição se perde.
 */
export function buildShareText(duracao: BetStreakDuration): string {
  // Mesma normalização do card (`inteiroExibido`), para a mensagem não dizer
  // um número e a imagem outro.
  const inteiro = (v: number) =>
    Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
  const days = inteiro(duracao.days);
  const hours = inteiro(duracao.hours);
  const minutes = inteiro(duracao.minutes);

  const partes = [
    `${days} ${days === 1 ? 'dia' : 'dias'}`,
    `${hours} ${hours === 1 ? 'hora' : 'horas'}`,
    `${minutes} min`,
  ];
  // "33 dias, 19 horas e 32 min" — vírgula entre os primeiros, "e" antes do último.
  const tempo = `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
  return `Estou há ${tempo} livre de apostas. ${SHARE_CARD_CTA}`;
}

/** Junta a frase (possivelmente editada) com o link, na hora de enviar. */
export function buildShareMessage(texto: string, link: string): string {
  return `${texto.trim()}\n\n${link}`;
}
