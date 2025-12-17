import React, { useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Entypo";
import MaskedView from "@react-native-masked-view/masked-view";

// Components
import { Footer, StatsDisplay, IconCard, RadialGradientBackground, GradientBorderButton } from "../../components";
import Modal from "../../components/common/Modal/Modal";

// Config
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
  HORIZONTAL_GRADIENT_COLORS,
} from "../../config/colors";

// Assets
import ImageBitcoin from "../../assets/image-bitcoin.svg";
import ImageMoeda from "../../assets/image-moeda.svg";
import ImageGrafico from "../../assets/image-grafico.svg";
import Meditation from "../../assets/home/meditation.svg";
import Reset from "../../assets/home/reset.svg";
import Block from "../../assets/home/block.svg";
import BetHunterIcon from "../../assets/home/bethunter.svg";
import AcessorIcon from "../../assets/home/acessor.svg";
import JornadaIcon from "../../assets/home/jornada.svg";
import MedicoIcon from "../../assets/home/medico.svg";
import EventosIcon from "../../assets/home/eventos.svg";
import CursosIcon from "../../assets/home/cursos.svg";
import ForumsIcon from "../../assets/home/forums.svg";
import ArtigosIcon from "../../assets/home/artigos.svg";
import VideosIcon from "../../assets/home/videos.svg";
import BetcoinIcon from "../../assets/home/betcoin.svg";

// Domain & Infrastructure

import { NavigationProp } from "../../types/navigation";

// Constants
const GRADIENT_HEIGHT_COLLAPSED = 242;
const GRADIENT_HEIGHT_EXPANDED = 450;
const DAYS_IN_MONTH = 30;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_WIDTH = SCREEN_WIDTH - 40; // 20px padding em cada lado

type TabType = "conta" | "parceiros" | "social";

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [articles, setArticles] = useState<any[]>([]);
  const [user, setUser] = useState<string | null>(null);
  const [showFreeOfBetBox, setShowFreeOfBetBox] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("conta");
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showBlockSuccessModal, setShowBlockSuccessModal] = useState<boolean>(false);
  const carouselRef = useRef<ScrollView>(null);
  

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
  
  };

  const getArticleImage = (article: any): ReactElement | null => {
    const imageMap: Record<string, ReactElement> = {
      bitcoin: <ImageBitcoin width="100%" height={90} />,
      moeda: <ImageMoeda width="100%" height={90} />,
      grafico: <ImageGrafico width="100%" height={90} />,
    };

    return imageMap[article.imageUrl] || null;
  };

  const toggleFreeOfBetBox = () => {
    setShowFreeOfBetBox(!showFreeOfBetBox);
  };

  const getTabIndex = (tab: TabType): number => {
    const tabs: TabType[] = ["conta", "parceiros", "social"];
    return tabs.indexOf(tab);
  };

  const getTabByIndex = (index: number): TabType => {
    const tabs: TabType[] = ["conta", "parceiros", "social"];
    return tabs[index] || "conta";
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    const index = getTabIndex(tab);
    carouselRef.current?.scrollTo({
      x: index * CAROUSEL_WIDTH,
      animated: true,
    });
  };

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CAROUSEL_WIDTH);
    const newTab = getTabByIndex(index);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const renderTabButton = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    
    if (isActive) {
      return (
        <TouchableOpacity
          key={tab}
          onPress={() => handleTabPress(tab)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={HORIZONTAL_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabButtonGradient}
          >
            <View style={styles.tabButtonInner}>
              <Text style={styles.tabButtonTextActive}>{label}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={tab}
        onPress={() => handleTabPress(tab)}
        style={styles.tabButtonInactive}
        activeOpacity={0.8}
      >
        <Text style={styles.tabButtonTextInactive}>{label}</Text>
      </TouchableOpacity>
    );
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
              "John Doe"
            </Text>
          </LinearGradient>
        </MaskedView>
      </View>
      
      <StatsDisplay energy={10} streak="3d" />
    </View>
  );

  const renderDayCalendar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.calendarScroll}
      contentContainerStyle={styles.calendarContent}
    >
      {Array.from({ length: DAYS_IN_MONTH }).map((_, idx) => {
        const day = idx + 1;
        const isChecked = day < 27; // Ajustar lógica conforme dados reais
        
        return (
          <View key={day} style={styles.dayContainer}>
            <View style={styles.dayCircle}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
            {isChecked ? (
              <Icon name="check" size={15} color="#D783D8" />
            ) : (
              <View style={styles.dayUnchecked} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  const renderFreeOfBetBox = () => (
    <View
      style={[
        styles.freeOfBetContainer,
        showFreeOfBetBox && styles.freeOfBetContainerExpanded,
      ]}
    >
      {showFreeOfBetBox && (
        <>
          <Text style={styles.freeOfBetTitle}>
            Você está livre de apostas por:
          </Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>15d</Text>
            <Text style={styles.timerText}>7hrs</Text>
            <Text style={[styles.timerText, styles.timerWarning]}>21mins</Text>
            <Text style={[styles.timerText, styles.timerDanger, styles.timerSeconds]}>
              17s
            </Text>
          </View>
          
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
              onPress={() => setShowBlockModal(true)}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconCircle}>
                <Block width={27} height={27} />
              </View>
              <Text style={styles.actionText}>Bloquear</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderArticleCard = (article: Article) => (
    <View key={article.id} style={styles.articleCard}>
      <View style={styles.articleImageContainer}>
        {getArticleImage(article)}
      </View>
      <Text style={styles.articleTitle} numberOfLines={2}>
        {article.title}
      </Text>
      <Text style={styles.articleDescription} numberOfLines={2}>
        {article.description}
      </Text>
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
                height: showFreeOfBetBox
                  ? GRADIENT_HEIGHT_EXPANDED
                  : GRADIENT_HEIGHT_COLLAPSED,
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
          
          {renderDayCalendar()}
          
          {renderFreeOfBetBox()}

          {/* Divider */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleFreeOfBetBox}
            style={styles.dividerTouchable}
          >
            <LinearGradient
              colors={HORIZONTAL_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />
          </TouchableOpacity>

          {/* Seção Conta, Parceiros, Social - Tabs */}
          <View style={styles.tabsContainer}>
            {renderTabButton("conta", "Conta")}
            {renderTabButton("parceiros", "Parceiros")}
            {renderTabButton("social", "Social")}
          </View> 

          {/* Carousel - Cards dinâmicos baseados na aba ativa */}
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCarouselScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={CAROUSEL_WIDTH}
            snapToAlignment="center"
            contentContainerStyle={styles.carouselContentContainer}
            style={styles.carousel}
          >
            {/* Conta */}
            <View style={[styles.cardsContainer, { width: CAROUSEL_WIDTH }]}>
              <IconCard 
                icon={<BetHunterIcon width={24} height={24} />} 
                title="Minha Conta" 
                onPress={() => navigation.navigate("MinhaConta")}
              />
              <IconCard 
                icon={<AcessorIcon width={24} height={24} />} 
                title="Meu Acessor" 
                onPress={() => navigation.navigate("Acessor")}
              />
              <IconCard 
                icon={<JornadaIcon width={24} height={24} />} 
                title="Minha  Jornada" 
                onPress={() => navigation.navigate("MinhaJornada")}
              />
            </View>

            {/* Parceiros */}
            <View style={[styles.cardsContainer, { width: CAROUSEL_WIDTH }]}>
              <IconCard 
                icon={<MedicoIcon width={24} height={24} />} 
                title="Consultas" 
              />
              <IconCard 
                icon={<EventosIcon width={24} height={24} />} 
                title="Eventos" 
              />
              <IconCard 
                icon={<CursosIcon width={24} height={24} />} 
                title="Cursos" 
              />
            </View>

            {/* Social */}
            <View style={[styles.cardsContainer, { width: CAROUSEL_WIDTH }]}>
              <IconCard 
                icon={<ForumsIcon width={24} height={24} />} 
                title="Fóruns" 
              />
              <IconCard 
                icon={<ArtigosIcon width={24} height={24} />} 
                title="Artigos" 
              />
              <IconCard 
                icon={<VideosIcon width={24} height={24} />} 
                title="Vídeos" 
              />
            </View>
          </ScrollView>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {["conta", "parceiros", "social"].map((tab, index) => (
              <View
                key={tab}
                style={[
                  styles.dot,
                  activeTab === tab && styles.dotActive
                ]}
              />
            ))}
          </View>

          {/* Betcoins Roulette Box */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Roulette")}
            style={styles.rouletteBoxContainer}
          >
            <View style={styles.rouletteBox}>
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
              
              <View style={styles.rouletteContent}>
                <View style={styles.rouletteTextContainer}>
                  <View style={styles.rouletteTextInner}>
                    <Text style={styles.rouletteTitle}>Você tem</Text>
                    <View style={styles.betcoinsRow}>
                      <Text style={styles.betcoinsAmount}>
                        {user?.betcoins || 40}
                      </Text>
                 
                      <MaskedView
                        maskElement={
                          <Text style={styles.betcoinsTextMask}>
                            betcoins
                          </Text>
                        }
                      >
                        <LinearGradient
                          colors={HORIZONTAL_GRADIENT_COLORS}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.betcoinsGradient}
                        >
                          <Text style={styles.betcoinsTextHidden}>
                            betcoins
                          </Text>
                        </LinearGradient>
                      </MaskedView>
                    </View>
                  </View>
                  <Text style={styles.rouletteSubtitle}>
                    Toque aqui para ir a roleta
                  </Text>
                </View>
                <View style={styles.rouletteIconContainer}>
                  <BetcoinIcon width={93} height={67} />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Seção Para Você */}
          <Text style={styles.sectionTitle}>Para você</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carouselContainer}
          >
            {articles?.map(renderArticleCard)}
          </ScrollView>

          {/* Seção Continue */}
          <Text style={styles.sectionTitle}>Continue de onde parou</Text>
          <TouchableOpacity style={styles.continueCard}>
            <Text style={styles.continueText}>Fundamentos: 1/4</Text>
            <Icon name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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
            onPress={() => {
              // TODO: Implementar lógica de reset do contador
              setShowResetModal(false);
              setShowResetConfirmModal(true);
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
            onPress={() => {
              // TODO: Implementar lógica de bloqueio VPN
              setShowBlockModal(false);
              setShowBlockSuccessModal(true);
            }}
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

  // Calendar Styles
  calendarScroll: {
    marginBottom: 20,
    marginTop: 6,
  },
  calendarContent: {
    gap: 18,
    paddingBottom: 4,
    paddingTop: 2,
  },
  dayContainer: {
    alignItems: "center",
  },
  dayCircle: {
    backgroundColor: "#232027",
    borderRadius: 999,
    width: 43,
    height: 43,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  dayText: {
    color: "#D7D6E0",
    fontSize: 15,
    fontWeight: "600",
  },
  dayUnchecked: {
    width: 20,
    height: 2,
    backgroundColor: "#6B6677",
    borderRadius: 1,
  },

  // Free of Bet Box Styles
  freeOfBetContainer: {
    width: "50%",
    height: 5,
    alignSelf: "center",
    marginBottom: 0,
    marginTop: 10,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#915BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  freeOfBetContainerExpanded: {
    width: "96%",
    height: 210, 
    padding: 20,
    justifyContent: "flex-start",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
   
  },
  freeOfBetTitle: {
    color: "#A19DAA",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 9,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  timerText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#B382FA",
    marginRight: 6,
  },
  timerWarning: {
    color: "#F37F98",
  },
  timerDanger: {
    color: "#FF6FA6",
  },
  timerSeconds: {
    fontSize: 19,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 7,
  },
  actionIconCircle: {
    backgroundColor: "#191922",
    borderRadius: 999,
    width: 62,
    height: 62,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
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

  // Tabs Styles
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: 10,
  },
  tabButtonGradient: {
    borderRadius: 12,
    padding: 1.2,
    marginRight: 8,
  },
  tabButtonInner: {
    backgroundColor: "#161522",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 15,
  },
  tabButtonInactive: {
    borderRadius: 12,
    backgroundColor: "#161522",
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#282232",
  },
  tabButtonTextInactive: {
    color: "#C7C3D1",
    fontWeight: "500",
    fontSize: 15,
  },

  // Cards Container (Minha Conta, Meu Acessor, Minha Jornada)
  carousel: {
    marginVertical: 20,
  },
  carouselContentContainer: {
    paddingHorizontal: 0,
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  // Dots Indicator
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3A3644",
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D783D8",
  },

  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },

  // Article Carousel Styles
  carouselContainer: {
    marginBottom: 20,
  },
  articleCard: {
    backgroundColor: "#1C1C1C",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    width: 150,
  },
  articleImageContainer: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  articleDescription: {
    fontSize: 12,
    color: "#A0A0A0",
  },

  // Continue Card Styles
  continueCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    padding: 15,
    borderRadius: 10,
    marginBottom: 60,
  },
  continueText: {
    fontSize: 16,
    color: "#FFFFFF",
  },

  // Roulette Box Styles
  rouletteBoxContainer: {
    marginVertical: 20,
  },
  rouletteBox: {
    borderRadius: 24,
    padding: 20,
    paddingBottom: 16,
    minHeight: 140,
    justifyContent: "flex-end",
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  rouletteContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 15,
  },
  rouletteTextContainer: {
    flex: 1,
  },
  rouletteTextInner: {
    marginBottom: 0,
  },
  rouletteTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "400",
  },
  betcoinsRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  betcoinsAmount: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  coinEmoji: {
    fontSize: 24,
    marginHorizontal: 4,
  },
  betcoinsText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  betcoinsTextMask: {
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "transparent",
  },
  betcoinsGradient: {
    flex: 1,
  },
  betcoinsTextHidden: {
    fontSize: 48,
    fontWeight: "bold",
    opacity: 0,
  },
  rouletteSubtitle: {
    fontSize: 14,
    color: "#B8B3BF",
    fontWeight: "400",
  },
  rouletteIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chevronIcon: {
    marginLeft: 4,
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
  resetConfirmModalContent: {
    display: "none",
  },
});

export default Home;
