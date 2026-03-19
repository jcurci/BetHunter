import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { OnboardingLayout } from "../OnboardingFlow/screens/OnboardingLayout";
import { Container } from "../../infrastructure/di/Container";
import { ValidationError } from "../../domain/errors/CustomErrors";
import { LinearGradient } from "expo-linear-gradient";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../config/colors";

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

const REQUIREMENTS = [
  { key: "length", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { key: "special", label: "Pelo menos um caractere especial (!, @, #, $, %)", test: (p: string) => /[!@#$%]/.test(p) },
];

const SignUpPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpPassword">>();
  const { name, username, email, phone } = route.params;

  // Animations
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(16)).current;
  const field1Fade = useRef(new Animated.Value(0)).current;
  const field1Slide = useRef(new Animated.Value(16)).current;
  const field2Fade = useRef(new Animated.Value(0)).current;
  const field2Slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const stagger = (anim: { fade: Animated.Value; slide: Animated.Value }, delay: number) =>
      Animated.parallel([
        Animated.timing(anim.fade, { toValue: 1, duration: 350, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim.slide, { toValue: 0, duration: 350, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);
    stagger({ fade: titleFade, slide: titleSlide }, 0).start();
    stagger({ fade: field1Fade, slide: field1Slide }, 80).start();
    stagger({ fade: field2Fade, slide: field2Slide }, 160).start();
  }, []);

  const validatePassword = (p: string): string | undefined => {
    if (!p) return undefined;
    if (p.length < 8) return "A senha deve ter no mínimo 8 caracteres";
    if (!/[!@#$%]/.test(p)) return "A senha deve conter pelo menos um caractere especial (!, @, #, $, %)";
  };

  const validateConfirmPassword = (c: string): string | undefined => {
    if (!c) return undefined;
    if (password && c !== password) return "As senhas não coincidem";
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (touched.password) setErrors(p => ({ ...p, password: v ? validatePassword(v) : undefined }));
    if (confirmPassword && touched.confirmPassword) {
      setErrors(p => ({ ...p, confirmPassword: v !== confirmPassword ? "As senhas não coincidem" : undefined }));
    }
  };

  const handleConfirmPasswordChange = (v: string) => {
    setConfirmPassword(v);
    if (!v) setErrors(p => ({ ...p, confirmPassword: undefined }));
  };

  const specialChars = /[!@#$%]/;
  const isFormValid =
    password.length >= 8 &&
    specialChars.test(password) &&
    confirmPassword !== "" &&
    password === confirmPassword &&
    !errors.password &&
    !errors.confirmPassword;

  const handleSubmit = async () => {
    setTouched({ password: true, confirmPassword: true });
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword);
    setErrors({ password: passErr, confirmPassword: confirmErr });
    if (passErr || confirmErr) return;

    setLoading(true);
    try {
      const container = Container.getInstance();
      const createPasswordUseCase = container.getCreatePasswordUseCase();
      await createPasswordUseCase.execute(email, password);
      navigation.reset({ index: 0, routes: [{ name: "OnboardingFlow" }] });
    } catch (error: unknown) {
      console.error("Erro ao criar senha:", error);
      if (error instanceof ValidationError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Erro ao finalizar cadastro. Verifique os dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      stepLabel="4 de 4 — Senha"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
            <Text style={styles.title}>Última etapa!</Text>
            <Text style={styles.subtitle}>Crie uma senha segura para proteger sua conta.</Text>
          </Animated.View>

          {/* Password field */}
          <Animated.View style={[styles.fieldBlock, { opacity: field1Fade, transform: [{ translateY: field1Slide }] }]}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={[styles.inputWrapper, passFocused && styles.inputWrapperFocused, errors.password && touched.password && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Crie uma senha"
                secureTextEntry={!showPassword}
                placeholderTextColor="#555"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => setPassFocused(true)}
                onBlur={() => { setPassFocused(false); setTouched(p => ({ ...p, password: true })); setErrors(p => ({ ...p, password: validatePassword(password) })); }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name={showPassword ? "visibility" : "visibility-off"} size={20} color="#555" />
              </TouchableOpacity>
            </View>
            {errors.password && touched.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Requirements */}
            <View style={styles.requirementsBox}>
              {REQUIREMENTS.map(req => {
                const met = req.test(password);
                return (
                  <View key={req.key} style={styles.reqRow}>
                    <View style={[styles.reqDot, met && styles.reqDotMet]} />
                    <Text style={[styles.reqText, met && styles.reqTextMet]}>{req.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* Confirm password */}
          <Animated.View style={[styles.fieldBlock, { opacity: field2Fade, transform: [{ translateY: field2Slide }] }]}>
            <Text style={styles.fieldLabel}>Confirmar senha</Text>
            <View style={[styles.inputWrapper, confirmFocused && styles.inputWrapperFocused, errors.confirmPassword && touched.confirmPassword && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Repita a senha"
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#555"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => { setConfirmFocused(false); setTouched(p => ({ ...p, confirmPassword: true })); setErrors(p => ({ ...p, confirmPassword: validateConfirmPassword(confirmPassword) })); }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name={showConfirmPassword ? "visibility" : "visibility-off"} size={20} color="#555" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && touched.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !isFormValid}
            activeOpacity={0.85}
            style={[styles.continueBtn, (loading || !isFormValid) && styles.continueBtnDisabled]}
          >
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueBtnText}>{loading ? "Finalizando..." : "Criar conta"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 38,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: "#7A7390",
    marginBottom: 28,
    lineHeight: 20,
  },
  fieldBlock: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A7390",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1928",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  inputWrapperFocused: {
    borderColor: "rgba(116,86,200,0.5)",
    backgroundColor: "#201D2E",
  },
  inputWrapperError: { borderColor: "#E74C3C" },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    padding: 0,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  requirementsBox: {
    marginTop: 12,
    gap: 6,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reqDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3A3650",
  },
  reqDotMet: {
    backgroundColor: "#7456C8",
  },
  reqText: {
    fontSize: 12,
    color: "#555",
    flex: 1,
  },
  reqTextMet: {
    color: "#B8A8E8",
  },
  footer: { paddingTop: 12, paddingBottom: 8 },
  continueBtn: { borderRadius: 999, overflow: "hidden" },
  continueBtnDisabled: { opacity: 0.4 },
  continueGradient: { paddingVertical: 16, alignItems: "center", borderRadius: 999 },
  continueBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});

export default SignUpPassword;
