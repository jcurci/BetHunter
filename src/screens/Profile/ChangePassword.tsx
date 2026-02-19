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
import { Container } from "../../infrastructure/di/Container";
import { ValidationError, AuthenticationError } from "../../domain/errors/CustomErrors";

const checkPasswordRequirements = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return { hasMinLength, hasSpecialChar };
};

const validatePassword = (password: string): string[] => {
  const errs: string[] = [];
  if (password.length < 8) errs.push("A senha deve conter no mínimo 8 caracteres.");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errs.push("A senha deve conter no mínimo um caractere especial");
  }
  return errs;
};

type Step = 1 | 2 | 3;

const ChangePassword: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrors(["Informe o e-mail."]);
      return;
    }
    setErrors([]);
    setLoading(true);
    try {
      const container = Container.getInstance();
      await container.getRequestPasswordChangeUseCase().execute(trimmed);
      setEmail(trimmed);
      setStep(2);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        setErrors([error.message]);
      } else if (error instanceof AuthenticationError) {
        setErrors([error.message]);
      } else {
        setErrors(["Não foi possível enviar o código. Tente novamente."]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setErrors(["Informe o código enviado por e-mail."]);
      return;
    }
    setErrors([]);
    setLoading(true);
    try {
      const container = Container.getInstance();
      await container.getVerifyPasswordChangeCodeUseCase().execute(email, trimmedCode);
      setCode(trimmedCode);
      setStep(3);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        setErrors([error.message]);
      } else if (error instanceof AuthenticationError) {
        setErrors([error.message]);
      } else {
        setErrors(["Código inválido ou expirado. Solicite um novo código."]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPassword = async () => {
    const passwordErr = validatePassword(newPassword);
    if (newPassword !== confirmPassword) {
      passwordErr.push("As senhas são diferentes. Confirme a nova senha.");
    }
    if (passwordErr.length > 0) {
      setErrors(passwordErr);
      return;
    }
    setErrors([]);
    setLoading(true);
    try {
      const container = Container.getInstance();
      await container.getConfirmPasswordChangeUseCase().execute(email, code, newPassword);
      Alert.alert("Sucesso", "Senha alterada com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        setErrors([error.message]);
      } else if (error instanceof AuthenticationError) {
        setErrors([error.message]);
      } else {
        Alert.alert("Erro", "Não foi possível redefinir a senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = checkPasswordRequirements(newPassword);

  const renderStep1 = () => (
    <>
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>E-mail cadastrado</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#A09CAB"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.length) setErrors([]);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <GradientBorderButton
          label="Enviar código"
          onPress={handleSendCode}
          loading={loading}
          disabled={loading}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Código de 6 dígitos enviado para {email}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite o código"
            placeholderTextColor="#A09CAB"
            value={code}
            onChangeText={(text) => {
              setCode(text);
              if (errors.length) setErrors([]);
            }}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <GradientBorderButton
          label="Verificar"
          onPress={handleVerifyCode}
          loading={loading}
          disabled={loading}
        />
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep(1)}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Nova senha</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#A09CAB"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrors((prev) => prev.filter((e) => !e.includes("8 caracteres") && !e.includes("caractere especial")));
            }}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Icon name={showNewPassword ? "eye" : "eye-off"} size={20} color="#A09CAB" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Confirme a nova senha</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirme sua nova senha"
            placeholderTextColor="#A09CAB"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) => prev.filter((e) => !e.includes("diferentes")));
            }}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Icon name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#A09CAB" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.requirementsSection}>
        <Text style={styles.requirementsTitle}>A senha:</Text>
        <View style={styles.requirementItem}>
          <Text style={[styles.requirementBullet, !passwordRequirements.hasMinLength && styles.requirementError]}>•</Text>
          <Text style={[styles.requirementText, !passwordRequirements.hasMinLength && styles.requirementError]}>
            Deve conter no mínimo 8 caracteres
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <Text style={[styles.requirementBullet, !passwordRequirements.hasSpecialChar && styles.requirementError]}>•</Text>
          <Text style={[styles.requirementText, !passwordRequirements.hasSpecialChar && styles.requirementError]}>
            Deve conter no mínimo um caractere especial (ex: !, @, #, $, %)
          </Text>
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <GradientBorderButton
          label="Redefinir senha"
          onPress={handleConfirmPassword}
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
    </>
  );

  const subtitleByStep: Record<Step, string> = {
    1: "Informe seu e-mail para receber o código de redefinição.",
    2: "Digite o código que enviamos para seu e-mail.",
    3: "Crie uma nova senha e confirme.",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackIconButton onPress={() => (step === 1 ? navigation.goBack() : setStep((s) => (s === 2 ? 1 : 2)))} size={42} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Redefinir senha</Text>
              <Text style={styles.headerSubtitle}>{subtitleByStep[step]}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {errors.length > 0 && (
              <View style={styles.errorsContainer}>
                {errors.map((err, index) => (
                  <View key={index} style={styles.errorBanner}>
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                ))}
              </View>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </ScrollView>
        </View>
      </RadialGradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  backgroundGradient: { flex: 1 },
  container: { flex: 1, paddingTop: 10, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 32, marginTop: 8, gap: 12 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: "#A7A3AE", lineHeight: 22 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  errorsContainer: { marginBottom: 24, gap: 8 },
  errorBanner: { backgroundColor: "#FF4444", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  errorText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  inputSection: { marginBottom: 24 },
  inputLabel: { fontSize: 16, fontWeight: "500", color: "#FFFFFF", marginBottom: 12 },
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
  input: { flex: 1, color: "#FFFFFF", fontSize: 16, fontWeight: "400" },
  eyeIcon: { padding: 4, marginLeft: 8 },
  requirementsSection: { marginTop: 8, marginBottom: 32 },
  requirementsTitle: { fontSize: 16, fontWeight: "500", color: "#FFFFFF", marginBottom: 12 },
  requirementItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  requirementBullet: { fontSize: 16, color: "#A7A3AE", marginRight: 8, marginTop: 2 },
  requirementText: { flex: 1, fontSize: 14, color: "#A7A3AE", lineHeight: 20 },
  requirementError: { color: "#FF4444" },
  buttonsContainer: { gap: 16, marginTop: 8 },
  cancelButton: { alignItems: "center", paddingVertical: 16 },
  cancelButtonText: { color: "#A7A3AE", fontSize: 16, fontWeight: "500" },
});

export default ChangePassword;
