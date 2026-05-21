import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { BackIconButton } from "../../components";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import { CourseMaterial } from "../../domain/entities/CourseMaterial";
import { AuthenticationError, ServerError } from "../../domain/errors/CustomErrors";
import { HORIZONTAL_GRADIENT_COLORS } from "../../config/colors";

const MaterialReader: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "MaterialReader">>();
  const { moduleId, moduleTitle } = route.params;

  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadMaterial();
  }, []);

  const loadMaterial = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await Container.getInstance()
        .getGetCourseMaterialUseCase()
        .execute(moduleId);
      setMaterials(result);
    } catch (err) {
      const msg =
        err instanceof ServerError || err instanceof AuthenticationError
          ? err.message
          : "Erro ao carregar o material. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConcludeReading = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await Container.getInstance().getCompleteCourseModuleUseCase().execute(moduleId);
      navigation.goBack();
    } catch (err) {
      const msg =
        err instanceof ServerError || err instanceof AuthenticationError
          ? err.message
          : "Não foi possível concluir este módulo. Tente novamente.";
      Alert.alert("Módulo", msg);
    } finally {
      setCompleting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={true} translucent={true} />
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <Text style={styles.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D783D8" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={true} translucent={true} />
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <Text style={styles.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadMaterial} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────────────────────
  if (materials.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={true} translucent={true} />
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <Text style={styles.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Sem conteúdo</Text>
          <Text style={styles.emptyText}>
            Este módulo ainda não tem material disponível.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Content ───────────────────────────────────────────────────────────────
  const sorted = [...materials].sort((a, b) => a.itemNumber - b.itemNumber);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} translucent={true} />

      <View style={styles.header}>
        <BackIconButton onPress={() => navigation.goBack()} size={42} />
        <Text style={styles.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sorted.map((item, index) => (
          <View key={item.id}>
            <View style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.dividerLine} />
              <Text style={styles.itemContent}>{item.contentText}</Text>
            </View>
            {index < sorted.length - 1 && <View style={styles.itemSpacer} />}
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <LinearGradient
          colors={HORIZONTAL_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.concludeGradient}
        >
          <TouchableOpacity
            style={styles.concludeButton}
            onPress={handleConcludeReading}
            activeOpacity={0.85}
            disabled={completing}
          >
            <Text style={styles.concludeButtonText}>
              {completing ? "A concluir..." : "Concluir leitura"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0A14",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  // ─── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  // ─── Material card ─────────────────────────────────────────────────────────
  itemCard: {
    backgroundColor: "#1A1923",
    borderRadius: 16,
    padding: 20,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
    marginBottom: 14,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#2B2740",
    marginBottom: 16,
  },
  itemContent: {
    fontSize: 16,
    color: "#C4C0CF",
    lineHeight: 26,
  },
  itemSpacer: {
    height: 16,
  },
  bottomSpacer: {
    height: 24,
  },
  // ─── Footer button ─────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "#0C0A14",
  },
  concludeGradient: {
    borderRadius: 14,
    padding: 2,
  },
  concludeButton: {
    backgroundColor: "#0C0A14",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  concludeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // ─── Loading / Error / Empty ───────────────────────────────────────────────
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: "#2B2740",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#A09CAB",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
});

export default MaterialReader;
