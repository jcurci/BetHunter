import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface MenuItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  iconColor?: string;
  textColor?: string;
  showSeparator?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  iconColor = "#FFFFFF",
  textColor = "#FFFFFF",
  showSeparator = true,
}) => {
  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Icon name={icon as any} size={20} color={iconColor} />
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
      {showSeparator && <View style={styles.separator} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginLeft: 16,
    marginRight: 16,
  },
});

export default MenuItem;

