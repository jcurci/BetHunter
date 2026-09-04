import { Platform } from 'react-native';
import { addUpdateListener, checkForUpdate, startUpdate } from 'expo-in-app-updates';

/**
 * Atualização obrigatória via Google Play In-App Updates.
 *
 * A Play Store é a única fonte da verdade: não há versão mínima para manter em
 * lugar nenhum, nem backend, nem arquivo remoto. Se existe versão nova publicada,
 * ela é obrigatória — quem desenha a tela, baixa e instala é o próprio Google
 * (fluxo IMMEDIATE).
 *
 * Regra que atravessa este arquivo: **o updater nunca pode inutilizar o app**.
 * Play indisponível, APK vindo de fora da loja, exceção do módulo nativo — tudo
 * isso é engolido e o app segue normalmente. O custo de bloquear por engano é
 * alto demais num app cuja função é manter o bloqueio de apostas de pé: usuário
 * trancado do lado de fora não consegue nem reativar a VPN, que exige
 * `VpnService.prepare()` por um toque na jornada da Home.
 */

/**
 * Quantas vezes a tela do Google é re-armada depois de o usuário cancelar, por
 * processo do app.
 *
 * É o teto que separa "obrigatório" de "tijolo". Sem ele, um aparelho sem espaço
 * em disco ou com a Play quebrada ficaria num laço permanente e o app nunca mais
 * abriria. Com ele, a exigência apenas volta no próximo launch e no próximo
 * foreground — na prática continua obrigatória, sem risco de deixar alguém
 * trancado para sempre.
 */
const MAX_REARM_PER_SESSION = 3;

/**
 * Folga entre o cancelamento e a re-armada. O evento chega enquanto a Activity
 * do Google ainda está saindo; reabrir em cima disso perde a chamada.
 */
const REARM_DELAY_MS = 800;

let rearmCount = 0;
let inFlight = false;
let listenerRegistered = false;

/**
 * iOS fica de fora (o módulo lá cai na API do iTunes e exigiria `AppStoreID` no
 * infoPlist), e build de dev nunca vem da Play — chamar o Play Core nesses casos
 * só produziria ruído.
 */
function isSupported(): boolean {
  return Platform.OS === 'android' && !__DEV__;
}

/**
 * É este listener que faz a atualização ser obrigatória de fato: no fluxo
 * IMMEDIATE o usuário ainda consegue sair com o botão voltar, e aí a tela volta.
 */
function registerCancelListener(): void {
  if (listenerRegistered) return;
  listenerRegistered = true;

  addUpdateListener('updateCancelled', () => {
    if (rearmCount >= MAX_REARM_PER_SESSION) return;
    rearmCount += 1;
    setTimeout(() => {
      void enforceUpdate(`cancelled:${rearmCount}`);
    }, REARM_DELAY_MS);
  });
}

/**
 * Verifica se há versão nova na Play e, havendo, abre a tela bloqueante.
 *
 * Efeito colateral puro: nunca lança, nunca devolve nada que valha a pena
 * checar. Deve ser chamada sem `await` — nenhum caminho de boot pode passar a
 * depender do resultado, sob pena de a renovação da licença do bloqueador
 * (`syncBlockerWithPremium` → `renewPremiumLease`) ficar atrás dela.
 */
export async function enforceUpdate(reason: string): Promise<void> {
  if (!isSupported()) return;
  if (inFlight) return;

  inFlight = true;
  try {
    registerCancelListener();

    const info = await checkForUpdate();

    // `updateInProgress` cobre o IMMEDIATE que ficou pela metade (usuário saiu no
    // meio do download): o Play pede que a retomada seja disparada de novo, e
    // nesse estado `updateAvailable` pode vir false.
    if (!info.updateAvailable && !info.updateInProgress) return;

    // `immediateAllowed` só vem undefined fora do Android, que já saiu no guard
    // acima. Na dúvida, IMMEDIATE — o flexible não bloqueia nada.
    await startUpdate(info.immediateAllowed !== false);
  } catch (error) {
    if (__DEV__) console.warn(`[APP UPDATE] ${reason}: falha ignorada`, error);
  } finally {
    inFlight = false;
  }
}
