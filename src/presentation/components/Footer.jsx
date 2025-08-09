import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const Footer = ({ state, navigation }) => {
  const currentRouteName = state.routeNames[state.index];

  const isActive = (tabName) => currentRouteName === tabName;

  const handleTabPress = (tabName) => {
    // Se já estamos na tela atual, não faz nada
    if (currentRouteName === tabName) {
      return;
    }
    // Navega para a tela dentro do Tab Navigator
    navigation.navigate(tabName);
  };

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => handleTabPress("Home")}
      >
        <View
          style={
            isActive("Home")
              ? styles.activeIconWrapper
              : styles.inactiveIconWrapper
          }
        >
          <Icon
            name={isActive("Home") ? "home" : "home-outline"}
            size={24}
            color={isActive("Home") ? "#FFFFFF" : "#A09CAB"}
          />
        </View>
        <Text
          style={isActive("Home") ? styles.activeIconText : styles.iconText}
        >
          Home
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => handleTabPress("Aprender")}
      >
        <View
          style={
            isActive("Aprender")
              ? styles.activeIconWrapper
              : styles.inactiveIconWrapper
          }
        >
          <Icon
            name={isActive("Aprender") ? "book" : "book-outline"}
            size={24}
            color={isActive("Aprender") ? "#FFFFFF" : "#A09CAB"}
          />
        </View>
        <Text
          style={isActive("Aprender") ? styles.activeIconText : styles.iconText}
        >
          Aprender
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => handleTabPress("Gráficos")}
      >
        <View
          style={
            isActive("Gráficos")
              ? styles.activeIconWrapper
              : styles.inactiveIconWrapper
          }
        >
          <Icon
            name={isActive("Gráficos") ? "stats-chart" : "stats-chart-outline"}
            size={24}
            color={isActive("Gráficos") ? "#FFFFFF" : "#A09CAB"}
          />
        </View>
        <Text
          style={isActive("Gráficos") ? styles.activeIconText : styles.iconText}
        >
          Gráficos
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => handleTabPress("Jogar")}
      >
        <View
          style={
            isActive("Jogar")
              ? styles.activeIconWrapper
              : styles.inactiveIconWrapper
          }
        >
          <Icon
            name={
              isActive("Jogar") ? "game-controller" : "game-controller-outline"
            }
            size={24}
            color={isActive("Jogar") ? "#FFFFFF" : "#A09CAB"}
          />
        </View>
        <Text
          style={isActive("Jogar") ? styles.activeIconText : styles.iconText}
        >
          Jogar
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  tabButton: {
    alignItems: "center",
    padding: 5,
  },
  activeIconWrapper: {
    backgroundColor: "#7456C8",
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  inactiveIconWrapper: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconText: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 4,
  },
  activeIconText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 4,
  },
});

export default Footer;
