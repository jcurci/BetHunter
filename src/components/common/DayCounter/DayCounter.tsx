import React from "react";
import { View, Text, StyleSheet, ScrollView, ViewStyle, Image } from "react-native";

interface DayCounterProps {
  startDay?: number;
  endDay?: number;
  checkedDays?: number[];
  style?: ViewStyle;
  // Modo com ícones de fogo
  useFireIcons?: boolean;
  activeFires?: number; // Quantidade de fogueiras ativas (coloridas)
  totalFires?: number; // Total de fogueiras a mostrar
  finalNumber?: number; // Número final a mostrar após os ícones
}

const DayCounter: React.FC<DayCounterProps> = ({
  startDay = 21,
  endDay = 27,
  checkedDays = [],
  style,
  useFireIcons = false,
  activeFires = 0,
  totalFires = 6,
  finalNumber,
}) => {
  if (useFireIcons) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.calendarScroll, style]}
        contentContainerStyle={styles.calendarContent}
      >
        {Array.from({ length: totalFires }).map((_, index) => {
          const isActive = index < activeFires;
          
          return (
            <View key={`fire-${index}`} style={styles.dayContainer}>
              <View style={styles.dayCircle}>
                <Image
                  source={
                    isActive
                      ? require("../../../assets/icon-fire.png")
                      : require("../../../assets/icon-gray-fire.png")
                  }
                  style={styles.fireIcon}
                  resizeMode="contain"
                />
              </View>
            </View>
          );
        })}
        {finalNumber !== undefined && (
          <View style={styles.dayContainer}>
            <View style={styles.dayCircle}>
              <Text style={styles.dayText}>{finalNumber}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.calendarScroll, style]}
      contentContainerStyle={styles.calendarContent}
    >
      {days.map((day) => {
        const isChecked = checkedDays.includes(day);

        return (
          <View key={day} style={styles.dayContainer}>
            <View style={styles.dayCircle}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
            {checkedDays.length > 0 && (
              isChecked ? (
                <View style={styles.checkedIndicator} />
              ) : (
                <View style={styles.dayUnchecked} />
              )
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  checkedIndicator: {
    width: 20,
    height: 2,
    backgroundColor: "#D783D8",
    borderRadius: 1,
  },
  dayUnchecked: {
    width: 20,
    height: 2,
    backgroundColor: "#6B6677",
    borderRadius: 1,
  },
  fireIcon: {
    width: 20,
    height: 20,
  },
});

export default DayCounter;

