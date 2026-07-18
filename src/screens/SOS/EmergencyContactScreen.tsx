import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { NavigationProp } from "../../types/navigation";
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
} from "../../config/colors";
import {
  getEmergencyContact,
  saveEmergencyContact,
  removeEmergencyContact,
  sanitizePhone,
  RESCUE_MESSAGE,
} from "../../services/emergencyContact";

/**
 * Cadastro do contato de resgate (padrinho/madrinha de recuperação,
 * parceiro(a), amigo de confiança) usado pelo Botão de Resgate do SOS.
 */
const EmergencyContactScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasExisting, setHasExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getEmergencyContact().then((contact) => {
      if (contact) {
        setName(contact.name);
        setPhone(contact.phone);
        setHasExisting(true);
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    const digits = sanitizePhone(phone);
    // DDI (2) + DDD (2) + número (8-9) → mínimo razoável de 12 dígitos
    if (digits.length < 12) {
      Alert.alert(
        "Número incompleto",
        "Use o formato com DDI e DDD. Exemplo: +55 11 99999-8888",
      );
      return;
    }

    setSaving(true);
    try {
      await saveEmergencyContact({ name: name.trim(), phone: digits });
      Alert.alert("Pronto", "Sua rede de apoio está a um toque de distância.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Erro", "Não conseguimos salvar. Tenta de novo?");
    } finally {
      setSaving(false);
    }
  }, [name, phone, navigation]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      "Remover contato",
      "Tem certeza? O Botão de Resgate deixará de funcionar até você cadastrar outro contato.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await removeEmergencyContact();
            setName("");
            setPhone("");
            setHasExisting(false);
          },
        },
      ],
    );
  }, []);

  const canSave = sanitizePhone(phone).length >= 12;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[...BACKGROUND_GRADIENT_COLORS]}
        locations={[...BACKGROUND_GRADIENT_LOCATIONS]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="lifebuoy" size={40} color="#FF6A56" />
          </View>

          <Text style={styles.title}>Contato de resgate</Text>
          <Text style={styles.subtitle}>
            Quem você quer chamar quando a vontade apertar? Pode ser seu
            padrinho de recuperação, parceiro(a) ou alguém de confiança.
          </Text>

          <View style={styles.inputWrapper}>
            <Icon name="user" size={18} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome (opcional)"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="phone" size={18} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+55 11 99999-8888"
              placeholderTextColor="#555"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Mensagem que será enviada:</Text>
            <Text style={styles.previewText}>“{RESCUE_MESSAGE}”</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
            activeOpacity={0.85}
            disabled={!canSave || saving}
            onPress={handleSave}
          >
            <LinearGradient
              colors={["#7456C8", "#D783D8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>
                {saving ? "Salvando..." : "Salvar contato"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {hasExisting && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={handleRemove}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <Text style={styles.removeText}>Remover contato</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,106,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#9E96AD",
    lineHeight: 22,
    marginBottom: 28,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1928",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    padding: 0,
  },
  previewBox: {
    backgroundColor: "rgba(116,86,200,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(116,86,200,0.25)",
    padding: 16,
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 12,
    color: "#8B84A0",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewText: {
    fontSize: 14,
    color: "#D8D2E8",
    lineHeight: 20,
    fontStyle: "italic",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  saveBtn: {
    borderRadius: 999,
    overflow: "hidden",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveGradient: {
    paddingVertical: 17,
    alignItems: "center",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  removeBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  removeText: {
    color: "#FF6A56",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default EmergencyContactScreen;
