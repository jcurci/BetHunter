import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useNavigation } from "@react-navigation/native";
import { Footer, Avatar, BackIconButton, RadialGradientBackground } from "../../components";
import { Container } from "../../infrastructure/di/Container";
import { User } from "../../domain/entities/User";
import { NavigationProp } from "../../types/navigation";
import { HORIZONTAL_GRADIENT_COLORS } from "../../config/colors";
const HEATMAP_COLORS = ["#1A1825", "#3D2B5A", "#6B4D8A", "#9B6FB8", "#D783D8"];
const MONTHS_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Cell dimensions
const CELL_SIZE = 11;
const CELL_GAP = 3;
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;

// Calculate which weeks correspond to which months (approximate)
const getMonthPositions = () => {
  const positions: { month: string; weekIndex: number }[] = [];
  const weeksPerMonth = 52 / 12;
  MONTHS_LABELS.forEach((month, index) => {
    positions.push({
      month,
      weekIndex: Math.floor(index * weeksPerMonth),
    });
  });
  return positions;
};

// Generate mock heatmap data (52 weeks x 7 days)
// Structure: data[weekIndex][dayIndex] where dayIndex 0 = Sunday, 6 = Saturday
const generateHeatmapData = () => {
  const data: number[][] = [];
  for (let week = 0; week < 52; week++) {
    const weekData: number[] = [];
    for (let day = 0; day < 7; day++) {
      // Random activity level 0-4
      weekData.push(Math.floor(Math.random() * 5));
    }
    data.push(weekData);
  }
  return data;
};

const MinhaJornada: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [heatmapData] = useState(generateHeatmapData());
  const container = Container.getInstance();

  // Mock data
  const stats = {
    diasLivreApostas: 36,
    modulosCompletos: 84,
    valorTotal: 220701.24,
    ratingMedio: 2.7,
    ratings: {
      treseEstrelas: 65,
      duasEstrelas: 45,
      umaEstrela: 20,
    },
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userUseCase = container.getUserUseCase();
      const currentUser = await userUseCase.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return "JD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatCurrency = (value: number): string => {
    const formatted = value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const [intPart, decPart] = formatted.split(",");
    return `R$ ${intPart},${decPart}`;
  };

  const renderGradientText = (text: string, style: any) => (
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

  const monthPositions = getMonthPositions();

  const renderHeatmapCell = (level: number, weekIndex: number, dayIndex: number) => (
    <View
      key={`${weekIndex}-${dayIndex}`}
      style={[
        styles.heatmapCell,
        { backgroundColor: HEATMAP_COLORS[level] },
      ]}
    />
  );

  // Render a single week column (7 days vertically)
  const renderWeekColumn = (weekData: number[], weekIndex: number) => (
    <View key={`week-${weekIndex}`} style={styles.weekColumn}>
      {weekData.map((level, dayIndex) => renderHeatmapCell(level, weekIndex, dayIndex))}
    </View>
  );

  const renderRatingBar = (label: string, percentage: number) => (
    <View style={styles.ratingBarContainer}>
      <Text style={styles.ratingBarLabel}>{label}</Text>
      <View style={styles.ratingBarBackground}>
        <LinearGradient
          colors={HORIZONTAL_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ratingBarFill, { width: `${percentage}%` }]}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Minha{"\n"}Jornada</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Avatar initials={getInitials(user?.name)} size={80} />
            <Text style={styles.userName}>{user?.name || "Jhon Doe"}</Text>
            <Text style={styles.userHandle}>@{user?.name?.toLowerCase().replace(/\s+/g, "") || "jhondoe"}</Text>
          </View>

          {/* Stats Cards Row */}
          <View style={styles.statsRow}>
            {/* Days Card */}
            <View style={styles.statCard}>
              {renderGradientText(`${stats.diasLivreApostas}`, styles.statValueLarge)}
              {renderGradientText("Dias", styles.statValueSmall)}
              <Text style={styles.statDescription}>
                Recorde atual de dias respectivos usando o app
              </Text>
            </View>

            {/* Modules Card */}
            <View style={styles.statCard}>
              {renderGradientText(`${stats.modulosCompletos}`, styles.statValueLarge)}
              <Text style={styles.statDescription}>
                Módulos completos na trilha de aprendizado
              </Text>
            </View>
          </View>

          {/* Value Card */}
          <View style={styles.valueCard}>
            <View style={styles.valueRow}>
              {renderGradientText(formatCurrency(stats.valorTotal).split(",")[0] + ",", styles.valueText)}
              <Text style={styles.valueCents}>
                {formatCurrency(stats.valorTotal).split(",")[1]}
              </Text>
            </View>
            <Text style={styles.valueDescription}>
              Valor de todas as entradas e saídas já cadastradas no Meu Acessor
            </Text>
          </View>

          {/* Rating Card */}
          <View style={styles.ratingCard}>
            {renderGradientText(`${stats.ratingMedio}`, styles.ratingValue)}
            <Text style={styles.ratingDescription}>
              O seu rating médio nos quizzes e cursos do Bethunter
            </Text>
            <View style={styles.ratingBarsContainer}>
              {renderRatingBar("3 estrelas", stats.ratings.treseEstrelas)}
              {renderRatingBar("2 estrelas", stats.ratings.duasEstrelas)}
              {renderRatingBar("1 estrela", stats.ratings.umaEstrela)}
            </View>
          </View>

          {/* Heatmap Card */}
          <View style={styles.heatmapCard}>
            {renderGradientText("Heatmap", styles.heatmapTitle)}
            <Text style={styles.heatmapDescription}>
              O seu mapa de atividade no último ano dentro do Bethunter
            </Text>

            {/* Main Heatmap Container */}
            <View style={styles.heatmapMainContainer}>
              {/* Fixed Day Labels Column */}
              <View style={styles.dayLabelsColumn}>
                {/* Empty space for month labels alignment */}
                <View style={styles.dayLabelsHeader} />
                {/* Day labels */}
                {DAY_LABELS.map((day, index) => (
                  <View key={`day-${index}`} style={styles.dayLabelCell}>
                    {index % 2 === 1 && (
                      <Text style={styles.dayLabel}>{day}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Scrollable Grid Area */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.heatmapScrollView}
                contentContainerStyle={styles.heatmapScrollContent}
              >
                <View>
                  {/* Month Labels Row */}
                  <View style={styles.monthLabelsRow}>
                    {monthPositions.map(({ month, weekIndex }, index) => (
                      <Text
                        key={`month-${index}`}
                        style={[
                          styles.monthLabel,
                          { left: weekIndex * WEEK_WIDTH },
                        ]}
                      >
                        {month}
                      </Text>
                    ))}
                  </View>

                  {/* Weeks Grid (columns of days) */}
                  <View style={styles.weeksGrid}>
                    {heatmapData.map((weekData, weekIndex) =>
                      renderWeekColumn(weekData, weekIndex)
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <Text style={styles.legendText}>Menos</Text>
              {HEATMAP_COLORS.map((color, index) => (
                <View
                  key={`legend-${index}`}
                  style={[styles.legendCell, { backgroundColor: color }]}
                />
              ))}
              <Text style={styles.legendText}>Mais</Text>
            </View>
          </View>
          </ScrollView>
        </View>
      </RadialGradientBackground>
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
  },
  userHandle: {
    fontSize: 14,
    color: "#A09CAB",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1825",
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
  },
  statValueLarge: {
    fontSize: 48,
    fontWeight: "bold",
    lineHeight: 52,
  },
  statValueSmall: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: -8,
  },
  statDescription: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 8,
    lineHeight: 16,
  },
  valueCard: {
    backgroundColor: "#1A1825",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  valueText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  valueCents: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#A09CAB",
  },
  valueDescription: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 8,
    lineHeight: 16,
  },
  ratingCard: {
    backgroundColor: "#1A1825",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  ratingDescription: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  ratingBarsContainer: {
    gap: 12,
  },
  ratingBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: "#A09CAB",
    width: 60,
  },
  ratingBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#2B2935",
    borderRadius: 4,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  heatmapCard: {
    backgroundColor: "#1A1825",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  heatmapTitle: {
    fontSize: 32,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  heatmapDescription: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  heatmapMainContainer: {
    flexDirection: "row",
  },
  dayLabelsColumn: {
    marginRight: 6,
  },
  dayLabelsHeader: {
    height: 16,
  },
  dayLabelCell: {
    height: 11,
    marginBottom: 3,
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 9,
    color: "#A09CAB",
  },
  heatmapScrollView: {
    flex: 1,
  },
  heatmapScrollContent: {
    paddingRight: 16,
  },
  monthLabelsRow: {
    height: 16,
    flexDirection: "row",
    position: "relative",
    width: 52 * 14, // 52 weeks * (cell + gap)
  },
  monthLabel: {
    fontSize: 9,
    color: "#A09CAB",
    position: "absolute",
  },
  weeksGrid: {
    flexDirection: "row",
    gap: 3,
  },
  weekColumn: {
    gap: 3,
  },
  heatmapCell: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 3,
  },
  legendText: {
    fontSize: 9,
    color: "#A09CAB",
    marginHorizontal: 4,
  },
  legendCell: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
});

export default MinhaJornada;



