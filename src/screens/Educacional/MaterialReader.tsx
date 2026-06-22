import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { BackIconButton } from "../../components";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import { CourseMaterial } from "../../domain/entities/CourseMaterial";
import { AuthenticationError, ServerError } from "../../domain/errors/CustomErrors";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../config/colors";
import RadialGradientBackground from "../../components/common/RadialGradientBackground/RadialGradientBackground";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Slide data model ─────────────────────────────────────────────────────────

interface Slide {
  title: string;
  sentences: string[]; // displayed as separate paragraphs
}

/**
 * Splits a text into sentences.
 * Falls back to period-based splitting when there are no newlines.
 * Requires at least 30 chars before a period to avoid splitting abbreviations
 * like "T. Harv" or "Dr. Smith".
 */
function splitSentences(text: string): string[] {
  const byNewline = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const sentences: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    let splitAt = -1;
    let searchFrom = 0;

    while (searchFrom < remaining.length) {
      const idx = remaining.indexOf(". ", searchFrom);
      if (idx === -1) break;
      if (remaining.slice(0, idx).length >= 30) {
        splitAt = idx;
        break;
      }
      searchFrom = idx + 2;
    }

    if (splitAt === -1) {
      sentences.push(remaining);
      break;
    }

    sentences.push(remaining.slice(0, splitAt + 1));
    remaining = remaining.slice(splitAt + 2).trim();
  }

  return sentences.filter(Boolean);
}

/**
 * Converts a sorted CourseMaterial[] into a flat Slide[] array.
 * Each material item is broken into sub-slides of at most MAX_WORDS words.
 */
const MAX_WORDS_PER_SLIDE = 75;

function buildSlides(materials: CourseMaterial[]): Slide[] {
  const slides: Slide[] = [];

  const sorted = [...materials].sort((a, b) => a.itemNumber - b.itemNumber);

  for (const mat of sorted) {
    const sentences = splitSentences(mat.contentText);
    let chunk: string[] = [];
    let wordCount = 0;

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).length;

      if (wordCount + words > MAX_WORDS_PER_SLIDE && chunk.length > 0) {
        slides.push({ title: mat.title, sentences: chunk });
        chunk = [sentence];
        wordCount = words;
      } else {
        chunk.push(sentence);
        wordCount += words;
      }
    }

    if (chunk.length > 0) {
      slides.push({ title: mat.title, sentences: chunk });
    }
  }

  return slides;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MaterialReader: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "MaterialReader">>();
  const { moduleId, moduleTitle } = route.params;

  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const slides = useMemo(() => buildSlides(materials), [materials]);

  const totalSlides = slides.length;
  const current = slides[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSlides - 1;

  useEffect(() => {
    loadMaterial();
  }, []);

  useEffect(() => {
    if (totalSlides === 0) return;
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / totalSlides,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentIndex, totalSlides]);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await Container.getInstance()
        .getGetCourseMaterialUseCase()
        .execute(moduleId);
      setMaterials(result);
    } catch (err) {
      const msg =
        err instanceof ServerError || err instanceof AuthenticationError
          ? err.message
          : "Erro ao carregar o material. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConcludeReading = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await Container.getInstance()
        .getCompleteCourseModuleUseCase()
        .execute(moduleId);
      navigation.goBack();
    } catch (err) {
      const msg =
        err instanceof ServerError || err instanceof AuthenticationError
          ? err.message
          : "Não foi possível concluir este módulo. Tente novamente.";
      Alert.alert("Módulo", msg);
    } finally {
      setCompleting(false);
    }
  };

  const navigateSlide = (direction: "next" | "prev") => {
    const next =
      direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (next < 0 || next >= totalSlides) return;

    const outX =
      direction === "next" ? -SCREEN_WIDTH * 0.25 : SCREEN_WIDTH * 0.25;
    const inX =
      direction === "next" ? SCREEN_WIDTH * 0.25 : -SCREEN_WIDTH * 0.25;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: outX,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(next);
      slideAnim.setValue(inX);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const progressFlex = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.001, 1],
  });
  const remainFlex = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.999, 0],
  });

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <RadialGradientBackground>
        <SafeAreaView style={styles.flex}>
          <StatusBar hidden />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#D783D8" />
          </View>
        </SafeAreaView>
      </RadialGradientBackground>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <RadialGradientBackground>
        <SafeAreaView style={styles.flex}>
          <StatusBar hidden />
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadMaterial} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </RadialGradientBackground>
    );
  }

  // ─── Empty ──────────────────────────────────────────────────────────────────
  if (slides.length === 0) {
    return (
      <RadialGradientBackground>
        <SafeAreaView style={styles.flex}>
          <StatusBar hidden />
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Sem conteúdo</Text>
            <Text style={styles.emptyText}>
              Este módulo ainda não tem material disponível.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.retryBtn}
            >
              <Text style={styles.retryBtnText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </RadialGradientBackground>
    );
  }

  return (
    <RadialGradientBackground>
      <SafeAreaView style={styles.flex}>
        <StatusBar hidden />
        <View style={styles.container}>

          {/* ── Progress bar ─────────────────────────────────────────────── */}
          <View style={styles.progressTrack}>
            <Animated.View style={{ flex: progressFlex }}>
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </Animated.View>
            <Animated.View style={{ flex: remainFlex }} />
          </View>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {moduleTitle}
            </Text>
            <View style={styles.slideBadge}>
              <Text style={styles.slideBadgeText}>
                {currentIndex + 1} de {totalSlides}
              </Text>
            </View>
          </View>

          {/* ── Slide ────────────────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.slideWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Title with gradient left accent */}
              <View style={styles.titleRow}>
                <LinearGradient
                  colors={[...HORIZONTAL_GRADIENT_COLORS]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.titleAccentBar}
                />
                <Text style={styles.slideTitle}>{current.title}</Text>
              </View>

              {/* Sentences as individual paragraphs */}
              <View style={styles.contentArea}>
                {current.sentences.map((sentence, i) => (
                  <Text key={i} style={styles.paragraph}>
                    {sentence}
                  </Text>
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <View style={styles.navRow}>
            {!isFirst ? (
              <TouchableOpacity
                style={styles.prevButton}
                onPress={() => navigateSlide("prev")}
                activeOpacity={0.7}
              >
                <Text style={styles.prevButtonText}>← Anterior</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.navPlaceholder} />
            )}

            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}
            >
              <TouchableOpacity
                style={styles.nextButton}
                onPress={
                  isLast
                    ? handleConcludeReading
                    : () => navigateSlide("next")
                }
                disabled={completing}
                activeOpacity={0.85}
              >
                <Text style={styles.nextButtonText}>
                  {isLast
                    ? completing
                      ? "A concluir..."
                      : "Concluir ✓"
                    : "Próximo →"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

        </View>
      </SafeAreaView>
    </RadialGradientBackground>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  // ─── Progress bar ──────────────────────────────────────────────────────────
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#2A2435",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#C4C0CF",
  },
  slideBadge: {
    backgroundColor: "rgba(116,86,200,0.15)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(116,86,200,0.3)",
  },
  slideBadgeText: {
    color: "#B8A8E8",
    fontSize: 12,
    fontWeight: "600",
  },
  // ─── Slide ─────────────────────────────────────────────────────────────────
  slideWrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 14,
  },
  titleAccentBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: "stretch",
    minHeight: 28,
  },
  slideTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  contentArea: {
    gap: 18,
  },
  paragraph: {
    fontSize: 16,
    color: "#C8C4D4",
    lineHeight: 27,
  },
  // ─── Navigation ────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  navPlaceholder: {
    flex: 1,
  },
  prevButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  prevButtonText: {
    color: "#C4C0CF",
    fontSize: 15,
    fontWeight: "600",
  },
  nextGradient: {
    flex: 1,
    borderRadius: 14,
  },
  nextButton: {
    paddingVertical: 17,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  // ─── States ────────────────────────────────────────────────────────────────
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: "#2B2740",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#A09CAB",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
});

export default MaterialReader;
