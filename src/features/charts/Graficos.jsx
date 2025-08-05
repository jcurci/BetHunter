import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Entypo";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const MARKET_DATA = [
  {
    id: 1,
    symbol: "BTC",
    name: "Bitcoin",
    price: "R$ 107.850,00",
    change: "+2.45%",
    changeType: "positive",
    volume: "R$ 45.2B",
  },
  {
    id: 2,
    symbol: "ETH",
    name: "Ethereum",
    price: "R$ 8.450,00",
    change: "-1.23%",
    changeType: "negative",
    volume: "R$ 18.7B",
  },
  {
    id: 3,
    symbol: "IBOV",
    name: "Ibovespa",
    price: "R$ 128.450,00",
    change: "+0.87%",
    changeType: "positive",
    volume: "R$ 12.3B",
  },
  {
    id: 4,
    symbol: "USD",
    name: "Dólar",
    price: "R$ 5,23",
    change: "-0.12%",
    changeType: "negative",
    volume: "R$ 8.9B",
  },
];

const INDICATORS = [
  {
    id: 1,
    name: "RSI",
    value: "65",
    status: "neutral",
    description: "Índice de Força Relativa",
  },
  {
    id: 2,
    name: "MACD",
    value: "Bullish",
    status: "positive",
    description: "Convergência/Divergência",
  },
  {
    id: 3,
    name: "Bollinger",
    value: "Upper",
    status: "warning",
    description: "Bandas de Bollinger",
  },
  {
    id: 4,
    name: "Volume",
    value: "High",
    status: "positive",
    description: "Volume de Negociação",
  },
];

const Graficos = () => {
  const navigation = useNavigation();
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");

  const timeframes = ["1H", "4H", "1D", "1W", "1M"];

  const getStatusColor = (status) => {
    switch (status) {
      case "positive":
        return "#4CAF50";
      case "negative":
        return "#F44336";
      case "warning":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const renderMarketCard = ({ item }) => (
    <TouchableOpacity style={styles.marketCard}>
      <View style={styles.marketHeader}>
        <View style={styles.symbolContainer}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.price}</Text>
          <Text
            style={[styles.change, { color: getStatusColor(item.changeType) }]}
          >
            {item.change}
          </Text>
        </View>
      </View>
      <Text style={styles.volume}>Vol: {item.volume}</Text>
    </TouchableOpacity>
  );

  const renderIndicatorCard = ({ item }) => (
    <View style={styles.indicatorCard}>
      <View style={styles.indicatorHeader}>
        <Text style={styles.indicatorName}>{item.name}</Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
      </View>
      <Text style={styles.indicatorValue}>{item.value}</Text>
      <Text style={styles.indicatorDescription}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gráficos</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Config")}>
            <Icon name="dots-three-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeframeScroll}
          >
            {timeframes.map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe &&
                    styles.timeframeButtonActive,
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === timeframe &&
                      styles.timeframeTextActive,
                  ]}
                >
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chart Placeholder */}
        <View style={styles.chartContainer}>
          <View style={styles.chartPlaceholder}>
            <Icon name="bar-graph" size={48} color="#333" />
            <Text style={styles.chartPlaceholderText}>
              Gráfico {selectedTimeframe}
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              Implemente sua biblioteca de gráficos preferida
            </Text>
          </View>
        </View>

        {/* Market Data */}
        <Text style={styles.sectionTitle}>Mercado</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.marketScroll}
        >
          {MARKET_DATA.map((item) => (
            <View key={item.id} style={styles.marketCard}>
              <View style={styles.marketHeader}>
                <View style={styles.symbolContainer}>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{item.price}</Text>
                  <Text
                    style={[
                      styles.change,
                      { color: getStatusColor(item.changeType) },
                    ]}
                  >
                    {item.change}
                  </Text>
                </View>
              </View>
              <Text style={styles.volume}>Vol: {item.volume}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Technical Indicators */}
        <Text style={styles.sectionTitle}>Indicadores Técnicos</Text>
        <View style={styles.indicatorsContainer}>
          {INDICATORS.map((item) => (
            <View key={item.id} style={styles.indicatorCard}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorName}>{item.name}</Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                />
              </View>
              <Text style={styles.indicatorValue}>{item.value}</Text>
              <Text style={styles.indicatorDescription}>
                {item.description}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  timeframeContainer: {
    marginBottom: 20,
  },
  timeframeScroll: {
    paddingHorizontal: 5,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
  },
  timeframeButtonActive: {
    backgroundColor: "#7456C8",
  },
  timeframeText: {
    fontSize: 14,
    color: "#A0A0A0",
    fontWeight: "600",
  },
  timeframeTextActive: {
    color: "#FFFFFF",
  },
  chartContainer: {
    height: 200,
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    marginBottom: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  chartPlaceholder: {
    alignItems: "center",
  },
  chartPlaceholderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  marketScroll: {
    paddingBottom: 10,
  },
  marketCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    minWidth: 150,
  },
  marketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  symbolContainer: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
  },
  volume: {
    fontSize: 11,
    color: "#A0A0A0",
  },
  indicatorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  indicatorCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    padding: 15,
    width: (width - 50) / 2 - 5,
    marginBottom: 15,
  },
  indicatorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  indicatorName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7456C8",
    marginBottom: 5,
  },
  indicatorDescription: {
    fontSize: 11,
    color: "#A0A0A0",
  },
});

export default Graficos;
