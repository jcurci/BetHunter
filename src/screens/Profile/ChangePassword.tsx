import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import {
  BackIconButton,
  RadialGradientBackground,
  GradientBorderButton,
} from "../../components";

const ChangePassword: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validatePassword = (password: string): string[] => {
    const validationErrors: string[] = [];

    if (password.length < 8) {
      validationErrors.push("A senha deve conter no mínimo 8 caracteres.");
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      validationErrors.push("A senha deve conter no mínimo um caractere especial");
    }

    return validationErrors;
  };

  const checkPasswordRequirements = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return { hasMinLength, hasSpecialChar };
  };

  const handleChangePassword = async () => {
    const newErrors: string[] = [];

    // Validate current password (mock - should check against API)
    if (!currentPassword.trim()) {
      newErrors.push("Sua senha antiga não está correta.");
    }

    // Validate new password
    const passwordErrors = validatePassword(newPassword);
    newErrors.push(...passwordErrors);

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      newErrors.push("As senhas novas são diferentes uma da outra.");
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      setLoading(true);
      try {
        // TODO: Implement API call to change password
        // const userUseCase = container.getUserUseCase();
        // await userUseCase.changePassword(currentPassword, newPassword);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        Alert.alert("Sucesso", "Senha alterada com sucesso!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } catch (error: any) {
        if (error.message?.includes("senha antiga")) {
          setErrors(["Sua senha antiga não está correta."]);
        } else {
          Alert.alert("Erro", "Não foi possível alterar a senha. Tente novamente.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const passwordRequirements = checkPasswordRequirements(newPassword);

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Sem problemas!</Text>
              <Text style={styles.headerSubtitle}>
                Trocaremos sua senha rapidamente.
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Messages */}
            {errors.length > 0 && (
              <View style={styles.errorsContainer}>
                {errors.map((error, index) => (
                  <View key={index} style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Current Password Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Digite sua senha atual</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor="#A09CAB"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    // Clear error when user starts typing
                    if (errors.some((e) => e.includes("senha antiga"))) {
                      setErrors(errors.filter((e) => !e.includes("senha antiga")));
                    }
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Icon
                    name={showCurrentPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#A09CAB"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotPasswordLink}>
                <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
              </TouchableOpacity>
            </View>

            {/* New Password Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Digite sua nova senha</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua nova senha"
                  placeholderTextColor="#A09CAB"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    // Clear password validation errors when user starts typing
                    setErrors(
                      errors.filter(
                        (e) =>
                          !e.includes("8 caracteres") &&
                          !e.includes("caractere especial")
                      )
                    );
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#A09CAB"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Confirme sua nova senha</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirme sua nova senha"
                  placeholderTextColor="#A09CAB"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    // Clear password match error when user starts typing
                    if (errors.some((e) => e.includes("diferentes"))) {
                      setErrors(errors.filter((e) => !e.includes("diferentes")));
                    }
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#A09CAB"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsSection}>
              <Text style={styles.requirementsTitle}>A senha:</Text>
              <View style={styles.requirementItem}>
                <Text
                  style={[
                    styles.requirementBullet,
                    !passwordRequirements.hasMinLength && styles.requirementError,
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.requirementText,
                    !passwordRequirements.hasMinLength && styles.requirementError,
                  ]}
                >
                  Deve conter no mínimo 8 caracteres
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Text
                  style={[
                    styles.requirementBullet,
                    !passwordRequirements.hasSpecialChar && styles.requirementError,
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.requirementText,
                    !passwordRequirements.hasSpecialChar && styles.requirementError,
                  ]}
                >
                  Deve conter no mínimo um caractere especial (ex: !, @, #, $, %)
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <GradientBorderButton
                label="Trocar senha"
                onPress={handleChangePassword}
                loading={loading}
                disabled={loading}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
    alignItems: "flex-start",
    marginBottom: 32,
    marginTop: 8,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#A7A3AE",
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorsContainer: {
    marginBottom: 24,
    gap: 8,
  },
  errorBanner: {
    backgroundColor: "#FF4444",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1825",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2B2935",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  forgotPasswordLink: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  forgotPasswordText: {
    color: "#FF6A56",
    fontSize: 14,
    fontWeight: "500",
  },
  requirementsSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  requirementBullet: {
    fontSize: 16,
    color: "#A7A3AE",
    marginRight: 8,
    marginTop: 2,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: "#A7A3AE",
    lineHeight: 20,
  },
  requirementError: {
    color: "#FF4444",
  },
  buttonsContainer: {
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: "#A7A3AE",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ChangePassword;
