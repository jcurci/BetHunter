import React, { useCallback, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import { BRAND_GRADIENT_COLORS, BRAND_GRADIENT_LOCATIONS } from "../../../config/colors";
import BetHunterLogoSlot from "./BetHunterLogoSlot";
import GlassSurface from "./GlassSurface";
import { CarouselCard, CarouselCardIcon, CarouselPage } from "./carouselPages";
import { HOME_FONTS, HomeLayout } from "./homeLayout";

interface HomeCarouselProps {
  pages: readonly CarouselPage[];
  layout: HomeLayout;
  onCardPress: (card: CarouselCard) => void;
}

const DOT_ACTIVE = "#E9747E";
const DOT_INACTIVE = "#4A4751";

/** Ícone da lib em gradiente. No Android o MaskedView de ícone gera artefato
 *  escuro (ver Footer), então lá o ícone usa a cor central do gradiente. */
const GradientIcon: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  if (Platform.OS === "android") {
    return <MaterialCommunityIcons name={name} size={size} color="#DE57DF" />;
  }
  return (
    <MaskedView maskElement={<MaterialCommunityIcons name={name} size={size} color="#FFF" />}>
      <LinearGradient
        colors={BRAND_GRADIENT_COLORS}
        locations={BRAND_GRADIENT_LOCATIONS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size }}
      />
    </MaskedView>
  );
};

const CardIcon: React.FC<{ icon: CarouselCardIcon; size: number }> = ({ icon, size }) => {
  switch (icon.kind) {
    case "logo":
      return <BetHunterLogoSlot size={size} />;
    case "svg": {
      const Svg = icon.Component;
      return <Svg width={size} height={size} />;
    }
    case "icon":
      return <GradientIcon name={icon.name} size={size} />;
  }
};

/**
 * Carrossel de atalhos: 3 páginas × 3 cards + indicadores.
 *
 * Paginação nativa do ScrollView; os indicadores leem o scroll pelo driver
 * nativo, então a bolinha ativa acompanha o dedo sem re-render.
 */
const HomeCarousel: React.FC<HomeCarouselProps> = ({ pages, layout, onCardPress }) => {
  const { width, s, v, gutter, cardSize, cardGap } = layout;
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = useRef(
    Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
      useNativeDriver: true,
    }),
  ).current;

  const goToPage = useCallback(
    (index: number) => scrollRef.current?.scrollTo({ x: index * width, animated: true }),
    [width],
  );

  const radius = s(24);
  const tileSize = s(34);
  const dotSize = s(10);

  return (
    <View>
      <Animated.ScrollView
        ref={scrollRef as React.RefObject<any>}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        // O card tem sombra; sem isto o iOS corta a sombra na borda da página.
        style={{ overflow: "visible" }}
      >
        {pages.map((page) => (
          <View
            key={page.id}
            style={[styles.page, { width, paddingHorizontal: gutter, gap: cardGap }]}
          >
            {page.cards.map((card) => (
              <Pressable
                key={card.id}
                onPress={() => onCardPress(card)}
                accessibilityRole="button"
                accessibilityLabel={card.title.replace("\n", " ")}
                style={({ pressed }) => [
                  { width: cardSize, height: cardSize },
                  pressed && styles.pressed,
                ]}
              >
                <GlassSurface
                  radius={radius}
                  style={StyleSheet.absoluteFill}
                  contentStyle={[styles.cardContent, { padding: s(16) }]}
                >
                  <View
                    style={[
                      styles.iconTile,
                      { width: tileSize, height: tileSize, borderRadius: s(10) },
                    ]}
                  >
                    <CardIcon icon={card.icon} size={s(18)} />
                  </View>
                  <Text
                    style={[styles.cardTitle, { fontSize: s(13.5), lineHeight: s(16) }]}
                    numberOfLines={2}
                  >
                    {card.title}
                  </Text>
                </GlassSurface>
              </Pressable>
            ))}
          </View>
        ))}
      </Animated.ScrollView>

      <View style={[styles.dots, { gap: s(6), marginTop: v(12) }]}>
        {pages.map((page, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const activeOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: "clamp",
          });
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 1.12, 1],
            extrapolate: "clamp",
          });
          return (
            <Pressable
              key={page.id}
              onPress={() => goToPage(index)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Página ${index + 1} de ${pages.length}`}
            >
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    transform: [{ scale }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: dotSize / 2, backgroundColor: DOT_ACTIVE, opacity: activeOpacity },
                  ]}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    justifyContent: "space-between",
  },
  iconTile: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardTitle: {
    color: "#F4F2F7",
    fontFamily: HOME_FONTS.medium,
    letterSpacing: -0.2,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    backgroundColor: DOT_INACTIVE,
    overflow: "hidden",
  },
});

export default HomeCarousel;
