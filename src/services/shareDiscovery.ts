/**
 * Estado de descoberta do card de compartilhamento.
 *
 * O card existe e funciona (ver docs/share-card-contador.md), mas o usuário
 * precisa ser chamado até ele. Estas flags governam essa chamada: quando o selo
 * "Novo" some, quando o lembrete recorrente para de disparar e qual marco de
 * dias já foi comemorado.
 *
 * **Abrir não é compartilhar.** São duas flags separadas de propósito: o selo
 * cai no primeiro toque (o usuário já sabe que a feature existe), mas o lembrete
 * só para quando um envio dá certo — quem abriu, olhou e fechou continua sendo
 * um bom alvo do convite.
 *
 * Todas as chaves levam o `userId` no fim, no mesmo padrão do
 * `blockerPromoSeenKey` da Home: duas contas no mesmo aparelho não herdam o
 * estado uma da outra.
 *
 * Nenhuma função aqui rejeita. Elas correm no caminho do check-in e da abertura
 * do card — uma falha de AsyncStorage pode custar um selo a mais na tela, nunca
 * a ação que o usuário pediu.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const seenKey = (userId: string): string => `@bethunter_share_seen_${userId}`;
const doneKey = (userId: string): string => `@bethunter_share_done_${userId}`;
const milestoneKey = (userId: string): string =>
  `@bethunter_share_milestone_${userId}`;

async function readFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) !== null;
  } catch {
    return false;
  }
}

async function writeFlag(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, "1");
  } catch {
    // Ver nota no topo: falha aqui não pode derrubar a ação do usuário.
  }
}

/** Já abriu o ShareCardModal ao menos uma vez? Governa o selo "Novo". */
export async function hasSeenShare(userId: string): Promise<boolean> {
  return readFlag(seenKey(userId));
}

export async function markShareSeen(userId: string): Promise<void> {
  return writeFlag(seenKey(userId));
}

/** Já enviou de fato (WhatsApp, Instagram ou galeria)? Governa o lembrete. */
export async function hasShared(userId: string): Promise<boolean> {
  return readFlag(doneKey(userId));
}

export async function markShared(userId: string): Promise<void> {
  return writeFlag(doneKey(userId));
}

/**
 * Maior marco já comemorado com o modal.
 *
 * Guardar o maior (e não um par de flags por marco) resolve sozinho o caso do
 * usuário que reseta o contador e sobe de novo: ele não recebe o mesmo modal
 * duas vezes, e volta a receber quando ultrapassar o marco anterior.
 *
 * Retorna 0 quando não há registro — qualquer marco é maior que isso.
 */
export async function lastCelebratedMilestone(userId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(milestoneKey(userId));
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export async function setCelebratedMilestone(
  userId: string,
  days: number,
): Promise<void> {
  try {
    await AsyncStorage.setItem(milestoneKey(userId), String(days));
  } catch {
    // idem
  }
}
