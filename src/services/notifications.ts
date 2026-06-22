import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const DAILY_REMINDER_KEY = "daily-checkin";
const REENGAGEMENT_REMINDER_KEY = "reengagement";

const DAILY_TITLE = "Hora do check-in";
const DAILY_BODY = "venha marcar mais um dia de vitoria";

const REENGAGEMENT_FALLBACK_TITLE = "Sentimos sua falta";
const REENGAGEMENT_BODY =
  "Seu progresso continua aqui. Que tal retomar com a contagem de dias sem apostar?";

const REENGAGEMENT_SECONDS = 3 * 24 * 60 * 60;

const MILESTONE_COPY: Record<number, { title: string; body: string }> = {
  7: {
    title: "7 dias livres",
    body: "Uma semana inteira no controle. Orgulhe-se disso.",
  },
  30: {
    title: "30 dias. Olha voce agora.",
    body: "Um mes virando o jogo. Continue firme.",
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

export async function scheduleDailyCheckInReminder(): Promise<void> {
  await cancelScheduledByKey(DAILY_REMINDER_KEY);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: DAILY_TITLE,
      body: DAILY_BODY,
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

export async function notifyStreakMilestone(betStreak: number): Promise<void> {
  const copy = MILESTONE_COPY[betStreak];
  if (!copy) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: { notificationKey: `milestone-${betStreak}` },
    },
    trigger: null,
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Promise.all([
    cancelScheduledByKey(DAILY_REMINDER_KEY),
    cancelScheduledByKey(REENGAGEMENT_REMINDER_KEY),
  ]);
}
