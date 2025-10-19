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
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from "react-native-svg";
import { RootStackParamList } from "../../types/navigation";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Diâmetro muito maior que a largura para "grudar" nas laterais e criar efeito imersivo
const WHEEL_SIZE = Math.min(SCREEN_WIDTH * 1.6, 800);
const SPIN_COST = 10;

interface RouletteResult {
  label: string;
  points: number;
}

const Roulette: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [lastWinnings, setLastWinnings] = useState<number>(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const [spinValue, setSpinValue] = useState<number>(0);
  const container = Container.getInstance();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      const userUseCase = container.getUserUseCase();
      const currentUser = await userUseCase.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const spinWheel = async (): Promise<void> => {
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
      const mockResults: RouletteResult[] = [
        { label: "Investeback", points: 10 },
        { label: "Investeback", points: 10 },
        { label: "Investeback", points: 10 },
        { label: "Investeback", points: 10 },
      ];

      const randomResult =
        mockResults[Math.floor(Math.random() * mockResults.length)];
      setResult(randomResult.label);
      setLastWinnings(randomResult.points);

      // Atualizar pontos do usuário - sempre subtrai 10 pontos
      if (user) {
        const updatedUser = await userUseCase.updateUserPoints(
          user.id,
          Math.max(0, user.points - SPIN_COST)
        );
        setUser(updatedUser);
      }

      // Animate the wheel - sempre para no mesmo lugar que iniciou
      const turns = 5; // Número fixo de voltas
      const targetAngle = 0; // Sempre para no ângulo inicial (posição original)
      const finalAngle = 360 * turns + targetAngle;

      Animated.timing(spinAnim, {
        toValue: spinValue + finalAngle,
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
        setSpinValue(spinValue + finalAngle);
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

            {/* Logo no centro da roleta */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/roleta_logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

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
            {/* Treasure Chest Illustration */}
            <View style={styles.illustrationContainer}>
              <Svg width="250" height="180" viewBox="0 0 250 180">
                <Defs>
                  <LinearGradient
                    id="chestGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor="#FFD700" />
                    <Stop offset="100%" stopColor="#FFA500" />
                  </LinearGradient>
                  <LinearGradient
                    id="coinGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor="#FFD700" />
                    <Stop offset="100%" stopColor="#B8860B" />
                  </LinearGradient>
                </Defs>

                {/* Treasure Chest */}
                <Path
                  d="M100 70 L150 70 L150 110 L125 130 L100 110 Z"
                  fill="url(#chestGradient)"
                  stroke="#8B4513"
                  strokeWidth="4"
                />

                {/* Chest Lid */}
                <Path
                  d="M95 70 L155 70 L150 50 L100 50 Z"
                  fill="url(#chestGradient)"
                  stroke="#8B4513"
                  strokeWidth="4"
                />

                {/* Chest Lock */}
                <Circle cx="125" cy="60" r="6" fill="#8B4513" />
                <Path
                  d="M125 54 L125 66"
                  stroke="#654321"
                  strokeWidth="2"
                />

                {/* Coins inside chest */}
                <Circle cx="115" cy="90" r="8" fill="url(#coinGradient)" />
                <Circle cx="135" cy="90" r="8" fill="url(#coinGradient)" />
                <Circle cx="125" cy="100" r="8" fill="url(#coinGradient)" />
                <Circle cx="110" cy="100" r="6" fill="url(#coinGradient)" />
                <Circle cx="140" cy="100" r="6" fill="url(#coinGradient)" />
                <Circle cx="120" cy="105" r="6" fill="url(#coinGradient)" />
                <Circle cx="130" cy="105" r="6" fill="url(#coinGradient)" />

                {/* Floating Coins */}
                <Circle cx="75" cy="55" r="7" fill="url(#coinGradient)" />
                <Circle cx="175" cy="55" r="7" fill="url(#coinGradient)" />
                <Circle cx="60" cy="90" r="6" fill="url(#coinGradient)" />
                <Circle cx="190" cy="90" r="6" fill="url(#coinGradient)" />
                <Circle cx="80" cy="120" r="6" fill="url(#coinGradient)" />
                <Circle cx="170" cy="120" r="6" fill="url(#coinGradient)" />
                <Circle cx="70" cy="110" r="5" fill="url(#coinGradient)" />
                <Circle cx="180" cy="110" r="5" fill="url(#coinGradient)" />

                {/* Stars */}
                <Path
                  d="M50 35 L54 45 L64 45 L56 52 L60 62 L50 55 L40 62 L44 52 L36 45 L46 45 Z"
                  fill="#FFD700"
                />
                <Path
                  d="M200 40 L203 48 L211 48 L205 54 L208 62 L200 56 L192 62 L195 54 L189 48 L197 48 Z"
                  fill="#FFD700"
                />
                <Path
                  d="M30 80 L33 88 L41 88 L35 94 L38 102 L30 96 L22 102 L25 94 L19 88 L27 88 Z"
                  fill="#FFD700"
                />
                <Path
                  d="M220 90 L223 98 L231 98 L225 104 L228 112 L220 106 L212 112 L215 104 L209 98 L217 98 Z"
                  fill="#FFD700"
                />
                <Path
                  d="M45 140 L48 148 L56 148 L50 154 L53 162 L45 156 L37 162 L40 154 L34 148 L42 148 Z"
                  fill="#FFD700"
                />
                <Path
                  d="M205 150 L208 158 L216 158 L210 164 L213 172 L205 166 L197 172 L200 164 L194 158 L202 158 Z"
                  fill="#FFD700"
                />
              </Svg>
            </View>

            <Text style={styles.resultTitle}>Você ganhou 10 $BET</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowResultModal(false)}
            >
              <Text style={styles.modalButtonText}>Coletar</Text>
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
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
    paddingVertical: 15,
  },
  pointsInfoText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
  },
  spinButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
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
  wheelGlow: {
    position: "absolute",
    bottom: -WHEEL_SIZE * 0.15,
    width: Math.max(WHEEL_SIZE, SCREEN_WIDTH * 1.4),
    height: WHEEL_SIZE * 0.3,
    borderRadius: WHEEL_SIZE * 0.3,
    backgroundColor: "#8B5CF6",
    opacity: 0.6,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 50,
    zIndex: 0,
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
    backgroundColor: "#8B5CF6",
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
  illustrationContainer: {
    marginBottom: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 25,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#FF8071",
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#FF8071",
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
