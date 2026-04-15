import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface IconCardProps {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
  cardBackgroundColor?: string;
}

const IconCard: React.FC<IconCardProps> = ({
  icon,
  title,
  onPress,
  cardBackgroundColor,
}) => {
  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={['#4A4855', '#2A2835', '#1A1825', '#2A2835', '#4A4855']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.borderGradient}
      >
        <TouchableOpacity
          style={[
            styles.iconCard,
            cardBackgroundColor ? { backgroundColor: cardBackgroundColor } : null,
          ]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircleBorder}>
              {icon}
            </View>
          </View>
          <View  />
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
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 8,
    paddingBottom: 8,
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconCircleBorder: {
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    backgroundColor: "#201F2A",
  },
  spacer: {
    flex: 1,
  },
  iconCardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "left",
    marginLeft: 5,
    lineHeight: 14,
  },
});

export default IconCard;


