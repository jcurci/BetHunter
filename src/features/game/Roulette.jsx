import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Entypo";
import { useNavigation } from "@react-navigation/native";

const SECTORS = [
  { label: "10 pts", color: "#FFD93D" }, // Amarelo
  { label: "20 pts", color: "#FF8C43" }, // Laranja
  { label: "30 pts", color: "#A66CFF" }, // Lilás
  { label: "40 pts", color: "#4D2C91" }, // Roxo escuro
  { label: "50 pts", color: "#FF6B6B" }, // Rosa
  { label: "0 pts", color: "#6C3DD1" }, // Roxo médio
];
const SECTOR_ANGLE = 360 / SECTORS.length;
const WHEEL_SIZE = Math.min(Dimensions.get("window").width, 430) * 0.48;

const INITIAL_POINTS = 47;
const SPIN_COST = 10;

const Roulette = () => {
  const navigation = useNavigation();
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [spinValue, setSpinValue] = useState(0);

  const spinWheel = () => {
    if (spinning || points < SPIN_COST) return;
    setSpinning(true);
    setPoints(points - SPIN_COST);
    const randomSector = Math.floor(Math.random() * SECTORS.length);
    const turns = 5;
    const finalAngle =
      360 * turns + (360 - randomSector * SECTOR_ANGLE - SECTOR_ANGLE / 2);
    Animated.timing(spinAnim, {
      toValue: spinValue + finalAngle,
      duration: 2500,
      useNativeDriver: true,
      easing: (t) => t,
    }).start(() => {
      setSpinValue(spinValue + finalAngle);
      setResult(SECTORS[randomSector].label);
      setSpinning(false);
    });
  };

  const renderSectors = () => {
    return SECTORS.map((sector, i) => {
      const rotate = i * SECTOR_ANGLE;
      return (
        <View
          key={i}
          style={[
            styles.sector,
            {
              backgroundColor: sector.color,
              transform: [
                { rotate: `${rotate}deg` },
                { translateY: -WHEEL_SIZE / 4 },
              ],
            },
          ]}
        >
          <Text style={styles.sectorLabel}>{sector.label}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={{ color: "#A66CFF" }}>Gire a </Text>
          <Text style={{ color: "#FFD93D" }}>roleta!</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="cross" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.pointsInfo}>
        Você possui {points} pontos. Você pode gastar {SPIN_COST} pontos para
        girar a roleta.
      </Text>
      <View style={styles.wheelContainer}>
        <Animated.View
          style={{
            width: WHEEL_SIZE,
            height: WHEEL_SIZE,
            borderRadius: WHEEL_SIZE / 2,
            overflow: "hidden",
            backgroundColor: "#22223B",
            transform: [
              {
                rotate: spinAnim.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <View style={styles.sectorsWrapper}>{renderSectors()}</View>
        </Animated.View>
        <View style={styles.pointer} />
      </View>
      <TouchableOpacity
        style={[
          styles.spinButton,
          spinning || points < SPIN_COST ? { opacity: 0.5 } : {},
        ]}
        onPress={spinWheel}
        disabled={spinning || points < SPIN_COST}
      >
        <Text style={styles.spinButtonText}>Girar!</Text>
      </TouchableOpacity>
      {result && <Text style={styles.resultText}>Você ganhou: {result}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18122B",
    padding: 0,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 6,
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  pointsInfo: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "left",
    width: "100%",
    paddingHorizontal: 18,
  },
  wheelContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    width: "100%",
  },
  sectorsWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sector: {
    position: "absolute",
    width: "50%",
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    left: "25%",
    top: 0,
  },
  sectorLabel: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pointer: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: "#FFD93D",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 2,
    elevation: 2,
  },
  spinButton: {
    marginTop: 12,
    backgroundColor: "#A66CFF",
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: "#FFD93D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    alignSelf: "center",
  },
  spinButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  resultText: {
    marginTop: 12,
    color: "#FFD93D",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Roulette;
