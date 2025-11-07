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
  const fontSize = size * 0.5; 
  
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
    backgroundColor: "#A09CAB",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#EAEAE5",
    fontWeight: "600",
  },
});

export default Avatar;

