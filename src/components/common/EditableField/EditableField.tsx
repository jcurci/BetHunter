import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface EditableFieldProps {
  label: string;
  value: string;
  onEdit?: () => void;
  valueColor?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onEdit,
  valueColor = "#FFFFFF",
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Icon name="edit-2" size={16} color="#FF6A56" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 12,
    color: "#A09CAB",
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
});

export default EditableField;




