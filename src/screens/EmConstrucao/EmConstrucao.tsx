import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

// Assets
import EmConstrucaoIcon from "../../assets/em-construcao.svg";

// Types
import { NavigationProp } from "../../types/navigation";

// Constants
const TEXT_GRADIENT_COLORS = ["#7456C8", "#D783D8", "#FF90A5", "#FF8071"];
const BACKGROUND_GRADIENT_COLORS = ["#443570", "#443045", "#2F2229", "#0F0E11", "#000000"];
const BACKGROUND_GRADIENT_LOCATIONS = [0, 0.15, 0.32, 0.62, 1];

const EmConstrucao: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Background Gradient - Top to Bottom */}
        <LinearGradient
          colors={BACKGROUND_GRADIENT_COLORS}
          locations={BACKGROUND_GRADIENT_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.backgroundGradient}
        />

        <View style={styles.content}>
          <Text style={styles.title}>Em Construção!</Text>
          <Text style={styles.subtitle}>
            Essa feature ainda não esta disponível.
          </Text>

          <View style={styles.iconContainer}>
            <LinearGradient
              colors={TEXT_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            />
            <View style={styles.iconWrapper}>
              <EmConstrucaoIcon width={228} height={219} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
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
  button: {
    backgroundColor: "#1C1C1C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EmConstrucao;

