import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp as RNRouteProp,
} from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { BackIconButton } from "../../components";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import {
  BudgetExpenseSnapshot,
  BudgetPeriodSummary,
  formatPeriodLabel,
} from "../../domain/entities/Budget";

function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const BudgetMonthDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "BudgetMonthDetail">>();
  const periodKey = route.params?.periodKey;

  const container = useMemo(() => Container.getInstance(), []);
  const getPeriodExpensesUseCase = useMemo(
    () => container.getGetBudgetPeriodExpensesUseCase(),
    [container],
  );

  const [summary, setSummary] = useState<BudgetPeriodSummary | null>(null);
  const [expenses, setExpenses] = useState<BudgetExpenseSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPeriodExpensesUseCase.execute(periodKey);
      setSummary(data.summary);
      setExpenses(data.expenses);
    } catch (error) {
      console.error("[BudgetMonthDetail] erro ao carregar período:", error);
      setSummary(null);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [getPeriodExpensesUseCase, periodKey]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const hasLeftover = (summary?.balance ?? 0) > 0;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>{formatPeriodLabel(periodKey)}</Text>
            <Text style={styles.headerSubtitle}>Detalhes do período</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#D783D8" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {summary && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Orçamento</Text>
                  <Text style={styles.summaryValue}>
                    R$ {formatBrl(summary.budgetValue)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total gasto</Text>
                  <Text style={styles.summaryValue}>
                    R$ {formatBrl(summary.totalSpent)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Saldo</Text>
                  {hasLeftover ? (
                    <Text style={styles.summaryValue}>
                      Sobrou R$ {formatBrl(summary.balance)}
                    </Text>
                  ) : (
                    <Text style={styles.summaryClosed}>Mês encerrado</Text>
                  )}
                </View>
              </View>
            )}

            <Text style={styles.listHeader}>O que eu registrei</Text>
            {expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhum gasto por aqui.</Text>
                <Text style={styles.emptyText}>
                  Os gastos registrados pelo Modo Orçamento aparecem aqui.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {expenses.map((item) => (
                  <View key={item.id} style={styles.expenseItem}>
                    <View style={styles.expenseIconCircle}>
                      <Icon
                        name={item.categoryIcon || "wallet"}
                        size={18}
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
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  headerTextWrapper: {
    flex: 1,
    paddingTop: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 26,
    textTransform: "capitalize",
  },
  headerSubtitle: {
    color: "#A09CAB",
    fontSize: 13,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
    gap: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#A09CAB",
    fontSize: 13,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryClosed: {
    color: "#7A7390",
    fontSize: 13,
    fontWeight: "600",
  },
  listHeader: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    gap: 10,
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  expenseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  emptyState: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 6,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    color: "#A09CAB",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BudgetMonthDetailScreen;
