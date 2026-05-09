import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ActivityIndicator,
  TextInput,
  Keyboard,
  InteractionManager,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Entypo";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
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
import { ValidationError } from "../../domain/errors/CustomErrors";
import { useAuthStore } from "../../storage/authStore";
import { useDashboardStore } from "../../storage/dashboardStore";
import { NavigationProp, RootStackParamList } from "../../types/navigation";

// Constants
const GRADIENT_HEIGHT_EXPANDED = 450;

type BlockFlowStep = "choices" | "report";

/** Saudação segundo o relógio local do dispositivo (pt-BR). */
function periodGreetingLabel(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia,";
  if (hour >= 12 && hour < 18) return "Boa tarde,";
  return "Boa noite,";
}

const { BetBlocker, BetBlocking } = NativeModules;
const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Home">>();
  const user = useAuthStore((s) => s.user);
  
  // Dashboard store
  const { 
    dashboard, 
    betStreak, 
    canCheckIn, 
    isLoading, 
    loadAll, 
    updateAfterCheckIn 
  } = useDashboardStore();
  
  // Modal states
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showBlockFlowModal, setShowBlockFlowModal] = useState<boolean>(false);
  const [blockFlowStep, setBlockFlowStep] = useState<BlockFlowStep>("choices");
  const blockFlowFade = useRef(new Animated.Value(1)).current;
  const [reportHouseName, setReportHouseName] = useState<string>("");
  const [reportHouseUrl, setReportHouseUrl] = useState<string>("");
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  const animateBlockFlowToStep = useCallback(
    (step: BlockFlowStep) => {
      Keyboard.dismiss();
      Animated.timing(blockFlowFade, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(({ finished }) => {
        if (!finished) return;
        setBlockFlowStep(step);
        Animated.timing(blockFlowFade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      });
    },
    [blockFlowFade]
  );
  const [showBlockSuccessModal, setShowBlockSuccessModal] = useState<boolean>(false);
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [showAlreadyMarkedModal, setShowAlreadyMarkedModal] = useState<boolean>(false);
  const [isCheckInSubmitting, setIsCheckInSubmitting] = useState<boolean>(false);
  
  // Calcula statsReady baseado no store
  const statsReady = !isLoading && dashboard !== null;

  const [greetingLine, setGreetingLine] = useState<string>(() => periodGreetingLabel());

  useFocusEffect(
    useCallback(() => {
      setGreetingLine(periodGreetingLabel());
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (route.params?.openBlockFlow !== true) return;
      blockFlowFade.setValue(1);
      setBlockFlowStep("choices");
      setShowBlockFlowModal(true);
      navigation.setParams({ openBlockFlow: undefined });
    }, [navigation, route.params?.openBlockFlow, blockFlowFade])
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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


  const handleDaysPress = () => {
    if (canCheckIn) {
      setShowCheckInModal(true);
    } else {
      setShowAlreadyMarkedModal(true);
    }
  };

  const handleCheckIn = async () => {
    setShowCheckInModal(false);
    setIsCheckInSubmitting(true);
    try {
      const container = Container.getInstance();
      const result = await container.getBetCheckInUseCase().execute();
      updateAfterCheckIn(result.betStreak, result.nextCheckInAt);
    } catch (error: any) {
      console.log("BetCheckIn POST:", error?.message ?? error);
      Alert.alert("Erro", "Não foi possível registrar o check-in. Tente novamente.");
    } finally {
      setIsCheckInSubmitting(false);
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

  const handleActivateBlockFlow = () => {
    setShowBlockFlowModal(false);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (Platform.OS === "ios" && BetBlocking?.openBlockingFlow) {
          try {
            BetBlocking.openBlockingFlow();
          } catch (e: unknown) {
            console.warn("BetBlocking.openBlockingFlow", e);
          }
          return;
        }
        setShowBlockModal(true);
      }, 400);
    });
  };

  const closeBlockFlowModal = (): void => {
    if (isSubmittingReport) return;
    setShowBlockFlowModal(false);
    setBlockFlowStep("choices");
    blockFlowFade.setValue(1);
    setReportHouseName("");
    setReportHouseUrl("");
  };

  const handleSubmitBettingHouseReport = async (): Promise<void> => {
    Keyboard.dismiss();
    setIsSubmittingReport(true);
    try {
      const useCase = Container.getInstance().getSubmitBettingHouseReportUseCase();
      await useCase.execute(reportHouseName, reportHouseUrl);
      closeBlockFlowModal();
      Alert.alert(
        "Obrigado!",
        "Recebemos sua denúncia. Vamos avaliar para incluir na lista de bloqueio."
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente.";
      if (error instanceof ValidationError) {
        Alert.alert("Atenção", msg);
      } else {
        Alert.alert("Erro", msg);
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };



  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{greetingLine}</Text>
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
        disabled={!statsReady || isCheckInSubmitting}
        style={styles.freeOfBetDaysValueWrapper}
      >
        {!statsReady ? (
          <View style={styles.daysSkeleton}>
            <View style={styles.daysNumberPlaceholder} />
            <View style={styles.daysUnitPlaceholder} />
          </View>
        ) : isCheckInSubmitting ? (
          <ActivityIndicator size="small" color="#B8A8E8" />
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
            blockFlowFade.setValue(1);
            setBlockFlowStep("choices");
            setShowBlockFlowModal(true);
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
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
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

      <Modal
        visible={showBlockFlowModal}
        onClose={closeBlockFlowModal}
        size="big"
        title="Proteção e denúncias"
        subtitle="Configure o bloqueio neste dispositivo ou nos informe um site ou app para incluir na lista."
      >
        <Animated.View style={{ opacity: blockFlowFade }}>
          {blockFlowStep === "choices" ? (
            <View style={styles.blockActionModalContent}>
              <View style={styles.blockChoiceCard}>
                <View style={styles.blockChoiceHeader}>
                  <View style={styles.blockChoiceIconCircle}>
                    <MaterialCommunityIcons
                      name="shield-lock-outline"
                      size={26}
                      color="#C9A7E8"
                    />
                  </View>
                  <View style={styles.blockChoiceHeaderText}>
                    <Text style={styles.blockChoiceTitle}>
                      {Platform.OS === "ios"
                        ? "Proteção neste iPhone"
                        : "Ativar bloqueio (VPN)"}
                    </Text>
                    <Text style={styles.blockChoiceDesc}>
                      {Platform.OS === "ios"
                        ? "Abre Tempo de Uso para escolher apps e aplicar bloqueios."
                        : "Instalação do perfil VPN para filtrar sites de apostas no dispositivo."}
                    </Text>
                  </View>
                </View>
                <GradientBorderButton
                  label={Platform.OS === "ios" ? "Configurar bloqueio" : "Ativar bloqueio"}
                  onPress={handleActivateBlockFlow}
                />
              </View>

              <View style={styles.blockActionOrRow}>
                <View style={styles.blockActionOrLine} />
                <Text style={styles.blockActionOrText}>ou</Text>
                <View style={styles.blockActionOrLine} />
              </View>

              <View style={[styles.blockChoiceCard, styles.blockChoiceCardMuted]}>
                <View style={styles.blockChoiceHeader}>
                  <View style={[styles.blockChoiceIconCircle, styles.blockChoiceIconCircleMuted]}>
                    <MaterialCommunityIcons
                      name="flag-outline"
                      size={26}
                      color="#E8B07A"
                    />
                  </View>
                  <View style={styles.blockChoiceHeaderText}>
                    <Text style={styles.blockChoiceTitle}>Informar casa de apostas</Text>
                    <Text style={styles.blockChoiceDesc}>
                      Envie o nome e a URL para avaliarmos e incluir na lista de bloqueio.
                    </Text>
                  </View>
                </View>
                <GradientBorderButton
                  label="Denunciar casa de apostas"
                  onPress={() => animateBlockFlowToStep("report")}
                />
              </View>
            </View>
          ) : (
            <View style={styles.reportForm}>
              <TouchableOpacity
                style={styles.blockFlowBackButton}
                onPress={() => animateBlockFlowToStep("choices")}
                disabled={isSubmittingReport}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10 }}
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color="#9E9AA8" />
                <Text style={styles.blockFlowBackText}>Voltar às opções</Text>
              </TouchableOpacity>
              <Text style={styles.reportLabel}>Nome da casa</Text>
              <TextInput
                style={styles.reportInput}
                value={reportHouseName}
                onChangeText={setReportHouseName}
                placeholder='Ex.: "Nome da casa"'
                placeholderTextColor="#726E7C"
                autoCapitalize="sentences"
                editable={!isSubmittingReport}
              />
              <Text style={styles.reportLabel}>URL</Text>
              <TextInput
                style={styles.reportInput}
                value={reportHouseUrl}
                onChangeText={setReportHouseUrl}
                placeholder="exemplo.com ou https://..."
                placeholderTextColor="#726E7C"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmittingReport}
              />
              <GradientBorderButton
                label="Enviar denúncia"
                onPress={() => void handleSubmitBettingHouseReport()}
                loading={isSubmittingReport}
              />
            </View>
          )}
        </Animated.View>
      </Modal>

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
                await loadAll();
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
            loading={isCheckInSubmitting}
          />
          <GradientBorderButton
            label="Apostou"
            onPress={async () => {
              try {
                const container = Container.getInstance();
                await container.getResetBetStreakUseCase().execute();
                setShowCheckInModal(false);
                setShowResetConfirmModal(true);
                await loadAll();
              } catch (error: any) {
                console.log("BetCheckIn apostou (reset):", error?.message ?? error);
                setShowCheckInModal(false);
              }
            }}
            disabled={isCheckInSubmitting}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    flexGrow: 1,
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
    marginBottom: 24,
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
  blockActionModalContent: {
    width: "100%",
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    gap: 20,
    alignSelf: "stretch",
  },
  blockChoiceCard: {
    width: "100%",
    backgroundColor: "#14121B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2F2A3E",
    padding: 18,
    gap: 16,
  },
  blockChoiceCardMuted: {
    borderColor: "#3A3428",
    backgroundColor: "#121018",
  },
  blockChoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  blockChoiceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(168, 120, 220, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  blockChoiceIconCircleMuted: {
    backgroundColor: "rgba(232, 176, 122, 0.12)",
  },
  blockChoiceHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  blockChoiceTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  blockChoiceDesc: {
    color: "#A09CAB",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  blockActionOrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
    width: "100%",
  },
  blockActionOrLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  blockActionOrText: {
    color: "#726E7C",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  reportForm: {
    paddingTop: 4,
    gap: 10,
    width: "100%",
    alignSelf: "stretch",
  },
  blockFlowBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    marginBottom: 6,
    paddingVertical: 4,
    paddingRight: 8,
    opacity: 0.92,
  },
  blockFlowBackText: {
    color: "#9E9AA8",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: -2,
  },
  reportLabel: {
    color: "#B8B3BF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  reportInput: {
    backgroundColor: "#201F2A",
    borderWidth: 1,
    borderColor: "#34303D",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 8,
    width: "100%",
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