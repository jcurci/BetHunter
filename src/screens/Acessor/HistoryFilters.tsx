import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal as RNModal,
} from "react-native";
import { BlurView } from "expo-blur";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { CircularIconButton } from "../../components/common";

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

// Interfaces
export interface Category {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  icone: string;
  createdAt: string;
}

export interface FilterOptions {
  tipo: 'entrada' | 'saida' | null;
  dataInicial: Date | null;
  dataFinal: Date | null;
  categoriaId: string | null;
}

interface HistoryFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  categories: Category[];
  initialFilters?: FilterOptions;
}

const DEFAULT_FILTERS: FilterOptions = {
  tipo: null,
  dataInicial: null,
  dataFinal: null,
  categoriaId: null,
};

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  visible,
  onClose,
  onApply,
  categories,
  initialFilters,
}) => {
  const [tipo, setTipo] = useState<'entrada' | 'saida' | null>(initialFilters?.tipo || null);
  const [dataInicial, setDataInicial] = useState<Date | null>(initialFilters?.dataInicial || null);
  const [dataFinal, setDataFinal] = useState<Date | null>(initialFilters?.dataFinal || null);
  const [categoriaId, setCategoriaId] = useState<string | null>(initialFilters?.categoriaId || null);
  
  const [showDataInicialCalendar, setShowDataInicialCalendar] = useState(false);
  const [showDataFinalCalendar, setShowDataFinalCalendar] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Reset states when modal opens with new initial filters
  useEffect(() => {
    if (visible) {
      setTipo(initialFilters?.tipo || null);
      setDataInicial(initialFilters?.dataInicial || null);
      setDataFinal(initialFilters?.dataFinal || null);
      setCategoriaId(initialFilters?.categoriaId || null);
    }
  }, [visible, initialFilters]);

  const handleClearFilters = () => {
    setTipo(null);
    setDataInicial(null);
    setDataFinal(null);
    setCategoriaId(null);
    setShowDataInicialCalendar(false);
    setShowDataFinalCalendar(false);
    setShowCategoryDropdown(false);
  };

  const handleApply = () => {
    onApply({
      tipo,
      dataInicial,
      dataFinal,
      categoriaId,
    });
    onClose();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "Selecionar";
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const selectedCategory = categories.find((cat) => cat.id === categoriaId);

  // Filter categories based on selected tipo
  const filteredCategories = tipo 
    ? categories.filter((cat) => cat.tipo === tipo)
    : categories;

  return (
    <RNModal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={40} tint="dark" style={styles.blurOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <CircularIconButton onPress={onClose} size={48}>
              <Icon name="close" size={24} color="#FFFFFF" />
            </CircularIconButton>

            <Text style={styles.headerTitle}>Filtros</Text>

            <View style={styles.headerActions}>
              <CircularIconButton onPress={handleClearFilters} size={48}>
                <Icon name="delete-outline" size={22} color="#FFFFFF" />
              </CircularIconButton>

              <CircularIconButton onPress={handleApply} size={48}>
                <Icon name="check" size={24} color="#FFFFFF" />
              </CircularIconButton>
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Tipo Toggle */}
            <View style={styles.tipoContainer}>
              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipo === 'saida' && styles.tipoButtonActive,
                ]}
                onPress={() => setTipo(tipo === 'saida' ? null : 'saida')}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tipoButtonText,
                  tipo === 'saida' && styles.tipoButtonTextActive,
                ]}>
                  Saídas
                </Text>
                <Icon 
                  name="cash-minus" 
                  size={18} 
                  color={tipo === 'saida' ? "#FFFFFF" : "#A7A3AE"} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipo === 'entrada' && styles.tipoButtonActive,
                ]}
                onPress={() => setTipo(tipo === 'entrada' ? null : 'entrada')}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tipoButtonText,
                  tipo === 'entrada' && styles.tipoButtonTextActive,
                ]}>
                  Entradas
                </Text>
                <Icon 
                  name="cash-plus" 
                  size={18} 
                  color={tipo === 'entrada' ? "#FFFFFF" : "#A7A3AE"} 
                />
              </TouchableOpacity>
            </View>

            {/* Data Selectors */}
            <View style={styles.dateSection}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Data inicial</Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    showDataInicialCalendar && styles.dateButtonActive,
                  ]}
                  onPress={() => {
                    setShowDataInicialCalendar(!showDataInicialCalendar);
                    setShowDataFinalCalendar(false);
                    setShowCategoryDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateButtonText}>{formatDate(dataInicial)}</Text>
                  <Icon name="calendar" size={18} color="#A7A3AE" />
                </TouchableOpacity>
              </View>

              <Text style={styles.dateSeparator}>Até</Text>

              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>Data final</Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    showDataFinalCalendar && styles.dateButtonActive,
                  ]}
                  onPress={() => {
                    setShowDataFinalCalendar(!showDataFinalCalendar);
                    setShowDataInicialCalendar(false);
                    setShowCategoryDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateButtonText}>{formatDate(dataFinal)}</Text>
                  <Icon name="calendar" size={18} color="#A7A3AE" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar Data Inicial */}
            {showDataInicialCalendar && (
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={(day) => {
                    setDataInicial(new Date(day.dateString + 'T12:00:00'));
                    setShowDataInicialCalendar(false);
                  }}
                  markedDates={dataInicial ? {
                    [dataInicial.toISOString().split('T')[0]]: {
                      selected: true,
                      selectedColor: '#D783D8',
                    },
                  } : {}}
                  maxDate={dataFinal?.toISOString().split('T')[0]}
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

            {/* Calendar Data Final */}
            {showDataFinalCalendar && (
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={(day) => {
                    setDataFinal(new Date(day.dateString + 'T12:00:00'));
                    setShowDataFinalCalendar(false);
                  }}
                  markedDates={dataFinal ? {
                    [dataFinal.toISOString().split('T')[0]]: {
                      selected: true,
                      selectedColor: '#D783D8',
                    },
                  } : {}}
                  minDate={dataInicial?.toISOString().split('T')[0]}
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

            {/* Category Selector */}
            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Categoria</Text>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  showCategoryDropdown && styles.categoryButtonActive,
                ]}
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowDataInicialCalendar(false);
                  setShowDataFinalCalendar(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryButtonText}>
                  {selectedCategory ? selectedCategory.nome : "Selecione a categoria"}
                </Text>
                <Icon name="account-multiple-plus" size={20} color="#A7A3AE" />
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View style={styles.categoryDropdown}>
                  <ScrollView style={styles.categoryDropdownList} nestedScrollEnabled>
                    {/* Option to clear category */}
                    <TouchableOpacity
                      style={[
                        styles.categoryDropdownItem,
                        !categoriaId && styles.categoryDropdownItemActive,
                      ]}
                      onPress={() => {
                        setCategoriaId(null);
                        setShowCategoryDropdown(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Icon
                        name="close-circle-outline"
                        size={22}
                        color={!categoriaId ? "#D783D8" : "#A7A3AE"}
                        style={styles.categoryDropdownIcon}
                      />
                      <Text
                        style={[
                          styles.categoryDropdownText,
                          !categoriaId && styles.categoryDropdownTextActive,
                        ]}
                      >
                        Todas as categorias
                      </Text>
                    </TouchableOpacity>

                    {filteredCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryDropdownItem,
                          categoriaId === category.id && styles.categoryDropdownItemActive,
                        ]}
                        onPress={() => {
                          setCategoriaId(category.id);
                          setShowCategoryDropdown(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Icon
                          name={category.icone}
                          size={22}
                          color={categoriaId === category.id ? "#D783D8" : "#A7A3AE"}
                          style={styles.categoryDropdownIcon}
                        />
                        <Text
                          style={[
                            styles.categoryDropdownText,
                            categoriaId === category.id && styles.categoryDropdownTextActive,
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
          </ScrollView>
        </View>
      </BlurView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  blurOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 3, 7, 0.75)",
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontStyle: "italic",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  tipoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  tipoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "45%",
    height: 57,
    borderRadius: 28,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  tipoButtonActive: {
    borderColor: "#D783D8",
  },
  tipoButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#A7A3AE",
  },
  tipoButtonTextActive: {
    color: "#FFFFFF",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A7A3AE",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 57,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  dateButtonActive: {
    borderColor: "#D783D8",
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  dateSeparator: {
    fontSize: 14,
    color: "#A7A3AE",
    marginHorizontal: 12,
    marginBottom: 14,
  },
  calendarContainer: {
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: "#14121B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  calendar: {
    borderRadius: 16,
  },
  categorySection: {
    marginTop: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 57,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  categoryButtonActive: {
    borderColor: "#D783D8",
  },
  categoryButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
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
});

export default HistoryFilters;

