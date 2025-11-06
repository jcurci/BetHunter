import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Entypo";
import { Footer, HomeAccountButton } from "../../components";
import { useNavigation } from "@react-navigation/native";
import ImageBitcoin from "../../assets/image-bitcoin.svg";
import ImageMoeda from "../../assets/image-moeda.svg";
import ImageGrafico from "../../assets/image-grafico.svg";
import Raio from "../../assets/home/raio.svg";
import Fogo from "../../assets/home/fogo.svg";
import { Container } from "../../infrastructure/di/Container";
import { Article } from "../../domain/entities/Article";
import { User } from "../../domain/entities/User";
import { LinearGradient } from "expo-linear-gradient";
import { NavigationProp } from "../../types/navigation";

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Exemplo: dias completados
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
      
      // TODO: Carregar dias completados do usuário
      // setCompletedDays(currentUser.completedDays || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getArticleImage = (article: Article): JSX.Element | null => {
    switch (article.imageUrl) {
      case "bitcoin":
        return <ImageBitcoin width="100%" height={90} />;
      case "moeda":
        return <ImageMoeda width="100%" height={90} />;
      case "grafico":
        return <ImageGrafico width="100%" height={90} />;
      default:
        return null;
    }
  };

  const renderDayItem = (day: number) => {
    const isChecked = completedDays.includes(day);
    
    return (
      <View key={day} style={styles.dayItemContainer}>
        <View style={styles.dayCircle}>
          <Text style={styles.dayNumber}>{day}</Text>
        </View>
        {isChecked ? (
          <Icon name="check" size={15} color="#D783D8" />
        ) : (
          <View style={styles.dayIndicatorEmpty} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background Gradient */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={["#443570", "#443045", "#2F2229", "#1A1923"]}
          locations={[0, 0.15, 0.32, 0.62]}
          start={{ x: 0.25, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          style={styles.gradient}
        />
      </View>

      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                Bom dia, {user?.name || "Usuário"}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              {/* Energia (Raio) */}
              <View style={styles.statItem}>
                <Raio width={13} height={19} style={styles.statIcon} />
                <Text style={styles.statText}>10</Text>
              </View>

              {/* Streak (Fogo) */}
              <View style={styles.streakContainer}>
                <Fogo width={17} height={20} style={styles.statIcon} />
                <Text style={styles.statText}>3d</Text>
              </View>
            </View>
          </View>

          {/* Contador de Dias do Mês */}
          <View style={styles.calendarSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.calendarScroll}
              contentContainerStyle={styles.calendarContent}
            >
              {Array.from({ length: 30 }, (_, idx) => renderDayItem(idx + 1))}
            </ScrollView>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* For You Section */}
          <Text style={styles.sectionTitle}>Para você</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carouselContainer}
          >
            {articles?.map((article: Article) => (
              <View key={article?.id} style={styles.articleCard}>
                <View style={styles.articleImageContainer}>
                  {getArticleImage(article)}
                </View>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article?.title || ""}
                </Text>
                <Text style={styles.articleDescription} numberOfLines={2}>
                  {article.description}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Continue Section */}
          <Text style={styles.sectionTitle}>Continue de onde parou</Text>
          <TouchableOpacity 
            style={styles.continueCard}
            onPress={() => navigation.navigate("Aprender")}
          >
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
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
  },
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 160,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statIcon: {
    marginRight: 6,
  },
  statText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  calendarSection: {
    marginBottom: 20,
  },
  calendarScroll: {
    marginTop: 6,
  },
  calendarContent: {
    paddingBottom: 4,
    paddingTop: 2,
  },
  dayItemContainer: {
    alignItems: "center",
    marginRight: 18,
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
  dayNumber: {
    color: "#d7d6e0",
    fontSize: 15,
    fontWeight: "600",
  },
  dayIndicatorEmpty: {
    width: 20,
    height: 2,
    backgroundColor: "#6B6677",
    borderRadius: 1,
  },
  divider: {
    width: "50%",
    height: 5,
    backgroundColor: "#A19DAA",
    borderRadius: 20,
    alignSelf: "center",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    marginTop: 10,
  },
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


