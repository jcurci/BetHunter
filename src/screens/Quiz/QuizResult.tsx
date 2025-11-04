import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Container } from "../../infrastructure/di/Container";
import { NavigationProp, RouteProp, RootStackParamList } from "../../types/navigation";

const QuizResult = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { score = 0, total = 0 } = (route.params as { score: number; total: number }) || {};
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    const container = Container.getInstance();
    (async () => {
      try {
        const userUseCase = container.getUserUseCase();
        const current = await userUseCase.getCurrentUser();
        if (current?.name) setUserName(current.name);
      } catch (_) {}
    })();
  }, []);

  const passed = score / total >= 0.6; // regra simples: 60%

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.ringWrapper}>
          <LinearGradient
            colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ring}
          >
            <View style={styles.ringInner}>
              <Text style={styles.scoreLabel}>Seu Placar</Text>
              <Text style={styles.scoreValue}>{`${score}/${total}`}</Text>
            </View>
          </LinearGradient>
          <View style={styles.glow} />
        </View>

        <Text style={styles.title}>
          {passed ? "Parabéns" : "Continue praticando"}
        </Text>
        <Text style={styles.subtitle}>
          {passed
            ? `Parabéns, ${userName}! Você passou!`
            : `Boa, ${userName}! Você está no caminho certo.`}
        </Text>
      </View>

      <View style={styles.footer}>
        <LinearGradient
          colors={["#7456C8", "#8C63E6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <TouchableOpacity
            style={styles.primaryTouchable}
            onPress={() => navigation.navigate("Aprender")}
          >
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const RING_SIZE = 220;
const RING_THICKNESS = 18;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  glow: {
    position: "absolute",
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    backgroundColor: "#7456C8",
    opacity: 0.15,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: RING_THICKNESS,
  },
  ringInner: {
    flex: 1,
    backgroundColor: "#0E0D14",
    borderRadius: (RING_SIZE - RING_THICKNESS * 2) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: {
    color: "#D783D8",
    fontSize: 18,
    marginBottom: 6,
  },
  scoreValue: {
    color: "#F2C6FF",
    fontSize: 36,
    fontWeight: "800",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    color: "#A09CAB",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
  },
  primaryTouchable: {
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default QuizResult;
