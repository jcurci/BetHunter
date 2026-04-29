import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Raio from "../../../assets/home/raio.svg";
import Fogo from "../../../assets/home/fogo.svg";

interface StatsDisplayProps {
  energy?: number;
  streak?: string;
  style?: ViewStyle;
  loading?: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ 
  energy, 
  streak,
  style,
  loading = false
}) => {
  if (loading) {
    return (
      <View style={[styles.statsContainer, style]}>
        {/* Energia - Loading */}
        <View style={styles.statRow}>
          <Raio width={13} height={19} style={styles.iconSpacing} />
          <View style={styles.placeholder} />
        </View>
        
        {/* Streak - Loading */}
        <View style={[styles.statRow, styles.streakContainer]}>
          <Fogo width={17} height={20} style={styles.iconSpacing} />
          <View style={styles.placeholder} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.statsContainer, style]}>
      {/* Energia */}
      <View style={styles.statRow}>
        <Raio width={13} height={19} style={styles.iconSpacing} />
        <Text style={styles.statText}>{energy ?? 0}</Text>
      </View>
      
      {/* Streak */}
      <View style={[styles.statRow, styles.streakContainer]}>
        <Fogo width={17} height={20} style={styles.iconSpacing} />
        <Text style={styles.statText}>{streak ?? "0d"}</Text>
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
  placeholder: {
    width: 32,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default StatsDisplay;








