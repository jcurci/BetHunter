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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Footer, IconCard, Modal } from "../../components";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";

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
  categoria: { id: string; nome: string; icone?: string } | null;
  createdAt: string;
}

interface DateOption {
  id: string;
  date: Date;
  label: string;
}

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STORAGE_KEY = "@bethunter:categories";
const ENTRIES_KEY = "@bethunter:entries";

// Mock data - valores crescentes ao longo do mês
const chartData = {
  labels: ["1", "6", "11", "16", "21", "26", "31"],
  datasets: [
    {
      data: [5000, 6500, 7200, 9000, 11000, 13500, 15526.97],
      strokeWidth: 3,
    },
  ],
};

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

const generateDateOptions = (): DateOption[] => {
  const today = new Date();
  return Array.from({ length: 14 }, (_, index) => {
    const optionDate = new Date(today);
    optionDate.setDate(today.getDate() - index);
    return {
      id: `date-${index}`,
      date: optionDate,
      label: optionDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  });
};

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
  const [dateOptions] = useState(generateDateOptions);

  const latestEntry = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }
    return entries[0];
  }, [entries]);

  // Load categories from AsyncStorage
  useEffect(() => {
    loadCategories();
    loadEntries();
  }, []);

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
        type StoredEntry = Omit<Entry, "data"> & { data: string };
        const parsedRaw = JSON.parse(storedEntries) as StoredEntry[];
        const parsed: Entry[] = parsedRaw
          .map((entry) => ({
            ...entry,
            data: new Date(entry.data),
          }))
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
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  const formattedDate = entryDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

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
                <Text style={styles.currencySymbol}>R$</Text>
               
                <Text style={styles.cents}>15.526,97</Text>
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
                <Text style={styles.currencySymbol}>R$</Text>
               
                <Text style={styles.cents}> 12.357,62</Text>
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
                <Text style={styles.recentAmount}>
                  {`-R$ ${Number(latestEntry.valor).toLocaleString("pt-BR", {
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
          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => setShowEntryModal(true)}
          >
            <Icon name="tag" size={20} color="#FF6B9D" />
            <Text style={styles.buttonText}>Nova Entrada</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => setShowCategoryModal(true)}
          >
            <Icon name="account-plus" size={20} color="#D783D8" />
            <Text style={styles.buttonText}>Nova Categoria</Text>
          </TouchableOpacity>
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
            <View style={styles.dateDropdown}>
              {dateOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dateDropdownItem,
                    option.date.toDateString() === entryDate.toDateString() &&
                      styles.dateDropdownItemActive,
                  ]}
                  onPress={() => {
                    setEntryDate(option.date);
                    setShowDateDropdown(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.dateDropdownText,
                      option.date.toDateString() === entryDate.toDateString() &&
                        styles.dateDropdownTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
                  {categories.map((category) => (
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

  // Buttons
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 160,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14121B",
    borderWidth: 1,
    borderColor: "#2C2A35",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
  dateDropdown: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: "#131019",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  dateDropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dateDropdownItemActive: {
    backgroundColor: "rgba(215, 131, 216, 0.12)",
  },
  dateDropdownText: {
    fontSize: 16,
    color: "#A7A3AE",
    fontWeight: "500",
  },
  dateDropdownTextActive: {
    color: "#FFFFFF",
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
});

export default Acessor;