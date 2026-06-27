import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Modal } from "../../../components";
import { Container } from "../../../infrastructure/di/Container";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../../config/colors";
import { FinancialCategory } from "../../../domain/entities/FinancialCategory";

// Locale do calendário em pt-BR já é configurado em Acessor.tsx; redefinir aqui
// é defensivo: caso o ExpenseSheet seja montado antes do Acessor, o locale
// fica disponível mesmo assim.
if (!LocaleConfig.locales['pt-br']) {
  LocaleConfig.locales['pt-br'] = {
    monthNames: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ],
    monthNamesShort: [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ],
    dayNames: [
      'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
    ],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje',
  };
  LocaleConfig.defaultLocale = 'pt-br';
}

interface ExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ExpenseSheet: React.FC<ExpenseSheetProps> = ({ visible, onClose, onSaved }) => {
  const [value, setValue] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const container = useMemo(() => Container.getInstance(), []);
  const getCategoriesUseCase = useMemo(
    () => container.getGetFinancialCategoriesUseCase(),
    [container],
  );
  const registerUseCase = useMemo(
    () => container.getRegisterBudgetExpenseUseCase(),
    [container],
  );

  const resetForm = useCallback(() => {
    setValue("");
    setDescription("");
    setDate(new Date());
    setShowCalendar(false);
    setSelectedCategoryId("");
    setIsSaving(false);
  }, []);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const list = await getCategoriesUseCase.execute();
      setCategories(list ?? []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [getCategoriesUseCase]);

  useEffect(() => {
    if (visible) {
      resetForm();
      void loadCategories();
    }
  }, [visible, loadCategories, resetForm]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const trimmedValue = value.trim();
  const trimmedDescription = description.trim();
  const parsedValue = parseFloat(
    trimmedValue.replace(/\./g, "").replace(",", "."),
  );
  const canSave =
    trimmedValue.length > 0 &&
    !isNaN(parsedValue) &&
    parsedValue > 0 &&
    trimmedDescription.length > 0 &&
    selectedCategoryId.length > 0 &&
    !isSaving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    const category = categories.find((c) => c.id === selectedCategoryId);
    if (!category) return;

    setIsSaving(true);
    try {
      await registerUseCase.execute({
        valor: trimmedValue,
        descricao: trimmedDescription,
        data: date,
        categoryId: category.id,
        categoryName: category.nome,
        categoryIcon: category.icone,
      });
      onSaved();
      handleClose();
    } catch (error: any) {
      const raw = error?.response?.data?.message;
      const detail = Array.isArray(raw)
        ? raw.join('\n')
        : typeof raw === 'string'
        ? raw
        : error?.message || '';
      Alert.alert("Não conseguimos salvar. Tenta de novo?", detail);
    } finally {
      setIsSaving(false);
    }
  }, [
    canSave,
    categories,
    selectedCategoryId,
    registerUseCase,
    trimmedValue,
    trimmedDescription,
    date,
    onSaved,
    handleClose,
  ]);

  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = `${y}-${m}-01`;
  const lastDayOfMonth = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      size="bigger"
      title="Registrar gasto"
      subtitle="Lança a saída no Acessor e atualiza o seu orçamento."
    >
      <View style={styles.body}>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Quanto foi?</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0,00"
              placeholderTextColor="#6B6677"
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Nota</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Uma palavra só já basta."
              placeholderTextColor="#6B6677"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Data</Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateButton,
                showCalendar && styles.dateButtonActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setShowCalendar((prev) => !prev)}
            >
              <Icon name="calendar" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {showCalendar && (
            <View style={styles.calendarWrapper}>
              <Calendar
                onDayPress={(day) => {
                  setDate(new Date(day.dateString + "T12:00:00"));
                  setShowCalendar(false);
                }}
                minDate={firstDayOfMonth}
                maxDate={lastDayOfMonth}
                renderArrow={() => <View />}
                markedDates={{
                  [date.toISOString().split("T")[0]]: {
                    selected: true,
                    selectedColor: "#D783D8",
                  },
                }}
                theme={{
                  backgroundColor: "#14121B",
                  calendarBackground: "#14121B",
                  textSectionTitleColor: "#A7A3AE",
                  selectedDayBackgroundColor: "#D783D8",
                  selectedDayTextColor: "#FFFFFF",
                  todayTextColor: "#FF6B9D",
                  dayTextColor: "#FFFFFF",
                  textDisabledColor: "#6B6677",
                  monthTextColor: "#FFFFFF",
                  arrowColor: "#D783D8",
                  textDayFontWeight: "500",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "600",
                }}
                style={styles.calendar}
              />
            </View>
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Categoria</Text>
          {isLoadingCategories ? (
            <View style={styles.categoriesLoading}>
              <ActivityIndicator color="#D783D8" />
            </View>
          ) : categories.length === 0 ? (
            <Text style={styles.helperText}>
              Nenhuma categoria disponível.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              {categories.map((cat) => {
                const isActive = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={[styles.pill, isActive && styles.pillActive]}
                  >
                    {cat.icone ? (
                      <Icon
                        name={cat.icone}
                        size={16}
                        color={isActive ? "#FFFFFF" : "#A7A3AE"}
                        style={styles.pillIcon}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.pillText,
                        isActive && styles.pillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <LinearGradient
          colors={[...HORIZONTAL_GRADIENT_COLORS]}
          locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ctaBorder, !canSave && styles.ctaBorderDisabled]}
        >
          <TouchableOpacity
            disabled={!canSave}
            activeOpacity={0.85}
            onPress={handleSave}
            style={styles.ctaButton}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>Registrei</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 18,
    paddingBottom: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    color: "#A7A3AE",
    fontSize: 13,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  currencyPrefix: {
    color: "#A7A3AE",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 0,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  dateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateButtonActive: {
    backgroundColor: "rgba(215,131,216,0.18)",
    borderColor: "rgba(215,131,216,0.35)",
  },
  calendarWrapper: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  calendar: {
    borderRadius: 16,
  },
  pillsRow: {
    paddingVertical: 2,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pillActive: {
    backgroundColor: "rgba(215,131,216,0.18)",
    borderColor: "rgba(215,131,216,0.5)",
  },
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    color: "#A7A3AE",
    fontSize: 13,
    fontWeight: "500",
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  helperText: {
    color: "#7A7390",
    fontSize: 13,
  },
  categoriesLoading: {
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaBorder: {
    borderRadius: 28,
    padding: 2,
    marginTop: 8,
  },
  ctaBorderDisabled: {
    opacity: 0.45,
  },
  ctaButton: {
    height: 54,
    borderRadius: 26,
    backgroundColor: "rgba(19,18,30,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ExpenseSheet;
