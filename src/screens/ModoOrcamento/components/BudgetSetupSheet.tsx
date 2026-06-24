import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Modal } from "../../../components";
import { Container } from "../../../infrastructure/di/Container";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../../config/colors";

/** Bottom sheet para configuração inicial e edição do orçamento mensal. */
interface BudgetSetupSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (newValue: number) => void;
  initialValue?: number | null;
}

function formatBrlForInput(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const BudgetSetupSheet: React.FC<BudgetSetupSheetProps> = ({
  visible,
  onClose,
  onSaved,
  initialValue,
}) => {
  const [value, setValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const setBudgetUseCase = useMemo(
    () => Container.getInstance().getSetCurrentBudgetUseCase(),
    [],
  );

  useEffect(() => {
    if (visible) {
      setValue(formatBrlForInput(initialValue ?? null));
      setIsSaving(false);
    }
  }, [visible, initialValue]);

  const isEditing = initialValue != null && initialValue > 0;
  const trimmed = value.trim();
  const canSave =
    trimmed.length > 0 &&
    !isSaving &&
    parseFloat(trimmed.replace(/\./g, "").replace(",", ".")) > 0;

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const saved = await setBudgetUseCase.execute(trimmed);
      onSaved(saved.value);
    } catch (error: any) {
      Alert.alert(
        "Não conseguimos salvar. Tenta de novo?",
        error?.message || "",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="big"
      title={isEditing ? "Editar orçamento" : "Configurar orçamento"}
      subtitle={
        isEditing
          ? "Atualize o valor disponível para este período."
          : "Pode ser salário, mesada, transferência — sem julgamento."
      }
    >
      <View style={styles.body}>
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>
            {isEditing
              ? "Novo valor disponível"
              : "Quanto você tem disponível agora?"}
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0,00"
              placeholderTextColor="#6B6677"
              keyboardType="decimal-pad"
              style={styles.input}
              autoFocus
            />
          </View>
          <Text style={styles.helperText}>
            Você pode editar quando quiser. Vamos um dia de cada vez.
          </Text>
        </View>

        <LinearGradient
          colors={[...HORIZONTAL_GRADIENT_COLORS]}
          locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ctaBorder, !canSave && styles.ctaBorderDisabled]}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
            style={styles.ctaButton}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>
                {isEditing ? "Editar orçamento" : "Começar"}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    paddingTop: 4,
  },
  inputBlock: {
    gap: 10,
  },
  inputLabel: {
    color: "#A7A3AE",
    fontSize: 13,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
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
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 0,
  },
  helperText: {
    color: "#7A7390",
    fontSize: 12,
  },
  ctaBorder: {
    borderRadius: 28,
    padding: 2,
    marginTop: 32,
  },
  ctaBorderDisabled: {
    opacity: 0.45,
  },
  ctaButton: {
    height: 52,
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

export default BudgetSetupSheet;
