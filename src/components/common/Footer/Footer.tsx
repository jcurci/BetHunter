import React, { useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Text, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Icon from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation, StackActions } from "@react-navigation/native";
import { RootStackParamList, NavigationProp } from "../../../types/navigation";
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from "../../../config/colors";

interface TabButtonProps {
  routeName: keyof RootStackParamList;
  iconName: string;
  iconNameOutline: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  iconName,
  iconNameOutline,
  label,
  isActive,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [scaleAnim]);

  const name = isActive ? iconName : iconNameOutline;
  const size = 28;

  const renderIcon = () => {
    if (isActive) {
      return (
        <MaskedView
          maskElement={
            <View style={styles.iconMask}>
              <Icon name={name} size={size} color="#FFFFFF" />
            </View>
          }
        >
          <LinearGradient
            colors={HORIZONTAL_GRADIENT_COLORS}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.iconGradient}
          >
            <Icon name={name} size={size} color="transparent" />
          </LinearGradient>
        </MaskedView>
      );
    }
    return <Icon name={name} size={size} color="#A09CAB" />;
  };

  return (
    <Pressable
      style={styles.tabButton}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {renderIcon()}
      </Animated.View>
      <Animated.Text
        style={[
          isActive ? styles.activeIconText : styles.iconText,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const Footer: React.FC = () => {
  const route = useRoute();
  const currentRouteName = route.name as keyof RootStackParamList;
  const navigation = useNavigation<NavigationProp>();

  const isActive = (tabName: keyof RootStackParamList): boolean => 
    currentRouteName === tabName;

  const handleNavigate = useCallback(
    (routeName: keyof RootStackParamList) => {
      if (currentRouteName !== routeName) {
        // Usa replace para transição mais suave entre tabs principais
        navigation.dispatch(StackActions.replace(routeName));
      }
    },
    [currentRouteName, navigation]
  );

  return (
    <View style={styles.footerContainer}>
      <TabButton
        routeName="Home"
        iconName="home"
        iconNameOutline="home-outline"
        label="Home"
        isActive={isActive("Home")}
        onPress={() => handleNavigate("Home")}
      />
      <TabButton
        routeName="MenuEducacional"
        iconName="book"
        iconNameOutline="book-outline"
        label="Aprender"
        isActive={isActive("MenuEducacional")}
        onPress={() => handleNavigate("MenuEducacional")}
      />
      <TabButton
        routeName="Acessor"
        iconName="wallet"
        iconNameOutline="wallet-outline"
        label="Acessor"
        isActive={isActive("Acessor")}
        onPress={() => handleNavigate("Acessor")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#05040A",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    alignItems: "center",
    padding: 0,
    flex: 1,
    justifyContent: "center",
  },
  iconWrapper: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  iconMask: {
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  iconGradient: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 12,
    color: "#A09CAB",
    marginTop: 0,
  },
  activeIconText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 0,
  },
});

export default Footer;
