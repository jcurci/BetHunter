import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const DAILY_REMINDER_KEY = "daily-checkin";
const REENGAGEMENT_REMINDER_KEY = "reengagement";
const SHARE_INVITE_KEY = "share-invite";

/**
 * Marca o content de uma notificação que deve abrir o card de compartilhamento
 * ao ser tocada. É o que o listener de resposta do `App.tsx` lê — o
 * `notificationKey` continua servindo só para o cancelamento por chave.
 */
export const SHARE_ACTION = "share";

const DAILY_TITLE = "Hora do check-in";
const DAILY_BODY = "venha marcar mais um dia de vitoria";
/**
 * Variante para quem nunca compartilhou. O trigger DAILY é um só e não alterna
 * conteúdo entre disparos, então a escolha acontece na hora de agendar — e como
 * o App.tsx reagenda a cada boot, ela se atualiza sozinha quando o usuário
 * finalmente compartilha.
 */
const DAILY_BODY_NEVER_SHARED =
  "Marque mais um dia de vitoria — e mostre seu contador pra quem torce por voce.";

const REENGAGEMENT_FALLBACK_TITLE = "Sentimos sua falta";
const REENGAGEMENT_BODY =
  "Seu progresso continua aqui. Que tal retomar com a contagem de dias sem apostar?";

const REENGAGEMENT_SECONDS = 3 * 24 * 60 * 60;

const SHARE_INVITE_TITLE = "Seu contador esta bonito";
const SHARE_INVITE_BODY =
  "Mostre pra quem torce por voce quantos dias voce ja segurou. O card sai pronto, sem o seu nome.";
/** Sete dias. Repete até o primeiro envio bem-sucedido cancelar a chave. */
const SHARE_INVITE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Atraso entre bater o marco e a notificação chegar.
 *
 * O check-in só acontece com o app em primeiro plano, então uma notificação
 * imediata apareceria por cima do app que o usuário já está olhando — e do modal
 * de comemoração que a Home abre nesse mesmo instante. O modal cobre o "agora,
 * no app"; esta notificação cobre o "depois, fora do app".
 */
const MILESTONE_DELAY_SECONDS = 4 * 60 * 60;

/**
 * Dias que valem uma comemoração. A Home usa a mesma lista para decidir se abre
 * o modal, então marco na notificação e marco na tela nunca divergem.
 */
export const MILESTONE_DAYS = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365] as const;

export function isMilestone(days: number): boolean {
  return (MILESTONE_DAYS as readonly number[]).includes(days);
}

/**
 * Copy de cada marco. Todas terminam chamando para compartilhar: a notificação
 * de marco existe justamente para levar o usuário ao card.
 */
const MILESTONE_COPY: Record<number, { title: string; body: string }> = {
  1: {
    title: "O primeiro dia",
    body: "O mais dificil ja passou. Registre esse comeco num card e mostre pra alguem.",
  },
  3: {
    title: "3 dias livres",
    body: "Tres dias no controle. Que tal contar isso pra quem te apoia?",
  },
  7: {
    title: "7 dias livres",
    body: "Uma semana inteira no controle. Orgulhe-se disso — e mostre pra quem torce por voce.",
  },
  14: {
    title: "Duas semanas",
    body: "14 dias virando o jogo. Seu card ja tem historia pra contar.",
  },
  21: {
    title: "21 dias",
    body: "Tres semanas. Compartilhe o contador e inspire alguem que esta comecando.",
  },
  30: {
    title: "30 dias. Olha voce agora.",
    body: "Um mes virando o jogo. Continue firme — e deixe as pessoas verem isso.",
  },
  60: {
    title: "60 dias",
    body: "Dois meses de escolhas suas. Mostre esse numero pra quem duvidou.",
  },
  90: {
    title: "90 dias",
    body: "Um trimestre inteiro. Poucos chegam aqui — compartilhe o seu contador.",
  },
  180: {
    title: "Meio ano livre",
    body: "180 dias. Esse card merece sair do seu celular.",
  },
  365: {
    title: "Um ano inteiro",
    body: "365 dias sem apostar. Conte isso pro mundo.",
  },
};

let notificationsConfigured = false;

async function cancelScheduledByKey(key: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled.filter((item) => item.content.data?.notificationKey === key);
  await Promise.all(
    matches.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function configureNotifications(): Promise<void> {
  if (!notificationsConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    notificationsConfigured = true;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * @param opts.neverShared Troca o corpo pela variante que menciona o card.
 *        Deliberadamente **sem** `SHARE_ACTION`: o trabalho principal desta
 *        notificação continua sendo o check-in, então o toque leva à Home
 *        normal, onde o CTA em destaque fecha o caminho.
 */
export async function scheduleDailyCheckInReminder(
  opts?: { neverShared?: boolean },
): Promise<void> {
  await cancelScheduledByKey(DAILY_REMINDER_KEY);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: DAILY_TITLE,
      body: opts?.neverShared ? DAILY_BODY_NEVER_SHARED : DAILY_BODY,
      data: { notificationKey: DAILY_REMINDER_KEY },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function scheduleReengagementReminder(name?: string): Promise<void> {
  await cancelScheduledByKey(REENGAGEMENT_REMINDER_KEY);

  const title =
    typeof name === "string" && name.trim().length > 0
      ? `Sentimos sua falta, ${name.trim()}`
      : REENGAGEMENT_FALLBACK_TITLE;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: REENGAGEMENT_BODY,
      data: { notificationKey: REENGAGEMENT_REMINDER_KEY },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: REENGAGEMENT_SECONDS,
      repeats: false,
    },
  });
}

async function isScheduled(key: string): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((item) => item.content.data?.notificationKey === key);
}

/**
 * Convite recorrente para quem ainda não compartilhou nenhuma vez.
 *
 * Quem agenda é a Home, e não o boot: a regra tem piso de streak (não faz
 * sentido convidar quem está no dia 1) e o contador só existe lá.
 *
 * **Idempotente de propósito**, ao contrário dos outros agendamentos daqui. A
 * Home chama isto toda vez que o contador carrega; um cancela-e-reagenda cego
 * reiniciaria a contagem de 7 dias a cada visita, e quem abre o app todo dia
 * nunca receberia o convite. Se já existe um agendado, ele fica onde está.
 */
export async function scheduleShareInvite(): Promise<void> {
  if (await isScheduled(SHARE_INVITE_KEY)) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: SHARE_INVITE_TITLE,
      body: SHARE_INVITE_BODY,
      data: { notificationKey: SHARE_INVITE_KEY, action: SHARE_ACTION },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SHARE_INVITE_SECONDS,
      repeats: true,
    },
  });
}

export async function cancelShareInvite(): Promise<void> {
  await cancelScheduledByKey(SHARE_INVITE_KEY);
}

/**
 * Agenda a notificação do marco recém-batido.
 *
 * Silenciosa para dias que não são marco — a Home pode chamar com qualquer
 * contagem sem precisar filtrar antes.
 */
export async function scheduleMilestoneShareInvite(betStreak: number): Promise<void> {
  const copy = MILESTONE_COPY[betStreak];
  if (!copy) return;

  const key = `milestone-${betStreak}`;
  await cancelScheduledByKey(key);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: { notificationKey: key, action: SHARE_ACTION },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: MILESTONE_DELAY_SECONDS,
      repeats: false,
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Promise.all([
    cancelScheduledByKey(DAILY_REMINDER_KEY),
    cancelScheduledByKey(REENGAGEMENT_REMINDER_KEY),
    cancelScheduledByKey(SHARE_INVITE_KEY),
  ]);
}
