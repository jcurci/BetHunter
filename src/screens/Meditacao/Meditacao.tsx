import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import Icon from "react-native-vector-icons/Feather";
import { BackIconButton } from "../../components";
import { NavigationProp } from "../../types/navigation";
<<<<<<< HEAD
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
} from "../../config/colors";
=======
>>>>>>> 4676db33 (tela de meditacao)

// Meditation audio (local file)
const MEDITATION_AUDIO = require("./mixkit-relaxation-2-253.mp3");

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CIRCLE_SIZE = SCREEN_WIDTH * 0.7;

<<<<<<< HEAD
=======
// Background gradient
const BACKGROUND_GRADIENT_COLORS = ["#443570", "#443045", "#2F2229", "#0F0E11", "#000000"] as const;
const BACKGROUND_GRADIENT_LOCATIONS = [0, 0.15, 0.32, 0.62, 1] as const;

>>>>>>> 4676db33 (tela de meditacao)
// Morphism color palette - limited, soft, organic
const CIRCLE_OUTER_COLORS = ["#7B5BAF", "#9B6BB8", "#C87BA0", "#E08B8B"] as const;
const CIRCLE_INNER_COLORS = ["#A890D0", "#C4A0D8", "#D8B0C8", "#E8C0B8", "#F0D0C0"] as const;

const Meditacao: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [selectedDuration] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(5 * 60);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // === MORPHISM ANIMATION VALUES ===
  // All animations use extremely long durations (30s - 120s) to avoid perceptible loops
  
  // Subtle breathing - almost imperceptible scale change
  const breatheAnim = useRef(new Animated.Value(1)).current;
  
  // Outer glow - soft pulsing
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  
  // === MORPH LAYERS - 3 layers at different speeds ===
  // Layer 1 (deepest) - slowest movement (60-90s)
  const morphLayer1X = useRef(new Animated.Value(0)).current;
  const morphLayer1Y = useRef(new Animated.Value(0)).current;
  const morphLayer1Scale = useRef(new Animated.Value(1)).current;
  const morphLayer1Opacity = useRef(new Animated.Value(0.3)).current;
  
  // Layer 2 (middle) - medium movement (45-60s)
  const morphLayer2X = useRef(new Animated.Value(0)).current;
  const morphLayer2Y = useRef(new Animated.Value(0)).current;
  const morphLayer2Scale = useRef(new Animated.Value(0.9)).current;
  const morphLayer2Opacity = useRef(new Animated.Value(0.25)).current;
  
  // Layer 3 (front) - slower than expected (30-50s)
  const morphLayer3X = useRef(new Animated.Value(0)).current;
  const morphLayer3Y = useRef(new Animated.Value(0)).current;
  const morphLayer3Scale = useRef(new Animated.Value(0.8)).current;
  const morphLayer3Opacity = useRef(new Animated.Value(0.2)).current;
  
  // Soft edge blur simulation
  const softEdge1 = useRef(new Animated.Value(0)).current;
  const softEdge2 = useRef(new Animated.Value(0)).current;
  
  // Asymmetric deformation - no center-based symmetry
  const asymX = useRef(new Animated.Value(0)).current;
  const asymY = useRef(new Animated.Value(0)).current;

  // Load audio
  useEffect(() => {
    loadAudio();
    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        MEDITATION_AUDIO,
        { isLooping: true, volume: 0.4 }
      );
      setSound(newSound);
      setIsAudioLoaded(true);
    } catch (error) {
      console.log("Error loading audio:", error);
    }
  };

  useEffect(() => {
    if (sound && isAudioLoaded) {
      if (isPlaying && !isMuted) {
        sound.playAsync();
      } else {
        sound.pauseAsync();
      }
    }
  }, [isPlaying, isMuted, sound, isAudioLoaded]);

  // Timer
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setSessionComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMute = () => setIsMuted(!isMuted);
  
  const handleReset = () => {
    setIsPlaying(false);
    setTimeRemaining(selectedDuration * 60);
    setSessionComplete(false);
  };

  // === MORPHISM ANIMATIONS ===
  
  // Breathing - extremely subtle (1.5% variation over 13.5s)
  const startBreathingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.008,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0.993,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Glow - very slow variation
  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.65,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 9500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 7500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // === MORPH LAYER 1 - Deepest, slowest (60-90s cycles) ===
  const startMorphLayer1 = () => {
    // X movement - asymmetric, not centered
    Animated.loop(
      Animated.sequence([
        Animated.timing(morphLayer1X, {
          toValue: 1,
          duration: 67000, // ~67s - prime number to avoid sync
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(morphLayer1X, {
          toValue: 0,
          duration: 73000, // ~73s
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Y movement - different timing
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer1Y, {
            toValue: 1,
            duration: 83000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer1Y, {
            toValue: 0,
            duration: 71000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 5000);

    // Scale breathing
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer1Scale, {
            toValue: 1.15,
            duration: 45000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer1Scale, {
            toValue: 0.9,
            duration: 52000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 8000);

    // Opacity fade
    Animated.loop(
      Animated.sequence([
        Animated.timing(morphLayer1Opacity, {
          toValue: 0.45,
          duration: 38000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(morphLayer1Opacity, {
          toValue: 0.2,
          duration: 42000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // === MORPH LAYER 2 - Middle layer (45-60s cycles) ===
  const startMorphLayer2 = () => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer2X, {
            toValue: 1,
            duration: 53000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer2X, {
            toValue: 0,
            duration: 47000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 3000);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer2Y, {
            toValue: 1,
            duration: 59000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer2Y, {
            toValue: 0,
            duration: 51000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 7000);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer2Scale, {
            toValue: 1.2,
            duration: 41000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer2Scale, {
            toValue: 0.85,
            duration: 37000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 4000);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer2Opacity, {
            toValue: 0.4,
            duration: 33000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer2Opacity, {
            toValue: 0.15,
            duration: 29000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 6000);
  };

  // === MORPH LAYER 3 - Front layer (30-50s cycles) ===
  const startMorphLayer3 = () => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer3X, {
            toValue: 1,
            duration: 37000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer3X, {
            toValue: 0,
            duration: 43000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 2000);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer3Y, {
            toValue: 1,
            duration: 41000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer3Y, {
            toValue: 0,
            duration: 47000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 9000);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer3Scale, {
            toValue: 1.1,
            duration: 31000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer3Scale, {
            toValue: 0.75,
            duration: 35000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 5000);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(morphLayer3Opacity, {
            toValue: 0.35,
            duration: 27000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(morphLayer3Opacity, {
            toValue: 0.1,
            duration: 31000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 11000);
  };

  // === SOFT EDGES - Dissolving boundaries ===
  const startSoftEdgeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(softEdge1, {
          toValue: 1,
          duration: 23000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(softEdge1, {
          toValue: 0,
          duration: 29000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(softEdge2, {
            toValue: 1,
            duration: 31000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(softEdge2, {
            toValue: 0,
            duration: 27000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 7000);
  };

  // === ASYMMETRIC MOVEMENT - No center-based symmetry ===
  const startAsymmetricAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(asymX, {
          toValue: 1,
          duration: 89000, // Prime number
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(asymX, {
          toValue: 0,
          duration: 97000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(asymY, {
            toValue: 1,
            duration: 101000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(asymY, {
            toValue: 0,
            duration: 79000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 13000);
  };

  const startAnimations = () => {
    startBreathingAnimation();
    startGlowAnimation();
    startMorphLayer1();
    startMorphLayer2();
    startMorphLayer3();
    startSoftEdgeAnimation();
    startAsymmetricAnimation();
  };

  const stopAnimations = () => {
    breatheAnim.stopAnimation();
    glowAnim.stopAnimation();
    morphLayer1X.stopAnimation();
    morphLayer1Y.stopAnimation();
    morphLayer1Scale.stopAnimation();
    morphLayer1Opacity.stopAnimation();
    morphLayer2X.stopAnimation();
    morphLayer2Y.stopAnimation();
    morphLayer2Scale.stopAnimation();
    morphLayer2Opacity.stopAnimation();
    morphLayer3X.stopAnimation();
    morphLayer3Y.stopAnimation();
    morphLayer3Scale.stopAnimation();
    morphLayer3Opacity.stopAnimation();
    softEdge1.stopAnimation();
    softEdge2.stopAnimation();
    asymX.stopAnimation();
    asymY.stopAnimation();
    
    // Reset
    breatheAnim.setValue(1);
    glowAnim.setValue(0.5);
    morphLayer1X.setValue(0);
    morphLayer1Y.setValue(0);
    morphLayer1Scale.setValue(1);
    morphLayer1Opacity.setValue(0.3);
    morphLayer2X.setValue(0);
    morphLayer2Y.setValue(0);
    morphLayer2Scale.setValue(0.9);
    morphLayer2Opacity.setValue(0.25);
    morphLayer3X.setValue(0);
    morphLayer3Y.setValue(0);
    morphLayer3Scale.setValue(0.8);
    morphLayer3Opacity.setValue(0.2);
    softEdge1.setValue(0);
    softEdge2.setValue(0);
    asymX.setValue(0);
    asymY.setValue(0);
  };

  useEffect(() => {
    if (isPlaying) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [isPlaying]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);

  // === INTERPOLATIONS ===
  
  // Layer 1 - Deep, slow movement
  const layer1TranslateX = morphLayer1X.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [-15, 8, -5, 12],
  });
  const layer1TranslateY = morphLayer1Y.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: [10, -12, 6, -8],
  });

  // Layer 2 - Middle movement
  const layer2TranslateX = morphLayer2X.interpolate({
    inputRange: [0, 0.35, 0.65, 1],
    outputRange: [12, -18, 10, -6],
  });
  const layer2TranslateY = morphLayer2Y.interpolate({
    inputRange: [0, 0.45, 0.75, 1],
    outputRange: [-8, 15, -10, 5],
  });

  // Layer 3 - Front movement
  const layer3TranslateX = morphLayer3X.interpolate({
    inputRange: [0, 0.25, 0.55, 0.85, 1],
    outputRange: [-10, 20, -15, 8, -5],
  });
  const layer3TranslateY = morphLayer3Y.interpolate({
    inputRange: [0, 0.3, 0.6, 0.9, 1],
    outputRange: [15, -8, 12, -18, 6],
  });

  // Soft edge positions
  const softEdgeX1 = softEdge1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-5, 8, -3],
  });
  const softEdgeY1 = softEdge1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [6, -4, 2],
  });
  const softEdgeX2 = softEdge2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [4, -6, 5],
  });
  const softEdgeY2 = softEdge2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-3, 7, -2],
  });

  // Asymmetric offset - subtle shift of the whole internal content
  const asymOffsetX = asymX.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 3, -2],
  });
  const asymOffsetY = asymY.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -2, 4],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <LinearGradient
        colors={BACKGROUND_GRADIENT_COLORS}
        locations={BACKGROUND_GRADIENT_LOCATIONS}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.header}>
        <BackIconButton onPress={() => navigation.goBack()} size={42} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={togglePlayPause}
          style={styles.circleWrapper}
        >
          {/* Outer Glow - Soft diffuse light */}
          <Animated.View 
            style={[
              styles.outerGlow,
              { opacity: glowAnim }
            ]}
          />

          {/* Main Circle with Morphism */}
          <Animated.View
            style={[
              styles.circleContainer,
              {
                transform: [
                  { scale: breatheAnim },
                  { translateX: asymOffsetX },
                  { translateY: asymOffsetY },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={CIRCLE_OUTER_COLORS}
              style={styles.outerRing}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              <LinearGradient
                colors={CIRCLE_INNER_COLORS}
                style={styles.innerCircle}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              >
                {/* === MORPH LAYER 1 - Deepest === */}
                <Animated.View
                  style={[
                    styles.morphLayer,
                    {
                      transform: [
                        { translateX: layer1TranslateX },
                        { translateY: layer1TranslateY },
                        { scale: morphLayer1Scale },
                      ],
                      opacity: morphLayer1Opacity,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(180, 140, 200, 0.5)", "rgba(200, 160, 190, 0.3)", "transparent"]}
                    style={styles.morphGradient}
                    start={{ x: 0.2, y: 0.1 }}
                    end={{ x: 0.8, y: 0.9 }}
                  />
                </Animated.View>

                {/* === MORPH LAYER 2 - Middle === */}
                <Animated.View
                  style={[
                    styles.morphLayer,
                    {
                      transform: [
                        { translateX: layer2TranslateX },
                        { translateY: layer2TranslateY },
                        { scale: morphLayer2Scale },
                      ],
                      opacity: morphLayer2Opacity,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(210, 170, 200, 0.4)", "rgba(190, 150, 180, 0.25)", "transparent"]}
                    style={styles.morphGradient}
                    start={{ x: 0.7, y: 0.2 }}
                    end={{ x: 0.3, y: 0.8 }}
                  />
                </Animated.View>

                {/* === MORPH LAYER 3 - Front === */}
                <Animated.View
                  style={[
                    styles.morphLayer,
                    {
                      transform: [
                        { translateX: layer3TranslateX },
                        { translateY: layer3TranslateY },
                        { scale: morphLayer3Scale },
                      ],
                      opacity: morphLayer3Opacity,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(220, 180, 200, 0.35)", "rgba(200, 160, 185, 0.2)", "transparent"]}
                    style={styles.morphGradient}
                    start={{ x: 0.1, y: 0.6 }}
                    end={{ x: 0.9, y: 0.4 }}
                  />
                </Animated.View>

                {/* === SOFT EDGE 1 - Dissolving boundary === */}
                <Animated.View
                  style={[
                    styles.softEdgeLayer,
                    {
                      transform: [
                        { translateX: softEdgeX1 },
                        { translateY: softEdgeY1 },
                      ],
                      opacity: softEdge1.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.15, 0.3, 0.15],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(230, 200, 220, 0.3)", "transparent"]}
                    style={styles.softEdgeGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                </Animated.View>

                {/* === SOFT EDGE 2 - Another dissolving boundary === */}
                <Animated.View
                  style={[
                    styles.softEdgeLayer,
                    {
                      transform: [
                        { translateX: softEdgeX2 },
                        { translateY: softEdgeY2 },
                      ],
                      opacity: softEdge2.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.1, 0.25, 0.12],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(200, 170, 190, 0.25)", "transparent"]}
                    style={styles.softEdgeGradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                  />
                </Animated.View>

                {/* Subtle inner highlight - static, soft */}
                <View style={styles.innerHighlight} />
              </LinearGradient>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>

        {sessionComplete && (
          <View style={styles.completeContainer}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.completeText}>Sessão concluída!</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
            <Icon name="refresh-cw" size={22} color="#A09CAB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <LinearGradient
              colors={["#9B8AC4", "#B794C7", "#D4A5C9"]}
              style={styles.playButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon
                name={isPlaying ? "pause" : "play"}
                size={28}
                color="#FFFFFF"
                style={isPlaying ? {} : { marginLeft: 3 }}
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
            <Icon name={isMuted ? "volume-x" : "volume-2"} size={22} color="#A09CAB" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleWrapper: {
    width: CIRCLE_SIZE + 80,
    height: CIRCLE_SIZE + 80,
    alignItems: "center",
    justifyContent: "center",
  },
  outerGlow: {
    position: "absolute",
    width: CIRCLE_SIZE + 50,
    height: CIRCLE_SIZE + 50,
    borderRadius: (CIRCLE_SIZE + 50) / 2,
    backgroundColor: "rgba(140, 100, 180, 0.06)",
    shadowColor: "#9070B0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 35,
    elevation: 8,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    padding: 5,
    shadowColor: "#A080C0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  innerCircle: {
    flex: 1,
    borderRadius: (CIRCLE_SIZE - 10) / 2,
    overflow: "hidden",
    position: "relative",
  },
  morphLayer: {
    position: "absolute",
    width: "140%",
    height: "140%",
    left: "-20%",
    top: "-20%",
  },
  morphGradient: {
    width: "100%",
    height: "100%",
    borderRadius: CIRCLE_SIZE,
  },
  softEdgeLayer: {
    position: "absolute",
    width: "120%",
    height: "120%",
    left: "-10%",
    top: "-10%",
  },
  softEdgeGradient: {
    width: "100%",
    height: "100%",
    borderRadius: CIRCLE_SIZE,
  },
  innerHighlight: {
    position: "absolute",
    top: "12%",
    left: "18%",
    width: "35%",
    height: "25%",
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  controlsContainer: {
    alignItems: "center",
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  timerText: {
    fontSize: 42,
    fontWeight: "300",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    marginBottom: 16,
    opacity: 0.9,
  },
  completeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  completeText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#10B981",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(26, 24, 37, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
  },
  playButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Meditacao;
