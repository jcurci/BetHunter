import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LogoWithText from "../assets/logo-img/LogoImgETexto.svg";
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
} from "../config/colors";

const LOGO_ASPECT = 53 / 211;
const LOADER_COLOR = "#D783D8";

/**
 * Splash de inicialização: vetor (leve/nítido), gradiente do DS, animações com native driver.
 */
const AppLoadingScreenInner: React.FC = () => {
  const { width: screenW } = useWindowDimensions();
  const entrance = useRef(new Animated.Value(0)).current;
  const loaderPulse = useRef(new Animated.Value(0.58)).current;

  const logoW = useMemo(() => Math.min(screenW - 48, 260), [screenW]);
  const logoH = logoW * LOGO_ASPECT;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loaderPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(loaderPulse, {
          toValue: 0.58,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [entrance, loaderPulse]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <LinearGradient
      colors={[...BACKGROUND_GRADIENT_COLORS]}
      locations={[...BACKGROUND_GRADIENT_LOCATIONS]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando o BetHunter"
    >
      <Animated.View
        style={[
          styles.inner,
          {
            opacity: entrance,
            transform: [{ translateY }],
          },
        ]}
      >
        <LogoWithText width={logoW} height={logoH} accessibilityLabel="BetHunter" />
        <Text style={styles.tagline}>Preparando sua jornada</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Educação financeira com propósito.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.loaderWrap, { opacity: loaderPulse }]}>
        <ActivityIndicator size="large" color={LOADER_COLOR} />
      </Animated.View>
    </LinearGradient>
  );
};

export const AppLoadingScreen = memo(AppLoadingScreenInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  inner: {
    alignItems: "center",
    maxWidth: 360,
  },
  tagline: {
    marginTop: 26,
    fontSize: 17,
    fontWeight: "700",
    color: "#F2EFF7",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#9E96AD",
    textAlign: "center",
  },
  loaderWrap: {
    position: "absolute",
    bottom: 52,
  },
});
