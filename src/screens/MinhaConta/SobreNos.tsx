import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import { BackIconButton, RadialGradientBackground } from "../../components";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../config/colors";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

function BulletRow({ marker, children }: { marker: string; children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMarker}>{marker}</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const SobreNos: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const goToBlockFlow = (): void => {
    navigation.navigate("Home", { openBlockFlow: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Sobre nós</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <MaskedView
              maskElement={
                <Text style={[styles.heroMasked, { backgroundColor: "transparent" }]}>
                  O sistema foi desenhado para você perder.{"\n"}Nós fomos desenhados para
                  você virar o jogo.
                </Text>
              }
            >
              <LinearGradient
                colors={HORIZONTAL_GRADIENT_COLORS}
                locations={HORIZONTAL_GRADIENT_LOCATIONS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradientBox}
              >
                <Text style={[styles.heroMasked, { opacity: 0 }]}>
                  O sistema foi desenhado para você perder.{"\n"}Nós fomos desenhados para
                  você virar o jogo.
                </Text>
              </LinearGradient>
            </MaskedView>

            <Text style={styles.paragraph}>
              As casas de apostas usam psicologia comportamental para tirar seu dinheiro. O
              Bethunter usa a mesma ciência para devolver o seu controle.
            </Text>

            <Text style={styles.sectionEyebrow}>A ARMADILHA</Text>
            <Text style={styles.sectionTitle}>O mercado</Text>
            <BulletRow marker="•">
              Promessa falsa de dinheiro rápido
            </BulletRow>
            <BulletRow marker="•">
              Gatilhos de vício por meio da psicologia comportamental
            </BulletRow>
            <BulletRow marker="•">
              Resultado: perda financeira e dependência
            </BulletRow>

            <Text style={[styles.sectionEyebrow, styles.sectionSpacer]}>A SAÍDA</Text>
            <Text style={styles.sectionTitle}>O Bethunter</Text>
            <BulletRow marker="✓">Realidade matemática e educação financeira</BulletRow>
            <BulletRow marker="✓">Controle de impulsos com ferramentas de bloqueio</BulletRow>
            <BulletRow marker="✓">Resultado: construção de patrimônio com consciência</BulletRow>

            <Text style={[styles.paragraph, styles.quoteMargin]}>
              Não somos contra a diversão. Somos contra a ignorância que custa caro.
            </Text>

            <Text style={styles.paragraph}>
              O Bethunter existe para dar aos jogadores as ferramentas que a &quot;banca&quot;
              costuma esconder: gestão de risco e visão honesta de probabilidade.
            </Text>

            <TouchableOpacity
              onPress={goToBlockFlow}
              activeOpacity={0.85}
              style={styles.ctaWrap}
            >
              <LinearGradient
                colors={HORIZONTAL_GRADIENT_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradientBorder}
              >
                <View style={styles.ctaInner}>
                  <Text style={styles.ctaText}>Ativar bloqueador</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sourceNote}>
              Texto alinhado ao propósito público em{" "}
              <Text style={styles.sourceLink}>bethunter.com.br/proposito</Text>
            </Text>
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
    marginBottom: 20,
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
  heroGradientBox: {
    marginBottom: 20,
  },
  heroMasked: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
    marginBottom: 0,
  },
  paragraph: {
    color: "#C8C4CF",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 20,
  },
  sectionEyebrow: {
    color: "#988FAD",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  sectionSpacer: {
    marginTop: 8,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingRight: 8,
  },
  bulletMarker: {
    color: "#A09CAB",
    fontSize: 15,
    fontWeight: "700",
    width: 22,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: "#C8C4CF",
    fontSize: 15,
    lineHeight: 23,
  },
  quoteMargin: {
    marginTop: 16,
    fontStyle: "italic",
    color: "#E0DCE8",
  },
  ctaWrap: {
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 30,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  ctaGradientBorder: {
    borderRadius: 30,
    padding: 2,
  },
  ctaInner: {
    backgroundColor: "#17151E",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sourceNote: {
    color: "#6B6775",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  sourceLink: {
    color: "#9B8EC4",
  },
});

export default SobreNos;
