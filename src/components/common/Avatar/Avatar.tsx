import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

interface AvatarProps {
  initials: string;
  size?: number;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({ 
  initials, 
  size = 48,
  style 
}) => {
  const fontSize = size * 0.5; // 50% do tamanho do círculo
  
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.initials, { fontSize }]}>
        {initials.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EAEAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default Avatar;

