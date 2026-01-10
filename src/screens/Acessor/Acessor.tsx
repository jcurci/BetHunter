import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import { Calendar, LocaleConfig } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

// Interfaces
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
const STORAGE_KEY = "@bethunter:categories";
const ENTRIES_KEY = "@bethunter:entries";

// Available Icons for Category
const AVAILABLE_ICONS = [
  "school", "dumbbell", "bitcoin", "palette", "pot", "pizza",
  "silverware-fork-knife", "dog", "hammer-wrench", "puzzle-outline", "gamepad-variant",
  "hanger", "shoe-print", "train", "tram", "gas-station", "package-variant",
  "credit-card", "trending-up", "trending-down", "weather-sunny", "cup", "medical-bag",
];

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "default-1",
    nome: "Compras Online",
    descricao: "Gastos com compras virtuais",
    tipo: "saida",
    icone: "cart-outline",
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    nome: "Educação",
    descricao: "Cursos e mensalidades",
    tipo: "saida",
    icone: "school",
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    nome: "Entradas Diversas",
    descricao: "Recebimentos variados",
    tipo: "entrada",
    icone: "cash-100",
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-4",
    nome: "Pagamento Digital",
    descricao: "Apps de pagamento",
    tipo: "entrada",
    icone: "cellphone-nfc",
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-5",
    nome: "Saídas Diversas",
    descricao: "Despesas imprevistas",
    tipo: "saida",
    icone: "cash-minus",
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-6",
    nome: "Transporte",
    descricao: "Combustível, passagens, etc.",
    tipo: "saida",
    icone: "bus",
    createdAt: new Date().toISOString(),
  },
];


const Acessor: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"mensal">("mensal");
  
  const navigation = useNavigation<NavigationProp>();

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

  // Load categories from AsyncStorage
  useEffect(() => {
    loadCategories();
  }, []);

  // Load entries after categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      loadEntries();
    }
  }, [categories]);

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Category[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setCategories(parsed);
        } else {
          setCategories(DEFAULT_CATEGORIES);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        }
      } else {
        setCategories(DEFAULT_CATEGORIES);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };
  
  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem(ENTRIES_KEY);
      if (storedEntries) {
        type StoredEntry = Omit<Entry, "data"> & { data: string; tipo?: 'entrada' | 'saida' };
        const parsedRaw = JSON.parse(storedEntries) as StoredEntry[];
        const parsed: Entry[] = parsedRaw
          .map((entry) => {
            // Inferir tipo baseado na categoria se não existir
            let tipo: 'entrada' | 'saida' = entry.tipo || 'saida';
            if (!entry.tipo && entry.categoria?.id) {
              const cat = categories.find((c) => c.id === entry.categoria?.id);
              if (cat) {
                tipo = cat.tipo;
              }
            }
            return {
            ...entry,
            data: new Date(entry.data),
              tipo,
            };
          })
          .sort((a, b) => b.data.getTime() - a.data.getTime());
        setEntries(parsed);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };

  const resetForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryType("");
    setSelectedIcon("");
  };

  const handleSaveCategory = async () => {
    if (!categoryName || !categoryDescription || !categoryType || !selectedIcon) {
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      nome: categoryName,
      descricao: categoryDescription,
      tipo: categoryType as 'entrada' | 'saida',
      icone: selectedIcon,
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedCategories = [...categories, newCategory];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
      setCategories(updatedCategories);
      setShowCategoryModal(false);
      resetForm();
      
      // Mostrar modal de sucesso por 5 segundos
      setShowCategorySuccessModal(true);
      setTimeout(() => {
        setShowCategorySuccessModal(false);
      }, 5000);
    } catch (error) {
      console.error("Error saving category:", error);
    }
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

  const handleSaveEntry = async () => {
    if (!entryValue || !entryDescription || !selectedCategoryId) {
      return;
    }

    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
    const newEntry: Entry = {
      id: Date.now().toString(),
      valor: entryValue,
      descricao: entryDescription,
      data: entryDate,
      tipo: 'entrada',
      categoria: selectedCategory
        ? { id: selectedCategory.id, nome: selectedCategory.nome, icone: selectedCategory.icone }
        : null,
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedEntries = [...entries, newEntry].sort(
        (a, b) => b.data.getTime() - a.data.getTime()
      );
      setEntries(updatedEntries);
      const serializedEntries = updatedEntries.map((entry) => ({
        ...entry,
        data: entry.data.toISOString(),
      }));
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(serializedEntries));
      setShowEntryModal(false);
      resetEntryForm();
      
      // Mostrar modal de sucesso por 5 segundos
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 5000);
    } catch (error) {
      console.error("Error saving entry:", error);
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

  const handleSaveSaida = async () => {
    if (!saidaValue || !saidaDescription || !selectedCategoryIdSaida) {
      return;
    }

    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryIdSaida);
    const newEntry: Entry = {
      id: Date.now().toString(),
      valor: saidaValue,
      descricao: saidaDescription,
      data: saidaDate,
      tipo: 'saida',
      categoria: selectedCategory
        ? { id: selectedCategory.id, nome: selectedCategory.nome, icone: selectedCategory.icone }
        : null,
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedEntries = [...entries, newEntry].sort(
        (a, b) => b.data.getTime() - a.data.getTime()
      );
      setEntries(updatedEntries);
      const serializedEntries = updatedEntries.map((entry) => ({
        ...entry,
        data: entry.data.toISOString(),
      }));
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(serializedEntries));
      setShowEntryModalSaida(false);
      resetSaidaForm();
      
      // Mostrar modal de sucesso por 5 segundos
      setShowSuccessModalSaida(true);
      setTimeout(() => {
        setShowSuccessModalSaida(false);
      }, 5000);
    } catch (error) {
      console.error("Error saving saida:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >


        {/* Título */}
        <Text style={styles.title}>Meu{"\n"}Acessor</Text>

        {/* Controle de Período */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButtonInline, styles.periodButtonInlineActive]}
            activeOpacity={0.8}
            onPress={() => setSelectedPeriod("mensal")}
          >
            <Text style={styles.periodButtonInlineText}>Mensal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.periodButtonInline}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("EmConstrucao")}
          >
            <Text style={styles.periodButtonInlineText}>Outros períodos</Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico Container */}
        <View style={styles.chartContainer}>
          <View style={styles.chartGradientBg}>
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH - 40}
              height={280}
              chartConfig={{
                backgroundColor: "#14121B",
                backgroundGradientFrom: "#14121B",
                backgroundGradientTo: "#14121B",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 111, 157, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(167, 163, 174, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "0",
                  fill: "#FF8FA5",
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
        </View>

        {/* Valores - Entradas e Saídas */}
        <View style={styles.valuesContainer}>
          {/* Entradas */}
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

          {/* Saídas */}
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
        </View>

        {/* Categorias */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <View>
              <Text style={styles.categoriesTitle}>Categorias</Text>
              <Text style={styles.categoriesSubtitle}>
                Cadastre, edite, e confira categorias
              </Text>
            </View>
            <TouchableOpacity
              style={styles.verMaisButton}
              onPress={() => navigation.navigate("EmConstrucao")}
              activeOpacity={0.8}
            >
              <Text style={styles.verMaisText}>Ver mais</Text>
              <Icon name="chevron-right" size={20} color="#A7A3AE" />
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

        {/* Entrada/Saída mais recente */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Entrada mais recente</Text>
            <TouchableOpacity
              style={styles.verHistoricoButton}
              onPress={() => navigation.navigate("HistoryList")}
              activeOpacity={0.8}
            >
              <Text style={styles.verHistoricoText}>Ver Histórico</Text>
              <Icon name="chevron-right" size={16} color="#A7A3AE" />
            </TouchableOpacity>
          </View>

          {latestEntry ? (
            <TouchableOpacity style={styles.recentCard} activeOpacity={1}>
              <View style={styles.recentCardLeft}>
                <View style={styles.recentIconCircle}>
                  <Icon
                    name={latestEntry.categoria?.icone || "wallet"}
                    size={24}
                    color="#D783D8"
                  />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentCategory}>
                    {latestEntry.categoria?.nome || "Sem categoria"}
                  </Text>
                  <Text style={styles.recentDescription}>
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
                <Text style={[
                  styles.recentAmount,
                  latestEntry.tipo === 'entrada' && styles.recentAmountEntrada
                ]}>
                  {`${latestEntry.tipo === 'entrada' ? '+' : '-'}R$ ${Number(latestEntry.valor).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.recentCard, styles.recentCardEmpty]}>
              <Text style={styles.recentEmptyText}>
                Adicione uma entrada para visualizar aqui.
              </Text>
            </View>
          )}
        </View>

        {/* Botões */}
        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <GradientButton 
              title="Nova Entrada" 
              onPress={() => setShowEntryModal(true)}
              icon={<NovaEntradaIcon width={24} height={24} />}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <GradientButton 
              title="Nova Saída" 
              onPress={() => setShowEntryModalSaida(true)}
              icon={<NovaCategoriaIcon width={24} height={24} />}
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
                  {categories.filter((cat) => cat.tipo === 'entrada').map((category) => (
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
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSaveEntry}
            disabled={!entryValue || !entryDescription || !selectedCategoryId}
            activeOpacity={0.85}
            style={[
              styles.modalSaveButton,
              (!entryValue || !entryDescription || !selectedCategoryId) &&
                styles.modalSaveButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.modalSaveButtonText,
                (!entryValue || !entryDescription || !selectedCategoryId) &&
                  styles.modalSaveButtonTextDisabled,
              ]}
            >
              Salvar
            </Text>
          </TouchableOpacity>
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
                  {categories.filter((cat) => cat.tipo === 'saida').map((category) => (
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
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSaveSaida}
            disabled={!saidaValue || !saidaDescription || !selectedCategoryIdSaida}
            activeOpacity={0.85}
            style={[
              styles.modalSaveButton,
              (!saidaValue || !saidaDescription || !selectedCategoryIdSaida) &&
                styles.modalSaveButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.modalSaveButtonText,
                (!saidaValue || !saidaDescription || !selectedCategoryIdSaida) &&
                  styles.modalSaveButtonTextDisabled,
              ]}
            >
              Salvar
            </Text>
          </TouchableOpacity>
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

          <TouchableOpacity
            onPress={handleSaveCategory}
            disabled={!isFormValid}
            activeOpacity={0.85}
            style={[
              styles.modalSaveButton,
              !isFormValid && styles.modalSaveButtonDisabled,
            ]}
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
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 60,
    marginBottom: 40,
  
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  periodButtonInline: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2C2A35",
    backgroundColor: "#14121B",
  },
  periodButtonInlineActive: {
    borderColor: "#D783D8",
  },
  periodButtonInlineText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  chartContainer: {
    marginBottom: 40,
    overflow: "visible",
    borderRadius: 24,
    backgroundColor: "#14121B",
    position: "relative",
  },
  chartGradientBg: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 60,
    gap: 16,
  },
  valueBoxContainer: {
    flex: 1,
    backgroundColor: "#14121B",
    borderRadius: 20,
    padding: 20,
  },
  valueBox: {
    flex: 1,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  valueLabelEntrada: {
    fontSize: 16,
    color: "#569158",
    fontWeight: "500",
  },
  valueLabelSaida: {
    fontSize: 16,
    color: "#FF6B9D",
    fontWeight: "500",
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6BCB77",
  },
  valueAmountExit: {
    color: "#FF6B9D",
  },
  currencySymbol: {
    fontSize: 20,
    color: "#EAEAE5",
  },
  cents: {
    fontSize: 20,
    color: "#EAEAE5",
  },

  // Categorias Section
  categoriesSection: {
    marginBottom: 40,
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  categoriesSubtitle: {
    fontSize: 14,
    color: "#A7A3AE",
  },
  verMaisButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  verMaisText: {
    fontSize: 14,
    color: "#A7A3AE",
    marginRight: 4,
  },
  categoriesCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  // Recent Transaction Section
  recentSection: {
    marginBottom: 60,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  verHistoricoButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  verHistoricoText: {
    fontSize: 12,
    color: "#A7A3AE",
    marginRight: 2,
  },
  recentCard: {
    backgroundColor: "#14121B",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentCardEmpty: {
    justifyContent: "center",
  },
  recentEmptyText: {
    color: "#A7A3AE",
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recentDescription: {
    fontSize: 12,
    color: "#A7A3AE",
  },
  recentCardRight: {
    alignItems: "flex-end",
  },
  recentDate: {
    fontSize: 12,
    color: "#A7A3AE",
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
    marginBottom: 160,
  },
  buttonWrapper: {
    flex: 1,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2A35",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
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
    borderWidth: 1.5,
    borderColor: "#2C2A35",
    backgroundColor: "transparent",
  },
  typeButtonActive: {
    backgroundColor: "#2C2A35",
    borderColor: "#D783D8",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A7A3AE",
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
    color: "#A7A3AE",
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
    backgroundColor: "#2C2A35",
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
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: "#131019",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
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
  modalSaveButton: {
    width: "100%",
    borderRadius: 32,
    paddingVertical: 18,
    backgroundColor: "#131019",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 18,
  },
  modalSaveButtonDisabled: {
    opacity: 0.45,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  modalSaveButtonTextDisabled: {
    color: "#8C8895",
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2C2A35",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonSelected: {
    backgroundColor: "#3D3A48",
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
    color: "#A7A3AE",
    textAlign: "center",
  },
});

export default Acessor;