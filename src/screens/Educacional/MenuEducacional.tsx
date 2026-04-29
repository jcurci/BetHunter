import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Footer, StatsDisplay, Avatar, DayCounter, IconCard } from "../../components";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import { useAuthStore } from "../../storage/authStore";

// Assets
const bookIcon = require("../../assets/icon-book.png");
import EmojiHappy from "../../assets/emoji-happy.svg";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
  BUTTON_INNER_BACKGROUND,
} from "../../config/colors";

const MenuEducacional: React.FC = () => {
  const [dashboard, setDashboard] = useState<{ energy: number; streak: number } | null>(null);
  const [statsReady, setStatsReady] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const container = Container.getInstance();
      const loadDashboardUseCase = container.getLoadDashboardUseCase();
      const result = await loadDashboardUseCase.execute();
      setDashboard({ energy: result.energy, streak: result.streak });
    } catch (error: any) {
      console.log("ℹ️ LoadDashboard:", error.message);
    } finally {
      setStatsReady(true);
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return "JD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar initials={getInitials(user?.name)} size={48} style={styles.avatar} />
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit={false}>
                Menu{"\n"}Educacional
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <StatsDisplay
              loading={!statsReady}
              energy={statsReady && dashboard ? dashboard.energy : undefined}
              streak={statsReady && dashboard ? `${dashboard.streak}d` : undefined}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Streak / DayCounter */}
          {!statsReady ? (
            <View style={[styles.streakCounter, styles.streakCounterSkeleton]}>
              <View style={styles.streakSkeletonContainer}>
                {Array.from({ length: 7 }).map((_, index) => (
                  <View key={index} style={styles.fireIconPlaceholder} />
                ))}
              </View>
            </View>
          ) : (
            <DayCounter
              useFireIcons={true}
              activeFires={Math.min(dashboard?.streak ?? 0, 7)}
              totalFires={7}
              finalNumber={
                dashboard != null && (dashboard.streak ?? 0) > 7
                  ? (dashboard.streak ?? 0)
                  : undefined
              }
              style={styles.streakCounter}
            />
          )}

          {/* Estude — chamada de continuação dos estudos */}
          <View style={styles.studySection}>
            <View style={styles.studyHeader}>
              <View style={styles.studyHeaderLeft}>
                <Text style={styles.sectionTitle}>Estude</Text>
                <Text style={styles.sectionSubtitle}>Continue de onde parou</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Cursos")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.studyLink}>Ver em progresso{" >"}</Text>
              </TouchableOpacity>
            </View>

            {/* Glassmorphic continue box (mesma estética da Home) */}
            <View style={styles.continueBox}>
              <LinearGradient
                colors={BACKGROUND_GRADIENT_COLORS}
                locations={BACKGROUND_GRADIENT_LOCATIONS}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={SHADOW_OVERLAY_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={SHADOW_OVERLAY_COLORS}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />

              <Text style={styles.continueBoxTitle}>Curso atual</Text>

              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueCardBorder}
              >
                <TouchableOpacity
                  style={styles.continueCardInner}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("Cursos")}
                >
                  <View style={styles.continueTextContainer}>
                    <MaskedView
                      style={styles.continueTitleMask}
                      maskElement={
                        <Text
                          style={[styles.continueTitle, { backgroundColor: "transparent" }]}
                        >
                          Fundamentos
                        </Text>
                      }
                    >
                      <LinearGradient
                        colors={HORIZONTAL_GRADIENT_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={[styles.continueTitle, { opacity: 0 }]}>
                          Fundamentos
                        </Text>
                      </LinearGradient>
                    </MaskedView>
                    <Text style={styles.continueProgress}>1/4</Text>
                  </View>

                  <View style={styles.arrowContainer}>
                    <Image
                      source={require("../../assets/Icon-seta-efeito.png")}
                      style={styles.arrowEffect}
                      resizeMode="contain"
                    />
                    <Image
                      source={require("../../assets/Icon-seta.png")}
                      style={styles.arrow}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          {/* Opções */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Opções</Text>
            <Text style={styles.sectionSubtitleSpaced}>Cursos, aulas, e mais!</Text>

            <View style={styles.optionsRow}>
              <IconCard
                icon={
                  <Image source={bookIcon} style={styles.optionIconImage} resizeMode="contain" />
                }
                title="Cursos"
                onPress={() => navigation.navigate("Cursos")}
              />
              <IconCard
                icon={<EmojiHappy width={24} height={24} />}
                title={"Parceiros\nBethunter"}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    maxWidth: "70%",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
    flexWrap: "wrap",
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Streak
  streakCounter: {
    marginBottom: 28,
  },
  streakCounterSkeleton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  streakSkeletonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  fireIconPlaceholder: {
    width: 32,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // Section headers (compartilhado)
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#A09CAB",
  },
  sectionSubtitleSpaced: {
    fontSize: 14,
    color: "#A09CAB",
    marginBottom: 16,
  },

  // Estude (continue de onde parou)
  studySection: {
    marginBottom: 28,
  },
  studyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  studyHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  studyLink: {
    fontSize: 13,
    color: "#A09CAB",
    fontWeight: "500",
    textAlign: "right",
  },
  continueBox: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  continueBoxTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  continueCardBorder: {
    borderRadius: 16,
    padding: 1,
    overflow: "hidden",
  },
  continueCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  continueTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  continueTitleMask: {
    height: 26,
  },
  continueTitle: {
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 26,
  },
  continueProgress: {
    fontSize: 13,
    color: "#A09CAB",
    marginTop: 2,
  },
  arrowContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  arrowEffect: {
    position: "absolute",
    width: 44,
    height: 44,
    opacity: 1,
  },
  arrow: {
    width: 22,
    height: 22,
    zIndex: 1,
  },

  // Opções
  optionsSection: {
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionIconImage: {
    width: 24,
    height: 24,
  },
});

export default MenuEducacional;
