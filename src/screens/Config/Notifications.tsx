import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import {
  BackIconButton,
  RadialGradientBackground,
  GradientBorderButton,
} from "../../components";

const Notifications: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const openNotificationSettings = () => {
    Linking.openSettings();
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
            <View style={styles.contentBlock}>
              <Text style={styles.descriptionText}>
                Para receber avisos e lembretes do BetHunter, ative as
                notificações nas configurações do app.
              </Text>
              <View style={styles.buttonContainer}>
                <GradientBorderButton
                  label="Abrir configurações de notificação"
                  onPress={openNotificationSettings}
                />
              </View>
            </View>
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
  contentBlock: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: "#A7A3AE",
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 8,
    alignItems: "center",
  },
});

export default Notifications;
