import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  NativeModules,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Entypo";
import MaskedView from "@react-native-masked-view/masked-view";

// Components
import { Footer, StatsDisplay, IconCard, GradientBorderButton } from "../../components";
import Modal from "../../components/common/Modal/Modal";

// Config
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
  BUTTON_INNER_BACKGROUND,
} from "../../config/colors";

// Assets
import Meditation from "../../assets/home/meditation.svg";
import Reset from "../../assets/home/reset.svg";
import Block from "../../assets/home/block.svg";
import BetHunterIcon from "../../assets/home/bethunter.svg";
import AcessorIcon from "../../assets/home/acessor.svg";
import CursosIcon from "../../assets/home/cursos.svg";

// Domain & Infrastructure

import { Container } from "../../infrastructure/di/Container";
import { useAuthStore } from "../../storage/authStore";
import { NavigationProp } from "../../types/navigation";

// Constants
const GRADIENT_HEIGHT_EXPANDED = 450;

const { BetBlocker, BetBlocking } = NativeModules;
const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showBlockSuccessModal, setShowBlockSuccessModal] = useState<boolean>(false);
  const [betStreak, setBetStreak] = useState<number>(0);
  const [canCheckIn, setCanCheckIn] = useState<boolean>(false);
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [showAlreadyMarkedModal, setShowAlreadyMarkedModal] = useState<boolean>(false);
  const [dashboard, setDashboard] = useState<{ energy: number; streak: number } | null>(null);
  const [statsReady, setStatsReady] = useState<boolean>(false);
  

  useEffect(() => {
    loadData();
  }, []);

  // Auto-close reset confirm modal after 3 seconds
  useEffect(() => {
    if (showResetConfirmModal) {
      const timer = setTimeout(() => {
        setShowResetConfirmModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showResetConfirmModal]);

  // Auto-close block success modal after 3 seconds
  useEffect(() => {
    if (showBlockSuccessModal) {
      const timer = setTimeout(() => {
        setShowBlockSuccessModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBlockSuccessModal]);

  const loadData = async () => {
    try {
      await loadBetStreak();
      await loadDashboard();
    } finally {
      setStatsReady(true);
    }
  };

  const loadDashboard = async () => {
    try {
      const container = Container.getInstance();
      const useCase = container.getLoadDashboardUseCase();
      const result = await useCase.execute();
      setDashboard({ energy: result.energy, streak: result.streak });
    } catch (error: any) {
      console.log("LoadDashboard:", error?.message ?? error);
    }
  };

  const loadBetStreak = async () => {
    try {
      const container = Container.getInstance();
      const useCase = container.getGetBetStreakStatusUseCase();
      const result = await useCase.execute();
      setBetStreak(result.betStreak);
      setCanCheckIn(result.canCheckIn);
    } catch (error: any) {
      console.log("BetCheckIn status:", error?.message ?? error);
    }
  };

  const handleDaysPress = () => {
    if (canCheckIn) {
      setShowCheckInModal(true);
    } else {
      setShowAlreadyMarkedModal(true);
    }
  };

  const handleCheckIn = async () => {
    try {
      const container = Container.getInstance();
      await container.getBetCheckInUseCase().execute();
      setShowCheckInModal(false);
      await loadBetStreak();
    } catch (error: any) {
      console.log("BetCheckIn POST:", error?.message ?? error);
    }
  };

  const handleBlockContinue = async () => {
    if (Platform.OS !== "android") {
      setShowBlockModal(false);
      Alert.alert(
        "Disponível no Android",
        "O bloqueio de apostas via VPN está disponível apenas no Android."
      );
      return;
    }
    if (!BetBlocker) {
      console.log("BetBlocker: módulo nativo não disponível");
      setShowBlockModal(false);
      Alert.alert(
        "Indisponível",
        "O recurso de bloqueio não está disponível neste ambiente."
      );
      return;
    }
    try {
      if (BetBlocker.refreshBlockedDomains) {
        await BetBlocker.refreshBlockedDomains();
      }
      BetBlocker.startBlocking();
      setShowBlockModal(false);
      setShowBlockSuccessModal(true);
    } catch (error: any) {
      console.log("BetBlocker error", error);
      Alert.alert(
        "Erro",
        "Não foi possível ativar o bloqueio. Tente novamente."
      );
    }
  };


  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>Bom dia,</Text>
        <MaskedView
          maskElement={
            <Text style={[styles.greetingText, { backgroundColor: 'transparent' }]}>
              {user?.name || "Usuário"}
            </Text>
          }
        >
          <LinearGradient
            colors={HORIZONTAL_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          >
            <Text style={[styles.greetingText, { opacity: 0 }]}>
              {user?.name || "Usuário"}
            </Text>
          </LinearGradient>
        </MaskedView>
      </View>
      
      <StatsDisplay 
        loading={!statsReady}
        energy={statsReady && dashboard ? dashboard.energy : undefined}
        streak={statsReady && dashboard ? `${dashboard.streak}d` : undefined}
        // Quando statsReady=true mas dashboard=null (erro API), 
        // StatsDisplay mostra 0 energy e "0d" streak como fallback explícito
      />
    </View>
  );

  const renderGradientText = (text: string, style: object) => (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        colors={HORIZONTAL_GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );

  const renderFreeOfBetDaysDisplay = () => (
    <View style={styles.freeOfBetDaysContainer}>
      <Text style={styles.freeOfBetDaysLabel}>
        Você está livre de apostas por:
      </Text>
      <TouchableOpacity
        onPress={statsReady ? handleDaysPress : undefined}
        activeOpacity={statsReady && canCheckIn ? 0.7 : 1}
        disabled={!statsReady}
        style={styles.freeOfBetDaysValueWrapper}
      >
        {!statsReady ? (
          <View style={styles.daysSkeleton}>
            <View style={styles.daysNumberPlaceholder} />
            <View style={styles.daysUnitPlaceholder} />
          </View>
        ) : (
          <>
            {/* betStreak inicia em 0, se loadBetStreak falhar mantém 0 - fallback honesto */}
            {renderGradientText(`${betStreak}`, styles.freeOfBetDaysNumber)}
            {renderGradientText(" dias", styles.freeOfBetDaysUnit)}
          </>
        )}
      </TouchableOpacity>
      {statsReady && canCheckIn && (
        <TouchableOpacity
          onPress={handleDaysPress}
          activeOpacity={0.7}
          style={styles.checkInHint}
        >
          <Text style={styles.checkInHintText}>Toque para marcar se apostou hoje</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFreeOfBetBox = () => (
    <View style={styles.freeOfBetContainer}>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Meditacao")}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconCircle}>
            <Meditation width={24} height={24} />
          </View>
          <Text style={styles.actionText}>Meditar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowResetModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconCircle}>
            <Reset width={24} height={24} />
          </View>
          <Text style={styles.actionText}>Resetar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (Platform.OS === "ios" && BetBlocking) {
              BetBlocking.openBlockingFlow();
            } else {
              setShowBlockModal(true);
            }
          }}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconCircle}>
            <Block width={27} height={27} />
          </View>
          <Text style={styles.actionText}>Bloquear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  return (  
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Background Gradient - Radial Effect */}
          <View
            style={[
              styles.backgroundGradient,
              {
                height: GRADIENT_HEIGHT_EXPANDED,
                backgroundColor: '#000000',
              },
            ]}
          >
            {/* Vertical gradient from top center */}
            <LinearGradient
              colors={BACKGROUND_GRADIENT_COLORS}
              locations={BACKGROUND_GRADIENT_LOCATIONS}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Left shadow overlay */}
            <LinearGradient
              colors={SHADOW_OVERLAY_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Right shadow overlay */}
            <LinearGradient
              colors={SHADOW_OVERLAY_COLORS}
              start={{ x: 1, y: 0 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {renderHeader()}

          {renderFreeOfBetDaysDisplay()}
          
          {renderFreeOfBetBox()}

          {/* Divider */}
          <View style={styles.dividerTouchable}>
            <LinearGradient
              colors={HORIZONTAL_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />
          </View>

          {/* Continue de onde parou */}
          <View style={styles.continueBoxOuter}>
            <View style={styles.rouletteBox}>
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
              <Text style={styles.continueBoxTitle}>Continue de onde parou</Text>
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueCardBorder}
              >
                <TouchableOpacity
                  style={styles.continueCardInner}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueText}>Fundamentos: 1/4</Text>
                  <Icon name="chevron-right" size={22} color="#B8B3BF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          {/* Minha conta, Meu acessor, Menu Educacional */}
          <View style={styles.cardsContainer}>
            <IconCard 
              icon={<BetHunterIcon width={20} height={20} />} 
              title={"Minha\nConta"} 
              cardBackgroundColor="#14121B"
              onPress={() => navigation.navigate("MinhaConta")}
            />
            <IconCard 
              icon={<AcessorIcon width={20} height={20} />} 
              title={"Meu\nAcessor"} 
              cardBackgroundColor="#14121B"
              onPress={() => navigation.navigate("Acessor")}
            />
            <IconCard 
              icon={<CursosIcon width={20} height={20} />} 
              title={"Menu\nEducacional"} 
              cardBackgroundColor="#14121B"
              onPress={() => navigation.navigate("MenuEducacional")}
            />
          </View>
        </ScrollView>
      </View>
      
      <Footer />

      {/* Modal de Confirmação de Reset */}
      <Modal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        size="small"
        title="Tem certeza?"
        subtitle="Seu contador será completamente reinicializado."
      >
        <View style={styles.resetModalContent}>
          <GradientBorderButton
            label="Continuar"
            onPress={async () => {
              try {
                const container = Container.getInstance();
                await container.getResetBetStreakUseCase().execute();
                setShowResetModal(false);
                setShowResetConfirmModal(true);
                await loadBetStreak();
              } catch (error: any) {
                console.log("ResetBetStreak:", error?.message ?? error);
              }
            }}
          />
        </View>
      </Modal>

      {/* Modal de Reset Confirmado - Menor */}
      <Modal
        visible={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        size="smaller"
        title="Poxa, que pena!"
        subtitle="Sentimos muito. Vamos recomeçar!"
        showCloseButton={false}
      >
        <View style={styles.resetConfirmModalContent} />
      </Modal>

      {/* Modal de Bloqueio - Permissões */}
      <Modal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        size="small"
        title="Habilite permissoes!"
        subtitle='Para o funcionamento do bloqueio do Bethunter, necessitamos da instalação de um perfil VPN para redirecionar e filtrar o tráfego. Esse bloqueio funcionará em todos os sites e apps que consideramos como "apostas".'
      >
        <View style={styles.blockModalContent}>
          <GradientBorderButton
            label="Continuar"
            onPress={handleBlockContinue}
          />
        </View>
      </Modal>

      {/* Modal de Bloqueio Sucesso - Menor */}
      <Modal
        visible={showBlockSuccessModal}
        onClose={() => setShowBlockSuccessModal(false)}
        size="smaller"
        title="Sucesso!"
        subtitle="Bloqueamos apps e sites de aposta, para você usar seu dispositivo tranquilo."
        showCloseButton={false}
      >
        <View style={styles.resetConfirmModalContent} />
      </Modal>

      {/* Modal de Check-in (Apostou / Não apostei) */}
      <Modal
        visible={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        size="small"
        title="Marcar check-in"
        subtitle="Você apostou hoje?"
      >
        <View style={styles.checkInModalContent}>
          <GradientBorderButton
            label="Não apostei"
            onPress={handleCheckIn}
          />
          <GradientBorderButton
            label="Apostou"
            onPress={async () => {
              try {
                const container = Container.getInstance();
                await container.getResetBetStreakUseCase().execute();
                setShowCheckInModal(false);
                setShowResetConfirmModal(true);
                await loadBetStreak();
                await loadDashboard();
              } catch (error: any) {
                console.log("BetCheckIn apostou (reset):", error?.message ?? error);
                setShowCheckInModal(false);
              }
            }}
          />
        </View>
      </Modal>

      {/* Modal Já marcado */}
      <Modal
        visible={showAlreadyMarkedModal}
        onClose={() => setShowAlreadyMarkedModal(false)}
        size="small"
        title="Já marcado"
        subtitle="Já foi marcado. Aguarde 1 dia para marcar novamente."
      >
        <View style={styles.resetModalContent}>
          <GradientBorderButton
            label="Entendi"
            onPress={() => setShowAlreadyMarkedModal(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container Styles
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 160,
  },

  // Background
  backgroundGradient: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    zIndex: -1,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // Free of Bet Days Display (substitui o calendário de círculos 1–8)
  freeOfBetDaysContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  freeOfBetDaysLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 8,
  },
  freeOfBetDaysValueWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  checkInHint: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  checkInHintText: {
    color: "#B8B3BF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  freeOfBetDaysNumber: {
    fontSize: 56,
    fontWeight: "bold",
  },
  freeOfBetDaysUnit: {
    fontSize: 56,
    fontWeight: "bold",
    marginLeft: 4,
  },
  daysSkeleton: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysNumberPlaceholder: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  daysUnitPlaceholder: {
    width: 120,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 4,
  },

  // Free of Bet Box Styles
  freeOfBetContainer: {
    width: "96%",
    height: 140,
    alignSelf: "center",
    marginBottom: 0,
    marginTop: 10,
    padding: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
  },
  actionIconCircle: {
    backgroundColor: "#201F2A",
    borderRadius: 999,
    width: 65,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },

  // Divider
  dividerTouchable: {
    alignSelf: "center",
    width: "50%",
    paddingVertical: 10,
    marginTop: 10,
  },
  divider: {
    width: "100%",
    height: 5,
    borderRadius: 20,
  },

  // Cards Container
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
    
  },




  continueBoxTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  continueCardBorder: {
    borderRadius: 16,
    padding: 1,
    overflow: "hidden",
  },
  continueCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  continueText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // Continue Box (reuses roulette visual)
  continueBoxOuter: {
    marginVertical: 20,
    marginBottom: 60,
  },
  rouletteBox: {
    borderRadius: 24,
    padding: 20,
    paddingBottom: 20,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  // Reset Modal Styles
  resetModalContent: {
    alignItems: "center",
    paddingTop: 20,
  },
  blockModalContent: {
    alignItems: "center",
    paddingTop: 10,
  },
  checkInModalContent: {
    alignItems: "center",
    paddingTop: 20,
    gap: 12,
  },
  resetConfirmModalContent: {
    display: "none",
  },
});

export default Home;