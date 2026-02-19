import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import {
  BackIconButton,
  RadialGradientBackground,
  FeatureCard,
  MenuItem,
  MenuSection,
} from "../../components";
import { NavigationProp } from "../../types/navigation";
import { useAuthStore } from "../../storage/authStore";
import { AuthUser } from "../../domain/entities/User";

import {
  HORIZONTAL_GRADIENT_COLORS,
  BUTTON_BORDER_GRADIENT_COLORS,
  BUTTON_BORDER_GRADIENT_LOCATIONS,
  BUTTON_BORDER_GRADIENT,
  BUTTON_HIGHLIGHT_COLORS,
  BUTTON_INNER_BACKGROUND,
  BUTTON_INNER_BORDER_COLOR,
} from "../../config/colors";

const ProIcon: React.FC = () => (
  <View style={styles.proIconContainer}>
    <LinearGradient
      colors={HORIZONTAL_GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.proIconGradient}
    >
      <Icon name="zap" size={24} color="#FFFFFF" />
    </LinearGradient>
  </View>
);

const InviteIcon: React.FC = () => (
  <View style={styles.inviteIconContainer}>
    <LinearGradient
      colors={HORIZONTAL_GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.inviteIconGradient}
    >
      <Icon name="user-plus" size={24} color="#FFFFFF" />
    </LinearGradient>
  </View>
);

const MinhaConta: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const authStore = useAuthStore();
  const user = authStore.user;

  // Usuário já vem do authStore, não precisa mais de loadUser

  const getInitials = (name: string | undefined): string => {
    if (!name) return "JD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getUserHandle = (name: string | undefined): string => {
    if (!name) return "jhondoe";
    return name.toLowerCase().replace(/\s+/g, "");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Minha{"\n"}Conta</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>
                    {getInitials(user?.name)}
                  </Text>
                </View>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>Pro</Text>
                </View>
              </View>
              <Text style={styles.userName}>{user?.name || "Jhon Doe"}</Text>
              <Text style={styles.userHandle}>
                @{getUserHandle(user?.name)}
              </Text>
            </View>

            {/* Profile Status Card */}
            <View style={styles.statusCardWrapper}>
              <LinearGradient
                colors={BUTTON_BORDER_GRADIENT_COLORS}
                locations={BUTTON_BORDER_GRADIENT_LOCATIONS}
                start={BUTTON_BORDER_GRADIENT.start}
                end={BUTTON_BORDER_GRADIENT.end}
                style={styles.statusCardGradient}
              >
                {/* Highlight no topo */}
                <LinearGradient
                  colors={BUTTON_HIGHLIGHT_COLORS}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.statusCardHighlight}
                  pointerEvents="none"
                />

                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>
                    Seu perfil é: <Text style={styles.statusBold}>Apostador</Text>
                  </Text>
                
                </View>
              </LinearGradient>
            </View>

            Feature Cards Row
            {/* <View style={styles.featureCardsRow}>
              <FeatureCard
                icon={<ProIcon />}
                title="Pro"
                subtitle="Renova em 31 de Dezembro"
                style={styles.featureCard}
              />
              <FeatureCard
                icon={<InviteIcon />}
                title="Convide Amigos"
                subtitle="Ganhe R$20 ou mais"
                style={styles.featureCard}
              />
            </View> */}

            {/* Menu Sections */}
            <MenuSection>
              <MenuItem
                icon="user"
                label="Conta"
                onPress={() => navigation.navigate("Profile")}
              />
             
              <MenuItem
                icon="help-circle"
                label="Ajuda"
                onPress={() => { }}
              />
              
            </MenuSection>

            <MenuSection>
              <MenuItem
                icon="shield"
                label="Segurança"
                onPress={() => { }}
              />
              <MenuItem
                icon="bell"
                label="Configurações de Notificação"
                onPress={() => navigation.navigate("Notifications")}
              />
             
             
              
            </MenuSection>

            <MenuSection>
              <MenuItem
                icon="info"
                label="Sobre Nós"
                onPress={() => { }}
              />
              <MenuItem
                icon="log-out"
                label="Sair"
                onPress={() => {
                  // TODO: Implementar logout
                }}
                iconColor="#FF4444"
                textColor="#FF4444"
                showSeparator={false}
              />
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
    lineHeight: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A1825",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  proBadge: {
    backgroundColor: "#1A1825",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4,
  },
  userHandle: {
    fontSize: 14,
    color: "#A09CAB",
    marginTop: 4,
  },
  statusCardWrapper: {
    overflow: "hidden",
    borderRadius: 16,
    marginBottom: 12,
  },
  statusCardGradient: {
    borderRadius: 16,
    padding: 1,
  },
  statusCardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderRadius: 16,
    opacity: 0.9,
  },
  statusCard: {
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: BUTTON_INNER_BORDER_COLOR,
  },
  statusText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  statusBold: {
    fontWeight: "bold",
  },
  
  redoButtonText: {
    fontSize: 12,
    color: "#A09CAB",
    textDecorationLine: "underline",
  },
  featureCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  featureCard: {
    flex: 1,
  },
  proIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  proIconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  inviteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  inviteIconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MinhaConta;

