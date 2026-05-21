import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { NavigationProp } from "../../types/navigation";
import { BackIconButton, RadialGradientBackground } from "../../components";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
  BUTTON_INNER_BACKGROUND,
  BUTTON_INNER_BORDER_COLOR,
} from "../../config/colors";

/** E-mail oficial para conversas sobre parceria. */
const PARTNER_EMAIL = "parceiros@bethunter.com.br";

/** Perfil oficial em Instagram e TikTok. */
const SOCIAL_HANDLE = "bethunter.app";

const SOCIAL_LINKS: {
  label: string;
  subtitle: string;
  url: string;
  icon: "instagram" | "video";
}[] = [
  {
    label: "Instagram",
    subtitle: `@${SOCIAL_HANDLE}`,
    url: `https://www.instagram.com/${SOCIAL_HANDLE}/`,
    icon: "instagram",
  },
  {
    label: "TikTok",
    subtitle: `@${SOCIAL_HANDLE}`,
    url: `https://www.tiktok.com/@${SOCIAL_HANDLE}`,
    icon: "video",
  },
];

async function openExternal(url: string): Promise<void> {
  try {
    if (!url.startsWith("mailto:")) {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          "Indisponível",
          "Não foi possível abrir este link neste dispositivo."
        );
        return;
      }
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("Erro", "Não foi possível abrir o link. Tente novamente.");
  }
}

const SejaParceiro: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const mailtoPartners = useCallback(() => {
    const qs = `subject=${encodeURIComponent("Parceria com o Bethunter")}`;
    void openExternal(`mailto:${PARTNER_EMAIL}?${qs}`);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Seja parceiro</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lead}>
              Quer levar educação financeira e propósito a mais pessoas? Fale com a equipe Bethunter —
              combinamos projetos comerciais, mídia, influência e institucionais por e-mail ou pelas redes.
            </Text>

            <Text style={styles.sectionEyebrow}>CONTATO PRINCIPAL</Text>

            <TouchableOpacity
              onPress={mailtoPartners}
              activeOpacity={0.85}
              style={styles.emailCtaWrap}
            >
              <LinearGradient
                colors={HORIZONTAL_GRADIENT_COLORS}
                locations={HORIZONTAL_GRADIENT_LOCATIONS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emailCtaGradientBorder}
              >
                <View style={styles.emailCtaInner}>
                  <Icon name="mail" size={22} color="#FFFFFF" />
                  <View style={styles.emailCtaTextCol}>
                    <Text style={styles.emailCtaLabel}>Enviar e-mail</Text>
                    <Text style={styles.emailCtaAddr}>{PARTNER_EMAIL}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#9E99A8" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.hint}>O destinatário já vem preenchido ao abrir o app de e-mail.</Text>

            <Text style={[styles.sectionEyebrow, styles.sectionEyebrowSpaced]}>REDES SOCIAIS</Text>
            <Text style={styles.sectionBlurb}>Abra o canal oficial e envie mensagem pela plataforma.</Text>

            {SOCIAL_LINKS.map(({ label, subtitle, url, icon }) => (
              <TouchableOpacity
                key={label}
                onPress={() => void openExternal(url)}
                activeOpacity={0.72}
                style={styles.socialRowOuter}
              >
                <LinearGradient
                  colors={["rgba(201,167,232,0.35)", "rgba(232,138,117,0.28)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.socialGradientBorder}
                >
                  <View style={styles.socialInner}>
                    <View style={styles.socialIconBubble}>
                      <Icon name={icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.socialTextWrap}>
                      <Text style={styles.socialTitle}>{label}</Text>
                      <Text style={styles.socialSubtitle}>{subtitle}</Text>
                    </View>
                    <Icon name="external-link" size={18} color="#A09CAB" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
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
    marginBottom: 18,
    marginTop: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  lead: {
    color: "#C8C4CF",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 28,
  },
  sectionEyebrow: {
    color: "#988FAD",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  sectionEyebrowSpaced: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionBlurb: {
    color: "#8A8494",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  emailCtaWrap: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  emailCtaGradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  emailCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BUTTON_INNER_BORDER_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  emailCtaTextCol: {
    flex: 1,
  },
  emailCtaLabel: {
    color: "#E8E4EE",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  emailCtaAddr: {
    color: "#9B8EC4",
    fontSize: 14,
    fontWeight: "500",
  },
  hint: {
    color: "#6B6775",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  socialRowOuter: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  socialGradientBorder: {
    borderRadius: 14,
    padding: 1,
  },
  socialInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BUTTON_INNER_BORDER_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  socialIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(155,142,196,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  socialTextWrap: {
    flex: 1,
  },
  socialTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  socialSubtitle: {
    color: "#8A8494",
    fontSize: 13,
    lineHeight: 18,
  },
});

export default SejaParceiro;
