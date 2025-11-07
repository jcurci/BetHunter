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
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { IconCard } from "../../components";

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mock data - valores crescentes ao longo do mês
const chartData = {
  labels: ["1", "6", "11", "16", "21", "26", "31"],
  datasets: [
    {
      data: [5000, 6500, 7200, 9000, 11000, 13500, 15526.97],
      strokeWidth: 3,
    },
  ],
};

const Acessor: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"mensal">("mensal");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >


        {/* Título */}
        <Text style={styles.title}>Meu{"\n"}Acessor</Text>

        {/* Gráfico Container */}
        <View style={styles.chartContainer}>
          {/* Botão Mensal dentro do gráfico */}
          <TouchableOpacity
            style={styles.periodButton}
            activeOpacity={0.8}
            onPress={() => setSelectedPeriod("mensal")}
          >
            <Text style={styles.periodButtonText}>Mensal</Text>
          </TouchableOpacity>

          <View style={styles.chartGradientBg}>
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH - 40}
              height={280}
              chartConfig={{
                backgroundColor: "#14121B",
                backgroundGradientFrom: "#14121B",
                backgroundGradientTo: "#14121B",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 111, 157, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(167, 163, 174, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "0",
                  fill: "#FF8FA5",
                },
                propsForBackgroundLines: {
                  strokeDasharray: "",
                  stroke: "transparent",
                },
                strokeWidth: 3,
              }}
              bezier
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withDots={true}
              withShadow={false}
              style={styles.chart}
              segments={4}
            />
          </View>
        </View>

        {/* Valores - Entradas e Saídas */}
        <View style={styles.valuesContainer}>
          {/* Entradas */}
          <View style={styles.valueBoxContainer}>
            <View style={styles.valueBox}>
              <View style={styles.valueHeader}>
                <Text style={styles.valueLabel}>Entradas </Text>
                <Icon name="trending-up" size={20} color="#6BCB77" />
              </View>
              <Text style={styles.valueAmount}>
                <Text style={styles.currencySymbol}>R$</Text>
                15.526
                <Text style={styles.cents}>,97</Text>
              </Text>
            </View>
          </View>

          {/* Saídas */}
          <View style={styles.valueBoxContainer}>
            <View style={styles.valueBox}>
              <View style={styles.valueHeader}>
                <Text style={styles.valueLabel}>Saídas </Text>
                <Icon name="trending-down" size={20} color="#FF6B9D" />
              </View>
              <Text style={[styles.valueAmount, styles.valueAmountExit]}>
                <Text style={styles.currencySymbol}>R$</Text>
                12.357
                <Text style={styles.cents}>,62</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Categorias */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <View>
              <Text style={styles.categoriesTitle}>Categorias</Text>
              <Text style={styles.categoriesSubtitle}>
                Cadastre, edite, e confira categorias
              </Text>
            </View>
            <TouchableOpacity style={styles.verMaisButton}>
              <Text style={styles.verMaisText}>Ver mais</Text>
              <Icon name="chevron-right" size={20} color="#A7A3AE" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesCards}>
            <IconCard
              icon={<Icon name="plus" size={28} color="#D783D8" />}
              title="Nova categoria"
            />
            <IconCard
              icon={<Icon name="credit-card" size={28} color="#D783D8" />}
              title="Cartão de Crédito"
            />
            <IconCard
              icon={<Icon name="school" size={28} color="#D783D8" />}
              title="Educação"
            />
          </View>
        </View>

        {/* Entrada/Saída mais recente */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Entrada mais recente</Text>
            <TouchableOpacity style={styles.verHistoricoButton}>
              <Text style={styles.verHistoricoText}>Ver Histórico</Text>
              <Icon name="chevron-right" size={16} color="#A7A3AE" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.recentCard}
            activeOpacity={1}
          >
            <View style={styles.recentCardLeft}>
              <View style={styles.recentIconCircle}>
                <Icon name="school" size={24} color="#D783D8" />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentCategory}>Educação</Text>
                <Text style={styles.recentDescription}>Mensalidade Escolar</Text>
              </View>
            </View>

            <View style={styles.recentCardRight}>
              <Text style={styles.recentDate}>31 dez, 2024</Text>
              <Text style={styles.recentAmount}>-R$ 1213,00</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botões */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.8}
          >
            <Icon name="tag" size={20} color="#FF6B9D" />
            <Text style={styles.buttonText}>Nova Entrada</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.8}
          >
            <Icon name="account-plus" size={20} color="#D783D8" />
            <Text style={styles.buttonText}>Nova Categoria</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 60,
    marginBottom: 40,
  
  },
  periodButton: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#1F1D2B",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    zIndex: 10,
  },
  periodButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  chartContainer: {
    marginBottom: 40,
    overflow: "visible",
    borderRadius: 24,
    backgroundColor: "#14121B",
    position: "relative",
  },
  chartGradientBg: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 60,
    gap: 16,
  },
  valueBoxContainer: {
    flex: 1,
    backgroundColor: "#14121B",
    borderRadius: 20,
    padding: 20,
  },
  valueBox: {
    flex: 1,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  valueLabel: {
    fontSize: 16,
    color: "#A7A3AE",
    fontWeight: "500",
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6BCB77",
  },
  valueAmountExit: {
    color: "#FF6B9D",
  },
  currencySymbol: {
    fontSize: 20,
  },
  cents: {
    fontSize: 20,
  },

  // Categorias Section
  categoriesSection: {
    marginBottom: 40,
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  categoriesSubtitle: {
    fontSize: 14,
    color: "#A7A3AE",
  },
  verMaisButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  verMaisText: {
    fontSize: 14,
    color: "#A7A3AE",
    marginRight: 4,
  },
  categoriesCards: {
    flexDirection: "row",
    gap: 12,
  },

  // Recent Transaction Section
  recentSection: {
    marginBottom: 60,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  verHistoricoButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  verHistoricoText: {
    fontSize: 12,
    color: "#A7A3AE",
    marginRight: 2,
  },
  recentCard: {
    backgroundColor: "#14121B",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recentIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#201F2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recentDescription: {
    fontSize: 12,
    color: "#A7A3AE",
  },
  recentCardRight: {
    alignItems: "flex-end",
  },
  recentDate: {
    fontSize: 12,
    color: "#A7A3AE",
    marginBottom: 4,
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B9D",
  },

  // Buttons
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14121B",
    borderWidth: 1,
    borderColor: "#2C2A35",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default Acessor;

