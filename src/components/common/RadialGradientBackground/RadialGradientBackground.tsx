import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
} from '../../../config/colors';

interface RadialGradientBackgroundProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Componente de gradiente radial reutilizável
 * Cria um efeito de "spotlight" onde a cor roxa irradia do centro superior
 * e as bordas laterais ficam mais escuras
 */
const RadialGradientBackground: React.FC<RadialGradientBackgroundProps> = ({
  style,
  children,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Vertical gradient from top center */}
      <LinearGradient
        colors={BACKGROUND_GRADIENT_COLORS}
        locations={BACKGROUND_GRADIENT_LOCATIONS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Left shadow overlay */}
      <LinearGradient
        colors={SHADOW_OVERLAY_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Right shadow overlay */}
      <LinearGradient
        colors={SHADOW_OVERLAY_COLORS}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
});

export default RadialGradientBackground;

