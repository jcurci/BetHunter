import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import GlassSurface from "./GlassSurface";
import Glow from "./Glow";
import { HOME_FONTS, HomeLayout } from "./homeLayout";

interface QuickActionsProps {
  layout: HomeLayout;
  isBlockerEnabled: boolean;
  onBlocker: () => void;
  onReset: () => void;
  onMeditate: () => void;
  onSupport: () => void;
}

interface ActionSpec {
  key: string;
  label: string;
  icon: string;
  /** Rotação do ícone — o "cancel" da lib vira o "⊘" do design com 90°. */
  rotate?: string;
  onPress: () => void;
  highlighted?: boolean;
  accessibilityLabel?: string;
}

const ICON_COLOR = "#C9C5D3";

/**
 * Bloqueador · Resetar · Meditar · Suporte.
 *
 * Círculos de vidro; o Bloqueador leva o anel iluminado da marca. O ponto
 * verde no Bloqueador substitui os selos "proteção ativa" que ficavam soltos
 * na Home: mesmo sinal, sem quebrar a composição.
 */
const QuickActions: React.FC<QuickActionsProps> = ({
  layout,
  isBlockerEnabled,
  onBlocker,
  onReset,
  onMeditate,
  onSupport,
}) => {
  const { s, v } = layout;
  const circle = s(58);
  const slot = s(66);

  const actions: ActionSpec[] = [
    {
      key: "blocker",
      label: "Bloqueador",
      icon: "cancel",
      rotate: "90deg",
      onPress: onBlocker,
      highlighted: true,
      accessibilityLabel: isBlockerEnabled
        ? "Bloqueador: proteção ativa. Abrir opções de bloqueio e denúncia"
        : "Bloqueador: abrir opções de bloqueio e denúncia",
    },
    { key: "reset", label: "Resetar", icon: "timer-sand", onPress: onReset },
    { key: "meditate", label: "Meditar", icon: "meditation", onPress: onMeditate },
    { key: "support", label: "Suporte", icon: "handshake-outline", onPress: onSupport },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          style={({ pressed }) => [styles.slot, { width: slot }, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel ?? action.label}
        >
          <View style={{ width: circle, height: circle }}>
            {action.highlighted && (
              <View style={styles.glowWrap} pointerEvents="none">
                <Glow width={circle * 1.9} height={circle * 1.9} color="#DE57DF" intensity={0.22} />
              </View>
            )}
            <GlassSurface
              radius={circle / 2}
              variant={action.highlighted ? "brand" : "glass"}
              style={StyleSheet.absoluteFill}
              contentStyle={styles.center}
            >
              <MaterialCommunityIcons
                name={action.icon}
                size={s(26)}
                color={ICON_COLOR}
                style={action.rotate ? { transform: [{ rotate: action.rotate }] } : undefined}
              />
            </GlassSurface>
            {action.key === "blocker" && isBlockerEnabled && (
              <View
                style={[
                  styles.statusDot,
                  { width: s(10), height: s(10), borderRadius: s(5), top: s(3), right: s(3) },
                ]}
              />
            )}
          </View>
          <Text
            style={[styles.label, { fontSize: s(13.5), marginTop: v(7), width: slot + s(20) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
  slot: {
    alignItems: "center",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    backgroundColor: "#7BE8A7",
    borderWidth: 2,
    borderColor: "#14121B",
  },
  label: {
    color: "#ADA8B8",
    fontFamily: HOME_FONTS.regular,
    textAlign: "center",
    letterSpacing: -0.2,
  },
});

export default QuickActions;
