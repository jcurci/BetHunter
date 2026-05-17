import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Footer, StatsDisplay, Avatar, DayCounter, IconCard } from "../../components";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import { useAuthStore } from "../../storage/authStore";
import { useDashboardStore } from "../../storage/dashboardStore";
import { CourseProgress } from "../../domain/entities/CourseProgress";

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
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((state) => state.user);

  // Dashboard store
  const { dashboard, isLoading, loadAll } = useDashboardStore();
  
  // Calcula statsReady baseado no store
  const statsReady = !isLoading && dashboard !== null;

  // Current course — stale-while-revalidate:
  // state persists between focus events (component doesn't unmount),
  // so cached value renders instantly while background fetch runs.
  const [currentCourse, setCurrentCourse] = useState<CourseProgress | null>(null);
  const [currentCourseLoading, setCurrentCourseLoading] = useState(true);
  const hasCourseDataRef = useRef(false);

  const loadCurrentCourse = useCallback(async () => {
    // First load → show skeleton. Subsequent focuses → silent background refresh.
    if (!hasCourseDataRef.current) {
      setCurrentCourseLoading(true);
    }
    try {
      const courses = await Container.getInstance().getGetCoursesWithProgressUseCase().execute();
      const inProgress = courses.find(
        (c) => c.modulesCompleted > 0 && c.moduleCompletionPercentage < 100,
      );
      const notStarted = courses.find((c) => c.modulesCompleted === 0);
      const resolved = inProgress ?? notStarted ?? courses[0] ?? null;
      hasCourseDataRef.current = true;
      setCurrentCourse(resolved);
    } catch {
      // Non-critical — keeps last known value, or skeleton stays if first load failed
    } finally {
      setCurrentCourseLoading(false);
    }
  }, []); // stable — reads only refs, no external deps

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      void loadCurrentCourse();
    }, [loadCurrentCourse]),
  );

  const getInitials = (name: string | undefined): string => {
    if (!name) return "JD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar initials={getInitials(user?.name)} size={42} style={styles.avatar} />
            <View style={styles.titleContainer}>
              <Text
                style={styles.title}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
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

              {currentCourseLoading && !currentCourse ? (
                <View style={styles.continueSkeletonCard}>
                  <View style={styles.continueSkeletonTitle} />
                  <View style={styles.continueSkeletonSubtitle} />
                </View>
              ) : currentCourse ? (
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
                    onPress={() =>
                      navigation.navigate("CourseModules", {
                        courseId: currentCourse.id,
                        courseTitle: currentCourse.title,
                        modulesCompleted: currentCourse.modulesCompleted,
                      })
                    }
                  >
                    <View style={styles.continueTextContainer}>
                      <MaskedView
                        style={styles.continueTitleMask}
                        maskElement={
                          <Text
                            style={[styles.continueTitle, { backgroundColor: "transparent" }]}
                            numberOfLines={1}
                          >
                            {currentCourse.title}
                          </Text>
                        }
                      >
                        <LinearGradient
                          colors={HORIZONTAL_GRADIENT_COLORS}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={[styles.continueTitle, { opacity: 0 }]} numberOfLines={1}>
                            {currentCourse.title}
                          </Text>
                        </LinearGradient>
                      </MaskedView>
                      <Text style={styles.continueProgress}>
                        {currentCourse.modulesCompleted}/{currentCourse.modulesQuantity}
                      </Text>
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
              ) : null}
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
                onPress={() => navigation.navigate("SejaParceiro")}
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
    paddingTop: 4,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 0,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  avatar: {
    marginRight: 10,
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 25,
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Streak
  streakCounter: {
    marginBottom: 20,
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
    marginBottom: 20,
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
  continueSkeletonCard: {
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 10,
  },
  continueSkeletonTitle: {
    height: 20,
    width: "65%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  continueSkeletonSubtitle: {
    height: 13,
    width: "35%",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
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
