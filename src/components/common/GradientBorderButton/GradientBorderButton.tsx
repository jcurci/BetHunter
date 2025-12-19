import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  BUTTON_BORDER_GRADIENT_COLORS,
  BUTTON_BORDER_GRADIENT_LOCATIONS,
  BUTTON_BORDER_GRADIENT,
  BUTTON_HIGHLIGHT_COLORS,
  BUTTON_INNER_BACKGROUND,
  BUTTON_INNER_BORDER_COLOR,
} from "../../../config/colors";

interface GradientBorderButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

/**
 * Botão com borda gradiente (estilo igual ao componente de pesquisa)
 * Usado para botões de confirmação (Continuar, Confirmar, Voltar, etc.)
 * Efeito: borda com gradiente + highlight no topo + fundo escuro interno
 */
const GradientBorderButton: React.FC<GradientBorderButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth, style]}>
      <LinearGradient
        colors={BUTTON_BORDER_GRADIENT_COLORS}
        locations={BUTTON_BORDER_GRADIENT_LOCATIONS}
        start={BUTTON_BORDER_GRADIENT.start}
        end={BUTTON_BORDER_GRADIENT.end}
        style={[styles.gradientBorder, fullWidth && styles.fullWidth]}
      >
        {/* Highlight no topo */}
        <LinearGradient
          colors={BUTTON_HIGHLIGHT_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.highlight}
          pointerEvents="none"
        />
        
        <TouchableOpacity
          style={[styles.innerButton, fullWidth && styles.fullWidth]}
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={[styles.buttonText, textStyle]}>{label}</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    borderRadius: 30,
  },
  gradientBorder: {
    borderRadius: 30,
    padding: 1,
  },
  fullWidth: {
    width: "100%",
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderRadius: 30,
    opacity: 0.9,
  },
  innerButton: {
    backgroundColor: BUTTON_INNER_BACKGROUND,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BUTTON_INNER_BORDER_COLOR,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GradientBorderButton;

