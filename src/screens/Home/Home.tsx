import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Entypo";
import MaskedView from "@react-native-masked-view/masked-view";

// Components
import { Footer, StatsDisplay } from "../../components";

// Assets
import ImageBitcoin from "../../assets/image-bitcoin.svg";
import ImageMoeda from "../../assets/image-moeda.svg";
import ImageGrafico from "../../assets/image-grafico.svg";
import Meditation from "../../assets/home/meditation.svg";
import Reset from "../../assets/home/reset.svg";
import Block from "../../assets/home/block.svg";

// Domain & Infrastructure
import { Container } from "../../infrastructure/di/Container";
import { Article } from "../../domain/entities/Article";
import { User } from "../../domain/entities/User";
import { NavigationProp } from "../../types/navigation";

// Constants
const GRADIENT_COLORS = ["#443570", "#443045", "#2F2229", "#1A1923"];
const GRADIENT_LOCATIONS = [0, 0.15, 0.32, 0.62];
const GRADIENT_HEIGHT_COLLAPSED = 242;
const GRADIENT_HEIGHT_EXPANDED = 450;
const DAYS_IN_MONTH = 30;
const TEXT_GRADIENT_COLORS = ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]; // Adicione esta linha

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showFreeOfBetBox, setShowFreeOfBetBox] = useState<boolean>(false);
  const container = Container.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const articleUseCase = container.getArticleUseCase();
      const userUseCase = container.getUserUseCase();

      const [articlesData, currentUser] = await Promise.all([
        articleUseCase.getArticles(),
        userUseCase.getCurrentUser(),
      ]);

      setArticles(articlesData);
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getArticleImage = (article: Article): JSX.Element | null => {
    const imageMap: Record<string, JSX.Element> = {
      bitcoin: <ImageBitcoin width="100%" height={90} />,
      moeda: <ImageMoeda width="100%" height={90} />,
      grafico: <ImageGrafico width="100%" height={90} />,
    };

    return imageMap[article.imageUrl] || null;
  };

  const toggleFreeOfBetBox = () => {
    setShowFreeOfBetBox(!showFreeOfBetBox);
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
            colors={TEXT_GRADIENT_COLORS}
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
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconCircle}>
                <Meditation width={24} height={24} />
              </View>
              <Text style={styles.actionText}>Meditar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconCircle}>
                <Reset width={24} height={24} />
              </View>
              <Text style={styles.actionText}>Resetar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
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
          {/* Background Gradient */}
          <LinearGradient
            colors={GRADIENT_COLORS}
            locations={GRADIENT_LOCATIONS}
            start={{ x: 0.25, y: 0 }}
            end={{ x: 0.75, y: 1 }}
            style={[
              styles.backgroundGradient,
              {
                height: showFreeOfBetBox
                  ? GRADIENT_HEIGHT_EXPANDED
                  : GRADIENT_HEIGHT_COLLAPSED,
              },
            ]}
          />

          {renderHeader()}
          
          {renderDayCalendar()}
          
          {renderFreeOfBetBox()}

          {/* Divider */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleFreeOfBetBox}
            style={styles.dividerTouchable}
          >
            <View style={styles.divider} />
          </TouchableOpacity>

          {/* Seção Conta, Parceiros, Social */}
          <View style={{ flexDirection: "row", justifyContent: "flex-start", marginVertical: 10 }}>
            {/* Conta Button (Active) */}
            <LinearGradient
              colors={TEXT_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 12,
                padding: 1.2,
                marginRight: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: "#161522",
                  borderRadius: 12,
                  paddingHorizontal: 18,
                  paddingVertical: 6,
                }}>
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "500",
                    fontSize: 15,
                  }}
                >
                  Conta
                </Text>
              </View>
            </LinearGradient>

            {/* Parceiros Button (Inactive) */}
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "#161522",
                paddingHorizontal: 18,
                paddingVertical: 6,
                marginRight: 8,
                borderWidth: 1,
                borderColor: "#282232",
              }}
            >
              <Text
                style={{
                  color: "#C7C3D1",
                  fontWeight: "500",
                  fontSize: 15,
                }}
              >
                Parceiros
              </Text>
            </View>
            
            {/* Social Button (Inactive) */}
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "#161522",
                paddingHorizontal: 18,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: "#282232",
              }}
            >
              <Text
                style={{
                  color: "#C7C3D1",
                  fontWeight: "500",
                  fontSize: 15,
                }}
              >
                Social
              </Text>
            </View>
          </View>

          {/* Cards Container: Minha Conta, Meu Acessor, Minha Jornada */}
          <View style={styles.cardsContainer}>
            {/* Minha Conta */}
            <TouchableOpacity style={styles.iconCard}>
              <View style={styles.iconCardGradient}>
                <View style={styles.iconCircleBorder}>
                  <Text style={styles.iconEmoji}>🐱</Text>
                </View>
              </View>
              <Text style={styles.iconCardTitle}>Minha</Text>
              <Text style={styles.iconCardTitle}>Conta</Text>
            </TouchableOpacity>

            {/* Meu Acessor */}
            <TouchableOpacity style={styles.iconCard}>
              <View style={styles.iconCardGradient}>
                <View style={styles.iconCircleBorder}>
                  <Text style={styles.iconEmoji}>💼</Text>
                </View>
              </View>
              <Text style={styles.iconCardTitle}>Meu</Text>
              <Text style={styles.iconCardTitle}>Acessor</Text>
            </TouchableOpacity>

            {/* Minha Jornada */}
            <TouchableOpacity style={styles.iconCard}>
              <View style={styles.iconCardGradient}>
                <View style={styles.iconCircleBorder}>
                  <Text style={styles.iconEmoji}>🎯</Text>
                </View>
              </View>
              <Text style={styles.iconCardTitle}>Minha</Text>
              <Text style={styles.iconCardTitle}>Jornada</Text>
            </TouchableOpacity>
          </View>

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
    marginBottom: 28,
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
    backgroundColor: "#A19DAA",
    borderRadius: 20,
  },

  // Cards Container (Minha Conta, Meu Acessor, Minha Jornada)
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    gap: 12,
  },
  iconCard: {
    flex: 1,
    backgroundColor: "#14121B",
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "14121B",
    minHeight: 100,
  },
  iconCardGradient: {
    marginBottom: 20,
  },
  iconCircleBorder: {
    borderWidth: 2,
    borderColor: "#201F2A",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: 48,
    height: 48,
    backgroundColor: "#201F2A",
  },
  iconEmoji: {
    fontSize: 24,
  },
  iconCardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "left",
    lineHeight: 16,
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
});

export default Home;
