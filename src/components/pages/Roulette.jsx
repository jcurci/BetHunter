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
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import Svg, {
  Path,
  Text as SvgText,
  G,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  DropShadow,
} from "react-native-svg";
import Footer from "../comum/Footer";
import { Container } from "../../infrastructure/di/Container";
import { RouletteSector } from "../../domain/entities/Roulette";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedView = Animated.createAnimatedComponent(View);

const WHEEL_SIZE = Math.min(Dimensions.get("window").width, 450) * 0.9;
const RADIUS = WHEEL_SIZE / 2;
const CENTER_X = RADIUS;
const CENTER_Y = RADIUS;

const SPIN_COST = 10;

const Roulette = () => {
  const navigation = useNavigation();
  const [sectors, setSectors] = useState([]);
  const [user, setUser] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastWinnings, setLastWinnings] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const neonAnim = useRef(new Animated.Value(0)).current;
  const [spinValue, setSpinValue] = useState(0);
  const container = Container.getInstance();

  useEffect(() => {
    loadData();
    startGlowAnimation();
  }, []);

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const loadData = async () => {
    try {
      const rouletteUseCase = container.getRouletteUseCase();
      const userUseCase = container.getUserUseCase();

      const [sectorsData, currentUser] = await Promise.all([
        rouletteUseCase.getSectors(),
        userUseCase.getCurrentUser(),
      ]);

      setSectors(sectorsData);
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const spinWheel = async () => {
    console.log("SpinWheel called, spinning:", spinning);
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

    // Start neon effect during spin
    Animated.loop(
      Animated.sequence([
        Animated.timing(neonAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(neonAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ])
    ).start();

    try {
      const rouletteUseCase = container.getRouletteUseCase();
      const userUseCase = container.getUserUseCase();

      const game = await rouletteUseCase.playGame(
        user?.id || "test-user",
        SPIN_COST
      );

      // Para fase de teste, apenas simular
      if (user) {
        const updatedUser = await userUseCase.updateUserPoints(
          user.id,
          Math.max(0, user.points - SPIN_COST + game.result.pointsWon)
        );
        setUser(updatedUser);
      }

      setResult(game.result.sector.label);
      setLastWinnings(game.result.pointsWon);

      // Animate the wheel with elastic easing
      const randomSector = game.result.sector;
      const sectorIndex = sectors.findIndex((s) => s.id === randomSector.id);
      const SECTOR_ANGLE = 360 / sectors.length;
      const turns = 5 + Math.random() * 3; // Random extra turns
      const finalAngle =
        360 * turns + (360 - sectorIndex * SECTOR_ANGLE - SECTOR_ANGLE / 2);

      Animated.timing(spinAnim, {
        toValue: spinValue + finalAngle,
        duration: 3000,
        useNativeDriver: true,
        easing: (t) => {
          // Elastic easing for more realistic deceleration
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

        // Stop neon effect
        neonAnim.stopAnimation();
        neonAnim.setValue(0);

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

  const createSectorPath = (startAngle, endAngle) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = CENTER_X + RADIUS * Math.cos(startRad);
    const y1 = CENTER_Y + RADIUS * Math.sin(startRad);
    const x2 = CENTER_X + RADIUS * Math.cos(endRad);
    const y2 = CENTER_Y + RADIUS * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${CENTER_X} ${CENTER_Y} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getSectorTextPosition = (sectorIndex) => {
    const SECTOR_ANGLE = 360 / sectors.length;
    const angle = sectorIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2;
    const rad = (angle * Math.PI) / 180;
    const textRadius = RADIUS * 0.7;

    return {
      x: CENTER_X + textRadius * Math.cos(rad),
      y: CENTER_Y + textRadius * Math.sin(rad),
    };
  };

  const renderSectors = () => {
    if (!sectors.length) return null;

    const SECTOR_ANGLE = 360 / sectors.length;

    return (
      <>
        <Defs>
          {sectors.map((sector, index) => (
            <LinearGradient
              key={`gradient-${sector.id}`}
              id={`gradient-${sector.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={sector.color} stopOpacity="1" />
              <Stop offset="100%" stopColor={sector.color} stopOpacity="0.7" />
            </LinearGradient>
          ))}
        </Defs>
        {sectors.map((sector, index) => {
          const startAngle = index * SECTOR_ANGLE;
          const endAngle = (index + 1) * SECTOR_ANGLE;
          const textPos = getSectorTextPosition(index);

          return (
            <G key={sector.id}>
              <Path
                d={createSectorPath(startAngle, endAngle)}
                fill={`url(#gradient-${sector.id})`}
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeOpacity="0.2"
              />
              <SvgText
                x={textPos.x}
                y={textPos.y - 8}
                fontSize="12"
                fontWeight="bold"
                fill="#FFFFFF"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {sector.label}
              </SvgText>
              <SvgText
                x={textPos.x}
                y={textPos.y + 8}
                fontSize="10"
                fontWeight="bold"
                fill="#FFD700"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {sector.points} pts
              </SvgText>
            </G>
          );
        })}
      </>
    );
  };

  const pointsInfo = user
    ? `Você possui ${user.points} pontos. Modo teste: giros liberados!`
    : "Modo teste: giros liberados!";
  const spinButtonDisabled = spinning;

  // Animated rotation for the wheel
  const animatedRotate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎰 Gire a Roleta!</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsCardContent}>
          <Icon name="diamond-stone" size={24} color="#FFD700" />
          <Text style={styles.pointsValue}>{user?.points || 0}</Text>
          <Text style={styles.pointsLabel}>pontos</Text>
        </View>
        <Text style={styles.spinCostText}>
          🎮 MODO TESTE - Giros ilimitados para testar!
        </Text>
      </View>

      {/* Roulette Wheel Container */}
      <View style={styles.wheelSection}>
        <View style={styles.wheelWrapper}>
          <AnimatedView
            style={[
              styles.wheelContainer,
              {
                transform: [{ scale: bounceAnim }],
                shadowColor: spinning
                  ? neonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#FF0080", "#00FF80"],
                    })
                  : glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#6B21A8", "#8B5CF6"],
                    }),
                shadowOpacity: spinning
                  ? neonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  : glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                shadowRadius: spinning
                  ? neonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 40],
                    })
                  : glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 25],
                    }),
                borderWidth: spinning ? 4 : 2,
                borderColor: spinning
                  ? neonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#FF0080", "#00FF80"],
                    })
                  : "#8B5CF6",
              },
            ]}
          >
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
              <Defs>
                <LinearGradient
                  id="wheelShadow"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor="#000000" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
                </LinearGradient>
              </Defs>

              {/* Wheel Shadow */}
              <Circle
                cx={CENTER_X + 5}
                cy={CENTER_Y + 5}
                r={RADIUS}
                fill="url(#wheelShadow)"
              />

              <AnimatedG
                originX={CENTER_X}
                originY={CENTER_Y}
                style={{
                  transform: [{ rotate: animatedRotate }],
                }}
              >
                {renderSectors()}

                {/* Center Hub */}
                <Circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={RADIUS * 0.2}
                  fill="#FFFFFF"
                  stroke="#333"
                  strokeWidth="3"
                />
                <SvgText
                  x={CENTER_X}
                  y={CENTER_Y}
                  fontSize="16"
                  fontWeight="bold"
                  fill="#333"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  GIRAR
                </SvgText>
              </AnimatedG>

              {/* Pointer */}
              <Path
                d={`M ${CENTER_X} ${CENTER_Y - RADIUS - 10} L ${CENTER_X - 8} ${
                  CENTER_Y - RADIUS + 8
                } L ${CENTER_X + 8} ${CENTER_Y - RADIUS + 8} Z`}
                fill="#333333"
                stroke="#000000"
                strokeWidth="1"
              />
            </Svg>
          </AnimatedView>

          {/* Central Spin Button - Invisible overlay on wheel center */}
          <TouchableOpacity
            style={styles.centerButton}
            onPress={spinWheel}
            disabled={spinButtonDisabled}
            activeOpacity={0.8}
          />
        </View>
      </View>

      {/* Spin Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {spinning
            ? "🎰 Girando..."
            : "👆 Toque no centro da roleta para girar"}
        </Text>

        {/* Botão de backup para girar */}
        <TouchableOpacity
          style={[
            styles.backupSpinButton,
            spinButtonDisabled && styles.disabledBackupButton,
          ]}
          onPress={spinWheel}
          disabled={spinButtonDisabled}
        >
          <Text style={styles.backupSpinButtonText}>
            {spinning ? "🎰 Girando..." : "🎯 GIRAR ROLETA"}
          </Text>
        </TouchableOpacity>
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
            <Icon name="star" size={60} color="#FFD700" />
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  closeButton: {
    backgroundColor: "#1C1C1C",
    borderRadius: 20,
    padding: 8,
  },
  pointsCard: {
    backgroundColor: "#1C1C1C",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8B5CF6",
    elevation: 5,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pointsCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginHorizontal: 10,
  },
  pointsLabel: {
    fontSize: 16,
    color: "#A0A0A0",
    fontWeight: "600",
  },
  spinCostText: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
  },
  wheelSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  wheelWrapper: {
    position: "relative",
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  wheelContainer: {
    borderRadius: WHEEL_SIZE / 2,
    elevation: 10,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  centerButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: RADIUS * 0.5,
    height: RADIUS * 0.5,
    borderRadius: (RADIUS * 0.5) / 2,
    marginTop: -(RADIUS * 0.25),
    marginLeft: -(RADIUS * 0.25),
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Levemente visível para debug
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  instructionsText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 15,
  },
  backupSpinButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  disabledBackupButton: {
    backgroundColor: "#555",
    shadowOpacity: 0.2,
  },
  backupSpinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
