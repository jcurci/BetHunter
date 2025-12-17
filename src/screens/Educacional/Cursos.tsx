import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import Icon from "react-native-vector-icons/Feather";
import IconMaterial from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
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
import { AuthUser } from "../../domain/entities/User";

// Assets
const IconBook = require("../../assets/icon-book.png");
const IconFire = require("../../assets/icon-fire.png");

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

const MOCK_LEARNING_MODULES: LearningModule[] = [
  {
    id: "fundamentos",
    title: "Fundamentos",
    progress: "1/4",
    percentage: 25,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: true,
    description: "Curso sobre os fundamentos da educação financeira",
    stars: "3/12",
    points: 10,
  },
  {
    id: "pratica-dinheiro",
    title: "Prática com Dinheiro",
    progress: "0/10",
    percentage: 0,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: false,
    description: "Aprenda a gerenciar seu dinheiro na prática",
    stars: "0/30",
    points: 25,
  },
  {
    id: "conhecimento-aplicado",
    title: "Conhecimento Aplicado",
    progress: "0/15",
    percentage: 0,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: false,
    description: "Aplicação prática dos conhecimentos adquiridos",
    stars: "0/45",
    points: 30,
  },
  {
    id: "objetivos-planejamento",
    title: "Objetivos e Planejamento",
    progress: "0/8",
    percentage: 0,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: false,
    description: "Defina metas e planeje seu futuro financeiro",
    stars: "0/24",
    points: 20,
  },
  {
    id: "investimentos-baixo-risco",
    title: "Investimentos de Baixo Risco",
    progress: "0/30",
    percentage: 0,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: false,
    description: "Investimentos seguros para iniciantes",
    stars: "0/90",
    points: 50,
  },
  {
    id: "investimentos-alto-risco",
    title: "Investimentos de Alto Risco",
    progress: "0/44",
    percentage: 0,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: false,
    description: "Investimentos avançados e de maior retorno",
    stars: "0/132",
    points: 75,
  },
  {
    id: "criptomoedas-basico",
    title: "Criptomoedas: Básico",
    progress: "0/12",
    percentage: 0,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: false,
    description: "Introdução ao mundo das criptomoedas",
    stars: "0/36",
    points: 30,
  },
  {
    id: "criptomoedas-intermediario",
    title: "Criptomoedas: Intermediário",
    progress: "0/18",
    percentage: 0,
    gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
    hasProgress: false,
    description: "Aprofunde seus conhecimentos em cripto",
    stars: "0/54",
    points: 45,
  },
];

const Cursos = () => {
  const navigation = useNavigation<NavigationProp>();
  const authStore = useAuthStore();
  const user = authStore.user;
  const [learningModules, setLearningModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const { isSaved, toggleSave } = useSavedCoursesStore();

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar módulos baseado na pesquisa
  const filteredModules = learningModules.filter((module) =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadData = async () => {
    try {
      setLoading(true);

      // Usuário já vem do authStore, não precisa mais buscar

      // Serviço de lições temporariamente offline.
      // Quando estiver disponível novamente, reative as linhas abaixo para utilizar os dados reais:
      // const lessonUseCase = container.getLessonUseCase();
      // const lessons = await lessonUseCase.getUserLessons();
      // const mappedLessons = lessons.map((lesson) => ({
      //   id: lesson.id,
      //   title: lesson.title,
      //   progress: `${lesson.completedTopics}/${lesson.totalTopics}`,
      //   percentage: lesson.progressPercent,
      //   gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
      //   hasProgress: lesson.completedTopics > 0,
      // }));

      setLearningModules(MOCK_LEARNING_MODULES);
      setError(null);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Erro ao carregar lições. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (percentage: number, hasProgress: boolean, gradientColors: string[]) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${percentage}%` }]}
          />
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
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
      const moduleTitle = selectedModule.title.toLowerCase().replace(/\s+/g, "-");
      setIsModalVisible(false);
      navigation.navigate("Quiz", { title: moduleTitle, moduleData: selectedModule });
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

  const renderModuleCard = (module: LearningModule) => (
    <TouchableOpacity
      key={module.id}
      style={styles.moduleCard}
      onPress={() => handleModulePress(module)}
    >
      <View style={styles.containerTitle}>
        <MaskedView
          maskElement={<Text style={styles.moduleTitle}>{module.title}</Text>}
        >
          <LinearGradient
            colors={module.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.moduleTitle, { opacity: 0 }]}>
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Nenhum curso encontrado para "{searchQuery}"
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Header - positioned above ScrollView */}
      <View style={styles.headerContainer}>
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
          <StatsDisplay energy={10} streak="3d" />
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
        size="small"
        title={selectedModule?.title || ""}
        subtitle={selectedModule?.description || ""}
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
          {/* Stats Row */}
          <View style={styles.modalStatsRow}>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatValue}>{selectedModule?.progress || "0/0"}</Text>
              <Image source={IconBook} style={styles.modalStatIcon} resizeMode="contain" />
            </View>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatValue}>{selectedModule?.stars || "0/0"}</Text>
              <IconMaterial name="star" size={24} color="#FFD700" />
          </View>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatValue}>{selectedModule?.points || 0}</Text>
              <Image source={IconFire} style={styles.modalStatIcon} resizeMode="contain" />
              </View>
          </View>

          {/* Confirm Button */}
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
    paddingTop: 60,
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
    paddingTop: 180, // Espaço para o header flutuante
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
    width: 168.26,
    height: 154.42,
    backgroundColor: "#2B2935",
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  moduleTitleGradient: {
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    paddingBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 6,
  },
  progressBarContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 160.81,
    marginTop: 0,
    alignSelf: "center",
  },
  progressBar: {
    width: "100%",
    height: 53.25,
    backgroundColor: "#1A1923",
    borderRadius: 13,
    position: "relative",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 13,
  },
  percentageText: {
    fontSize: 14,
    color: "#A09CAB",
    position: "absolute",
    right: 12,
    bottom: 12,
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
    width: 161.87,
    height: 88.39,
    backgroundColor: "#1A1923",
    borderRadius: 13,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    alignItems: "flex-start",
    alignSelf: "center",
  },
  modalContent: {
    paddingTop: 20,
  },
  modalStatsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
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
