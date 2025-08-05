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
import Footer from "../components/Footer";
import { Container } from "../../infrastructure/di/Container";

const Aprender = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const container = Container.getInstance();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userUseCase = container.getUserUseCase();
      const currentUser = await userUseCase.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const learningModules = [
    {
      id: 1,
      title: "Fundamentos",
      progress: "1/4",
      percentage: 25,
      color: "#FF8C43",
      hasProgress: true,
    },
    {
      id: 2,
      title: "Prática com Dinheiro",
      progress: "0/10",
      percentage: 0,
      color: "#7456C8",
      hasProgress: false,
    },
    {
      id: 3,
      title: "Conhecimento Aplicado",
      progress: "0/15",
      percentage: 0,
      color: "#FF8C43",
      hasProgress: false,
    },
    {
      id: 4,
      title: "Objetivos e Planejamento",
      progress: "0/8",
      percentage: 0,
      color: "#7456C8",
      hasProgress: false,
    },
    {
      id: 5,
      title: "Investimentos de Baixo Risco",
      progress: "0/30",
      percentage: 0,
      color: "#FF8C43",
      hasProgress: false,
    },
    {
      id: 6,
      title: "Investimentos de Alto Risco",
      progress: "0/44",
      percentage: 0,
      color: "#7456C8",
      hasProgress: false,
    },
  ];

  const renderProgressBar = (percentage, hasProgress) => {
    if (!hasProgress) return null;
    
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>
    );
  };

  const renderModuleCard = (module) => (
    <TouchableOpacity key={module.id} style={styles.moduleCard}>
      <Text style={[styles.moduleTitle, { color: module.color }]}>
        {module.title}
      </Text>
      <Text style={styles.progressText}>{module.progress}</Text>
      {renderProgressBar(module.percentage, module.hasProgress)}
      {!module.hasProgress && (
        <Text style={styles.percentageText}>{module.percentage}%</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aprender</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Icon name="user" size={24} color="#A0A0A0" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.name || "John Doe"}
              </Text>
              <Text style={styles.userRank}>Prata - #7</Text>
            </View>
          </View>
          <View style={styles.rankingInfo}>
            <Text style={styles.rankingNumber}>5</Text>
            <Icon name="heart" size={16} color="#FF0000" />
          </View>
          <TouchableOpacity style={styles.rankingButton}>
            <Text style={styles.rankingButtonText}>Consultar ranking</Text>
            <Icon name="chevron-down" size={16} color="#7456C8" />
          </TouchableOpacity>
        </View>

        {/* Learning Modules Grid */}
        <View style={styles.modulesContainer}>
          <Text style={styles.modulesTitle}>Módulos de Aprendizagem</Text>
          <View style={styles.modulesGrid}>
            {learningModules.map(renderModuleCard)}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7456C8",
  },
  userCard: {
    backgroundColor: "#2A1B3D",
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  userRank: {
    fontSize: 14,
    color: "#7456C8",
  },
  rankingInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 10,
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
    color: "#7456C8",
    marginRight: 5,
  },
  modulesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  },
  moduleCard: {
    width: "48%",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    minHeight: 120,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 10,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7456C8",
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: "#A0A0A0",
    alignSelf: "flex-end",
  },
});

export default Aprender; 