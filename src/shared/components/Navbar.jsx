import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Navbar = () => {
  return (
    <View style={styles.navbar}>
      <Text style={styles.title}>BetHunter</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    height: 60,
    backgroundColor: "#2c3e50",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default Navbar;
