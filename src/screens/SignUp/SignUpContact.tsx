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
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { OnboardingLayout } from "../OnboardingFlow/screens/OnboardingLayout";
import { Container } from "../../infrastructure/di/Container";
import { AuthenticationError, ValidationError } from "../../domain/errors/CustomErrors";
import { LinearGradient } from "expo-linear-gradient";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../config/colors";

const SignUpContact: React.FC = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, phone: false });
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpContact">>();
  const { name, username } = route.params;
  const firstName = name.split(" ")[0];

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

  const validateEmail = (v: string) => {
    if (!v.trim()) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Digite um endereço de email válido";
    return "";
  };

  const validatePhone = (v: string) => {
    if (!v.trim()) return "";
    if (v.replace(/\D/g, "").length !== 11) return "Digite um número de telefone válido (11 dígitos)";
    return "";
  };

  const applyPhoneMask = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (v.length > 0 && !touched.email) setTouched(p => ({ ...p, email: true }));
    if (touched.email || v.length > 0) setEmailError(v.trim() ? validateEmail(v) : "");
  };

  const handlePhoneChange = (v: string) => {
    const masked = applyPhoneMask(v);
    setPhone(masked);
    if (masked.length > 0 && !touched.phone) setTouched(p => ({ ...p, phone: true }));
    if (touched.phone || masked.length > 0) setPhoneError(masked.trim() ? validatePhone(masked) : "");
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = phone.replace(/\D/g, "");
  const isFormValid =
    email.trim() !== "" &&
    emailRegex.test(email) &&
    phoneDigits.length === 11 &&
    !emailError &&
    !phoneError;

  const handleNext = async () => {
    setTouched({ email: true, phone: true });
    const emailV = validateEmail(email);
    const phoneV = validatePhone(phone);
    setEmailError(emailV || (!email.trim() ? "Digite um endereço de email válido" : ""));
    setPhoneError(phoneV || (!phone.trim() ? "Digite um número de telefone válido" : ""));
    if (emailV || phoneV || !email.trim() || !phone.trim()) return;

    setLoading(true);
    try {
      const container = Container.getInstance();
      const startRegistrationUseCase = container.getStartRegistrationUseCase();
      await startRegistrationUseCase.execute({
        email: email.trim(),
        name,
        username,
        cellphone: phoneDigits,
      });
      navigation.navigate("SignUpVerification", {
        name,
        username,
        email: email.trim(),
        phone: phoneDigits,
      });
    } catch (error: unknown) {
      console.error("Erro ao iniciar cadastro:", error);
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Erro ao iniciar cadastro. Verifique os dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      stepLabel="2 de 4 — Contato"
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
            <Text style={styles.title}>Perfeito, {firstName}!</Text>
            <Text style={styles.subtitle}>Agora precisamos do seu email e telefone para prosseguir.</Text>
          </Animated.View>

          {/* Email field */}
          <Animated.View style={[styles.fieldBlock, { opacity: field1Fade, transform: [{ translateY: field1Slide }] }]}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused, !!emailError && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#555"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => { setEmailFocused(false); setTouched(p => ({ ...p, email: true })); setEmailError(validateEmail(email)); }}
                onFocus={() => setEmailFocused(true)}
              />
            </View>
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </Animated.View>

          {/* Phone field */}
          <Animated.View style={[styles.fieldBlock, { opacity: field2Fade, transform: [{ translateY: field2Slide }] }]}>
            <Text style={styles.fieldLabel}>Telefone</Text>
            <View style={[styles.phoneRow]}>
              <View style={styles.countryBadge}>
                <Text style={styles.countryText}>🇧🇷 +55</Text>
              </View>
              <View style={[styles.inputWrapper, styles.phoneInput, phoneFocused && styles.inputWrapperFocused, !!phoneError && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                  placeholderTextColor="#555"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onBlur={() => { setPhoneFocused(false); setTouched(p => ({ ...p, phone: true })); setPhoneError(validatePhone(phone)); }}
                  onFocus={() => setPhoneFocused(true)}
                />
              </View>
            </View>
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
            style={[styles.continueBtn, (!isFormValid || loading) && styles.continueBtnDisabled]}
          >
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueBtnText}>{loading ? "Enviando..." : "Próximo"}</Text>
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
  phoneRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  countryBadge: {
    backgroundColor: "#1C1928",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  countryText: {
    color: "#B8A8E8",
    fontSize: 14,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
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
  footer: { paddingTop: 12, paddingBottom: 8 },
  continueBtn: { borderRadius: 999, overflow: "hidden" },
  continueBtnDisabled: { opacity: 0.4 },
  continueGradient: { paddingVertical: 16, alignItems: "center", borderRadius: 999 },
  continueBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});

export default SignUpContact;
