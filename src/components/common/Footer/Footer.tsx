import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import IconHome from "../../../assets/icon-home.svg";
import { RootStackParamList, NavigationProp } from "../../../types/navigation";

const Footer: React.FC = () => {
  const route = useRoute();
  const currentRouteName = route.name as keyof RootStackParamList;
  const navigation = useNavigation<NavigationProp>();

  const isActive = (tabName: keyof RootStackParamList): boolean => 
    currentRouteName === tabName;

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Home")}
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
        onPress={() => navigation.navigate("Aprender")}
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
        onPress={() => navigation.navigate("Graficos")}
      >
        <View
          style={
            isActive("Graficos")
              ? styles.activeIconWrapper
              : styles.inactiveIconWrapper
          }
        >
          <Icon
            name={isActive("Graficos") ? "stats-chart" : "stats-chart-outline"}
            size={24}
            color={isActive("Graficos") ? "#FFFFFF" : "#A09CAB"}
          />
        </View>
        <Text
          style={isActive("Graficos") ? styles.activeIconText : styles.iconText}
        >
          Gráficos
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Roulette")}
      >
        <View
          style={
            isActive("Roulette")
              ? styles.activeIconWrapper
              : styles.inactiveIconWrapper
          }
        >
          <Icon
            name={
              isActive("Roulette") ? "game-controller" : "game-controller-outline"
            }
            size={24}
            color={isActive("Roulette") ? "#FFFFFF" : "#A09CAB"}
          />
        </View>
        <Text
          style={isActive("Roulette") ? styles.activeIconText : styles.iconText}
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
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    alignItems: "center",
    padding: 0,
    flex: 1,
    justifyContent: "center",
  },
  activeIconWrapper: {
    backgroundColor: "#7456C8",
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  inactiveIconWrapper: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  iconText: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 0,
  },
  activeIconText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 0,
  },
});

export default Footer;


