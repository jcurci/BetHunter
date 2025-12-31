import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Modal from "../Modal/Modal";

interface EditFieldModalProps {
  visible: boolean;
  onClose: () => void;
  fieldName: string;
  fieldLabel: string;
  initialValue: string;
  onConfirm: (value: string) => void; // Changed from onSave to onConfirm
  placeholder?: string;
  validate?: (value: string) => string | undefined;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  applyPhoneMask?: boolean;
}

const EditFieldModal: React.FC<EditFieldModalProps> = ({
  visible,
  onClose,
  fieldName,
  fieldLabel,
  initialValue,
  onConfirm,
  placeholder,
  validate,
  keyboardType = "default",
  autoCapitalize = "sentences",
  applyPhoneMask = false,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      // Apply mask to initial value if it's a phone
      const formattedValue = applyPhoneMask ? formatPhoneNumber(initialValue) : initialValue;
      setValue(formattedValue);
      setError(undefined);
    }
  }, [visible, initialValue, applyPhoneMask]);

  // Format phone number: +55 (11) 99999-9999
  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digit characters
    const digits = text.replace(/\D/g, "");
    
    // If empty, return empty
    if (!digits) return "";
    
    // If starts with 55, keep it, otherwise assume it's a local number
    let formatted = "";
    
    if (digits.startsWith("55")) {
      // International format: +55 (XX) XXXXX-XXXX
      if (digits.length <= 2) {
        formatted = `+${digits}`;
      } else if (digits.length <= 4) {
        formatted = `+${digits.slice(0, 2)} (${digits.slice(2)}`;
      } else if (digits.length <= 9) {
        formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
      } else if (digits.length <= 13) {
        formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
      } else {
        // Limit to 13 digits
        formatted = `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
      }
    } else {
      // Local format: (XX) XXXXX-XXXX
      if (digits.length <= 2) {
        formatted = `(${digits}`;
      } else if (digits.length <= 7) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      } else if (digits.length <= 11) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      } else {
        // Limit to 11 digits
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      }
    }
    
    return formatted;
  };

  // Remove mask for validation/storage
  const removePhoneMask = (text: string): string => {
    return text.replace(/\D/g, "");
  };

  const handleChange = (text: string) => {
    let formattedText = text;
    
    if (applyPhoneMask) {
      formattedText = formatPhoneNumber(text);
    }
    
    setValue(formattedText);
    
    if (error && validate) {
      // For validation, use unmasked value
      const valueToValidate = applyPhoneMask ? removePhoneMask(formattedText) : formattedText;
      const validationError = validate(valueToValidate);
      setError(validationError);
    }
  };

  const handleConfirm = () => {
    // For confirmation, remove mask if applied
    const valueToConfirm = applyPhoneMask ? removePhoneMask(value) : value;
    
    if (validate) {
      const validationError = validate(valueToConfirm);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    onConfirm(valueToConfirm);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="small"
      title="Editar"
      subtitle={fieldLabel}
      headerActions={{
        right: [
          {
            icon: "arrow-right",
            onPress: handleConfirm,
            color: "#FFFFFF",
          },
        ],
      }}
      showCloseButton={true}
    >
      <View style={styles.container}>
        <View
          style={[styles.inputContainer, error && styles.inputContainerError]}
        >
          <TextInput
            style={styles.input}
            placeholder={placeholder || `Digite o seu ${fieldLabel.toLowerCase()}`}
            placeholderTextColor="#A09CAB"
            value={value}
            onChangeText={handleChange}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoFocus={true}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  inputContainer: {
    backgroundColor: "#1A1825",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2B2935",
  },
  inputContainerError: {
    borderColor: "#FF4444",
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});

export default EditFieldModal;


