import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { BlurView } from "expo-blur";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BackIconButton, StatsDisplay } from "../../components";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import { useBetStreakDays } from "../../storage/dashboardStore";
import { CourseModule } from "../../domain/entities/CourseModule";
import { AuthenticationError, ServerError } from "../../domain/errors/CustomErrors";
import {
  resolveModuleSvgString,
  makeUniqueSvg,
  NODE_SVG_DIMS,
  DEFAULT_NODE_DIMS,
  ModuleVisualState,
} from "./moduleIconMap";

// ─── Trail layout constants ───────────────────────────────────────────────────
const VERTICAL_SPACING = 200;
const TRAIL_GAP = 24; // gap below the header's bottom edge
const BOTTOM_PADDING = 120;
const HORIZONTAL_AMPLITUDE = 52;
const CONNECTOR_DOTS = 5;

// ─── Module status ────────────────────────────────────────────────────────────
type ModuleStatus = "completed" | "active" | "locked";

function getStatus(moduleNumber: number, modulesCompleted: number): ModuleStatus {
  if (moduleNumber <= modulesCompleted) return "completed";
  if (moduleNumber === modulesCompleted + 1) return "active";
  return "locked";
}

function statusToVisualState(status: ModuleStatus): ModuleVisualState {
  switch (status) {
    case "completed": return "completed";
    case "locked":    return "locked";
    default:          return "default";
  }
}

// ─── Trail position algorithm (sinusoidal zigzag) ────────────────────────────
function getNodeCenterX(index: number, screenWidth: number): number {
  return screenWidth / 2 + Math.sin(index * (Math.PI / 2)) * HORIZONTAL_AMPLITUDE;
}

function getNodeCenterY(index: number, trailTopPadding: number): number {
  return trailTopPadding + index * VERTICAL_SPACING;
}

// ─── Active glow border (pill-shaped, not circle) ────────────────────────────
function ActiveGlow({ bodyW, bodyH }: { bodyW: number; bodyH: number }) {
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.35, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.activeGlow,
        animStyle,
        {
          width: bodyW + 12,
          height: bodyH + 12,
          borderRadius: 34,
          top: -6,
          left: -6,
        },
      ]}
    />
  );
}

// ─── Connector dots between consecutive nodes ─────────────────────────────────
interface ConnectorProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function ConnectorDots({ fromX, fromY, toX, toY }: ConnectorProps) {
  return (
    <>
      {Array.from({ length: CONNECTOR_DOTS }, (_, i) => {
        const t = (i + 1) / (CONNECTOR_DOTS + 1);
        return (
          <View
            key={i}
            style={[
              styles.connectorDot,
              {
                left: fromX + (toX - fromX) * t - 3,
                top: fromY + (toY - fromY) * t - 3,
              },
            ]}
          />
        );
      })}
    </>
  );
}

// ─── Single trail node ────────────────────────────────────────────────────────
interface TrailNodeProps {
  module: CourseModule;
  status: ModuleStatus;
  index: number;
  centerX: number;
  centerY: number;
  processedXml: string;
  onPress: (module: CourseModule, status: ModuleStatus) => void;
}

const TrailNode = React.memo(function TrailNode({
  module,
  status,
  index,
  centerX,
  centerY,
  processedXml,
  onPress,
}: TrailNodeProps) {
  const dims = NODE_SVG_DIMS[module.moduleType] ?? DEFAULT_NODE_DIMS;
  const left = centerX - dims.renderW / 2;
  const top = centerY - dims.bodyH / 2;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).springify()}
      style={[styles.nodeWrapper, { left, top }]}
    >
      {status === "active" && (
        <ActiveGlow bodyW={dims.renderW} bodyH={dims.bodyH} />
      )}

      <TouchableOpacity
        onPress={() => onPress(module, status)}
        activeOpacity={status === "locked" ? 0.6 : 0.8}
      >
        <SvgXml xml={processedXml} width={dims.renderW} height={dims.renderH} />
      </TouchableOpacity>

      <Text style={styles.nodeLabel} numberOfLines={1}>
        {module.title}
      </Text>
    </Animated.View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────
const CourseModules: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "CourseModules">>();
  const { courseId, courseTitle, modulesCompleted: initialModulesCompleted } = route.params;

  const [headerHeight, setHeaderHeight] = useState(120);
  const trailTopPadding = headerHeight + TRAIL_GAP;

  const scrollViewRef = useRef<ScrollView>(null);

  const betStreakDays = useBetStreakDays();
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [processedSvgs, setProcessedSvgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const hasDataRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<{ energy: number; streak: number } | null>(null);
  const [statsReady, setStatsReady] = useState(false);
  const [modulesCompletedCount, setModulesCompletedCount] = useState(initialModulesCompleted);
  const completedFallbackRef = useRef(initialModulesCompleted);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);

  useEffect(() => {
    completedFallbackRef.current = initialModulesCompleted;
    setModulesCompletedCount(initialModulesCompleted);
  }, [courseId, initialModulesCompleted]);

  useEffect(() => {
    if (modules.length > 0 && !loading) {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }
  }, [modules.length, loading]);

  const loadDashboard = useCallback(async () => {
    try {
      const container = Container.getInstance();
      let energy = 0;
      let streak = 0;
      try {
        const dash = await container.getLoadDashboardUseCase().execute();
        energy = dash.energy;
      } catch {
        /* energia não crítica */
      }
      try {
        const bet = await container.getGetBetStreakStatusUseCase().execute();
        streak = bet.betStreak.days;
      } catch {
        /* streak não crítico */
      }
      setDashboard({ energy, streak });
    } catch {
      // Non-critical
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      if (!hasDataRef.current) setLoading(true);
      await loadDashboard();

      let resolvedCompleted = completedFallbackRef.current;
      try {
        const courses = await Container.getInstance()
          .getGetCoursesWithProgressUseCase()
          .execute();
        const match = courses.find((c) => c.id === courseId);
        if (match !== undefined) {
          resolvedCompleted = match.modulesCompleted;
          completedFallbackRef.current = resolvedCompleted;
          setModulesCompletedCount(resolvedCompleted);
        }
      } catch {
        /* mantém último valor conhecido */
      }

      const result = await Container.getInstance()
        .getGetCourseModulesUseCase()
        .execute(courseId);
      const svgMap: Record<string, string> = {};
      result.forEach((m) => {
        const status = getStatus(m.moduleNumber, resolvedCompleted);
        const raw = resolveModuleSvgString(m.moduleType, statusToVisualState(status));
        svgMap[m.id] = makeUniqueSvg(raw, m.id);
      });
      setProcessedSvgs(svgMap);
      setModules(result);
      hasDataRef.current = true;
      setError(null);
    } catch (err) {
      const msg =
        err instanceof ServerError || err instanceof AuthenticationError
          ? err.message
          : "Erro ao carregar módulos. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
      setStatsReady(true);
    }
  }, [courseId, loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleModulePress = (module: CourseModule, status: ModuleStatus) => {
    if (__DEV__) {
      console.warn('[BetHunter] handleModulePress', {
        moduleId: module.id,
        moduleNumber: module.moduleNumber,
        moduleType: module.moduleType,
        title: module.title,
        status,
        modulesCompletedCount,
      });
    }
    if (status === 'locked') {
      Alert.alert('Módulo bloqueado', 'Complete os módulos anteriores para desbloquear este módulo.');
      return;
    }
    if (module.moduleType === 'QUIZ') {
      navigation.navigate('Quiz', { moduleId: module.id, moduleTitle: module.title });
    } else if (module.moduleType === 'MATERIAL') {
      navigation.navigate('MaterialReader', { moduleId: module.id, moduleTitle: module.title });
    } else if (module.moduleType === 'REWARD') {
      void handleClaimReward(module.id);
    }
  };

  const handleClaimReward = async (rewardModuleId: string): Promise<void> => {
    if (claimingRewardId !== null) return;
    setClaimingRewardId(rewardModuleId);
    try {
      const result = await Container.getInstance()
        .getClaimRewardUseCase()
        .execute(rewardModuleId);
      Alert.alert(
        'Baú de Recompensa',
        `Você recebeu ${result.energyReceived} de energia!`,
        [{ text: 'Ótimo!', onPress: () => void loadData() }],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao coletar recompensa.';
      if (msg.includes('já coletou') || msg.includes('já coletado')) {
        Alert.alert('Baú de Recompensa', 'Você já coletou esta recompensa.');
      } else {
        Alert.alert('Erro', msg);
      }
    } finally {
      setClaimingRewardId(null);
    }
  };

  const totalHeight =
    trailTopPadding + Math.max(1, modules.length) * VERTICAL_SPACING + BOTTOM_PADDING;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { height: totalHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#D783D8" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (() => {
          const displayModules = [...modules].reverse();
          return displayModules.map((module, visualIndex) => {
            const cx = getNodeCenterX(visualIndex, screenWidth);
            const cy = getNodeCenterY(visualIndex, trailTopPadding);
            const status = getStatus(module.moduleNumber, modulesCompletedCount);

            const hasNext = visualIndex < displayModules.length - 1;
            const nextCx = hasNext ? getNodeCenterX(visualIndex + 1, screenWidth) : 0;
            const nextCy = hasNext ? getNodeCenterY(visualIndex + 1, trailTopPadding) : 0;

            const curDims = NODE_SVG_DIMS[module.moduleType] ?? DEFAULT_NODE_DIMS;
            const nextDims = hasNext
              ? NODE_SVG_DIMS[displayModules[visualIndex + 1].moduleType] ?? DEFAULT_NODE_DIMS
              : DEFAULT_NODE_DIMS;

            return (
              <React.Fragment key={module.id}>
                {hasNext && (
                  <ConnectorDots
                    fromX={cx}
                    fromY={cy + curDims.bodyH / 2}
                    toX={nextCx}
                    toY={nextCy - nextDims.bodyH / 2}
                  />
                )}
                <TrailNode
                  module={module}
                  status={status}
                  index={visualIndex}
                  centerX={cx}
                  centerY={cy}
                  processedXml={processedSvgs[module.id] ?? ""}
                  onPress={handleModulePress}
                />
              </React.Fragment>
            );
          })
        })()}
      </ScrollView>

      {/* Floating header */}
      <View
        style={[styles.header, { paddingTop: topInset + 8 }]}
        pointerEvents="box-none"
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {courseTitle}
            </Text>
          </View>
          <StatsDisplay
            loading={!statsReady}
            energy={statsReady && dashboard ? dashboard.energy : undefined}
            streak={statsReady ? `${betStreakDays}d` : undefined}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0A14",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // paddingTop set dynamically via topInset + 8 inline style
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  // ─── Node ──────────────────────────────────────────────────────────────────
  nodeWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  nodeLabel: {
    marginTop: 8,
    fontSize: 11,
    color: "#7B7892",
    textAlign: "center",
    maxWidth: 90,
  },
  // ─── Active glow ───────────────────────────────────────────────────────────
  activeGlow: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: "#4E8EFF",
    backgroundColor: "transparent",
  },
  // ─── Connector ─────────────────────────────────────────────────────────────
  connectorDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2A2740",
  },
  // ─── Error / Retry ───────────────────────────────────────────────────────────
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 32,
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
});

export default CourseModules;
