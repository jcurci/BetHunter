import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import HistoryFilters, { FilterOptions, Category } from "./HistoryFilters";
import { CircularIconButton } from "../../components/common";
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
  BUTTON_INNER_BACKGROUND,
} from "../../config/colors";

// Clean Architecture imports
import { Container } from "../../infrastructure/di/Container";
import { FinancialCategory } from "../../domain/entities/FinancialCategory";
import type { FinancialEntry } from "../../domain/entities/FinancialEntry";

interface HistoryEntry {
  id: string;
  valor: string;
  descricao: string;
  data: Date;
  tipo: 'entrada' | 'saida';
  categoria: { id: string; nome: string; icone?: string } | null;
  createdAt: string;
}

// Helper para converter FinancialCategory para Category (usado pelo HistoryFilters)
const mapFinancialCategoryToFilterCategory = (fc: FinancialCategory): Category => ({
  id: fc.id,
  nome: fc.nome,
  descricao: fc.descricao,
  tipo: fc.tipo,
  icone: fc.icone,
  createdAt: new Date().toISOString(),
});

// Helper para converter FinancialEntry para HistoryEntry
const mapFinancialEntryToHistoryEntry = (fe: FinancialEntry): HistoryEntry => ({
  id: fe.id,
  valor: fe.valor,
  descricao: fe.descricao,
  data: fe.data,
  tipo: fe.tipo,
  categoria: fe.categoria,
  createdAt: fe.createdAt,
});

const HistoryList: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    tipo: null,
    dataInicial: null,
    dataFinal: null,
    categoriaId: null,
  });

  // Use Cases from Container
  const container = Container.getInstance();
  const getCategoriesUseCase = container.getGetFinancialCategoriesUseCase();
  const getEntriesUseCase = container.getGetFinancialEntriesUseCase();

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔄 [HistoryList] Carregando transações da API...');

      // Buscar todas as entradas (sem filtro de período para o histórico completo)
      const apiEntries = await getEntriesUseCase.execute();

      if (apiEntries && apiEntries.length > 0) {
        console.log('✅ [HistoryList] Transações carregadas:', apiEntries.length);
        const mappedEntries = apiEntries
          .map(mapFinancialEntryToHistoryEntry)
          .sort((a, b) => b.data.getTime() - a.data.getTime());
        setEntries(mappedEntries);
      } else {
        console.log('⚠️ [HistoryList] Nenhuma transação encontrada');
        setEntries([]);
      }
    } catch (error: any) {
      console.error("❌ [HistoryList] Erro ao carregar transações:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível carregar o histórico. Tente novamente."
      );
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [getEntriesUseCase]);

  const loadCategories = useCallback(async () => {
    try {
      console.log('🔄 [HistoryList] Carregando categorias da API...');
      const apiCategories = await getCategoriesUseCase.execute();

      if (apiCategories && apiCategories.length > 0) {
        console.log('✅ [HistoryList] Categorias carregadas:', apiCategories.length);
        const mappedCategories = apiCategories.map(mapFinancialCategoryToFilterCategory);
        setCategories(mappedCategories);
      } else {
        console.log('⚠️ [HistoryList] Nenhuma categoria encontrada');
        setCategories([]);
      }
    } catch (error: any) {
      console.error("❌ [HistoryList] Erro ao carregar categorias:", error);
      setCategories([]);
    }
  }, [getCategoriesUseCase]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadEntries();
    }, [loadEntries, loadCategories])
  );

  // Filter and order entries based on applied filters
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filter by tipo
    if (filters.tipo) {
      result = result.filter((entry) => entry.tipo === filters.tipo);
    }

    // Filter by data inicial
    if (filters.dataInicial) {
      const startOfDay = new Date(filters.dataInicial);
      startOfDay.setHours(0, 0, 0, 0);
      result = result.filter((entry) => entry.data >= startOfDay);
    }

    // Filter by data final
    if (filters.dataFinal) {
      const endOfDay = new Date(filters.dataFinal);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((entry) => entry.data <= endOfDay);
    }

    // Filter by categoria
    if (filters.categoriaId) {
      result = result.filter((entry) => entry.categoria?.id === filters.categoriaId);
    }

    // Sort by date (newest first)
    return result.sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [entries, filters]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Check if any filter is active
  const hasActiveFilters = filters.tipo || filters.dataInicial || filters.dataFinal || filters.categoriaId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <CircularIconButton onPress={() => navigation.goBack()} size={48}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" />
          </CircularIconButton>

          <Text style={styles.headerTitle}>Histórico</Text>

          <View style={hasActiveFilters && styles.filterDot}>
            <CircularIconButton onPress={() => setShowFiltersModal(true)} size={48}>
              <Icon name="tune-vertical" size={20} color="#FFFFFF" />
            </CircularIconButton>
            {hasActiveFilters && <View style={styles.filterIndicator} />}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D783D8" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
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
              <Icon name="file-search-outline" size={36} color="#A09CAB" />
              <Text style={styles.emptyText}>
                {hasActiveFilters
                  ? "Nenhum lançamento encontrado com os filtros aplicados."
                  : "Você ainda não possui lançamentos."}
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredEntries.map((entry) => (
              <LinearGradient
                key={entry.id}
                colors={["#4A4855", "#2A2835", "#1A1825", "#2A2835", "#4A4855"]}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cardBorder}
              >
                <View style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                      <Icon
                        name={entry.categoria?.icone || "wallet"}
                        size={26}
                        color="#D783D8"
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {entry.categoria?.nome || "Sem categoria"}
                      </Text>
                      <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {entry.descricao}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.cardDate}>
                      {entry.data.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.cardAmount,
                        entry.tipo === "entrada" && styles.cardAmountEntrada,
                      ]}
                    >
                      {`${entry.tipo === "entrada" ? "+" : "-"}R$ ${Number(entry.valor).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ))}
          </ScrollView>
        )}
      </View>

      <HistoryFilters
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApply={handleApplyFilters}
        categories={categories}
        initialFilters={filters}
      />
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
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  filterDot: {
    position: "relative",
  },
  filterIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D783D8",
    borderWidth: 2,
    borderColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#A09CAB",
    fontSize: 15,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 14,
    paddingBottom: 40,
  },
  cardBorder: {
    borderRadius: 22,
    padding: 1,
    overflow: "hidden",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  cardInfo: {
    flex: 1,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#201F2A",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: "#A09CAB",
    fontSize: 12,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 12,
  },
  cardDate: {
    color: "#A09CAB",
    fontSize: 12,
  },
  cardAmount: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardAmountEntrada: {
    color: "#6BCB77",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    width: "100%",
    minHeight: 180,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  emptyText: {
    color: "#A09CAB",
    fontSize: 14,
    textAlign: "center",
  },
});

export default HistoryList;
