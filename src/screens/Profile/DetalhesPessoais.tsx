import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  BackIconButton,
  Avatar,
  RadialGradientBackground,
  MenuSection,
  EditableField,
  MenuItem,
  EditFieldModal,
  Modal,
  GradientBorderButton,
} from "../../components";
import { NavigationProp } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import { User } from "../../domain/entities/User";
import { useProfileStore } from "../../storage/profileStore";

type EditableFieldType = "name" | "email" | "phone" | null;

// Extended User type to include phone (will be added to User interface when API supports it)
interface UserWithPhone extends User {
  phone?: string;
}

const DetalhesPessoais: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<UserWithPhone | null>(null);
  const [editingField, setEditingField] = useState<EditableFieldType>(null);
  const [confirmingValue, setConfirmingValue] = useState<string>("");
  const [confirmingField, setConfirmingField] = useState<EditableFieldType>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successFieldLabel, setSuccessFieldLabel] = useState<string>("");
  const { profileImageUri, setProfileImage, loadProfileImage } = useProfileStore();
  const container = Container.getInstance();

  useEffect(() => {
    loadUser();
    loadProfileImage();
    requestImagePickerPermissions();
  }, [loadProfileImage]);

  const requestImagePickerPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de permissão para acessar suas fotos!"
        );
      }
    }
  };

  const loadUser = async () => {
    try {
      const userUseCase = container.getUserUseCase();
      const currentUser = await userUseCase.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return "JD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getUserHandle = (name: string | undefined): string => {
    if (!name) return "jhondoe";
    return name.toLowerCase().replace(/\s+/g, "");
  };

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Escreva um nome completo válido, números e caracteres especiais não são aceitos";
    }
    // Check for numbers
    if (/\d/.test(value)) {
      return "Escreva um nome completo válido, números e caracteres especiais não são aceitos";
    }
    // Check for special characters (allow spaces and accents)
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
      return "Escreva um nome completo válido, números e caracteres especiais não são aceitos";
    }
    if (value.trim().length < 3) {
      return "O nome deve ter no mínimo 3 caracteres";
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Email é obrigatório";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Email inválido";
    }
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Telefone é obrigatório";
    }
    // Remove common formatting characters
    const cleanPhone = value.replace(/[\s\-\(\)\+]/g, "");
    // Check if it's all digits
    if (!/^\d+$/.test(cleanPhone)) {
      return "Telefone inválido";
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return "Telefone deve ter entre 10 e 15 dígitos";
    }
    return undefined;
  };

  const handleConfirmEdit = (field: EditableFieldType, value: string) => {
    // Store the value to confirm and show confirmation modal
    setConfirmingField(field);
    setConfirmingValue(value);
    setEditingField(null);
  };

  const handleSaveField = async (field: EditableFieldType, value: string) => {
    if (!field) return;

    try {
      // TODO: Implementar chamada à API para atualizar o campo
      // const userUseCase = container.getUserUseCase();
      // await userUseCase.updateUserField(field, value);
      
      // Atualizar estado local temporariamente
      // Se user não estiver carregado, criar um objeto temporário
      if (user) {
        const updatedUser: UserWithPhone = { ...user };
        if (field === "name") {
          updatedUser.name = value;
        } else if (field === "email") {
          updatedUser.email = value;
        } else if (field === "phone") {
          updatedUser.phone = value;
        }
        setUser(updatedUser);
      } else {
        // Se user não estiver carregado, criar um objeto temporário com o valor atualizado
        const tempUser: UserWithPhone = {
          id: "temp",
          name: field === "name" ? value : "Jhon Doe",
          email: field === "email" ? value : "jhondoe@gmail.com",
          points: 0,
          betcoins: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          phone: field === "phone" ? value : undefined,
        };
        setUser(tempUser);
      }
      
      // Prepare success message
      const fieldLabel = 
        field === "name" 
          ? "Nome completo alterado"
          : field === "email"
          ? "Endereço de email alterado"
          : "Número de telefone alterado";
      
      // Close confirmation modal
      setConfirmingField(null);
      setConfirmingValue("");
      
      // Show success modal after a short delay to ensure smooth transition
      setTimeout(() => {
        setSuccessFieldLabel(fieldLabel);
        setShowSuccessModal(true);
        
        // Auto close success modal after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      }, 100);
    } catch (error) {
      console.error("Error updating field:", error);
    }
  };

  const getFieldValue = (field: EditableFieldType): string => {
    if (!user) return "";
    switch (field) {
      case "name":
        return user.name || "";
      case "email":
        return user.email || "";
      case "phone":
        return user.phone || "";
      default:
        return "";
    }
  };

  const getFieldValidate = (field: EditableFieldType) => {
    switch (field) {
      case "name":
        return validateName;
      case "email":
        return validateEmail;
      case "phone":
        return validatePhone;
      default:
        return undefined;
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Save to store (which also saves to AsyncStorage)
        await setProfileImage(result.assets[0].uri);
        // TODO: Upload image to server/API
        // const userUseCase = container.getUserUseCase();
        // await userUseCase.uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Detalhes{"\n"}Pessoais</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Avatar 
                  initials={getInitials(user?.name)} 
                  size={100}
                />
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Icon name="camera" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>
                  @{getUserHandle(user?.name)}
                </Text>
                <TouchableOpacity style={styles.usernameEditButton}>
                  <Icon name="edit-2" size={14} color="#FF6A56" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Personal Section */}
            <MenuSection>
              <EditableField
                label="Nome completo"
                value={user?.name || "Jhon Doe"}
                onEdit={() => setEditingField("name")}
              />
              <View style={styles.separator} />
              <EditableField
                label="Endereço de email"
                value={user?.email || "jhondoe@gmail.com"}
                onEdit={() => setEditingField("email")}
              />
              <View style={styles.separator} />
              <EditableField
                label="Número de telefone"
                value={user?.phone ? formatPhoneForDisplay(user.phone) : "+55 11 99999-9999"}
                onEdit={() => setEditingField("phone")}
              />
            </MenuSection>

            {/* Password Section */}
            <MenuSection>
              <MenuItem
                icon="lock"
                label="Trocar a senha"
                onPress={() => navigation.navigate("ChangePassword")}
                showSeparator={false}
              />
            </MenuSection>
          </ScrollView>
        </View>

        {/* Edit Field Modal */}
        <EditFieldModal
          visible={editingField !== null}
          onClose={() => setEditingField(null)}
          fieldName={editingField || ""}
          fieldLabel={
            editingField === "name"
              ? "Nome completo"
              : editingField === "email"
              ? "Endereço de email"
              : editingField === "phone"
              ? "Número de telefone"
              : ""
          }
          initialValue={editingField ? getFieldValue(editingField) : ""}
          onConfirm={(value) => {
            if (editingField) {
              handleConfirmEdit(editingField, value);
            }
          }}
          placeholder={
            editingField === "name"
              ? "Digite o seu nome completo"
              : editingField === "email"
              ? "Digite o seu endereço de email"
              : editingField === "phone"
              ? "Digite o seu número de telefone"
              : ""
          }
          validate={editingField ? getFieldValidate(editingField) : undefined}
          keyboardType={
            editingField === "email"
              ? "email-address"
              : editingField === "phone"
              ? "phone-pad"
              : "default"
          }
          autoCapitalize={
            editingField === "name" ? "words" : editingField === "email" || editingField === "phone" ? "none" : "sentences"
          }
          applyPhoneMask={editingField === "phone"}
        />

        {/* Confirmation Modal */}
        <Modal
          visible={confirmingField !== null}
          onClose={() => {
            setConfirmingField(null);
            setConfirmingValue("");
          }}
          size="medium"
          title="Editar"
          subtitle={
            confirmingField === "name"
              ? "Nome completo"
              : confirmingField === "email"
              ? "Endereço de email"
              : confirmingField === "phone"
              ? "Número de telefone"
              : ""
          }
          showCloseButton={true}
          scrollEnabled={false}
        >
          <View style={styles.confirmationModalContent}>
            <View style={styles.confirmationInputContainer}>
              <Text style={styles.confirmationValue}>
                {confirmingField === "phone" && confirmingValue
                  ? formatPhoneForDisplay(confirmingValue)
                  : confirmingValue}
              </Text>
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={() => {
                  // Return to edit modal
                  if (confirmingField) {
                    setEditingField(confirmingField);
                    setConfirmingField(null);
                    setConfirmingValue("");
                  }
                }}
              >
                <Icon name="edit-2" size={14} color="#FF6A56" />
              </TouchableOpacity>
            </View>
            <Text style={styles.confirmationQuestion}>
              {confirmingField === "name"
                ? "Esse nome está correto?"
                : confirmingField === "email"
                ? "Esse email está correto?"
                : "Esse telefone está correto?"}
            </Text>
            <View style={styles.buttonContainer}>
              <GradientBorderButton
                label="Continuar"
                onPress={() => {
                  if (confirmingField) {
                    handleSaveField(confirmingField, confirmingValue || "");
                  }
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          size="smaller"
          title="Sucesso!"
          subtitle={successFieldLabel}
          showCloseButton={true}
          scrollEnabled={false}
        >
          <View style={styles.successModalContent}>
            {/* Empty content, just shows title and subtitle */}
          </View>
        </Modal>
      </RadialGradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1825",
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: "400",
    color: "#FF6A56",
  },
  usernameEditButton: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginLeft: 16,
    marginRight: 16,
  },
  confirmationModalContent: {
    paddingVertical: 24,
    gap: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1825",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "#2B2935",
    width: "100%",
  },
  confirmationValue: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  editIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  confirmationQuestion: {
    color: "#A7A3AE",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    width: "100%",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 8,
  },
  successModalContent: {
    paddingVertical: 8,
    minHeight: 40,
  },
});

export default DetalhesPessoais;

