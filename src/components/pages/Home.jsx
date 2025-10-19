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
import Footer from "../comum/Footer";
import { useNavigation } from "@react-navigation/native";
import ImageBitcoin from "../../assets/image-bitcoin.svg";
import ImageMoeda from "../../assets/image-moeda.svg";
import ImageGrafico from "../../assets/image-grafico.svg";
import { Container } from "../../infrastructure/di/Container";
import { Article } from "../../domain/entities/Article";
import HomeAccountButton from "../comum/HomeAccountButton";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const Home = () => {
  const navigation = useNavigation();
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
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

  const getArticleImage = (article) => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greetingText}>
              Bom dia, {user?.name || "Usuário"}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Config")}>
              <Icon name="dots-three-horizontal" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Points Card */}
          <LinearGradient
            colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pointsCard}
          >
            <View>
              <Text style={styles.pointsText}>
                Você tem {user?.points || 0} pontos
              </Text>
              <Text style={styles.pointsSubtitle}>
                Pode girar a roleta {Math.floor((user?.points || 0) / 10)} vezes
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Roulette")}>
              <Icon name="controller-record" size={30} color="#FFFFFF" />
              <Icon name="chevron-right" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Initiative Section */}
          <View style={styles.initiativeSection}>
            <Text style={styles.initiativeTitle}>
              Sua iniciativa já te gerou
            </Text>
            <MaskedView
              maskElement={
                <Text style={styles.initiativeAmount}>R$14.884,20</Text>
              }
            >
              <LinearGradient
                colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.initiativeAmount, { opacity: 0 }]}>
                  R$14.884,20
                </Text>
              </LinearGradient>
            </MaskedView>

            <TouchableOpacity style={{ alignItems: "center" }}>
              <MaskedView
                maskElement={
                  <Text style={styles.historyText}>Conferir histórico</Text>
                }
              >
                <LinearGradient
                  colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.historyText, { opacity: 0 }]}>
                    Conferir histórico
                  </Text>
                </LinearGradient>
              </MaskedView>
              <MaskedView
                maskElement={
                  <Icon name="chevron-down" size={24} color="#FFFFFF" />
                }
              >
                <LinearGradient
                  colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="chevron-down" size={24} style={{ opacity: 0 }} />
                </LinearGradient>
              </MaskedView>
            </TouchableOpacity>

            {/* Account Button */}
            <HomeAccountButton />
          </View>

          {/* For You Section */}
          <Text style={styles.sectionTitle}>Para você</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.carouselContainer}
          >
            {articles.map((article) => (
              <View key={article.id} style={styles.articleCard}>
                <View style={styles.articleImageContainer}>
                  {getArticleImage(article)}
                </View>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleDescription}>
                  {article.description}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Continue Section */}
          <Text style={styles.sectionTitle}>Continue de onde parou</Text>
          <TouchableOpacity style={styles.continueCard}>
            <Text style={styles.continueText}>Fundamentos: 1/4</Text>
            <Icon name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
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
    alignItems: "center",
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  pointsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#7456C8", // Solid color instead of gradient
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  pointsSubtitle: {
    fontSize: 14,
    color: "#D0D0D0",
  },
  initiativeSection: {
    marginBottom: 20,
  },
  initiativeTitle: {
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 5,
  },
  initiativeAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFA500",
    marginBottom: 5,
  },
  historyText: {
    fontSize: 14,
    color: "#A09CAB",
    textDecorationLine: "underline",
    marginBottom: 0,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
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
  articleImagePlaceholder: {
    width: "100%",
    height: 90,
    backgroundColor: "#333",
    borderRadius: 8,
    marginBottom: 10,
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
