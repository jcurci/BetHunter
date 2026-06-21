import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface NoEntriesBannerProps {
  days: number;
  onRegister: () => void;
  onDismiss: () => void;
}

const NoEntriesBanner: React.FC<NoEntriesBannerProps> = ({
  days,
  onRegister,
  onDismiss,
}) => {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.textColumn}>
        <Text style={styles.message} numberOfLines={2}>
          Você não registra gastos há {days} dias. Quer atualizar?
        </Text>
        <TouchableOpacity
          onPress={onRegister}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.cta}>Registrar agora</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={onDismiss}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Dispensar aviso"
      >
        <Icon name="x" size={14} color="#7A7390" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 12,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  message: {
    color: "#A09CAB",
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  cta: {
    color: "#D783D8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default NoEntriesBanner;
