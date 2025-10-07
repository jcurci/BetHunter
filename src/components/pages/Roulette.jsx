import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Modal,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Footer from "../comum/Footer";
import { Container } from "../../infrastructure/di/Container";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Diâmetro muito maior que a largura para "grudar" nas laterais e criar efeito imersivo
const WHEEL_SIZE = Math.min(SCREEN_WIDTH * 1.6, 800);
const SPIN_COST = 10;

const Roulette = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastWinnings, setLastWinnings] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const [spinValue, setSpinValue] = useState(0);
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

  const spinWheel = async () => {
    console.log("spinWheel called, spinning:", spinning);
    if (spinning) return;

    setSpinning(true);
    console.log("Starting spin animation");

    // Button bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const rouletteUseCase = container.getRouletteUseCase();
      const userUseCase = container.getUserUseCase();

      const game = await rouletteUseCase.playGame(
        user?.id || "test-user",
        SPIN_COST
      );

      // Simular resultado para teste
      const mockResults = [
        { label: "Vitória!", points: 50 },
        { label: "Prêmio!", points: 30 },
        { label: "Bônus!", points: 20 },
        { label: "Sorte!", points: 10 },
      ];

      const randomResult =
        mockResults[Math.floor(Math.random() * mockResults.length)];
      setResult(randomResult.label);
      setLastWinnings(randomResult.points);

      // Atualizar pontos do usuário
      if (user) {
        const updatedUser = await userUseCase.updateUserPoints(
          user.id,
          Math.max(0, user.points - SPIN_COST + randomResult.points)
        );
        setUser(updatedUser);
      }

      // Animate the wheel - sempre para um pouco antes
      const turns = 5; // Número fixo de voltas
      const targetAngle = -30; // Sempre para 30 graus antes da posição inicial
      const totalRotation = 360 * turns + targetAngle;

      Animated.timing(spinAnim, {
        toValue: spinValue + totalRotation,
        duration: 3000,
        useNativeDriver: true,
        easing: (t) => {
          if (t < 0.7) {
            return t * t;
          } else {
            const f = t - 0.7;
            return 0.49 + 0.51 * (1 - Math.pow(2, (-10 * f) / 0.3));
          }
        },
      }).start(() => {
        setSpinValue(spinValue + totalRotation);
        setSpinning(false);

        // Show result modal after a short delay
        setTimeout(() => {
          setShowResultModal(true);
        }, 500);
      });
    } catch (error) {
      console.error("Error spinning wheel:", error);
      setSpinning(false);
    }
  };

  // Animated rotation for the wheel
  const animatedRotate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gire a roleta!</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Points Info */}
      <View style={styles.pointsInfo}>
        <Text style={styles.pointsInfoText}>
          Você possui {user?.points || 47} pontos. Você pode gastar 10 pontos
          para girar a roleta.
        </Text>
      </View>

      {/* Spin Button */}
      <View style={styles.spinButtonContainer}>
        <TouchableOpacity
          style={[styles.spinButton, spinning && styles.disabledSpinButton]}
          onPress={spinWheel}
          disabled={spinning}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? "🎰 Girando..." : "Girar!"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Roulette Wheel Container */}
      <View style={styles.wheelSection}>
        {/* Wheel */}
        <View style={styles.wheelWrapper}>
          {/* Glow/Shadow elíptica para efeito 3D na base */}
          <View style={styles.wheelGlow} />
          {/* Pointer/Indicator */}
          <View style={styles.pointerContainer}>
            <Image
              source={require("../../assets/roleta_pointer.png")}
              style={styles.pointerImage}
              resizeMode="contain"
            />
          </View>
          <Animated.View
            style={[
              styles.wheelContainer,
              {
                transform: [{ scale: bounceAnim }, { rotate: animatedRotate }],
              },
            ]}
          >
            <Image
              source={require("../../assets/roleta_circulo.png")}
              style={styles.wheelImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Logo fixa no centro, não gira com a roleta */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/roleta_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Central Spin Button - Invisible overlay on wheel center */}
          <TouchableOpacity
            style={styles.centerButton}
            onPress={spinWheel}
            disabled={spinning}
            activeOpacity={0.8}
          />
        </View>
      </View>

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModal}>
            <Text style={styles.resultTitle}>🎉 Parabéns!</Text>
            <Text style={styles.resultText}>Você ganhou:</Text>
            <Text style={styles.resultPoints}>{lastWinnings} pontos</Text>
            <Text style={styles.resultSector}>{result}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowResultModal(false)}
            >
              <Text style={styles.modalButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "left",
    marginTop: 15,
    flex: 1,
  },
  closeButton: {
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  pointsInfo: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    marginTop: -5,
  },
  pointsInfoText: {
    fontSize: 15,
    color: "#A09CAB",
    textAlign: "left",
    marginRight: 40,
    lineHeight: 24,
  },
  spinButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 30,
  },
  spinButton: {
    backgroundColor: "#6B21A8",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#FFD700",
    elevation: 5,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  disabledSpinButton: {
    backgroundColor: "#555",
    borderColor: "#888",
    shadowOpacity: 0.3,
  },
  spinButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  wheelSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 0,
  },
  pointerContainer: {
    position: "absolute",
    // Posiciona exatamente no topo da roleta, centralizado horizontalmente
    top: WHEEL_SIZE * 0.134,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  pointerImage: {
    width: WHEEL_SIZE * 0.11,
    height: WHEEL_SIZE * 0.11,
  },
  wheelWrapper: {
    position: "relative",
    width: Math.max(WHEEL_SIZE, SCREEN_WIDTH * 1.3),
    height: WHEEL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    // avança mais a roleta para baixo para dar sensação 3D mais pronunciada
    marginBottom: -WHEEL_SIZE * 0.12,
  },
  wheelGlow: {
    position: "absolute",
    bottom: -WHEEL_SIZE * 0.15,
    width: Math.max(WHEEL_SIZE, SCREEN_WIDTH * 1.4),
    height: WHEEL_SIZE * 0.3,
    borderRadius: WHEEL_SIZE * 0.3,
    backgroundColor: "#8B5CF6",
    opacity: 0.6,
    filter: undefined,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 50,
    zIndex: 0,
  },
  wheelContainer: {
    width: Math.max(WHEEL_SIZE, SCREEN_WIDTH * 1.3),
    height: WHEEL_SIZE,
    borderRadius: Math.max(WHEEL_SIZE, SCREEN_WIDTH * 1.3) / 2,
    elevation: 10,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  wheelImage: {
    width: "100%",
    height: "100%",
    borderRadius: Math.max(WHEEL_SIZE, SCREEN_WIDTH * 1.3) / 2,
  },
  logoContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: WHEEL_SIZE * 0.05,
    height: WHEEL_SIZE * 0.05,
    marginTop: -(WHEEL_SIZE * 0.025),
    marginLeft: -(WHEEL_SIZE * 0.025),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  centerButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: WHEEL_SIZE * 0.18,
    height: WHEEL_SIZE * 0.18,
    borderRadius: (WHEEL_SIZE * 0.18) / 2,
    marginTop: -(WHEEL_SIZE * 0.09),
    marginLeft: -(WHEEL_SIZE * 0.09),
    zIndex: 15,
    backgroundColor: "transparent",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultModal: {
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    marginHorizontal: 40,
    borderWidth: 2,
    borderColor: "#8B5CF6",
    elevation: 10,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginVertical: 15,
  },
  resultText: {
    fontSize: 18,
    color: "#A0A0A0",
    marginBottom: 10,
  },
  resultPoints: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
  },
  resultSector: {
    fontSize: 20,
    color: "#8B5CF6",
    fontWeight: "600",
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Roulette;
