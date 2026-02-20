import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton, GradientButton } from "../../components/common";
import { NavigationProp } from "../../types/navigation";
import {
  enableBlocker,
  disableBlocker,
  getStatus,
  updateBlocklist,
  getBlockedDomainsCache,
  isNativeBlockerAvailable,
} from "../../native";
import {
  updateBlocklistWithFallback,
  getLastUpdateTimestamp,
} from "../../services/BlocklistService";
import type { BlockerConfig } from "../../native";

const BlockerSetup: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [active, setActive] = useState(false);
  const [layers, setLayers] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [domainCount, setDomainCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadState = async () => {
    setLoading(true);
    try {
      const status = await getStatus();
      setActive(status.active);
      setLayers(status.layers);
      const ts = await getLastUpdateTimestamp();
      setLastUpdated(ts);
      const domains = await getBlockedDomainsCache();
      setDomainCount(domains.length);
    } catch {
      setActive(false);
      setLayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const handleToggle = async (value: boolean) => {
    try {
      const config: BlockerConfig = {
        enabled: value,
        blockedDomains: await getBlockedDomainsCache(),
        blockedApps: [],
        useVPN: true,
        useDNS: false,
        useAppBlocker: false,
        useScreenTime: false,
      };
      if (value) {
        await enableBlocker(config);
      } else {
        await disableBlocker();
      }
      const status = await getStatus();
      setActive(status.active);
      setLayers(status.layers);
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível alterar o bloqueio.");
    }
  };

  const handleUpdateList = async () => {
    setUpdating(true);
    try {
      await updateBlocklistWithFallback();
      await updateBlocklist();
      const domains = await getBlockedDomainsCache();
      setDomainCount(domains.length);
      const ts = await getLastUpdateTimestamp();
      setLastUpdated(ts ?? Date.now());
      Alert.alert("Lista atualizada", `${domains.length} domínios na lista de bloqueio.`);
    } catch (e: any) {
      Alert.alert(
        "Erro",
        e?.message ?? "Não foi possível atualizar a lista. Verifique a conexão."
      );
    } finally {
      setUpdating(false);
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <CircularIconButton onPress={() => navigation.goBack()} size={50}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </CircularIconButton>
          <Text style={styles.title}>Bloqueio de apostas</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Ativar bloqueio</Text>
            <Switch
              value={active}
              onValueChange={handleToggle}
              trackColor={{ false: "#3a3a3a", true: "#7456C8" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {!isNativeBlockerAvailable() && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                O bloqueio nativo (VPN/apps) está disponível apenas em versão de desenvolvimento (build nativo). Aqui você pode ativar/desativar e atualizar a lista; ao gerar o build com "expo prebuild", as camadas nativas serão usadas.
              </Text>
            </View>
          )}

          {active && layers.length > 0 && (
            <Text style={styles.layersText}>Camadas ativas: {layers.join(", ")}</Text>
          )}

          <GradientButton
            title={updating ? "Atualizando..." : "Atualizar lista de bloqueio"}
            onPress={handleUpdateList}
            disabled={updating}
          />

          {domainCount > 0 && (
            <Text style={styles.metaText}>
              {domainCount} domínios na lista
              {lastUpdated != null && ` • Atualizado em ${formatDate(lastUpdated)}`}
            </Text>
          )}

          {Platform.OS === "ios" && (
            <View style={styles.iosBox}>
              <Text style={styles.iosTitle}>No iPhone (Safari)</Text>
              <Text style={styles.iosText}>
                Para bloquear sites no Safari, ative a extensão BetHunter em Ajustes → Safari → Extensões.
              </Text>
              <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                <Text style={styles.settingsButtonText}>Abrir Ajustes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1C1C1C",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  infoBox: {
    backgroundColor: "rgba(116, 86, 200, 0.15)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(116, 86, 200, 0.4)",
  },
  infoText: {
    fontSize: 14,
    color: "#CCCCCC",
    lineHeight: 20,
  },
  layersText: {
    fontSize: 14,
    color: "#8A8A8A",
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 12,
  },
  iosBox: {
    marginTop: 28,
    backgroundColor: "#1C1C1C",
    padding: 18,
    borderRadius: 16,
  },
  iosTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  iosText: {
    fontSize: 14,
    color: "#8A8A8A",
    lineHeight: 20,
    marginBottom: 14,
  },
  settingsButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#7456C8",
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default BlockerSetup;
