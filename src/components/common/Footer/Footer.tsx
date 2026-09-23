import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
  LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Icon from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainerRef, StackActions } from "@react-navigation/native";
import { RootStackParamList } from "../../../types/navigation";
import {
  GLASS_BORDER_COLORS,
  GLASS_BORDER_LOCATIONS,
  GLASS_HIGHLIGHT_COLORS,
} from "../../../config/colors";
import { useAuthStore } from "../../../storage/authStore";
import { useTabBarStore } from "../../../storage/tabBarStore";
import Avatar from "../Avatar/Avatar";

const INACTIVE = "#D6D3DC";
const BAR_BASE_HEIGHT = 52;
const CONTAINER_PADDING_TOP = 6;
/** Sem home indicator (Android com gestos/fullscreen), a barra ainda respira da borda. */
const MIN_BOTTOM_PADDING = 22;
const TAB_COUNT = 4;
/** Respiro interno da barra em volta da pílula ativa. */
const BAR_PADDING = 4;

type RouteName = keyof RootStackParamList;

/**
 * Telas em que a taskbar aparece, e qual aba cada uma acende (-1 = nenhuma).
 * Toda tela listada aqui precisa reservar `useFooterHeight()` no fim do scroll,
 * porque a barra flutua por cima do conteúdo.
 */
const TAB_BAR_ROUTES: Partial<Record<RouteName, number>> = {
  Home: 0,
  MenuEducacional: 1,
  Cursos: 1,
  CursosSalvos: 1,
  ModoOrcamento: 2,
  Graficos: -1,
  MinhaJornada: -1,
};

const footerScale = (width: number) => Math.min(Math.max(width / 393, 0.85), 1.2);

/**
 * Altura total ocupada pela taskbar (respiro + barra + área segura inferior).
 * As telas com taskbar somam isto ao paddingBottom do conteúdo, para o último
 * item conseguir rolar para cima da barra.
 */
export function useFooterHeight(): number {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    CONTAINER_PADDING_TOP +
    Math.round(BAR_BASE_HEIGHT * footerScale(width)) +
    Math.max(insets.bottom, MIN_BOTTOM_PADDING)
  );
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onPress, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
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

  return (
    <Pressable
      style={styles.tabButton}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={null}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

interface FooterProps {
  /** Rota ativa, lida do NavigationContainer no App. */
  currentRoute: string | undefined;
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}

/**
 * Taskbar global em "liquid glass".
 *
 * Montada UMA vez no App, por cima do Stack.Navigator: não desmonta nem pisca
 * na troca de telas — as telas deslizam por baixo dela. A pílula ativa desliza
 * entre as abas e a barra some com fade nas telas que não são de aba.
 *
 * Flutua por cima do conteúdo: o que rolar por baixo aparece desfocado (iOS)
 * ou através da película translúcida (Android). Sem nada por baixo, o que se vê
 * é o próprio fundo da tela, então o visual não muda.
 */
const Footer: React.FC<FooterProps> = ({ currentRoute, navigationRef }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const userName = useAuthStore((s) => s.user?.name);
  const suppressed = useTabBarStore((s) => s.suppressed);

  const scale = footerScale(width);
  const barHeight = Math.round(BAR_BASE_HEIGHT * scale);
  const iconSize = Math.round(25 * scale);

  const routeIndex = currentRoute ? TAB_BAR_ROUTES[currentRoute as RouteName] : undefined;
  const visible = routeIndex !== undefined && !suppressed;
  const activeIndex = routeIndex ?? -1;

  // Aparecer/sumir: fade + leve descida, no driver nativo.
  const shown = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(shown, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, shown]);

  // Pílula ativa: desliza até a aba da rota atual.
  const [slotWidth, setSlotWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(activeIndex >= 0 ? 1 : 0)).current;
  const pillPlaced = useRef(false);

  useEffect(() => {
    if (!slotWidth) return;
    if (activeIndex >= 0) {
      const target = activeIndex * slotWidth;
      if (!pillPlaced.current) {
        // Primeira posição: sem animação, para a pílula não "voar" no boot.
        pillX.setValue(target);
        pillPlaced.current = true;
      } else {
        Animated.spring(pillX, {
          toValue: target,
          useNativeDriver: true,
          speed: 16,
          bounciness: 5,
        }).start();
      }
    }
    Animated.timing(pillOpacity, {
      toValue: activeIndex >= 0 ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, slotWidth, pillX, pillOpacity]);

  const onTabsLayout = useCallback((e: LayoutChangeEvent) => {
    setSlotWidth((e.nativeEvent.layout.width - BAR_PADDING * 2) / TAB_COUNT);
  }, []);

  const handleNavigate = useCallback(
    (routeName: RouteName) => {
      if (currentRoute !== routeName) {
        // Replace entre as abas principais: a pilha não cresce a cada troca.
        navigationRef.current?.dispatch(StackActions.replace(routeName));
      }
    },
    [currentRoute, navigationRef],
  );

  // O Perfil não tem taskbar: abre por cima (push) para o "voltar" funcionar.
  const openProfile = useCallback(() => {
    navigationRef.current?.navigate("Profile");
  }, [navigationRef]);

  const initials = (userName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, i, all) => (i === 0 || i === all.length - 1 ? part[0] : ""))
    .join("")
    .toUpperCase();

  const iconColor = (index: number) => (activeIndex === index ? "#FFFFFF" : INACTIVE);

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      style={[
        styles.footerContainer,
        {
          paddingHorizontal: Math.round(22 * scale),
          paddingBottom: Math.max(insets.bottom, MIN_BOTTOM_PADDING),
          opacity: shown,
          transform: [{ translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          { height: barHeight, borderRadius: barHeight / 2 },
          Platform.OS === "ios" && styles.barShadow,
        ]}
      >
        {/* Vidro: desfoque do que estiver por baixo (iOS; no Android o expo-blur
            sem método experimental vira só uma película escura), borda iluminada
            por cima, preenchimento translúcido e reflexo. */}
        <View style={[StyleSheet.absoluteFill, { borderRadius: barHeight / 2, overflow: "hidden" }]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
        <LinearGradient
          colors={GLASS_BORDER_COLORS}
          locations={GLASS_BORDER_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: barHeight / 2 }]}
        />
        <LinearGradient
          colors={
            Platform.OS === "ios"
              ? ["rgba(30,28,36,0.62)", "rgba(16,15,20,0.72)"]
              : ["rgba(30,28,36,0.86)", "rgba(16,15,20,0.9)"]
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.barFill, { borderRadius: barHeight / 2 - 1 }]}
        />
        <LinearGradient
          colors={GLASS_HIGHLIGHT_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[styles.barFill, { borderRadius: barHeight / 2 - 1 }]}
          pointerEvents="none"
        />

        <View style={styles.tabs} onLayout={onTabsLayout}>
          {/* Pílula do estado ativo: vidro mais claro, desliza entre as abas. */}
          {slotWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.activePill,
                {
                  width: slotWidth,
                  opacity: pillOpacity,
                  transform: [{ translateX: pillX }],
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0.09)"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.pillRadius]}
              />
            </Animated.View>
          )}

          <TabButton label="Home" isActive={activeIndex === 0} onPress={() => handleNavigate("Home")}>
            <Icon name={activeIndex === 0 ? "home" : "home-outline"} size={iconSize} color={iconColor(0)} />
          </TabButton>
          <TabButton
            label="Aprender"
            isActive={activeIndex === 1}
            onPress={() => handleNavigate("MenuEducacional")}
          >
            <Icon name={activeIndex === 1 ? "book" : "book-outline"} size={iconSize} color={iconColor(1)} />
          </TabButton>
          <TabButton
            label="Assessor"
            isActive={activeIndex === 2}
            onPress={() => handleNavigate("ModoOrcamento")}
          >
            <Icon name={activeIndex === 2 ? "wallet" : "wallet-outline"} size={iconSize} color={iconColor(2)} />
          </TabButton>
          <TabButton label="Perfil" isActive={false} onPress={openProfile}>
            <Avatar initials={initials || "?"} size={Math.round(28 * scale)} />
          </TabButton>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: CONTAINER_PADDING_TOP,
  },
  bar: {
    width: "100%",
  },
  barShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  barFill: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
    padding: BAR_PADDING,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    position: "absolute",
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  pillRadius: {
    borderRadius: 999,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Footer;
