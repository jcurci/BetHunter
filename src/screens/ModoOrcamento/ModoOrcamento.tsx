import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { Footer } from "../../components";
import { NavigationProp } from "../../types/navigation";
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
} from "../../config/colors";
import { Container } from "../../infrastructure/di/Container";
import {
  Budget,
  BudgetExpenseSnapshot,
  BudgetPeriodSummary,
  formatPeriodLabel,
  periodKeyFromDate,
} from "../../domain/entities/Budget";

import BudgetSetupSheet from "./components/BudgetSetupSheet";
import ExpenseSheet from "./components/ExpenseSheet";
import NoEntriesBanner from "./components/NoEntriesBanner";

const BUDGET_TTL = 3 * 60 * 1000; // 3 minutos

function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Microcopy contextual baseada na saúde do saldo e na fase do período (mensal).
 *
 * Prioridade: saúde do saldo > fase do período. O aperto vem do dinheiro
 * acabando, não do calendário — então "Tá apertado..." dispara em qualquer
 * momento do mês quando sobra menos de 15%.
 */
function getContextualGreeting(
  budget: Budget | null,
  balance: number,
): string | null {
  if (!budget) return null;

  if (balance <= 0) {
    return "Você chegou no limite, mas ainda está de pé.";
  }

  const balanceRatio = budget.value > 0 ? balance / budget.value : 0;
  if (balanceRatio < 0.15) {
    return "Tá apertado, mas você ainda está de pé.";
  }

  const today = new Date();
  const day = today.getDate();
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const daysRemainingInPeriod = lastDayOfMonth - day;

  if (day <= 7) {
    return "Novo período, novo começo. Vamos com calma.";
  }

  if (daysRemainingInPeriod <= 7) {
    return "Quase lá. Você está conseguindo.";
  }

  return "Você está no controle. Continue assim.";
}

/**
 * Cor da barra de progresso conforme % restante.
 *
 * Faixas declaradas no produto:
 *   100%–40%  → verde      (#4CAF50)
 *    39%–20%  → amarelo    (#FFC107)
 *    19%–5%   → laranja    (#FF7043)
 *     <5%     → cinza      (#616161)
 *
 * Decisão deliberada: no momento mais delicado (saldo crítico) usamos cinza,
 * não vermelho. A barra silencia em vez de "gritar". A transição entre as
 * cores é linear, evitando salto abrupto ao cruzar qualquer threshold.
 */
type RGB = readonly [number, number, number];
const PROGRESS_GREEN: RGB = [76, 175, 80];
const PROGRESS_YELLOW: RGB = [255, 193, 7];
const PROGRESS_ORANGE: RGB = [255, 112, 67];
const PROGRESS_GRAY: RGB = [97, 97, 97];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function lerpColor(c1: RGB, c2: RGB, t: number): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r}, ${g}, ${b})`;
}

function getProgressColor(remainingRatio: number): string {
  const r = Math.max(0, Math.min(1, remainingRatio));
  if (r >= 0.4) {
    return `rgb(${PROGRESS_GREEN[0]}, ${PROGRESS_GREEN[1]}, ${PROGRESS_GREEN[2]})`;
  }
  if (r >= 0.2) {
    const t = (0.4 - r) / 0.2;
    return lerpColor(PROGRESS_GREEN, PROGRESS_YELLOW, t);
  }
  if (r >= 0.05) {
    const t = (0.2 - r) / 0.15;
    return lerpColor(PROGRESS_YELLOW, PROGRESS_ORANGE, t);
  }
  const t = Math.min(1, (0.05 - r) / 0.05);
  return lerpColor(PROGRESS_ORANGE, PROGRESS_GRAY, t);
}

const ModoOrcamento: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const container = useMemo(() => Container.getInstance(), []);
  const getCurrentBudgetUseCase = useMemo(
    () => container.getGetCurrentBudgetUseCase(),
    [container],
  );
  const getPeriodExpensesUseCase = useMemo(
    () => container.getGetBudgetPeriodExpensesUseCase(),
    [container],
  );
  const getDaysSinceLastEntryUseCase = useMemo(
    () => container.getGetDaysSinceLastEntryUseCase(),
    [container],
  );
  const dismissBannerUseCase = useMemo(
    () => container.getDismissNoEntriesBannerUseCase(),
    [container],
  );

  const [budget, setBudget] = useState<Budget | null>(null);
  const [summary, setSummary] = useState<BudgetPeriodSummary | null>(null);
  const [expenses, setExpenses] = useState<BudgetExpenseSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bannerDays, setBannerDays] = useState<number>(0);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [setupVisible, setSetupVisible] = useState<boolean>(false);
  const [setupIsEdit, setSetupIsEdit] = useState<boolean>(false);
  const [expenseVisible, setExpenseVisible] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const currentPeriodKeyRef = useRef(periodKeyFromDate(new Date()));
  const [currentPeriodKey, setCurrentPeriodKey] = useState(() => periodKeyFromDate(new Date()));

  const refresh = useCallback(async (force = false) => {
    const now = Date.now();
    const freshPeriodKey = periodKeyFromDate(new Date());

    // Virada de mês: invalida cache e força refresh com o novo período
    if (freshPeriodKey !== currentPeriodKeyRef.current) {
      currentPeriodKeyRef.current = freshPeriodKey;
      setCurrentPeriodKey(freshPeriodKey);
      lastFetchedRef.current = null;
      force = true;
    }

    if (
      !force &&
      lastFetchedRef.current !== null &&
      now - lastFetchedRef.current < BUDGET_TTL
    ) {
      return;
    }
    setIsLoading(true);
    try {
      const [current, periodData, banner] = await Promise.all([
        getCurrentBudgetUseCase.execute(freshPeriodKey),
        getPeriodExpensesUseCase.execute(freshPeriodKey),
        getDaysSinceLastEntryUseCase.execute(),
      ]);
      setBudget(current);
      setSummary(periodData.summary);
      setExpenses(periodData.expenses);
      setBannerDays(banner.days);
      setShowBanner(banner.shouldShow);
      lastFetchedRef.current = now;
      if (current == null) {
        setSetupIsEdit(false);
        setSetupVisible(true);
      }
    } catch (error) {
      console.error("[ModoOrcamento] erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        setHasLoaded(true);
      }
    }
  }, [
    getCurrentBudgetUseCase,
    getPeriodExpensesUseCase,
    getDaysSinceLastEntryUseCase,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showAnotadoToast = useCallback(() => {
    setToastVisible(true);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, 1700);
  }, [toastOpacity]);

  const budgetValue = budget?.value ?? 0;
  const totalSpent = summary?.totalSpent ?? 0;
  const balance = budgetValue - totalSpent;
  const remaining = Math.max(0, balance);

  // A barra mostra o RESTANTE (não o gasto). Cheia = saudável.
  const remainingRatio =
    budget == null
      ? 1
      : budgetValue > 0
        ? Math.max(0, Math.min(1, balance / budgetValue))
        : 0;
  const progressColor = getProgressColor(remainingRatio);
  const greeting = getContextualGreeting(budget, balance);
  const hasBudget = budget != null;

  const openEditBudget = useCallback(() => {
    setSetupIsEdit(true);
    setSetupVisible(true);
  }, []);

  const openSetupForNewBudget = useCallback(() => {
    setSetupIsEdit(false);
    setSetupVisible(true);
  }, []);

  const onSetupClosed = useCallback(() => {
    setSetupVisible(false);
    // Regra (Adendo 6): se fechar sem confirmar e não houver orçamento,
    // o sheet reabre na próxima focagem.
  }, []);

  const onSetupSaved = useCallback(
    async (_newValue: number) => {
      setSetupVisible(false);
      await refresh(true);
    },
    [refresh],
  );

  const onExpenseSaved = useCallback(async () => {
    await refresh(true);
    setShowBanner(false);
    showAnotadoToast();
  }, [refresh, showAnotadoToast]);

  const dismissBanner = useCallback(async () => {
    try {
      await dismissBannerUseCase.execute();
      setShowBanner(false);
    } catch (error) {
      console.error("[ModoOrcamento] erro ao dispensar banner:", error);
    }
  }, [dismissBannerUseCase]);

  const handleBannerRegister = useCallback(() => {
    setShowBanner(false);
    setExpenseVisible(true);
  }, []);

  const goToCurrentPeriodList = useCallback(() => {
    navigation.navigate("BudgetMonthDetail", { periodKey: currentPeriodKey });
  }, [navigation, currentPeriodKey]);

  if (!hasLoaded) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color="#D783D8" />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Orçamento</Text>
            <Text style={styles.headerSubtitle}>
              {formatPeriodLabel(currentPeriodKey)}
            </Text>
          </View>
        </View>

        {greeting && (
          <Text style={styles.greetingText} numberOfLines={2}>
            {greeting}
          </Text>
        )}

        {showBanner && (
          <View style={{ marginBottom: 16 }}>
            <NoEntriesBanner
              days={bannerDays}
              onRegister={handleBannerRegister}
              onDismiss={dismissBanner}
            />
          </View>
        )}

        {!hasBudget && !isLoading ? (
          <View style={styles.noBudgetCard}>
            <Text style={styles.noBudgetTitle}>
              Defina seu orçamento e acompanhe sem estresse.
            </Text>
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.noBudgetCtaBorder}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openSetupForNewBudget}
                style={styles.noBudgetCtaButton}
              >
                <Text style={styles.noBudgetCtaText}>Configurar agora</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.balanceCardWrapper}>
            <LinearGradient
              colors={BACKGROUND_GRADIENT_COLORS}
              locations={BACKGROUND_GRADIENT_LOCATIONS}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={SHADOW_OVERLAY_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={SHADOW_OVERLAY_COLORS}
              start={{ x: 1, y: 0 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.balanceContent}>
              <View style={styles.balanceTopRow}>
                <Text style={styles.balanceLabel}>Você tem disponível</Text>
                <TouchableOpacity
                  style={styles.editBudgetButton}
                  onPress={openEditBudget}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Editar orçamento"
                >
                  <Feather name="edit-3" size={18} color="#C8C4CF" />
                </TouchableOpacity>
              </View>

              <View style={styles.valueBlock}>
                <View style={styles.balanceValueRow}>
                  <Text style={styles.balanceCurrency}>R$</Text>
                  <Text
                    style={styles.balanceValue}
                    numberOfLines={1}
                  >
                    {formatBrl(remaining)}
                  </Text>
                </View>
                <Text style={styles.balanceFootnote}>nesse período</Text>
              </View>

              <View style={styles.progressBlock}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${remainingRatio * 100}%`,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabelsRow}>
                  <Text style={styles.progressLabel}>
                    R$ {formatBrl(totalSpent)} gastos
                  </Text>
                  <Text style={styles.progressLabel}>
                    R$ {formatBrl(remaining)} restantes
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("BudgetHistory")}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.historyLinkRow}
              >
                <Text style={styles.historyLinkText}>Ver meses anteriores</Text>
                <Feather name="arrow-right" size={14} color="#C8C4CF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>O que eu registrei</Text>
          {expenses.length > 0 && (
            <TouchableOpacity
              onPress={goToCurrentPeriodList}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.sectionLinkRow}
            >
              <Text style={styles.sectionLinkText}>Ver tudo</Text>
              <Feather name="arrow-right" size={13} color="#A09CAB" />
            </TouchableOpacity>
          )}
        </View>

        {expenses.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              Nenhum gasto ainda. Aproveita.
            </Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {expenses.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.expenseItem}>
                <View style={styles.expenseIconCircle}>
                  <Icon
                    name={item.categoryIcon || "wallet"}
                    size={20}
                    color="#D783D8"
                  />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory} numberOfLines={1}>
                    {item.categoryName}
                  </Text>
                  <Text style={styles.expenseDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseValue}>
                    - R$ {formatBrl(item.value)}
                  </Text>
                  <Text style={styles.expenseDate}>
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </Text>
                </View>
              </View>
            ))}

            {expenses.length > 5 && (
              <TouchableOpacity
                onPress={goToCurrentPeriodList}
                activeOpacity={0.7}
                style={styles.viewAllLinkRow}
              >
                <Text style={styles.viewAllLinkText}>
                  Ver o que eu registrei
                </Text>
                <Feather name="arrow-right" size={14} color="#A09CAB" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {hasBudget && (
        <View style={styles.fabBar}>
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabBorder}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setExpenseVisible(true)}
              style={styles.fabButton}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.fabText}>Registrar gasto</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {toastVisible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toastContainer, { opacity: toastOpacity }]}
        >
          <View style={styles.toastPill}>
            <Feather name="check" size={14} color="#FFFFFF" />
            <Text style={styles.toastText}>Anotado.</Text>
          </View>
        </Animated.View>
      )}

      <Footer />

      {isLoading && hasLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D783D8" />
        </View>
      )}

      <BudgetSetupSheet
        visible={setupVisible}
        onClose={onSetupClosed}
        onSaved={onSetupSaved}
        initialValue={setupIsEdit ? budget?.value ?? null : null}
      />

      <ExpenseSheet
        visible={expenseVisible}
        onClose={() => setExpenseVisible(false)}
        onSaved={onExpenseSaved}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  headerSubtitle: {
    color: "#A09CAB",
    fontSize: 13,
    marginTop: 4,
    textTransform: "capitalize",
  },
  greetingText: {
    color: "#C8C4CF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 12,
  },
  balanceCardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  balanceContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 14,
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    color: "#C8C4CF",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  editBudgetButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  valueBlock: {
    alignItems: "center",
    gap: 4,
  },
  balanceValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  balanceCurrency: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 46,
    letterSpacing: -1,
  },
  balanceFootnote: {
    color: "#7A7390",
    fontSize: 12,
    fontWeight: "500",
  },
  progressBlock: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    minWidth: 4,
  },
  progressLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#C8C4CF",
    fontSize: 13,
    fontWeight: "500",
  },
  historyLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  historyLinkText: {
    color: "#C8C4CF",
    fontSize: 13,
    fontWeight: "500",
  },
  noBudgetCard: {
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  noBudgetTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  noBudgetCtaBorder: {
    borderRadius: 26,
    padding: 2,
    alignSelf: "stretch",
  },
  noBudgetCtaButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(19,18,30,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  noBudgetCtaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionLinkText: {
    color: "#A09CAB",
    fontSize: 13,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  emptyState: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyStateTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  expensesList: {
    gap: 8,
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  expenseIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(215,131,216,0.12)",
  },
  expenseInfo: {
    flex: 1,
    minWidth: 0,
  },
  expenseCategory: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  expenseDescription: {
    color: "#A09CAB",
    fontSize: 12,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  expenseValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  expenseDate: {
    color: "#7A7390",
    fontSize: 11,
  },
  viewAllLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  viewAllLinkText: {
    color: "#A09CAB",
    fontSize: 13,
    fontWeight: "500",
  },
  fabBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "rgba(5,4,10,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  fabBorder: {
    borderRadius: 28,
    padding: 2,
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: "rgba(19,18,30,0.95)",
    gap: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  toastContainer: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toastPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(20,18,27,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ModoOrcamento;
