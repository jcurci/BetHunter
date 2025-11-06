import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface IconCardProps {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
}

const IconCard: React.FC<IconCardProps> = ({ icon, title, onPress }) => {
  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={['#4A4855', '#2A2835', '#1A1825', '#2A2835', '#4A4855']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.borderGradient}
      >
        <TouchableOpacity style={styles.iconCard} onPress={onPress} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircleBorder}>
              {icon}
            </View>
          </View>
          <Text style={styles.iconCardTitle}>{title}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: 106,
    height: 106,
    borderRadius: 26,
    overflow: "hidden",
  },
  borderGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    padding: 1,
  },
  iconCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1825",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  iconContainer: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "center",
    lineHeight: 16,
  },
});

export default IconCard;

