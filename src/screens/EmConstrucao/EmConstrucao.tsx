import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

// Assets
import EmConstrucaoIcon from "../../assets/em-construcao.svg";

// Types
import { NavigationProp } from "../../types/navigation";

// Config
import { HORIZONTAL_GRADIENT_COLORS } from "../../config/colors";
import { RadialGradientBackground, GradientBorderButton } from "../../components";

interface EmConstrucaoProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

const EmConstrucao: React.FC<EmConstrucaoProps> = ({
  title = "Em Construção!",
  subtitle = "Essa feature ainda não esta disponível.",
  onBack,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { width, height } = useWindowDimensions();

  const circleSize = Math.min(width * 0.8, 340);
  const iconScale = circleSize / 340;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingBottom: Math.max(24, height * 0.05) }]}>
        {/* Background Gradient - Radial Effect */}
        <RadialGradientBackground style={styles.backgroundGradient} />

        <View style={[styles.content, { paddingTop: height * 0.1 }]}>
          <Text style={[styles.title, { fontSize: Math.min(42, width * 0.11) }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { fontSize: Math.min(20, width * 0.055), marginBottom: height * 0.07 }]}>
            {subtitle}
          </Text>

          <View style={[styles.iconContainer, { width: circleSize, height: circleSize }]}>
            <LinearGradient
              colors={HORIZONTAL_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.gradientCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}
            />
            <View style={styles.iconWrapper}>
              <EmConstrucaoIcon width={228 * iconScale} height={219 * iconScale} />
            </View>
          </View>
        </View>

        <GradientBorderButton
          label="Voltar"
          onPress={onBack ?? (() => navigation.goBack())}
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
  },
  title: {
    fontWeight: "bold",
    color: "#EAEAE5",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    color: "#A09CAB",
    textAlign: "center",
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  gradientCircle: {
    position: "absolute",
    opacity: 0.6,
  },
  iconWrapper: {
    position: "relative",
    zIndex: 1,
  },
});

export default EmConstrucao;

