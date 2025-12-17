import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { Footer } from "../../components";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import Svg, { Polyline } from "react-native-svg";

const { width } = Dimensions.get("window");

const Graficos = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountBalance, setAccountBalance] = useState("R$14.884,20");
  const [selectedPeriod, setSelectedPeriod] = useState("Essa semana");
  const [chartData, setChartData] = useState(null);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadChartData(), loadInvestmentsData()]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadChartData = async () => {
    // Simulando dados do gráfico principal com variação realista
    const mockChartData = {
      labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
      datasets: [
        {
          data: [14800, 14920, 14850, 15010, 14980, 15120, 14884],
          color: (opacity = 1) => `rgba(116, 86, 200, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
    setChartData(mockChartData);
  };

  const loadInvestmentsData = async () => {
    try {
      // Dados mockados baseados em ações reais com variações realistas
      const mockInvestments = [
        {
          id: 1,
          ticker: "MSFT",
          company: "Microsoft Corp.",
          logo: require("../../assets/icon-bolsa/microsoft-icon.png"),
          currentValue: "$524,28",
          percentageChange: 0.06,
          isPositive: true,
          miniChartData: [522, 523, 524, 523.5, 524.28],
        },
        {
          id: 2,
          ticker: "GOOGL",
          company: "Alphabet Inc.",
          logo: require("../../assets/icon-bolsa/google-icon.png"),
          currentValue: "$244,62",
          percentageChange: -0.46,
          isPositive: false,
          miniChartData: [246, 245.5, 245, 244.8, 244.62],
        },
        {
          id: 3,
          ticker: "SPOT",
          company: "Spotify Technology",
          logo: require("../../assets/icon-bolsa/spotify-icon.png"),
          currentValue: "$675,23",
          percentageChange: -0.77,
          isPositive: false,
          miniChartData: [680, 678, 677, 676, 675.23],
        },
        {
          id: 4,
          ticker: "NVDA",
          company: "Nvidia Corp.",
          logo: require("../../assets/icon-bolsa/nvidia-icon.png"),
          currentValue: "$188,98",
          percentageChange: 2.13,
          isPositive: true,
          miniChartData: [185, 186, 187, 188, 188.98],
        },
        {
          id: 5,
          ticker: "AAPL",
          company: "Apple Inc.",
          logo: require("../../assets/icon-bolsa/apple-icon.png"),
          currentValue: "$257,99",
          percentageChange: 0.59,
          isPositive: true,
          miniChartData: [256, 256.5, 257, 257.5, 257.99],
        },
        {
          id: 6,
          ticker: "TSLA",
          company: "Tesla Inc.",
          logo: require("../../assets/icon-bolsa/tesla-icon.png"),
          currentValue: "$439,44",
          percentageChange: 1.47,
          isPositive: true,
          miniChartData: [433, 435, 437, 438, 439.44],
        },
      ];
      setInvestments(mockInvestments);
    } catch (error) {
      console.error("Error loading investments:", error);
    }
  };

  const renderMiniChart = (data, isPositive) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1; // Evita divisão por zero

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 40;
        const y = 20 - ((value - min) / range) * 20;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <View style={styles.miniChartContainer}>
        <Svg width="50" height="25" style={styles.miniChart}>
          <Polyline
            points={points}
            fill="none"
            stroke={isPositive ? "#4CAF50" : "#F44336"}
            strokeWidth="2"
          />
        </Svg>
      </View>
    );
  };

  const renderInvestmentItem = (investment) => (
    <TouchableOpacity key={investment.id} style={styles.investmentItem}>
      <View style={styles.investmentLeft}>
        <View style={styles.logoContainer}>
          <Image source={investment.logo} style={styles.logoImage} />
        </View>
        <View style={styles.investmentInfo}>
          <Text style={styles.tickerText}>{investment.ticker}</Text>
          <Text style={styles.companyText}>{investment.company}</Text>
        </View>
      </View>

      <View style={styles.investmentRight}>
        {renderMiniChart(investment.miniChartData, investment.isPositive)}
        <View style={styles.valueContainer}>
          <Text style={styles.currentValue}>{investment.currentValue}</Text>
          <View style={styles.percentageContainer}>
            <Icon
              name={investment.isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={investment.isPositive ? "#4CAF50" : "#F44336"}
            />
            <Text
              style={[
                styles.percentageText,
                { color: investment.isPositive ? "#4CAF50" : "#F44336" },
              ]}
            >
              {investment.isPositive ? "+" : ""}
              {investment.percentageChange}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const periods = ["Essa semana", "Este mês", "Este ano"];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7456C8" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7456C8"
            colors={["#7456C8"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gráficos</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Account Summary Card */}
        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountTitle}>Conta</Text>
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>{selectedPeriod}</Text>
              <Icon name="chevron-down" size={16} color="#7456C8" />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceValue}>123,91</Text>
            <Text style={styles.balanceCurrency}>$BET</Text>
          </View>
          <View style={styles.chartArea}>
            <LineChart
              data={chartData}
              width={width - 80}
              height={120}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom: "transparent",
                backgroundGradientTo: "transparent",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(116, 86, 200, ${opacity})`,
                labelColor: (opacity = 0) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#7456C8",
                },
                fillShadowGradient: "#7456C8",
                fillShadowGradientOpacity: 0.3,
              }}
              bezier
              withHorizontalLabels={false}
              withVerticalLabels={false}
              withDots={true}
              withShadow={true}
              style={styles.areaChart}
            />
          </View>
        </View>

        {/* Asset Visualizer Section */}
        <View style={styles.investmentsSection}>
          <View style={styles.investmentsHeader}>
            <Text style={styles.investmentsTitle}>Visualizador de Ativos</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Icon name="chevron-right" size={20} color="#7456C8" />
            </TouchableOpacity>
          </View>

          <View style={styles.investmentsList}>
            {investments.map(renderInvestmentItem)}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7456C8",
  },
  accountCard: {
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    padding: 20,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 14,
    color: "#7456C8",
    marginRight: 5,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 20,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  balanceCurrency: {
    fontSize: 16,
    color: "#A0A0A0",
    marginLeft: 8,
  },
  chartArea: {
    height: 120,
    justifyContent: "center",
  },
  areaChart: {
    marginVertical: 0,
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  investmentsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  investmentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  investmentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  seeAllButton: {
    padding: 5,
  },
  investmentsList: {
    gap: 0,
  },
  investmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  investmentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  investmentInfo: {
    flex: 1,
  },
  tickerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  companyText: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  investmentRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniChartContainer: {
    marginRight: 15,
  },
  miniChart: {
    backgroundColor: "transparent",
  },
  valueContainer: {
    alignItems: "flex-end",
  },
  currentValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 2,
  },
});

export default Graficos;
