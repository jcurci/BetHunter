import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTheme } from "../../contexts/ThemeContext";

const ThemeToggle = () => {
  const { currentTheme, toggleTheme, colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const getThemeIndex = (theme) => {
    const themes = ["default", "xp", "xpDark"];
    return themes.indexOf(theme);
  };

  useEffect(() => {
    const targetValue = getThemeIndex(currentTheme);
    Animated.timing(slideAnim, {
      toValue: targetValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [currentTheme, slideAnim]);

  const handleToggle = () => {
    toggleTheme();
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [2, 82, 162], // Posições para 3 botões de 75px cada
  });

  const getThemeConfig = (themeName) => {
    switch (themeName) {
      case "default":
        return { color: "#7456C8", icon: "moon", label: "Padrão" };
      case "xp":
        return { color: "#FFD200", icon: "sun", label: "XP" };
      case "xpDark":
        return { color: "#FFD700", icon: "sunset", label: "XP Dark" };
      default:
        return { color: "#7456C8", icon: "moon", label: "Padrão" };
    }
  };

  const currentConfig = getThemeConfig(currentTheme);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Tema</Text>

      <View style={styles.toggleWrapper}>
        <TouchableOpacity
          style={[styles.toggleContainer, { backgroundColor: colors.border }]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.slider,
              {
                transform: [{ translateX }],
                backgroundColor: currentConfig.color,
              },
            ]}
          >
            <Icon name={currentConfig.icon} size={16} color="#000" />
          </Animated.View>

          <View style={styles.labelsContainer}>
            <View style={styles.themeOption}>
              <Icon
                name="moon"
                size={14}
                color={
                  currentTheme === "default"
                    ? colors.text
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color:
                      currentTheme === "default"
                        ? colors.text
                        : colors.textSecondary,
                    fontWeight: currentTheme === "default" ? "bold" : "normal",
                  },
                ]}
              >
                Padrão
              </Text>
            </View>

            <View style={styles.themeOption}>
              <Icon
                name="sun"
                size={14}
                color={currentTheme === "xp" ? "#000000" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color:
                      currentTheme === "xp" ? "#000000" : colors.textSecondary,
                    fontWeight: currentTheme === "xp" ? "bold" : "normal",
                  },
                ]}
              >
                XP
              </Text>
            </View>

            <View style={styles.themeOption}>
              <Icon
                name="sunset"
                size={14}
                color={
                  currentTheme === "xpDark" ? "#000000" : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color:
                      currentTheme === "xpDark"
                        ? "#000000"
                        : colors.textSecondary,
                    fontWeight: currentTheme === "xpDark" ? "bold" : "normal",
                  },
                ]}
              >
                XP Dark
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Indicador do tema atual */}
        <View style={styles.indicatorContainer}>
          <View
            style={[styles.dot, currentTheme === "default" && styles.activeDot]}
          />
          <View
            style={[styles.dot, currentTheme === "xp" && styles.activeDot]}
          />
          <View
            style={[styles.dot, currentTheme === "xpDark" && styles.activeDot]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  toggleWrapper: {
    alignItems: "center",
  },
  toggleContainer: {
    width: 244, // 3 x 78px + margens
    height: 36,
    borderRadius: 18,
    position: "relative",
    justifyContent: "center",
    marginBottom: 8,
  },
  slider: {
    position: "absolute",
    width: 78,
    height: 32,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
    justifyContent: "center",
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    height: "100%",
  },
  themeOption: {
    alignItems: "center",
    justifyContent: "center",
    width: 78,
    height: "100%",
  },
  toggleLabel: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },
  indicatorContainer: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#666",
  },
  activeDot: {
    backgroundColor: "#FFD700",
  },
});

export default ThemeToggle;
