import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { NavigationProp } from "../../types/navigation";
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
} from "../../config/colors";
import { PHYSICAL_CHALLENGES, pickRandom, PhysicalChallenge } from "./sosChallenges";

const TIMER_SECONDS = 60;

/**
 * Choque Fisiológico — interrompe a taquicardia da fissura com uma
 * ação física brusca guiada por um timer de 1 minuto.
 */
const ChoqueFisiologico: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [challenge, setChallenge] = useState<PhysicalChallenge>(() =>
    pickRandom(PHYSICAL_CHALLENGES),
  );
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const start = useCallback(() => {
    setRunning(true);
    setDone(false);
    setSecondsLeft(TIMER_SECONDS);
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: TIMER_SECONDS * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          setRunning(false);
          setDone(true);
          Vibration.vibrate(500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [progress, stopTimer]);

  const reset = useCallback(
    (newChallenge: boolean) => {
      stopTimer();
      progress.stopAnimation();
      progress.setValue(0);
      setRunning(false);
      setDone(false);
      setSecondsLeft(TIMER_SECONDS);
      if (newChallenge) {
        setChallenge((current) => pickRandom(PHYSICAL_CHALLENGES, current));
      }
    },
    [progress, stopTimer],
  );

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[...BACKGROUND_GRADIENT_COLORS]}
        locations={[...BACKGROUND_GRADIENT_LOCATIONS]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="snowflake" size={44} color="#7EC8FF" />
        </View>

        <Text style={styles.instruction}>{challenge.instruction}</Text>
        <Text style={styles.detail}>{challenge.detail}</Text>

        {/* Timer */}
        <Text style={styles.timer}>
          {`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`}
        </Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>

        {done && (
          <View style={styles.doneWrap}>
            <Icon name="check-circle" size={22} color="#10B981" />
            <Text style={styles.doneText}>Corpo resetado. Você venceu essa.</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {!running ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={done ? () => navigation.goBack() : start}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={["#7456C8", "#D783D8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryText}>
                {done ? "Concluir" : "Começar agora"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => reset(false)}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Recomeçar</Text>
          </TouchableOpacity>
        )}

        {!running && !done && (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => reset(true)}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Text style={styles.linkText}>Quero outra ação</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(120,200,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  instruction: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 12,
  },
  detail: {
    fontSize: 15,
    color: "#9E96AD",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 40,
  },
  timer: {
    fontSize: 64,
    fontWeight: "300",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    marginBottom: 20,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#7EC8FF",
  },
  doneWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 999,
    overflow: "hidden",
  },
  primaryGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  linkText: {
    color: "#B8A8E8",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ChoqueFisiologico;
