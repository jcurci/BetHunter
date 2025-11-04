import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Footer } from "../../components";
import { Container } from "../../infrastructure/di/Container";
import { User } from "../../domain/entities/User";
import { Lesson } from "../../domain/entities/Lesson";
import { NavigationProp } from "../../types/navigation";

import MaskedView from "@react-native-masked-view/masked-view";

interface LearningModule {
  id: string;
  title: string;
  progress: string;
  percentage: number;
  gradientColors: string[];
  hasProgress: boolean;
}

const Aprender = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [learningModules, setLearningModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const container = Container.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar dados do usuário
      const userUseCase = container.getUserUseCase();
      const currentUser = await userUseCase.getCurrentUser();
      setUser(currentUser);

      // Carregar lições da API
      const lessonUseCase = container.getLessonUseCase();
      const lessons = await lessonUseCase.getUserLessons();

      // Mapear lições da API para o formato da UI
      const mappedLessons = lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        progress: `${lesson.completedTopics}/${lesson.totalTopics}`,
        percentage: lesson.progressPercent,
        gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
        hasProgress: lesson.completedTopics > 0,
      }));

      setLearningModules(mappedLessons);
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
    const moduleTitle = module.title.toLowerCase().replace(/\s+/g, "-");
    navigation.navigate("Quiz", { title: moduleTitle, moduleData: module });
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
      <ScrollView>
        {/* Header */}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Icon name="user" size={24} color="#A0A0A0" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || "John Doe"}</Text>
              <Text style={styles.userRank}>Prata - #7</Text>
            </View>
          </View>
          <View style={styles.rankingInfo}>
            <Text style={styles.rankingNumber}>5</Text>
            <Icon name="heart" size={16} color="#FF0000" />
          </View>
          <TouchableOpacity style={styles.rankingButton}>
            <Text style={styles.rankingButtonText}>Conferir ranking</Text>
            <Icon name="chevron-down" size={16} color="#A09CAB" />
          </TouchableOpacity>

          {/* <LinearGradient
            colors={["#7456C8", "#FF8C43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientSeparator}
          /> */}
        </View>

        {/* Learning Modules Grid */}
        <View style={styles.modulesContainer}>
          <LinearGradient
            colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 50,
              borderRadius: 5,
              marginBottom: 20,
              position: "absolute",
              opacity: 0.25,
              top: -27,
              left: 0,
              right: 0,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 8,
            }}
          />
          <View style={styles.modulesGrid}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando lições...</Text>
              </View>
            ) : (
              learningModules.map(renderModuleCard)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // scrollView: {
  //   flex: 1,
  // },
  // header: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   paddingHorizontal: 20,
  //   paddingTop: 10,
  //   paddingBottom: 20,
  // },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7456C8",
  },
  userCard: {
    backgroundColor: "#1A1923",
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  userRank: {
    fontSize: 20,
    color: "#B9D8E9",
  },
  rankingInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "absolute",
    right: 20,
    top: 30,
  },
  rankingNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 5,
  },
  rankingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rankingButtonText: {
    fontSize: 14,
    color: "#A09CAB",
    marginRight: 5,
  },
  gradientSeparator: {
    height: 2,
    marginTop: 15,
    borderRadius: 20,
  },
  modulesContainer: {
    paddingHorizontal: 20,
  },
  modulesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
    marginTop: 18,
  },
  moduleCard: {
    width: "48%",
    backgroundColor: "#2B2935",
    borderRadius: 12,
    padding: 5,
    marginBottom: 15,
    minHeight: 120,
  },
  moduleTitleGradient: {
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    padding: 9,
  },
  progressText: {
    fontSize: 12,
    color: "#A09CAB",
    marginBottom: 10,
    paddingLeft: 8,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerTitle: {
    height: 92,
    backgroundColor: "#1A1923",
    borderRadius: 20,
    marginRight: 10,
    width: "100%",
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 50,
    backgroundColor: "#1A1923",
    borderRadius: 20,
    marginRight: 10,
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: 15,
  },
  percentageText: {
    fontSize: 14,
    color: "#A09CAB",
    alignSelf: "flex-end",
    marginTop: -30,
    marginRight: 10,
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
});

export default Aprender;
