import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import {
  BackIconButton,
  RadialGradientBackground,
  MenuSection,
} from "../../components";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

const Notifications: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "news",
      title: "Notícias",
      description: "Seja notificado sempre, com noticias da área de educação financeira.",
      icon: "user",
      enabled: true,
    },
    {
      id: "investments",
      title: "Investimentos",
      description: "Seja notificado sempre, com oportunidades de investimento.",
      icon: "user",
      enabled: false,
    },
    {
      id: "partners",
      title: "Parceiros",
      description: "Seja notificado sempre, com notificacoes variadas dos nossos parceiros.",
      icon: "user",
      enabled: true,
    },
    {
      id: "reminders",
      title: "Lembretes",
      description: "Seja notificado com lembretes para continuar sua iniciativa ao longo do dia.",
      icon: "user",
      enabled: true,
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
    // TODO: Implementar chamada à API para salvar preferências
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Configurações de Notificação</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Notifications Card */}
            <MenuSection>
              {notifications.map((notification, index) => (
                <View key={notification.id}>
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationLeft}>
                      <View style={styles.iconContainer}>
                        <Icon
                          name={notification.icon as any}
                          size={20}
                          color="#A7A3AE"
                        />
                      </View>
                      <View style={styles.notificationTextContent}>
                        <Text style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationDescription}>
                          {notification.description}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      trackColor={{
                        false: "#2B2935",
                        true: "#FF6A56",
                      }}
                      thumbColor={notification.enabled ? "#FFFFFF" : "#A7A3AE"}
                      ios_backgroundColor="#2B2935"
                      onValueChange={() => toggleNotification(notification.id)}
                      value={notification.enabled}
                    />
                  </View>
                  {index < notifications.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </MenuSection>
          </ScrollView>
        </View>
      </RadialGradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  notificationTextContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  notificationDescription: {
    fontSize: 14,
    color: "#A7A3AE",
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginLeft: 52,
    marginRight: 16,
  },
});

export default Notifications;
