import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface IconCardProps {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
}

const IconCard: React.FC<IconCardProps> = ({ icon, title, onPress }) => {
  return (
    <TouchableOpacity style={styles.iconCard} onPress={onPress}>
      <View style={styles.iconCardGradient}>
        <View style={styles.iconCircleBorder}>
          {icon}
        </View>
      </View>
      <Text style={styles.iconCardTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconCard: {
    flex: 1,
    backgroundColor: "#15121B",
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#201F2A",
    minHeight: 100,
  },
  iconCardGradient: {
    marginBottom: 20,
  },
  iconCircleBorder: {
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: 48,
    height: 48,
    backgroundColor: "#201F2A",
  },
  iconCardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "left",
    lineHeight: 16,
  },
});

export default IconCard;


