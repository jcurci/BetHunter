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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { OnboardingLayout } from "../OnboardingFlow/screens/OnboardingLayout";
import { Container } from "../../infrastructure/di/Container";
import { AuthenticationError, ValidationError } from "../../domain/errors/CustomErrors";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../config/colors";

const CODE_LENGTH = 6;

const SignUpVerification: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpVerification">>();
  const { name, username, email, phone } = route.params;
  const firstName = name.split(" ")[0];

  // Animations
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(16)).current;
  const codeFade = useRef(new Animated.Value(0)).current;
  const codeSlide = useRef(new Animated.Value(16)).current;
  // Per-digit scale animations for bounce on entry
  const digitScales = useRef(
    Array.from({ length: CODE_LENGTH }, () => new Animated.Value(0.8))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleFade, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(titleSlide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.stagger(
      60,
      digitScales.map(s =>
        Animated.spring(s, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true })
      )
    ).start();

    Animated.parallel([
      Animated.timing(codeFade, { toValue: 1, duration: 350, delay: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(codeSlide, { toValue: 0, duration: 350, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "");
    if (digit.length <= 1) {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);
      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      const container = Container.getInstance();
      const startRegistrationUseCase = container.getStartRegistrationUseCase();
      await startRegistrationUseCase.execute({ email, name, username, cellphone: phone });
      setCountdown(30);
      setCanResend(false);
      Alert.alert("Código reenviado", "Um novo código foi enviado para seu telefone.");
    } catch (error: unknown) {
      console.error("Erro ao reenviar código:", error);
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Erro ao reenviar código. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = code.every(d => d !== "");

  const handleNext = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert("Erro", "Por favor, preencha o código completo");
      return;
    }
    setLoading(true);
    try {
      const container = Container.getInstance();
      const verifyRegistrationCodeUseCase = container.getVerifyRegistrationCodeUseCase();
      await verifyRegistrationCodeUseCase.execute(email, fullCode);
      navigation.navigate("SignUpPassword", { name, username, email, phone });
    } catch (error: unknown) {
      console.error("Erro ao verificar código:", error);
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Código inválido ou expirado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      stepLabel="3 de 4 — Verificação"
    >
      {/* Title */}
      <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }], marginBottom: 28 }}>
        <Text style={styles.title}>Quase lá, {firstName}!</Text>
        <Text style={styles.subtitle}>
          Digite o código de 6 dígitos que enviamos para seu telefone.
        </Text>
      </Animated.View>

      {/* Code inputs */}
      <Animated.View style={[styles.codeRow, { opacity: codeFade, transform: [{ translateY: codeSlide }] }]}>
        {code.map((digit, index) => (
          <Animated.View
            key={index}
            style={[
              styles.digitWrapper,
              digit ? styles.digitWrapperFilled : null,
              { transform: [{ scale: digitScales[index] }] },
            ]}
          >
            <TextInput
              ref={ref => { inputRefs.current[index] = ref; }}
              style={styles.digitInput}
              value={digit}
              onChangeText={text => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          </Animated.View>
        ))}
      </Animated.View>

      {/* Resend */}
      <Animated.View style={{ opacity: codeFade, marginTop: 20, marginBottom: 8 }}>
        <TouchableOpacity onPress={handleResendCode} disabled={!canResend}>
          {canResend ? (
            <MaskedView maskElement={<Text style={styles.resendActive}>Reenviar código</Text>}>
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.resendActive, { opacity: 0 }]}>Reenviar código</Text>
              </LinearGradient>
            </MaskedView>
          ) : (
            <Text style={styles.resendDisabled}>
              Reenviar código ({countdown}s)
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.spacer} />

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isCodeComplete || loading}
          activeOpacity={0.85}
          style={[styles.continueBtn, (!isCodeComplete || loading) && styles.continueBtnDisabled]}
        >
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueBtnText}>{loading ? "Verificando..." : "Confirmar"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
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
    lineHeight: 20,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  digitWrapper: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    backgroundColor: "#1C1928",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  digitWrapperFilled: {
    borderColor: "rgba(116,86,200,0.5)",
    backgroundColor: "#201D2E",
  },
  digitInput: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resendActive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resendDisabled: {
    fontSize: 14,
    color: "#555",
  },
  spacer: { flex: 1 },
  footer: { paddingTop: 12, paddingBottom: 8 },
  continueBtn: { borderRadius: 999, overflow: "hidden" },
  continueBtnDisabled: { opacity: 0.4 },
  continueGradient: { paddingVertical: 16, alignItems: "center", borderRadius: 999 },
  continueBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});

export default SignUpVerification;
