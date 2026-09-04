/**
 * Pedido de avaliação na loja, disparado no pico emocional.
 *
 * O gatilho não é a abertura do app — ali o usuário quer chegar na tela, não
 * dar nota. É o instante em que ele acabou de confirmar o check-in e viu o
 * contador virar 2 dias livre de apostas: orgulho recém-produzido pelo próprio
 * app, e já filtrado (são dois check-ins separados por 24h, ninguém chega aqui
 * por acidente).
 *
 * Por que 2 e não 1 ou 3: os dias 1, 3, 7, 14… são marcos
 * (`MILESTONE_DAYS` em `./notifications`) e a Home abre o modal de comemoração
 * neles. O dia 2 é o único vão livre perto do começo — pede avaliação sem
 * disputar a tela com outro modal.
 *
 * **Sem pré-prompt.** Nada de "está gostando do app?" antes do diálogo nativo:
 * filtrar usuário antes de chamar `requestReview()` é proibido pela política do
 * Play e da Apple, e o filtro derruba justamente a conversão que se quer.
 *
 * Regra que atravessa o arquivo, igual à do `appUpdate.ts`: **nada aqui pode
 * derrubar o caminho do usuário**. Todas as funções são efeito colateral puro,
 * nenhuma rejeita, nenhuma devolve algo que valha a pena checar. Elas correm no
 * caminho do check-in — no pior caso o usuário perde um convite, nunca a ação
 * que ele pediu.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";
import * as StoreReview from "expo-store-review";

/** Dias de streak a partir dos quais o convite pode disparar. */
const REVIEW_MIN_STREAK_DAYS = 2;

const ANDROID_PACKAGE = "com.bethunter.app";
/** `ascAppId` do eas.json — o id da ficha na App Store. */
const IOS_APP_STORE_ID = "6788189536";

/**
 * Chave por usuário, mesmo padrão do `shareDiscovery`: duas contas no mesmo
 * aparelho não herdam o estado uma da outra.
 */
const askedKey = (userId: string): string =>
  `@bethunter_review_asked_${userId}`;

/** Já pedimos avaliação para este usuário? */
export async function hasAskedForReview(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(askedKey(userId))) !== null;
  } catch {
    return false;
  }
}

export async function markReviewAsked(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(askedKey(userId), "1");
  } catch {
    // Ver nota no topo: falha aqui não pode derrubar o check-in.
  }
}

/**
 * Pede a avaliação, se for a hora e se ainda não pedimos.
 *
 * `>=` e não `===`: quem some por uma temporada e volta pode ter o `days` já
 * acima de 2 no check-in seguinte. Melhor entrar tarde no funil do que ser
 * pulado para sempre por um dia que nunca bateu exato.
 *
 * **Uma vez por usuário, para sempre.** A API do Play não conta se o diálogo
 * apareceu de fato — ela tem quota própria e decide sozinha. Insistir só queima
 * essa quota sem gerar avaliação nenhuma; para quem ficou de fora existe a
 * entrada manual em Minha Conta (`openStoreListing`).
 *
 * A flag é marcada só quando `requestReview()` **resolve**. No Android a
 * promise rejeita quando o Play recusa abrir o fluxo — é o que acontece num
 * build de dev ou num APK instalado fora da loja. Não marcar nesse caso é o que
 * dá ao usuário a chance real no próximo check-in, já com o app vindo da Play.
 */
export async function maybeRequestReview(
  userId: string,
  days: number,
): Promise<void> {
  try {
    if (days < REVIEW_MIN_STREAK_DAYS) return;
    if (await hasAskedForReview(userId)) return;

    // No Android isto responde "a Play Store existe neste aparelho"; no iOS,
    // "não é TestFlight". Não distingue app vindo da loja — quem faz isso é a
    // rejeição do próprio requestReview, tratada abaixo.
    if (!(await StoreReview.isAvailableAsync())) return;

    await StoreReview.requestReview();
    await markReviewAsked(userId);
  } catch (error) {
    if (__DEV__) console.warn("[APP REVIEW] convite não disparou", error);
  }
}

/**
 * Abre a ficha da loja para avaliar à mão.
 *
 * Existe porque o diálogo nativo tem quota silenciosa: quando o Google decide
 * não mostrar, `requestReview()` resolve sem erro e a avaliação simplesmente
 * não acontece. Este é o caminho que nunca falha — e o único que dá para
 * divulgar ("Minha Conta → Avaliar o BetHunter").
 *
 * `market://` abre direto no app da Play (sem passar pelo navegador); o
 * `https://` cobre o aparelho sem a loja instalada.
 */
export async function openStoreListing(): Promise<void> {
  const urls =
    Platform.OS === "ios"
      ? [
          `itms-apps://apps.apple.com/app/id${IOS_APP_STORE_ID}?action=write-review`,
          `https://apps.apple.com/app/id${IOS_APP_STORE_ID}?action=write-review`,
        ]
      : [
          `market://details?id=${ANDROID_PACKAGE}`,
          `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
        ];

  for (const url of urls) {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // Tenta o próximo da lista.
    }
  }

  if (__DEV__) console.warn("[APP REVIEW] nenhuma URL de loja pôde ser aberta");
}
