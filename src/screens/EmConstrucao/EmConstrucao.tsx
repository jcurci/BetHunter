import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

// Assets
import EmConstrucaoIcon from "../../assets/em-construcao.svg";

// Types
import { NavigationProp } from "../../types/navigation";

// Config
import { HORIZONTAL_GRADIENT_COLORS } from "../../config/colors";
import { RadialGradientBackground, GradientBorderButton } from "../../components";

const EmConstrucao: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Background Gradient - Radial Effect */}
        <RadialGradientBackground style={styles.backgroundGradient} />

        <View style={styles.content}>
          <Text style={styles.title}>Em Construção!</Text>
          <Text style={styles.subtitle}>
            Essa feature ainda não esta disponível.
          </Text>

          <View style={styles.iconContainer}>
            <LinearGradient
              colors={HORIZONTAL_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            />
            <View style={styles.iconWrapper}>
              <EmConstrucaoIcon width={228} height={219} />
            </View>
          </View>
        </View>

        <GradientBorderButton
          label="Voltar"
          onPress={() => navigation.goBack()}
        />
      </View>
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
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    zIndex: -1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 86,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#EAEAE5",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: "#A09CAB",
    textAlign: "center",
    marginBottom: 60,
  },
  iconContainer: {
    position: "relative",
    width: 340,
    height: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientCircle: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.6,
  },
  iconWrapper: {
    position: "relative",
    zIndex: 1,
  },
});

export default EmConstrucao;

