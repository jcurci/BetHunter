import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Entypo";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const COURSES = [
  {
    id: 1,
    title: "Fundamentos",
    totalLessons: 4,
    completedLessons: 1,
    progress: 25,
  },
  {
    id: 2,
    title: "Conhecimento Aplicado",
    totalLessons: 15,
    completedLessons: 0,
    progress: 0,
  },
  {
    id: 3,
    title: "Investimentos de Baixo Risco",
    totalLessons: 30,
    completedLessons: 0,
    progress: 0,
  },
];

const Aprender = () => {
  const navigation = useNavigation();

  const renderCourseCard = ({ item }) => (
    <TouchableOpacity style={styles.courseCard}>
      <Text style={styles.courseTitle}>{item.title}</Text>
      <Text style={styles.lessonsText}>
        {item.completedLessons}/{item.totalLessons}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{item.progress}%</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aprender</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Config")}>
            <Icon name="dots-three-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Courses List */}
        <FlatList
          data={COURSES}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.coursesList}
        />
      </View>
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
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  coursesList: {
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  lessonsText: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 15,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    marginBottom: 5,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#7456C8",
    // Gradiente roxo para laranja como na imagem
  },
  progressText: {
    fontSize: 12,
    color: "#A0A0A0",
    fontWeight: "600",
    textAlign: "right",
  },
});

export default Aprender;
