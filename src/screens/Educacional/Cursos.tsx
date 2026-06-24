import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Footer, StatsDisplay, Avatar, BackIconButton, Modal, GradientBorderButton } from "../../components";
import { NavigationProp } from "../../types/navigation";
import {
  BUTTON_BORDER_GRADIENT_COLORS,
  BUTTON_BORDER_GRADIENT_LOCATIONS,
  BUTTON_HIGHLIGHT_COLORS,
  BUTTON_INNER_BACKGROUND,
  BUTTON_INNER_BORDER_COLOR,
} from "../../config/colors";

import MaskedView from "@react-native-masked-view/masked-view";
import { useSavedCoursesStore } from "../../storage/savedCoursesStore";
import { useAuthStore } from "../../storage/authStore";
import { useDashboardStore } from "../../storage/dashboardStore";
import { Container } from "../../infrastructure/di/Container";
import { CourseProgress } from "../../domain/entities/CourseProgress";
import { AuthenticationError, ServerError } from "../../domain/errors/CustomErrors";

// Assets
const IconBook = require("../../assets/icon-book.png");

const DEFAULT_MODULE_GRADIENT = ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"];

/** Alinhado a `scrollContent.paddingHorizontal` */
const SCROLL_HORIZONTAL_PADDING = 20;
const GRID_COLUMN_GAP = 12;

interface LearningModule {
  id: string;
  title: string;
  progress: string;
  percentage: number;
  gradientColors: string[];
  hasProgress: boolean;
  description?: string;
  stars?: string;
  points?: number;
}

function mapCourseProgressToLearningModule(course: CourseProgress): LearningModule {
  return {
    id: course.id,
    title: course.title,
    progress: `${course.modulesCompleted}/${course.modulesQuantity}`,
    percentage: course.moduleCompletionPercentage,
    gradientColors: [...DEFAULT_MODULE_GRADIENT],
    hasProgress: course.modulesCompleted > 0,
    description: course.description,
    stars: `${course.userStars}/${course.possibleStars}`,
    points: course.betcoins,
  };
}

/** Exibição no modal de curso: primeira letra maiúscula, restante minúscula (valor em estado/API inalterado). */
function formatCourseModalTitle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

const Cursos = () => {
  const { width: windowWidth } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const cardWidth = Math.floor(
    (windowWidth - SCROLL_HORIZONTAL_PADDING * 2 - GRID_COLUMN_GAP) / 2,
  );
  const [headerHeight, setHeaderHeight] = useState(180);
  // ScrollView starts after SafeAreaView's top inset, so we subtract it
  // to align cards exactly at the header's bottom edge on every device.
  const scrollPaddingTop = Math.max(headerHeight - topInset, 0);

  const navigation = useNavigation<NavigationProp>();
  const authStore = useAuthStore();
  const user = authStore.user;
  const { betStreak } = useDashboardStore();
  const [learningModules, setLearningModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsReady, setStatsReady] = useState<boolean>(false);
  const [dashboard, setDashboard] = useState<{ energy: number; streak: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { isSaved, toggleSave } = useSavedCoursesStore();

  const loadDashboard = useCallback(async () => {
    try {
      const container = Container.getInstance();
      const useCase = container.getLoadDashboardUseCase();
      const result = await useCase.execute();
      setDashboard({ energy: result.energy, streak: result.streak });
    } catch (error: any) {
      console.log("LoadDashboard:", error?.message ?? error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await loadDashboard();

      const container = Container.getInstance();
      const courses = await container.getGetCoursesWithProgressUseCase().execute();
      setLearningModules(courses.map(mapCourseProgressToLearningModule));
      setError(null);
    } catch (error) {
      console.error("Error loading data:", error);
      const message =
        error instanceof ServerError || error instanceof AuthenticationError
          ? error.message
          : "Erro ao carregar lições. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
      setStatsReady(true);
    }
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const filteredModules = learningModules.filter((module) =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderProgressBar = (percentage: number, _hasProgress: boolean, gradientColors: string[]) => {
    return (
      <View style={styles.progressBarRow}>
        <View style={styles.progressBarTrack}>
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, percentage))}%` }]}
          />
        </View>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>
    );
  };

  const handleModulePress = (module: LearningModule) => {
    setSelectedModule(module);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedModule(null);
  };

  const handleConfirmCourse = () => {
    if (selectedModule) {
      setIsModalVisible(false);
      navigation.navigate("CourseModules", {
        courseId: selectedModule.id,
        courseTitle: selectedModule.title,
        modulesCompleted: parseInt(selectedModule.progress.split("/")[0]) || 0,
      });
    }
  };

  const handleToggleSave = () => {
    if (selectedModule) {
      toggleSave(selectedModule);
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

  const titleTextProps = {
    numberOfLines: 3 as const,
    ellipsizeMode: "tail" as const,
  };

  const renderModuleCard = (module: LearningModule) => (
    <TouchableOpacity
      key={module.id}
      style={[styles.moduleCard, { width: cardWidth }]}
      onPress={() => handleModulePress(module)}
    >
      <View style={styles.containerTitle}>
        <MaskedView
          style={styles.maskedTitle}
          maskElement={
            <Text {...titleTextProps} style={styles.moduleTitle}>
              {module.title}
            </Text>
          }
        >
          <LinearGradient
            colors={module.gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientTitleUnderlay}
          >
            <Text {...titleTextProps} style={[styles.moduleTitle, styles.moduleTitleInvisible]}>
              {module.title}
            </Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.progressText}>{module.progress}</Text>
      </View>

      {renderProgressBar(
        module.percentage,
        module.hasProgress,
        module.gradientColors
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Learning Modules Grid */}
        <View style={styles.modulesContainer}>
          <View style={styles.modulesGrid}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando lições...</Text>
              </View>
            ) : filteredModules.length > 0 ? (
              filteredModules.map(renderModuleCard)
            ) : searchQuery.trim().length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Nenhum curso encontrado para "{searchQuery}"
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Nenhum curso disponível no momento.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Header - positioned above ScrollView */}
      <View
        style={[styles.headerContainer, { paddingTop: topInset + 12 }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        {/* Header Background with Blur - always visible with low opacity */}
        <BlurView
          intensity={50}
          tint="dark"
          style={styles.headerBlur}
        />

        {/* Header */}
        <View style={styles.headerTop}>
          <View style={styles.headerTopLeft}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Cursos</Text>
          </View>
          <StatsDisplay 
            loading={!statsReady}
            energy={statsReady && dashboard ? dashboard.energy : undefined}
            streak={statsReady ? `${betStreak}d` : undefined}
            // Quando statsReady=true mas dashboard=null (erro API), 
            // StatsDisplay mostra 0 energy e "0d" streak como fallback explícito
          />
        </View>

        <View style={styles.headerBottom}>
          <Avatar initials={getInitials(user?.name)} size={48} style={styles.headerAvatar} />
          <View style={styles.searchWrapper}>
            <LinearGradient
              colors={BUTTON_BORDER_GRADIENT_COLORS}
              locations={BUTTON_BORDER_GRADIENT_LOCATIONS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.searchGradient}
            >
              <LinearGradient
                colors={BUTTON_HIGHLIGHT_COLORS}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.searchHighlight}
                pointerEvents="none"
              />
              <View style={styles.searchContainer}>
                <Icon name="search" size={18} color="#A09CAB" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Pesquisar"
                  placeholderTextColor="#A09CAB"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Footer />

      {/* Course Preview Modal */}
      <Modal
        visible={isModalVisible}
        onClose={handleCloseModal}
        size="big"
        title={formatCourseModalTitle(selectedModule?.title || "")}
        headerActions={{
          right: [
            {
              icon: selectedModule && isSaved(selectedModule.id) ? "bookmark" : "bookmark-outline",
              onPress: handleToggleSave,
            },
          ],
        }}
      >
        <View style={styles.modalContent}>
          {!!selectedModule?.description?.trim() && (
            <Text style={styles.modalCourseDescription}>{selectedModule.description}</Text>
          )}

          <View style={styles.modalStatsRow}>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatValue}>{selectedModule?.progress || "0/0"}</Text>
              <Image source={IconBook} style={styles.modalStatIcon} resizeMode="contain" />
            </View>
          </View>

          <GradientBorderButton label="Conferir!" onPress={handleConfirmCourse} />
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
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // paddingTop set dynamically via topInset + 12 inline style
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  headerTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  headerAvatar: {
    marginRight: 4,
  },
  searchWrapper: {
    flex: 1,
  },
  searchGradient: {
    borderRadius: 28,
    padding: 1,
  },
  searchHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderRadius: 28,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16141F",
    borderRadius: 27,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#2B2737",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    // paddingTop is set dynamically via onLayout on the header
  },
  modulesContainer: {
    paddingTop: 12,
  },
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 0,
  },
  moduleCard: {
    minHeight: 172,
    overflow: "hidden",
    backgroundColor: "#2B2935",
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  moduleTitleGradient: {
    marginBottom: 12,
  },
  maskedTitle: {
    width: "100%",
    alignSelf: "stretch",
  },
  gradientTitleUnderlay: {
    alignSelf: "stretch",
  },
  moduleTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    width: "100%",
    flexShrink: 1,
  },
  moduleTitleInvisible: {
    opacity: 0,
  },
  progressText: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 8,
    marginBottom: 10,
  },
  progressBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  progressBarTrack: {
    flex: 1,
    minWidth: 0,
    height: 32,
    backgroundColor: "#1A1923",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A09CAB",
    minWidth: 40,
    textAlign: "right",
  },
  loadingContainer: {
    width: "100%",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#A09CAB",
  },
  emptyContainer: {
    width: "100%",
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#A09CAB",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#FF3B30",
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    borderRadius: 10,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "bold",
  },
  containerTitle: {
    width: "100%",
    minHeight: 70,
    flexGrow: 1,
    backgroundColor: "#1A1923",
    borderRadius: 13,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 6,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  modalContent: {
    paddingTop: 8,
  },
  /** Alinhado ao `subtitle` do componente Modal (cor/tamanho tipográficos) */
  modalCourseDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#A7A3AE",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  modalStatsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  modalStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalStatIcon: {
    width: 24,
    height: 24,
  },
});

export default Cursos;
