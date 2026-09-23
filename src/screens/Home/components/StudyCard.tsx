import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import { BRAND_GRADIENT_COLORS, BRAND_GRADIENT_LOCATIONS } from "../../../config/colors";
import GlassSurface from "./GlassSurface";
import GradientText from "./GradientText";
import Glow from "./Glow";
import { HOME_FONTS, HomeLayout } from "./homeLayout";

interface StudyCardProps {
  layout: HomeLayout;
  /** Curso atual (ver selectCurrentCourse). null → convite para começar. */
  course: { title: string; modulesCompleted: number; modulesQuantity: number } | null;
  loading: boolean;
  onPress: () => void;
}

/** Chevron em gradiente vertical (roxo → laranja). No Android o MaskedView de
 *  ícone gera artefato (ver Footer), então lá usa a cor quente do gradiente. */
const GradientChevron: React.FC<{ size: number }> = ({ size }) => {
  if (Platform.OS === "android") {
    return <Icon name="chevron-forward" size={size} color="#F0566A" />;
  }
  return (
    <MaskedView maskElement={<Icon name="chevron-forward" size={size} color="#FFF" />}>
      <LinearGradient
        colors={BRAND_GRADIENT_COLORS}
        locations={BRAND_GRADIENT_LOCATIONS}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 0.9 }}
        style={{ width: size, height: size }}
      />
    </MaskedView>
  );
};

/**
 * Seção "Estude": continua o curso em andamento.
 */
const StudyCard: React.FC<StudyCardProps> = ({ layout, course, loading, onPress }) => {
  const { s, v } = layout;
  const radius = s(24);
  const height = s(78);
  const titleSize = s(24);

  return (
    <View>
      <Text style={[styles.sectionTitle, { fontSize: s(20), lineHeight: s(22) }]}>Estude</Text>
      <Text style={[styles.sectionSubtitle, { fontSize: s(14), lineHeight: s(17) }]}>
        Continue de onde parou
      </Text>

      <Pressable
        onPress={onPress}
        disabled={loading && !course}
        accessibilityRole="button"
        accessibilityLabel={
          course
            ? `Continuar ${course.title}: ${course.modulesCompleted} de ${course.modulesQuantity} módulos`
            : "Começar a estudar"
        }
        style={({ pressed }) => [{ height, marginTop: v(4) }, pressed && styles.pressed]}
      >
        <GlassSurface radius={radius} borderWidth={1.5} style={StyleSheet.absoluteFill}>
          {/* Bloco de sombra interno à esquerda — a "profundidade" do vidro na referência. */}
          <View
            style={[
              styles.innerShade,
              { top: s(4), bottom: s(4), left: s(4), borderRadius: radius - s(4) },
            ]}
            pointerEvents="none"
          />
          <View style={[styles.content, { paddingLeft: s(20), paddingRight: s(14) }]}>
            {loading && !course ? (
              <View style={styles.texts}>
                <View style={[styles.skeleton, { width: s(150), height: s(22) }]} />
                <View style={[styles.skeleton, { width: s(32), height: s(12), marginTop: s(6) }]} />
              </View>
            ) : (
              <View style={styles.texts}>
                <GradientText style={styles.titleMask}>
                  <Text
                    style={[
                      styles.title,
                      { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.15), letterSpacing: -titleSize * 0.05 },
                    ]}
                    numberOfLines={1}
                  >
                    {course ? course.title : "Comece a estudar"}
                  </Text>
                </GradientText>
                <Text style={[styles.progress, { fontSize: s(14) }]}>
                  {course ? `${course.modulesCompleted}/${course.modulesQuantity}` : "Ver cursos"}
                </Text>
              </View>
            )}
            <View style={styles.chevron}>
              <View style={styles.chevronGlow} pointerEvents="none">
                <Glow width={s(64)} height={s(64)} color="#E0567A" intensity={0.3} />
              </View>
              <GradientChevron size={s(34)} />
            </View>
          </View>
        </GlassSurface>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#F2EFF5",
    fontFamily: HOME_FONTS.bold,
    letterSpacing: -0.8,
  },
  sectionSubtitle: {
    color: "#A9A4B5",
    fontFamily: HOME_FONTS.regular,
    letterSpacing: -0.4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  innerShade: {
    position: "absolute",
    width: "34%",
    backgroundColor: "rgba(4,3,8,0.38)",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  texts: {
    flex: 1,
  },
  titleMask: {
    alignSelf: "flex-start",
  },
  title: {
    fontFamily: HOME_FONTS.bold,
    includeFontPadding: false,
  },
  progress: {
    color: "#A9A4B5",
    fontFamily: HOME_FONTS.regular,
    marginTop: -2,
  },
  chevron: {
    alignItems: "center",
    justifyContent: "center",
  },
  chevronGlow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  skeleton: {
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});

export default StudyCard;
