import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Bem-vindo ao BetHunter</Text>
        <Text style={styles.subtitle}>Sua plataforma de apostas</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
});

export default Home;
