/**
 * Geração e compartilhamento do card do contador.
 *
 * Fluxo: captura a View do card como PNG → entrega ao WhatsApp com a imagem
 * anexada e o texto. Tudo local, sem servidor e sem rede.
 *
 * Ver docs/share-card-contador.md.
 */

import { PixelRatio, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share, { Social } from 'react-native-share';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';

import {
  SHARE_CARD_ASPECT,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  WHATSAPP_TEST_NUMBER,
} from '../config/shareCard';

/**
 * Largura em dp que produz exatamente 1080px na captura.
 *
 * `captureRef` grava na densidade nativa do device, então renderizar em
 * 1080/densidade sai em 1080px reais em qualquer aparelho — sem reescalar
 * bitmap, o que borraria o texto. A altura vem da proporção 4:5 da arte.
 */
export function captureWidthDp(): number {
  return SHARE_CARD_WIDTH / PixelRatio.get();
}

/** Altura em dp correspondente, na proporção 4:5 da arte. */
export function captureHeightDp(): number {
  return captureWidthDp() / SHARE_CARD_ASPECT;
}

/** Nome do PNG no cache interno. Fixo: cada compartilhamento sobrescreve o anterior. */
const NOME_DO_ARQUIVO = 'bethunter-contador.png';

/**
 * Garante que o PNG esteja no cache **interno** do app.
 *
 * O `react-native-view-shot` grava no cache externo sempre que ele tiver mais
 * espaço livre que o interno (RNViewShotModule.java:169-191). Só que o
 * FileProvider do `react-native-share` mapeia apenas `cache-path "/"` (interno)
 * e `external-path "Download/"` — o cache externo não está em nenhum dos dois.
 * Quando o arquivo cai lá, `ShareFile.getURI()` devolve `null` e o
 * compartilhamento sai **sem imagem**, em silêncio.
 *
 * `Paths.cache` é exatamente o `context.getCacheDir()` que o provider cobre.
 * Se a movimentação falhar, seguimos com o caminho original — pior o
 * compartilhamento tentar e falhar do que não acontecer.
 */
function moverParaCacheInterno(caminho: string): string {
  if (Platform.OS !== 'android') return caminho;

  try {
    const origem = new File(caminho);
    const destino = new File(Paths.cache, NOME_DO_ARQUIVO);

    if (destino.exists) destino.delete();
    origem.move(destino);

    return destino.uri;
  } catch (erro) {
    if (__DEV__) {
      console.log('[shareCard] mover para o cache interno falhou:', erro);
    }
    return caminho;
  }
}

/**
 * Captura a View referenciada como PNG.
 *
 * @returns caminho de arquivo temporário (`file://…`), sempre no cache interno.
 * @throws se a captura falhar — quem chama deve oferecer o fallback.
 */
export async function generateCardImage(
  ref: React.RefObject<any>,
): Promise<string> {
  if (!ref.current) {
    throw new Error('Card ainda não foi montado.');
  }

  const capturado = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    // Trava a saída em 1080x1350 exatos. No Android estas opções viram
    // `Bitmap.createScaledBitmap` no tamanho pedido (ViewShot.java:439), então
    // o arquivo final não depende da densidade do aparelho nem de o layout ter
    // medido a View com um pixel a mais ou a menos.
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
  });

  return moverParaCacheInterno(capturado);
}

/** Como o compartilhamento terminou — o modal usa isso para decidir o que dizer. */
export type ShareOutcome =
  /** Abriu o app de destino pedido. */
  | 'direto'
  /** App indisponível; abriu o seletor do sistema e algum app aceitou. */
  | 'sistema'
  /** O usuário fechou o seletor sem escolher ninguém. */
  | 'cancelado'
  /** Nenhum destino aceitou. */
  | 'falhou';

/** Pacotes dos destinos diretos. Todos declarados em `<queries>` no manifesto. */
const PACOTE_WHATSAPP = 'com.whatsapp';
const PACOTE_WHATSAPP_BUSINESS = 'com.whatsapp.w4b';
const PACOTE_INSTAGRAM = 'com.instagram.android';

/**
 * Desistência do usuário não é falha.
 *
 * `Share.open` rejeita com "User did not share" quando o seletor é fechado sem
 * escolha — sem separar esse caso, quem só mudou de ideia recebia o alerta de
 * "não conseguimos abrir o app".
 */
function usuarioCancelou(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? '');
  return /did not share|dismissed|cancel/i.test(mensagem);
}

/**
 * Seletor genérico do sistema, com imagem e texto.
 *
 * Aviso conhecido: nem todo app de destino aceita os dois juntos. O WhatsApp
 * aceita (vira legenda da foto); vários outros descartam um dos dois. Por isso
 * o link também vai no texto, e não dentro da imagem.
 */
async function abrirSeletorDoSistema(
  imageUri: string,
  message: string,
): Promise<ShareOutcome> {
  try {
    await Share.open({ url: imageUri, message, type: 'image/png' });
    return 'sistema';
  } catch (erroSistema) {
    if (__DEV__) {
      console.log('[shareCard] Share.open falhou:', erroSistema);
    }
    return usuarioCancelou(erroSistema) ? 'cancelado' : 'falhou';
  }
}

/**
 * O pacote está instalado?
 *
 * `isPackageInstalled` só existe no Android (lança no resto) e depende de o
 * pacote estar declarado em `<queries>` no AndroidManifest — sem isso o Android
 * 11+ esconde o app e a resposta vem `false` mesmo com ele presente.
 */
async function pacoteInstalado(pacote: string): Promise<boolean> {
  try {
    const { isInstalled } = await Share.isPackageInstalled(pacote);
    return isInstalled;
  } catch {
    return false;
  }
}

/**
 * Envia pelo WhatsApp comum ou Business, com a imagem anexada e o texto.
 *
 * Checar o pacote ANTES é obrigatório: quando o WhatsApp não está instalado, o
 * `shareSingle` troca o intent por `market://details?id=com.whatsapp` e
 * **resolve como sucesso** (SingleShareIntent.java:44-52). Sem a checagem, o
 * usuário era despejado na Play Store e o app fechava o modal comemorando.
 */
async function enviarPeloWhatsAppAndroid(
  imageUri: string,
  message: string,
): Promise<ShareOutcome | null> {
  const destinos = [
    { pacote: PACOTE_WHATSAPP, social: Social.Whatsapp },
    { pacote: PACOTE_WHATSAPP_BUSINESS, social: Social.Whatsappbusiness },
  ];

  for (const { pacote, social } of destinos) {
    if (!(await pacoteInstalado(pacote))) continue;

    try {
      await Share.shareSingle({
        social,
        url: imageUri,
        message,
        type: 'image/png',
        filename: 'bethunter-contador',
        // Em desenvolvimento, abre direto a conversa do número de teste em vez
        // do seletor de contatos. `whatsAppNumber` existe no nativo
        // (WhatsAppShare.java) mas não está nos tipos do pacote — daí o cast.
        ...(__DEV__ ? { whatsAppNumber: WHATSAPP_TEST_NUMBER } : {}),
      } as Parameters<typeof Share.shareSingle>[0]);
      return 'direto';
    } catch (erroWhatsApp) {
      // Não engolir em silêncio: distinguir "WhatsApp não instalado" de
      // "FileProvider mal configurado" é o que economiza horas de depuração.
      if (__DEV__) {
        console.log(`[shareCard] shareSingle(${pacote}) falhou:`, erroWhatsApp);
      }
    }
  }

  return null;
}

/**
 * Envia o card pelo WhatsApp: imagem anexada, texto como legenda.
 *
 * O caminho muda por plataforma, e a razão é do lado do `react-native-share`:
 *
 * - **Android** — `shareSingle` monta um `ACTION_SEND` com `EXTRA_STREAM` +
 *   `EXTRA_TEXT` (ShareIntent.java:177-190), que é exatamente o que o WhatsApp
 *   precisa para abrir a foto já com a legenda preenchida. Vai direto ao app.
 *
 * - **iOS** — `shareSingle` com imagem **descarta a mensagem**: o
 *   `tryToSendImage` (WhatsAppShare.m:59-88) manda só o arquivo por
 *   `UIDocumentInteractionController` e nunca lê `options.message`. O texto e o
 *   link com `ref`/UTM sumiam, e a promise ainda resolvia como sucesso. O share
 *   sheet do sistema entrega os dois itens ao WhatsApp e mantém a legenda —
 *   custa um toque a mais para escolher o app, e é o único caminho que preserva
 *   a atribuição.
 */
export async function shareToWhatsApp(
  imageUri: string,
  message: string,
): Promise<ShareOutcome> {
  if (Platform.OS === 'android') {
    const resultado = await enviarPeloWhatsAppAndroid(imageUri, message);
    if (resultado) return resultado;
  }

  return abrirSeletorDoSistema(imageUri, message);
}

/**
 * Abre o Instagram com a imagem.
 *
 * **O Instagram não aceita legenda por intent** — o `InstagramShare` do
 * react-native-share só passa a imagem. Por isso quem chama deve colocar o
 * texto com o link na área de transferência antes, senão o compartilhamento
 * sai sem link nenhum e a atribuição se perde.
 *
 * `type` é obrigatório: sem ele o `InstagramShare.java` faz `return` silencioso
 * e nada acontece.
 *
 * Requer `<package android:name="com.instagram.android"/>` em `<queries>`, pelo
 * mesmo motivo do WhatsApp.
 *
 * A checagem do pacote no Android é pelo mesmo motivo de
 * `enviarPeloWhatsAppAndroid`: sem Instagram instalado, o `shareSingle` abriria
 * a ficha da Play Store e devolveria sucesso.
 */
export async function shareToInstagram(
  imageUri: string,
): Promise<ShareOutcome> {
  if (Platform.OS === 'android' && !(await pacoteInstalado(PACOTE_INSTAGRAM))) {
    return abrirSeletorDoSistema(imageUri, '');
  }

  try {
    await Share.shareSingle({
      social: Social.Instagram,
      url: imageUri,
      type: 'image/png',
      filename: 'bethunter-contador',
    });
    return 'direto';
  } catch (erroInstagram) {
    if (__DEV__) {
      console.log('[shareCard] shareSingle(Instagram) falhou:', erroInstagram);
    }

    try {
      await Share.open({ url: imageUri, type: 'image/png' });
      return 'sistema';
    } catch (erroSistema) {
      return usuarioCancelou(erroSistema) ? 'cancelado' : 'falhou';
    }
  }
}

/**
 * Fallback: salva o PNG na galeria.
 *
 * Só grava, nunca lê — por isso `writeOnly: true` na permissão (evita pedir
 * acesso à biblioteca inteira).
 *
 * @returns false se a permissão foi negada ou a gravação falhou.
 */
export async function saveToGallery(imageUri: string): Promise<boolean> {
  try {
    const { granted } = await MediaLibrary.requestPermissionsAsync(true);
    if (!granted) return false;

    await MediaLibrary.saveToLibraryAsync(imageUri);
    return true;
  } catch {
    return false;
  }
}
