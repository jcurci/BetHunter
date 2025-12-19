import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Footer, BackIconButton } from "../../components";
import { NavigationProp } from "../../types/navigation";
import { useSavedCoursesStore, SavedCourse } from "../../storage/savedCoursesStore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const CursosSalvos: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { savedCourses, removeCourse } = useSavedCoursesStore();

  const handleModulePress = (course: SavedCourse) => {
    const moduleTitle = course.title.toLowerCase().replace(/\s+/g, "-");
    navigation.navigate("Quiz", { title: moduleTitle, moduleData: course });
  };

  const handleRemoveCourse = (courseId: string) => {
    removeCourse(courseId);
  };

  const renderProgressBar = (percentage: number, gradientColors: string[]) => {
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

  const renderCourseCard = (course: SavedCourse) => (
    <View key={course.id} style={styles.courseCard}>
      <TouchableOpacity
        style={styles.courseContent}
        onPress={() => handleModulePress(course)}
      >
        <View style={styles.containerTitle}>
          <MaskedView
            maskElement={<Text style={styles.courseTitle}>{course.title}</Text>}
          >
            <LinearGradient
              colors={course.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.courseTitle, { opacity: 0 }]}>
                {course.title}
              </Text>
            </LinearGradient>
          </MaskedView>
          <Text style={styles.progressText}>{course.progress}</Text>
        </View>
        {renderProgressBar(course.percentage, course.gradientColors)}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveCourse(course.id)}
      >
        <Icon name="bookmark-remove" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <Text style={styles.headerTitle}>Cursos Salvos</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedCourses.length > 0 ? (
          <View style={styles.coursesGrid}>
            {savedCourses.map(renderCourseCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="bookmark-outline" size={64} color="#A09CAB" />
            <Text style={styles.emptyTitle}>Nenhum curso salvo</Text>
            <Text style={styles.emptyText}>
              Salve cursos para acessá-los rapidamente aqui
            </Text>
          </View>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  coursesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  courseCard: {
    width: "48%",
    backgroundColor: "#2B2935",
    borderRadius: 15,
    marginBottom: 16,
    overflow: "hidden",
  },
  courseContent: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  containerTitle: {
    backgroundColor: "#1A1923",
    borderRadius: 13,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    alignItems: "flex-start",
    minHeight: 80,
  },
  courseTitle: {
    fontSize: 16,
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
    marginTop: 0,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 4,
  },
  progressBar: {
    width: "100%",
    height: 45,
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
    fontSize: 12,
    color: "#A09CAB",
    position: "absolute",
    right: 10,
    bottom: 10,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#A09CAB",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

export default CursosSalvos;



