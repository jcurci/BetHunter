import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Entypo";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Text as SvgText, G, Circle } from "react-native-svg";
import Footer from "../components/Footer";
import { Container } from "../../infrastructure/di/Container";
import { RouletteSector } from "../../domain/entities/Roulette";

const AnimatedG = Animated.createAnimatedComponent(G);

const WHEEL_SIZE = Math.min(Dimensions.get("window").width, 430) * 0.8;
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
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [spinValue, setSpinValue] = useState(0);
  const container = Container.getInstance();

  useEffect(() => {
    loadData();
  }, []);

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
      console.error('Error loading data:', error);
    }
  };

  const spinWheel = async () => {
    if (spinning || !user || user.points < SPIN_COST) return;
    
    setSpinning(true);
    
    try {
      const rouletteUseCase = container.getRouletteUseCase();
      const userUseCase = container.getUserUseCase();
      
      const game = await rouletteUseCase.playGame(user.id, SPIN_COST);
      const updatedUser = await userUseCase.updateUserPoints(user.id, user.points - SPIN_COST + game.result.pointsWon);
      
      setUser(updatedUser);
      setResult(game.result.sector.label);
      
      // Animate the wheel
      const randomSector = game.result.sector;
      const sectorIndex = sectors.findIndex(s => s.id === randomSector.id);
      const SECTOR_ANGLE = 360 / sectors.length;
      const turns = 5;
      const finalAngle = 360 * turns + (360 - sectorIndex * SECTOR_ANGLE - SECTOR_ANGLE / 2);
      
      Animated.timing(spinAnim, {
        toValue: spinValue + finalAngle,
        duration: 2500,
        useNativeDriver: true,
        easing: (t) => t,
      }).start(() => {
        setSpinValue(spinValue + finalAngle);
        setSpinning(false);
      });
    } catch (error) {
      console.error('Error spinning wheel:', error);
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
    
    return sectors.map((sector, index) => {
      const startAngle = index * SECTOR_ANGLE;
      const endAngle = (index + 1) * SECTOR_ANGLE;
      const textPos = getSectorTextPosition(index);
      
      return (
        <G key={sector.id}>
          <Path
            d={createSectorPath(startAngle, endAngle)}
            fill={sector.color}
            stroke="#000"
            strokeWidth="2"
          />
          <SvgText
            x={textPos.x}
            y={textPos.y}
            fontSize="14"
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {sector.label}
          </SvgText>
        </G>
      );
    });
  };

  const pointsInfo = user ? `Você possui ${user.points} pontos. Você pode gastar ${SPIN_COST} pontos para girar a roleta.` : "Carregando...";
  const spinButtonDisabled = spinning || !user || user.points < SPIN_COST;

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="cross" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Points Info */}
      <Text style={styles.pointsInfo}>{pointsInfo}</Text>

      {/* Spin Button */}
      <View style={styles.spinButtonContainer}>
        <TouchableOpacity
          style={[styles.spinButton, spinButtonDisabled && styles.disabledButton]}
          onPress={spinWheel}
          disabled={spinButtonDisabled}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? 'Girando...' : 'Girar!'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Roulette Wheel */}
      <View style={styles.wheelContainer}>
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
          <AnimatedG
            originX={CENTER_X}
            originY={CENTER_Y}
            style={{
              transform: [{ rotate: animatedRotate }],
            }}
          >
            {renderSectors()}
            <Circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={RADIUS * 0.1}
              fill="#FFFFFF"
              stroke="#000"
              strokeWidth="2"
            />
          </AnimatedG>
          {/* Pointer */}
          <Path
            d={`M ${CENTER_X} ${CENTER_Y - RADIUS - 10} L ${CENTER_X - 10} ${CENTER_Y - RADIUS + 10} L ${CENTER_X + 10} ${CENTER_Y - RADIUS + 10} Z`}
            fill="#FF8C43"
            stroke="#000"
            strokeWidth="1"
          />
        </Svg>
      </View>

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
  pointsInfo: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  spinButtonContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  spinButton: {
    backgroundColor: "#7456C8",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#FF8C43",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
  spinButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  wheelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
  },
});

export default Roulette;
