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
import Footer from "../comum/Footer";
import { Container } from "../../infrastructure/di/Container";

import MaskedView from "@react-native-masked-view/masked-view";

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
      console.error("Error loading user data:", error);
    }
  };

  const learningModules = [
    {
      id: 1,
      title: "Fundamentos",
      progress: "1/4",
      percentage: 25,
      gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
      hasProgress: true,
    },
    {
      id: 2,
      title: "Prática com Dinheiro",
      progress: "0/10",
      percentage: 0,
      gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
      hasProgress: false,
    },
    {
      id: 3,
      title: "Conhecimento Aplicado",
      progress: "0/15",
      percentage: 0,
      gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
      hasProgress: false,
    },
    {
      id: 4,
      title: "Objetivos e Planejamento",
      progress: "0/8",
      percentage: 0,
      gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
      hasProgress: false,
    },
    { 
      id: 5,
      title: "Investimentos de Baixo Risco",
      progress: "0/30",
      percentage: 0,
      gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
      hasProgress: false,
    },
    {
      id: 6,
      title: "Investimentos de Alto Risco",
      progress: "0/44",
      percentage: 0,
      gradientColors: ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"],
      hasProgress: false,
    },
  ];

  const renderProgressBar = (percentage, hasProgress, gradientColors) => {
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

  const renderModuleCard = (module) => (
    <TouchableOpacity key={module.id} style={styles.moduleCard}>
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
      <ScrollView style={styles.scrollView}>
        {/* Header */}

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
              borderRadius: 2,
              marginBottom: 20,
              position: "absolute",
              opacity: 0.25,
              top: -27,
              left: 0,
              right: 0,
              borderRadius: 5,
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
    borderRadius: 5,
    marginRight: 10,
    width: "100%",
    borderRadius: 20,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 50,
    backgroundColor: "#1A1923",
    borderRadius: 5,
    marginRight: 10,
    width: "100%",
    borderRadius: 20,
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
});

export default Aprender;
