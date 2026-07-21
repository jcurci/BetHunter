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
import { BlurView } from "expo-blur";
import {
  BUTTON_GLASS_BACKGROUND,
  BUTTON_GLASS_BORDER_COLOR,
  BUTTON_GLASS_BLUR_INTENSITY,
  BUTTON_GLASS_SHADOW,
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
 * Botão padrão do app — "Button/Glass/Inactive" do Figma.
 * Preenchimento preto a 40%, blur do que está atrás e sombra 0/1/8 a 10%.
 *
 * O nome do componente vem do desenho anterior (borda gradiente + miolo
 * escuro) e foi mantido para não quebrar as 7 telas que o importam.
 *
 * A view de fora carrega a sombra e o preenchimento; a de dentro recorta o
 * blur. Separadas porque `overflow: hidden` na mesma view apagaria a sombra,
 * e no iOS a sombra precisa de um fundo para ser desenhada.
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
    <View
      style={[
        styles.shadow,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.clip}>
        <BlurView
          intensity={BUTTON_GLASS_BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <TouchableOpacity
          style={styles.button}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 30,
    backgroundColor: BUTTON_GLASS_BACKGROUND,
    ...BUTTON_GLASS_SHADOW,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  clip: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BUTTON_GLASS_BORDER_COLOR,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GradientBorderButton;
