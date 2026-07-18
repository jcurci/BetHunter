import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { NavigationProp } from "../../types/navigation";
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
} from "../../config/colors";
import {
  LIGHTNING_CHALLENGES,
  pickRandom,
} from "./sosChallenges";
import {
  getEmergencyContact,
  openWhatsAppRescue,
} from "../../services/emergencyContact";

/**
 * Menu SOS — intervenção de crise (fissura por apostas / ansiedade).
 * Regras de UX: sem scroll, 4 alvos grandes, um toque, zero fricção cognitiva.
 */
const SOSMenu: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [challengeVisible, setChallengeVisible] = useState(false);
  const [challenge, setChallenge] = useState<string>(LIGHTNING_CHALLENGES[0]);

  const openLightningChallenge = useCallback(() => {
    setChallenge(pickRandom(LIGHTNING_CHALLENGES));
    setChallengeVisible(true);
  }, []);

  const nextChallenge = useCallback(() => {
    setChallenge((current) => pickRandom(LIGHTNING_CHALLENGES, current));
  }, []);

  const handleRescue = useCallback(async () => {
    const contact = await getEmergencyContact();
    if (!contact) {
      Alert.alert(
        "Contato não configurado",
        "Cadastre a pessoa da sua rede de apoio para usar o resgate com um toque.",
        [
          { text: "Agora não", style: "cancel" },
          {
            text: "Configurar",
            onPress: () => navigation.navigate("EmergencyContact"),
          },
        ],
      );
      return;
    }

    const opened = await openWhatsAppRescue(contact);
    if (!opened) {
      Alert.alert(
        "Não foi possível abrir o WhatsApp",
        "Verifique se o WhatsApp está instalado neste aparelho.",
      );
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[...BACKGROUND_GRADIENT_COLORS]}
        locations={[...BACKGROUND_GRADIENT_LOCATIONS]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Respira.</Text>
          <Text style={styles.headerSubtitle}>
            A vontade passa. Escolha uma saída:
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <Icon name="x" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 4 cards — ocupam o espaço vertical, sem scroll */}
      <View style={styles.cardsArea}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={openLightningChallenge}
          accessibilityRole="button"
          accessibilityLabel="Desafio relâmpago: distração imediata"
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(255,200,90,0.14)" }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={34} color="#F6C85F" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Desafio Relâmpago</Text>
            <Text style={styles.cardSubtitle}>Distraia a mente agora</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#6E6880" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("ChoqueFisiologico")}
          accessibilityRole="button"
          accessibilityLabel="Choque fisiológico: ação física de um minuto"
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(120,200,255,0.14)" }]}>
            <MaterialCommunityIcons name="snowflake" size={34} color="#7EC8FF" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Choque Fisiológico</Text>
            <Text style={styles.cardSubtitle}>Reset do corpo em 1 minuto</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#6E6880" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Meditacao")}
          accessibilityRole="button"
          accessibilityLabel="Recuperar o controle: respiração guiada com som"
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(183,148,199,0.16)" }]}>
            <MaterialCommunityIcons name="meditation" size={34} color="#D4A5C9" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Recuperar o Controle</Text>
            <Text style={styles.cardSubtitle}>Respiração guiada com som</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#6E6880" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.rescueCard]}
          activeOpacity={0.85}
          onPress={handleRescue}
          accessibilityRole="button"
          accessibilityLabel="Botão de resgate: chamar sua rede de apoio no WhatsApp"
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(255,106,86,0.16)" }]}>
            <MaterialCommunityIcons name="lifebuoy" size={34} color="#FF6A56" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Botão de Resgate</Text>
            <Text style={styles.cardSubtitle}>Fale com alguém de confiança</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#6E6880" />
        </TouchableOpacity>
      </View>

      {/* Link discreto para configurar o contato de resgate */}
      <TouchableOpacity
        style={styles.configLink}
        onPress={() => navigation.navigate("EmergencyContact")}
        hitSlop={{ top: 8, bottom: 8 }}
      >
        <Icon name="settings" size={13} color="#8B84A0" />
        <Text style={styles.configLinkText}>Configurar contato de resgate</Text>
      </TouchableOpacity>

      {/* Modal — Desafio Relâmpago */}
      <Modal
        visible={challengeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChallengeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="lightning-bolt" size={40} color="#F6C85F" />
            </View>
            <Text style={styles.modalLabel}>Faça agora:</Text>
            <Text style={styles.modalChallenge}>{challenge}</Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => setChallengeVisible(false)}
            >
              <LinearGradient
                colors={["#7456C8", "#D783D8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalPrimaryGradient}
              >
                <Text style={styles.modalPrimaryText}>Feito</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={nextChallenge}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <Text style={styles.modalSecondaryText}>Me dá outro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#B4AEC6",
    marginTop: 6,
    lineHeight: 22,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardsArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
    justifyContent: "center",
  },
  card: {
    flex: 1,
    maxHeight: 128,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22,20,31,0.92)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(116,86,200,0.25)",
    paddingHorizontal: 18,
    gap: 16,
  },
  rescueCard: {
    borderColor: "rgba(255,106,86,0.45)",
  },
  cardIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#9E96AD",
    lineHeight: 19,
  },
  configLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  configLinkText: {
    fontSize: 13,
    color: "#8B84A0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#1C1928",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(246,200,95,0.3)",
    padding: 28,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(246,200,95,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  modalLabel: {
    fontSize: 14,
    color: "#9E96AD",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  modalChallenge: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 26,
  },
  modalPrimaryBtn: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  modalPrimaryGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  modalSecondaryBtn: {
    marginTop: 14,
    paddingVertical: 6,
  },
  modalSecondaryText: {
    color: "#B8A8E8",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default SOSMenu;
