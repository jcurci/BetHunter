import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Calendar, LocaleConfig } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
  BUTTON_INNER_BACKGROUND,
} from "../../config/colors";

// Configuração do calendário em Português
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ],
  dayNames: [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';
import { Footer, IconCard, Modal, GradientButton } from "../../components";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import NovaEntradaIcon from "../../assets/meu-acessor/nova-entrada.svg";
import NovaCategoriaIcon from "../../assets/meu-acessor/nova-categoria.svg";

// Import Clean Architecture dependencies
import { Container } from "../../infrastructure/di/Container";
import { FinancialCategory } from "../../domain/entities/FinancialCategory";
import { FinancialEntry } from "../../domain/entities/FinancialEntry";

// Interfaces (mantendo compatibilidade com estrutura local)
interface Category {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  icone: string;
  createdAt: string;
}

interface Entry {
  id: string;
  valor: string;
  descricao: string;
  data: Date;
  tipo: 'entrada' | 'saida';
  categoria: { id: string; nome: string; icone?: string } | null;
  createdAt: string;
}


// Constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Available Icons for Category (usado no modal de criar categoria)
const AVAILABLE_ICONS = [
  "school", "dumbbell", "bitcoin", "palette", "pot", "pizza",
  "silverware-fork-knife", "dog", "hammer-wrench", "puzzle-outline", "gamepad-variant",
  "hanger", "shoe-print", "train", "tram", "gas-station", "package-variant",
  "credit-card", "trending-up", "trending-down", "weather-sunny", "cup", "medical-bag",
];

// Helper para converter FinancialCategory para Category
const mapFinancialCategoryToCategory = (fc: FinancialCategory): Category => ({
  id: fc.id,
  nome: fc.nome,
  descricao: fc.descricao,
  tipo: fc.tipo,
  icone: fc.icone,
  createdAt: new Date().toISOString(),
});

// Helper para converter FinancialEntry para Entry
const mapFinancialEntryToEntry = (fe: FinancialEntry): Entry => ({
  id: fe.id,
  valor: fe.valor,
  descricao: fe.descricao,
  data: fe.data,
  tipo: fe.tipo,
  categoria: fe.categoria,
  createdAt: fe.createdAt,
});

// Helper para calcular datas do mês atual
const getMonthDateRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start_date: startOfMonth.toISOString().split('T')[0],
    end_date: endOfMonth.toISOString().split('T')[0],
  };
};


const Acessor: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"mensal">("mensal");

  const navigation = useNavigation<NavigationProp>();

  // Loading and error states
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Category Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryType, setCategoryType] = useState<'entrada' | 'saida' | ''>("");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Entry Modal States
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [entryValue, setEntryValue] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCategorySuccessModal, setShowCategorySuccessModal] = useState(false);

  // Saída Modal States
  const [showEntryModalSaida, setShowEntryModalSaida] = useState(false);
  const [showCategoryDropdownSaida, setShowCategoryDropdownSaida] = useState(false);
  const [saidaValue, setSaidaValue] = useState("");
  const [saidaDescription, setSaidaDescription] = useState("");
  const [saidaDate, setSaidaDate] = useState<Date>(new Date());
  const [showDateDropdownSaida, setShowDateDropdownSaida] = useState(false);
  const [selectedCategoryIdSaida, setSelectedCategoryIdSaida] = useState<string>("");
  const [showSuccessModalSaida, setShowSuccessModalSaida] = useState(false);

  // Use Cases from Container
  const container = Container.getInstance();
  const getCategoriesUseCase = container.getGetFinancialCategoriesUseCase();
  const getEntriesUseCase = container.getGetFinancialEntriesUseCase();
  const createEntryUseCase = container.getCreateFinancialEntryUseCase();

  const latestEntry = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }
    return entries[0];
  }, [entries]);

  // Calcular totais de entradas e saídas
  const { totalEntradas, totalSaidas } = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    entries.forEach((entry) => {
      const valor = parseFloat(entry.valor) || 0;
      if (entry.tipo === 'entrada') {
        entradas += valor;
      } else {
        saidas += valor;
      }
    });

    return { totalEntradas: entradas, totalSaidas: saidas };
  }, [entries]);

  // Calcular dados do gráfico dinamicamente
  const chartData = useMemo(() => {
    if (entries.length === 0) {
      // Dados padrão quando não há entradas
      return {
        labels: ["1", "6", "11", "16", "21", "26", "31"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3 }],
      };
    }

    // Ordenar entries por data (mais antiga primeiro)
    const sortedEntries = [...entries].sort(
      (a, b) => a.data.getTime() - b.data.getTime()
    );

    // Calcular saldo acumulado ao longo do tempo
    const dataPoints: { date: Date; balance: number }[] = [];
    let runningBalance = 0;

    sortedEntries.forEach((entry) => {
      const valor = parseFloat(entry.valor) || 0;
      if (entry.tipo === 'entrada') {
        runningBalance += valor;
      } else {
        runningBalance -= valor;
      }
      dataPoints.push({ date: entry.data, balance: runningBalance });
    });

    // Limitar a 7 pontos para visualização
    let displayPoints = dataPoints;
    if (dataPoints.length > 7) {
      const step = Math.floor(dataPoints.length / 6);
      displayPoints = [];
      for (let i = 0; i < dataPoints.length; i += step) {
        displayPoints.push(dataPoints[i]);
      }
      // Sempre incluir o último ponto
      if (displayPoints[displayPoints.length - 1] !== dataPoints[dataPoints.length - 1]) {
        displayPoints.push(dataPoints[dataPoints.length - 1]);
      }
      displayPoints = displayPoints.slice(0, 7);
    }

    // Formatar labels (dia do mês)
    const labels = displayPoints.map((point) =>
      point.date.getDate().toString()
    );

    // Valores do gráfico (garantir que tenha pelo menos 2 pontos)
    let values = displayPoints.map((point) => point.balance);
    if (values.length === 1) {
      values = [0, values[0]];
      labels.unshift("0");
    }

    return {
      labels,
      datasets: [{ data: values, strokeWidth: 3 }],
    };
  }, [entries]);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setErrorMessage(null);

    try {
      console.log('🔄 Carregando categorias da API...');
      const apiCategories = await getCategoriesUseCase.execute();

      if (apiCategories && apiCategories.length > 0) {
        console.log('✅ Categorias carregadas da API:', apiCategories.length);
        const mappedCategories = apiCategories.map(mapFinancialCategoryToCategory);
        setCategories(mappedCategories);
      } else {
        // Sem categorias na API - usuário precisa criar pelo backend
        console.log('⚠️ Nenhuma categoria na API');
        setCategories([]);
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar categorias:", error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [getCategoriesUseCase]);

  // Load entries from API
  const loadEntries = useCallback(async () => {
    setIsLoadingEntries(true);
    setErrorMessage(null);

    try {
      console.log('🔄 Carregando transações da API...');
      const dateRange = getMonthDateRange();

      const apiEntries = await getEntriesUseCase.execute({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      });

      if (apiEntries && apiEntries.length > 0) {
        console.log('✅ Transações carregadas da API:', apiEntries.length);
        const mappedEntries = apiEntries
          .map(mapFinancialEntryToEntry)
          .sort((a, b) => b.data.getTime() - a.data.getTime());
        setEntries(mappedEntries);
      } else {
        console.log('⚠️ Nenhuma transação encontrada');
        setEntries([]);
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar transações:", error);
      setEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [getEntriesUseCase]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load entries after categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      loadEntries();
    }
  }, [categories, loadEntries]);

  const resetForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryType("");
    setSelectedIcon("");
  };

  // Criar categoria - funcionalidade temporariamente desabilitada
  // Categorias devem ser criadas pelo administrador no backend
  const handleSaveCategory = () => {
    Alert.alert(
      "Em breve",
      "A criação de categorias personalizadas estará disponível em breve. Por enquanto, use as categorias padrão do sistema."
    );
    setShowCategoryModal(false);
    resetForm();
  };

  const isFormValid = categoryName && categoryDescription && categoryType && selectedIcon;

  const resetEntryForm = () => {
    setEntryValue("");
    setEntryDescription("");
    setEntryDate(new Date());
    setSelectedCategoryId("");
    setShowCategoryDropdown(false);
    setShowDateDropdown(false);
  };

  // Criar entrada via API
  const handleSaveEntry = async () => {
    if (!entryValue || !entryDescription || !selectedCategoryId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      console.log('🔄 Criando entrada via API...');

      const newEntry = await createEntryUseCase.execute(
        entryValue,
        entryDescription,
        entryDate,
        selectedCategoryId
      );

      console.log('✅ Entrada criada com sucesso:', newEntry);

      // Adicionar a nova entrada à lista local
      const mappedEntry = mapFinancialEntryToEntry(newEntry);
      setEntries((prev) => [mappedEntry, ...prev].sort((a, b) => b.data.getTime() - a.data.getTime()));

      setShowEntryModal(false);
      resetEntryForm();

      // Mostrar modal de sucesso por 5 segundos
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 5000);
    } catch (error: any) {
      console.error("❌ Erro ao criar entrada:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível criar a entrada. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = entryDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedDateSaida = saidaDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const resetSaidaForm = () => {
    setSaidaValue("");
    setSaidaDescription("");
    setSaidaDate(new Date());
    setSelectedCategoryIdSaida("");
    setShowCategoryDropdownSaida(false);
    setShowDateDropdownSaida(false);
  };

  // Criar saída via API
  const handleSaveSaida = async () => {
    if (!saidaValue || !saidaDescription || !selectedCategoryIdSaida) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      console.log('🔄 Criando saída via API...');

      const newEntry = await createEntryUseCase.execute(
        saidaValue,
        saidaDescription,
        saidaDate,
        selectedCategoryIdSaida
      );

      console.log('✅ Saída criada com sucesso:', newEntry);

      // Adicionar a nova entrada à lista local
      const mappedEntry = mapFinancialEntryToEntry(newEntry);
      setEntries((prev) => [mappedEntry, ...prev].sort((a, b) => b.data.getTime() - a.data.getTime()));

      setShowEntryModalSaida(false);
      resetSaidaForm();

      // Mostrar modal de sucesso por 5 segundos
      setShowSuccessModalSaida(true);
      setTimeout(() => {
        setShowSuccessModalSaida(false);
      }, 5000);
    } catch (error: any) {
      console.error("❌ Erro ao criar saída:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível criar a saída. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit={false}>
              Meu{"\n"}Acessor
            </Text>
          </View>
        </View>

        {/* Controle de Período */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSelectedPeriod("mensal")}
            style={styles.periodButtonOuter}
          >
            <LinearGradient
              colors={HORIZONTAL_GRADIENT_COLORS}
              locations={HORIZONTAL_GRADIENT_LOCATIONS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.periodButtonGradient}
            >
              <View style={styles.periodButtonInnerActive}>
                <Text style={styles.periodButtonTextActive}>Mensal</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.periodButtonInline}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("EmConstrucao")}
          >
            <Text style={styles.periodButtonInlineText}>Outros períodos</Text>
          </TouchableOpacity>
        </View>

        {/* Loading indicator para dados */}
        {(isLoadingCategories || isLoadingEntries) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#D783D8" />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        )}

        {/* Gráfico — card glassmorphic */}
        <View style={styles.chartCard}>
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

          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 40}
            height={260}
            chartConfig={{
              backgroundColor: "transparent",
              backgroundGradientFrom: "#14121B",
              backgroundGradientFromOpacity: 0,
              backgroundGradientTo: "#14121B",
              backgroundGradientToOpacity: 0,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 144, 165, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(167, 163, 174, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "5",
                strokeWidth: "0",
                fill: "#FF90A5",
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "transparent",
              },
              strokeWidth: 3,
            }}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={false}
            withDots={true}
            withShadow={false}
            style={styles.chart}
            segments={4}
          />
        </View>

        {/* Valores - Entradas e Saídas */}
        <View style={styles.valuesContainer}>
          {/* Entradas */}
          <LinearGradient
            colors={["#4A4855", "#2A2835", "#1A1825", "#2A2835", "#4A4855"]}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.valueBorderGradient}
          >
            <View style={styles.valueBoxContainer}>
              <View style={styles.valueBox}>
                <View style={styles.valueHeader}>
                  <Text style={styles.valueLabelEntrada}>Entradas </Text>
                  <Icon name="trending-up" size={20} color="#6BCB77" />
                </View>
                <Text style={styles.valueAmount}>
                  <Text style={styles.currencySymbol}>R$ </Text>
                  <Text style={styles.cents}>
                    {totalEntradas.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Saídas */}
          <LinearGradient
            colors={["#4A4855", "#2A2835", "#1A1825", "#2A2835", "#4A4855"]}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.valueBorderGradient}
          >
            <View style={styles.valueBoxContainer}>
              <View style={styles.valueBox}>
                <View style={styles.valueHeader}>
                  <Text style={styles.valueLabelSaida}>Saídas </Text>
                  <Icon name="trending-down" size={20} color="#FF6B9D" />
                </View>
                <Text style={[styles.valueAmount, styles.valueAmountExit]}>
                  <Text style={styles.currencySymbol}>R$ </Text>
                  <Text style={styles.cents}>
                    {totalSaidas.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Entrada/Saída mais recente */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>Entrada mais recente</Text>
              <Text style={styles.sectionSubtitle}>Sua última movimentação</Text>
            </View>
            <TouchableOpacity
              style={styles.verMaisButton}
              onPress={() => navigation.navigate("HistoryList")}
              activeOpacity={0.8}
            >
              <Text style={styles.verMaisText}>Ver Histórico</Text>
              <Icon name="chevron-right" size={18} color="#A09CAB" />
            </TouchableOpacity>
          </View>

          <View style={styles.recentCardWrapper}>
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

            {latestEntry ? (
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recentCardBorder}
              >
                <TouchableOpacity style={styles.recentCard} activeOpacity={0.85}>
                  <View style={styles.recentCardLeft}>
                    <View style={styles.recentIconCircle}>
                      <Icon
                        name={latestEntry.categoria?.icone || "wallet"}
                        size={22}
                        color="#D783D8"
                      />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentCategory} numberOfLines={1}>
                        {latestEntry.categoria?.nome || "Sem categoria"}
                      </Text>
                      <Text style={styles.recentDescription} numberOfLines={1}>
                        {latestEntry.descricao}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.recentCardRight}>
                    <Text style={styles.recentDate}>
                      {latestEntry.data.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.recentAmount,
                        latestEntry.tipo === "entrada" && styles.recentAmountEntrada,
                      ]}
                    >
                      {`${latestEntry.tipo === "entrada" ? "+" : "-"}R$ ${Number(latestEntry.valor).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <View style={[styles.recentCard, styles.recentCardEmpty]}>
                <Text style={styles.recentEmptyText}>
                  Adicione uma entrada para visualizar aqui.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Botões */}
        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <GradientButton
              title="Nova Entrada"
              onPress={() => setShowEntryModal(true)}
              icon={<NovaEntradaIcon width={22} height={22} />}
              containerStyle={styles.actionButtonContainer}
              buttonStyle={styles.actionButtonInner}
              textStyle={styles.actionButtonText}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <GradientButton
              title="Nova Saída"
              onPress={() => setShowEntryModalSaida(true)}
              icon={<NovaCategoriaIcon width={22} height={22} />}
              containerStyle={styles.actionButtonContainer}
              buttonStyle={styles.actionButtonInner}
              textStyle={styles.actionButtonText}
            />
          </View>

        </View>

        {/* Categorias */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              <Text style={styles.sectionSubtitle}>
                Cadastre, edite, e confira categorias
              </Text>
            </View>
            <TouchableOpacity
              style={styles.verMaisButton}
              onPress={() => navigation.navigate("EmConstrucao")}
              activeOpacity={0.8}
            >
              <Text style={styles.verMaisText}>Ver mais</Text>
              <Icon name="chevron-right" size={18} color="#A09CAB" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesCards}>
            <IconCard
              icon={<Icon name="plus" size={28} color="#D783D8" />}
              title="Nova categoria"
              onPress={() => setShowCategoryModal(true)}
            />
            <IconCard
              icon={<Icon name="credit-card" size={28} color="#D783D8" />}
              title="Cartão de Crédito"
              onPress={() => navigation.navigate("EmConstrucao")}
            />
            <IconCard
              icon={<Icon name="school" size={28} color="#D783D8" />}
              title="Educação"
              onPress={() => navigation.navigate("EmConstrucao")}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal Nova Entrada */}
      <Modal
        visible={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          resetEntryForm();
        }}
        title="Nova entrada"
        size="bigger"
      >
        <View style={styles.entryModalContent}>
          {/* Valor */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Valor</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder='"1235.57"'
                placeholderTextColor="#6B6677"
                keyboardType="decimal-pad"
                value={entryValue}
                onChangeText={setEntryValue}
              />
              <Icon name="pencil" size={20} color="#A7A3AE" />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder='"Pagamento da refeição feita no restaurante, comi com minha família"'
                placeholderTextColor="#6B6677"
                value={entryDescription}
                onChangeText={setEntryDescription}
              />
              <Icon name="pencil" size={20} color="#A7A3AE" />
            </View>
          </View>

          {/* Data */}
          <View style={styles.entryRow}>
            <View>
              <Text style={styles.inputLabel}>Data</Text>
              <Text style={styles.entryDate}>{formattedDate}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateButton,
                showDateDropdown && styles.dateButtonActive,
              ]}
              onPress={() => setShowDateDropdown((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Icon name="calendar" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>


          {showDateDropdown && (
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  setEntryDate(new Date(day.dateString + 'T12:00:00'));
                  setShowDateDropdown(false);
                }}
                markedDates={{
                  [entryDate.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#D783D8',
                  },
                }}
                theme={{
                  backgroundColor: '#14121B',
                  calendarBackground: '#14121B',
                  textSectionTitleColor: '#A7A3AE',
                  selectedDayBackgroundColor: '#D783D8',
                  selectedDayTextColor: '#FFFFFF',
                  todayTextColor: '#FF6B9D',
                  dayTextColor: '#FFFFFF',
                  textDisabledColor: '#6B6677',
                  monthTextColor: '#FFFFFF',
                  arrowColor: '#D783D8',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
                style={styles.calendar}
              />
            </View>
          )}

          {/* Categoria */}
          <View>
            <Text style={styles.inputLabel}>Categoria</Text>
            <TouchableOpacity
              style={[
                styles.categorySelectButton,
                showCategoryDropdown && styles.categorySelectButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setShowCategoryDropdown((prev) => !prev)}
            >
              <Text style={styles.categorySelectText}>
                {selectedCategoryId
                  ? categories.find((cat) => cat.id === selectedCategoryId)?.nome
                  : "Selecione a categoria"}
              </Text>
              <Icon name="account-multiple-plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View style={styles.categoryDropdown}>
                <ScrollView style={styles.categoryDropdownList}>
                  {categories.filter((cat) => cat.tipo === 'entrada').length === 0 ? (
                    <View style={styles.noCategoriesContainer}>
                      <Text style={styles.noCategoriesText}>
                        Nenhuma categoria de entrada disponível.
                      </Text>
                    </View>
                  ) : (
                    categories.filter((cat) => cat.tipo === 'entrada').map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryDropdownItem,
                          selectedCategoryId === category.id &&
                          styles.categoryDropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedCategoryId(category.id);
                          setShowCategoryDropdown(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Icon
                          name={category.icone}
                          size={22}
                          color={selectedCategoryId === category.id ? "#D783D8" : "#A7A3AE"}
                          style={styles.categoryDropdownIcon}
                        />
                        <Text
                          style={[
                            styles.categoryDropdownText,
                            selectedCategoryId === category.id &&
                            styles.categoryDropdownTextActive,
                          ]}
                        >
                          {category.nome}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.modalSaveButtonBorder,
              (!entryValue || !entryDescription || !selectedCategoryId || isSaving) &&
              styles.modalSaveButtonDisabled,
            ]}
          >
            <TouchableOpacity
              onPress={handleSaveEntry}
              disabled={!entryValue || !entryDescription || !selectedCategoryId || isSaving}
              activeOpacity={0.85}
              style={styles.modalSaveButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.modalSaveButtonText,
                    (!entryValue || !entryDescription || !selectedCategoryId) &&
                    styles.modalSaveButtonTextDisabled,
                  ]}
                >
                  Salvar
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal Nova Saída */}
      <Modal
        visible={showEntryModalSaida}
        onClose={() => {
          setShowEntryModalSaida(false);
          resetSaidaForm();
        }}
        title="Nova saída"
        size="bigger"
      >
        <View style={styles.entryModalContent}>
          {/* Valor */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Valor</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder='"1235.57"'
                placeholderTextColor="#6B6677"
                keyboardType="decimal-pad"
                value={saidaValue}
                onChangeText={setSaidaValue}
              />
              <Icon name="pencil" size={20} color="#A7A3AE" />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder='"Pagamento da refeição feita no restaurante, comi com minha família"'
                placeholderTextColor="#6B6677"
                value={saidaDescription}
                onChangeText={setSaidaDescription}
              />
              <Icon name="pencil" size={20} color="#A7A3AE" />
            </View>
          </View>

          {/* Data */}
          <View style={styles.entryRow}>
            <View>
              <Text style={styles.inputLabel}>Data</Text>
              <Text style={styles.entryDate}>{formattedDateSaida}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateButton,
                showDateDropdownSaida && styles.dateButtonActive,
              ]}
              onPress={() => setShowDateDropdownSaida((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Icon name="calendar" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {showDateDropdownSaida && (
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  setSaidaDate(new Date(day.dateString + 'T12:00:00'));
                  setShowDateDropdownSaida(false);
                }}
                markedDates={{
                  [saidaDate.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#D783D8',
                  },
                }}
                theme={{
                  backgroundColor: '#14121B',
                  calendarBackground: '#14121B',
                  textSectionTitleColor: '#A7A3AE',
                  selectedDayBackgroundColor: '#D783D8',
                  selectedDayTextColor: '#FFFFFF',
                  todayTextColor: '#FF6B9D',
                  dayTextColor: '#FFFFFF',
                  textDisabledColor: '#6B6677',
                  monthTextColor: '#FFFFFF',
                  arrowColor: '#D783D8',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
                style={styles.calendar}
              />
            </View>
          )}

          {/* Categoria */}
          <View>
            <Text style={styles.inputLabel}>Categoria</Text>
            <TouchableOpacity
              style={[
                styles.categorySelectButton,
                showCategoryDropdownSaida && styles.categorySelectButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setShowCategoryDropdownSaida((prev) => !prev)}
            >
              <Text style={styles.categorySelectText}>
                {selectedCategoryIdSaida
                  ? categories.find((cat) => cat.id === selectedCategoryIdSaida)?.nome
                  : "Selecione a categoria"}
              </Text>
              <Icon name="account-multiple-plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {showCategoryDropdownSaida && (
              <View style={styles.categoryDropdown}>
                <ScrollView style={styles.categoryDropdownList}>
                  {categories.filter((cat) => cat.tipo === 'saida').length === 0 ? (
                    <View style={styles.noCategoriesContainer}>
                      <Text style={styles.noCategoriesText}>
                        Nenhuma categoria de saída disponível.
                      </Text>
                    </View>
                  ) : (
                    categories.filter((cat) => cat.tipo === 'saida').map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryDropdownItem,
                          selectedCategoryIdSaida === category.id &&
                          styles.categoryDropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedCategoryIdSaida(category.id);
                          setShowCategoryDropdownSaida(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Icon
                          name={category.icone}
                          size={22}
                          color={selectedCategoryIdSaida === category.id ? "#D783D8" : "#A7A3AE"}
                          style={styles.categoryDropdownIcon}
                        />
                        <Text
                          style={[
                            styles.categoryDropdownText,
                            selectedCategoryIdSaida === category.id &&
                            styles.categoryDropdownTextActive,
                          ]}
                        >
                          {category.nome}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.modalSaveButtonBorder,
              (!saidaValue || !saidaDescription || !selectedCategoryIdSaida || isSaving) &&
              styles.modalSaveButtonDisabled,
            ]}
          >
            <TouchableOpacity
              onPress={handleSaveSaida}
              disabled={!saidaValue || !saidaDescription || !selectedCategoryIdSaida || isSaving}
              activeOpacity={0.85}
              style={styles.modalSaveButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.modalSaveButtonText,
                    (!saidaValue || !saidaDescription || !selectedCategoryIdSaida) &&
                    styles.modalSaveButtonTextDisabled,
                  ]}
                >
                  Salvar
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal Nova Categoria */}
      <Modal
        visible={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          resetForm();
        }}
        title="Nova categoria"
        size="bigger"
      >
        <View style={styles.modalContent}>
          {/* Nome Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Toque para adicionar um nome"
                placeholderTextColor="#6B6677"
                value={categoryName}
                onChangeText={setCategoryName}
              />
              <Icon name="pencil" size={20} color="#A7A3AE" />
            </View>
          </View>

          {/* Descrição Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Toque para adicionar uma descrição"
                placeholderTextColor="#6B6677"
                value={categoryDescription}
                onChangeText={setCategoryDescription}
              />
              <Icon name="pencil" size={20} color="#A7A3AE" />
            </View>
          </View>

          {/* Tipo (Entrada/Saída) */}
          <View style={styles.typeContainer}>
            <Text style={styles.typeTitle}>Categoria de entrada ou saída?</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  categoryType === 'saida' && styles.typeButtonActive
                ]}
                onPress={() => setCategoryType('saida')}
                activeOpacity={0.8}
              >
                <Icon
                  name="trending-down"
                  size={20}
                  color={categoryType === 'saida' ? '#FFFFFF' : '#A7A3AE'}
                />
                <Text style={[
                  styles.typeButtonText,
                  categoryType === 'saida' && styles.typeButtonTextActive
                ]}>
                  Saídas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  categoryType === 'entrada' && styles.typeButtonActive
                ]}
                onPress={() => setCategoryType('entrada')}
                activeOpacity={0.8}
              >
                <Icon
                  name="trending-up"
                  size={20}
                  color={categoryType === 'entrada' ? '#FFFFFF' : '#A7A3AE'}
                />
                <Text style={[
                  styles.typeButtonText,
                  categoryType === 'entrada' && styles.typeButtonTextActive
                ]}>
                  Entradas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ícones */}
          <View style={styles.iconsContainer}>
            <Text style={styles.iconsTitle}>Ícones</Text>
            <Text style={styles.iconsSubtitle}>Selecione um ícone para sua categoria</Text>

            <View style={styles.iconsGrid}>
              {AVAILABLE_ICONS.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconButton,
                    selectedIcon === iconName && styles.iconButtonSelected
                  ]}
                  onPress={() => setSelectedIcon(iconName)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={iconName}
                    size={28}
                    color={selectedIcon === iconName ? '#D783D8' : '#6B6677'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.modalSaveButtonBorder,
              !isFormValid && styles.modalSaveButtonDisabled,
            ]}
          >
            <TouchableOpacity
              onPress={handleSaveCategory}
              disabled={!isFormValid}
              activeOpacity={0.85}
              style={styles.modalSaveButton}
            >
              <Text
                style={[
                  styles.modalSaveButtonText,
                  !isFormValid && styles.modalSaveButtonTextDisabled,
                ]}
              >
                Salvar
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal de Sucesso - Entrada */}
      <Modal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="smaller"
        showCloseButton={false}
      >
        <View style={styles.successModalContent}>
          <Text style={styles.successTitle}>Sucesso!</Text>
          <Text style={styles.successMessage}>Entrada adicionada com sucesso.</Text>
        </View>
      </Modal>

      {/* Modal de Sucesso - Categoria */}
      <Modal
        visible={showCategorySuccessModal}
        onClose={() => setShowCategorySuccessModal(false)}
        size="smaller"
        showCloseButton={false}
      >
        <View style={styles.successModalContent}>
          <Text style={styles.successTitle}>Sucesso!</Text>
          <Text style={styles.successMessage}>Categoria adicionada com sucesso.</Text>
        </View>
      </Modal>

      {/* Modal de Sucesso - Saída */}
      <Modal
        visible={showSuccessModalSaida}
        onClose={() => setShowSuccessModalSaida(false)}
        size="smaller"
        showCloseButton={false}
      >
        <View style={styles.successModalContent}>
          <Text style={styles.successTitle}>Sucesso!</Text>
          <Text style={styles.successMessage}>Saída adicionada com sucesso.</Text>
        </View>
      </Modal>

      <Footer />
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
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
    flexWrap: "wrap",
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    color: "#A09CAB",
    fontSize: 14,
  },

  // Section headers (compartilhado)
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#A09CAB",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },

  // Period selector
  periodSelector: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  periodButtonOuter: {
    borderRadius: 24,
    overflow: "hidden",
  },
  periodButtonGradient: {
    borderRadius: 24,
    padding: 1,
  },
  periodButtonInnerActive: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 23,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  periodButtonInline: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#14121B",
  },
  periodButtonInlineText: {
    color: "#A09CAB",
    fontSize: 15,
    fontWeight: "600",
  },

  // Chart card glassmorphic
  chartCard: {
    marginBottom: 24,
    overflow: "hidden",
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 0,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  chart: {
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: "transparent",
  },

  // Values
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
    gap: 14,
  },
  valueBorderGradient: {
    flex: 1,
    borderRadius: 22,
    padding: 1,
    overflow: "hidden",
  },
  valueBoxContainer: {
    flex: 1,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 21,
    padding: 18,
  },
  valueBox: {
    flex: 1,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  valueLabelEntrada: {
    fontSize: 14,
    color: "#6BCB77",
    fontWeight: "600",
  },
  valueLabelSaida: {
    fontSize: 14,
    color: "#FF6B9D",
    fontWeight: "600",
  },
  valueAmount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6BCB77",
  },
  valueAmountExit: {
    color: "#FF6B9D",
  },
  currencySymbol: {
    fontSize: 16,
    color: "#EAEAE5",
  },
  cents: {
    fontSize: 18,
    color: "#EAEAE5",
  },

  // Categorias Section
  categoriesSection: {
    marginBottom: 140,
  },
  verMaisButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  verMaisText: {
    fontSize: 13,
    color: "#A09CAB",
    fontWeight: "500",
    marginRight: 2,
  },
  categoriesCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  // Recent Transaction Section
  recentSection: {
    marginBottom: 36,
  },
  recentCardWrapper: {
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  recentCardBorder: {
    borderRadius: 18,
    padding: 1,
    overflow: "hidden",
  },
  recentCard: {
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentCardEmpty: {
    justifyContent: "center",
    borderRadius: 18,
    padding: 18,
  },
  recentEmptyText: {
    color: "#A09CAB",
    fontSize: 14,
    textAlign: "center",
    width: "100%",
  },
  recentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#201F2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentCategory: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recentDescription: {
    fontSize: 12,
    color: "#A09CAB",
  },
  recentCardRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  recentDate: {
    fontSize: 12,
    color: "#A09CAB",
    marginBottom: 4,
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B9D",
  },
  recentAmountEntrada: {
    color: "#6BCB77",
  },

  // Buttons
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 36,
  },
  buttonWrapper: {
    flex: 1,
  },
  actionButtonContainer: {
    width: "100%",
  },
  actionButtonInner: {
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Modal Styles
  modalContent: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
  },
  typeContainer: {
    gap: 12,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: BUTTON_INNER_BACKGROUND,
  },
  typeButtonActive: {
    backgroundColor: "#26233A",
    borderColor: "#D783D8",
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#A09CAB",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
  },
  iconsContainer: {
    gap: 12,
  },
  iconsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  iconsSubtitle: {
    fontSize: 14,
    color: "#A09CAB",
  },
  iconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  entryModalContent: {
    gap: 24,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryDate: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  dateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  dateButtonActive: {
    borderWidth: 1.5,
    borderColor: "#D783D8",
  },
  calendarContainer: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#14121B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  calendar: {
    borderRadius: 16,
  },
  categorySelectButton: {
    marginTop: 12,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorySelectButtonActive: {
    borderColor: "#D783D8",
  },
  categorySelectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  categoryDropdown: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: "#131019",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    maxHeight: 260,
    overflow: "hidden",
  },
  categoryDropdownList: {
    paddingVertical: 12,
  },
  categoryDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryDropdownItemActive: {
    backgroundColor: "rgba(215, 131, 216, 0.12)",
  },
  categoryDropdownIcon: {
    marginRight: 18,
  },
  categoryDropdownText: {
    fontSize: 16,
    color: "#A7A3AE",
    fontWeight: "500",
  },
  categoryDropdownTextActive: {
    color: "#FFFFFF",
  },
  noCategoriesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  noCategoriesText: {
    color: "#A7A3AE",
    fontSize: 14,
    textAlign: "center",
  },
  modalSaveButtonBorder: {
    width: "100%",
    borderRadius: 32,
    padding: 1,
    marginTop: 12,
    overflow: "hidden",
  },
  modalSaveButton: {
    width: "100%",
    borderRadius: 31,
    paddingVertical: 17,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveButtonDisabled: {
    opacity: 0.45,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  modalSaveButtonTextDisabled: {
    color: "#8C8895",
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonSelected: {
    backgroundColor: "#26233A",
    borderWidth: 2,
    borderColor: "#D783D8",
  },
  successModalContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: "#A09CAB",
    textAlign: "center",
  },
});

export default Acessor;
