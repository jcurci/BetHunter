import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Raio from "../../../assets/home/raio.svg";
import Fogo from "../../../assets/home/fogo.svg";

interface StatsDisplayProps {
  energy?: number;
  streak?: string;
  style?: ViewStyle;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ 
  energy = 10, 
  streak = "3d",
  style 
}) => {
  return (
    <View style={[styles.statsContainer, style]}>
      {/* Energia */}
      <View style={styles.statRow}>
        <Raio width={13} height={19} style={styles.iconSpacing} />
        <Text style={styles.statText}>{energy}</Text>
      </View>
      
      {/* Streak */}
      <View style={[styles.statRow, styles.streakContainer]}>
        <Fogo width={17} height={20} style={styles.iconSpacing} />
        <Text style={styles.statText}>{streak}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  iconSpacing: {
    marginRight: 6,
  },
});

export default StatsDisplay;








