import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Feather from "react-native-vector-icons/Feather";

import { BackIconButton } from "../../components";
import { NavigationProp } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import {
  BudgetPeriodSummary,
  formatPeriodLabel,
} from "../../domain/entities/Budget";

function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const BudgetHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const getHistoryUseCase = useMemo(
    () => Container.getInstance().getGetBudgetHistoryUseCase(),
    [],
  );

  const [history, setHistory] = useState<BudgetPeriodSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getHistoryUseCase.execute();
      setHistory(list);
    } catch (error) {
      console.error("[BudgetHistory] erro ao carregar histórico:", error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [getHistoryUseCase]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>Meses anteriores</Text>
          </View>
        </View>

        <View style={styles.topBanner}>
          <Text style={styles.topBannerText}>
            Olhar para trás é parte do processo. Só não fique preso lá.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#D783D8" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Por enquanto, está vazio.</Text>
            <Text style={styles.emptyText}>
              Seus próximos meses vão aparecer aqui.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {history.map((item) => {
              const hasLeftover = item.balance > 0;
              return (
                <TouchableOpacity
                  key={item.periodKey}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("BudgetMonthDetail", {
                      periodKey: item.periodKey,
                    })
                  }
                  style={styles.row}
                >
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>
                      {formatPeriodLabel(item.periodKey)}
                    </Text>
                    <View style={styles.rowMetaLine}>
                      <Text style={styles.rowMetaLabel}>Orçamento</Text>
                      <Text style={styles.rowMetaValue}>
                        R$ {formatBrl(item.budgetValue)}
                      </Text>
                    </View>
                    <View style={styles.rowMetaLine}>
                      <Text style={styles.rowMetaLabel}>Total gasto</Text>
                      <Text style={styles.rowMetaValue}>
                        R$ {formatBrl(item.totalSpent)}
                      </Text>
                    </View>
                    <View style={styles.rowMetaLine}>
                      <Text style={styles.rowMetaLabel}>Saldo</Text>
                      {hasLeftover ? (
                        <Text style={styles.rowBalancePositive}>
                          Sobrou R$ {formatBrl(item.balance)}
                        </Text>
                      ) : (
                        <Text style={styles.rowClosedLabel}>Mês encerrado</Text>
                      )}
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color="#7A7390" />
                </TouchableOpacity>
              );
            })}
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
  },
  headerSubtitle: {
    color: "#A09CAB",
    fontSize: 13,
    marginTop: 4,
  },
  topBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  topBannerText: {
    color: "#A09CAB",
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  rowMetaLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowMetaLabel: {
    color: "#A09CAB",
    fontSize: 12,
  },
  rowMetaValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  rowBalancePositive: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  rowClosedLabel: {
    color: "#7A7390",
    fontSize: 12,
    fontWeight: "600",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    color: "#A09CAB",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});

export default BudgetHistoryScreen;
