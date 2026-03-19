import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import { OnboardingLayout } from "../OnboardingFlow/screens/OnboardingLayout";
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../config/colors";
import { LinearGradient } from "expo-linear-gradient";

interface ValidationErrors {
  name?: string;
  username?: string;
}

const SignUpName: React.FC = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ name: false, username: false });
  const [nameFocused, setNameFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const navigation = useNavigation<NavigationProp>();

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

  const validateName = (v: string) => {
    if (!v.trim()) return "Escreva seu nome completo";
    if (v.trim().length < 3) return "O nome deve ter no mínimo 3 caracteres";
  };

  const validateUsername = (v: string) => {
    if (!v.trim()) return "Preencha o nome de usuário";
    if (v.length < 3 || v.length > 32) return "O nome de usuário deve ter entre 3 e 32 caracteres";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Use apenas letras, números e underscore";
  };

  const handleNameChange = (v: string) => {
    setName(v);
    if (v.length > 0 && !touched.name) setTouched(p => ({ ...p, name: true }));
    if (touched.name || v.length > 0) {
      setErrors(p => ({ ...p, name: v.trim() ? validateName(v) : undefined }));
    }
  };

  const handleUsernameChange = (v: string) => {
    const clean = v.toLowerCase().replace(/\s/g, "");
    setUsername(clean);
    if (clean.length > 0 && !touched.username) setTouched(p => ({ ...p, username: true }));
    if (touched.username || clean.length > 0) {
      setErrors(p => ({ ...p, username: clean ? validateUsername(clean) : undefined }));
    }
  };

  const isFormValid =
    name.trim().length >= 3 &&
    username.length >= 3 &&
    username.length <= 32 &&
    /^[a-zA-Z0-9_]+$/.test(username) &&
    !errors.name &&
    !errors.username;

  const handleNext = () => {
    setTouched({ name: true, username: true });
    const nameErr = validateName(name);
    const usernameErr = validateUsername(username);
    setErrors({ name: nameErr, username: usernameErr });
    if (nameErr || usernameErr) return;
    navigation.navigate("SignUpContact", { name, username });
  };

  return (
    <OnboardingLayout
      currentStep={0}
      totalSteps={4}
      onBack={() => navigation.goBack()}
      stepLabel="1 de 4 — Nome"
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
            <Text style={styles.title}>Qual o{"\n"}seu nome?</Text>
            <Text style={styles.subtitle}>Cadastre seu nome e usuário para começar.</Text>
          </Animated.View>

          {/* Name field */}
          <Animated.View style={[styles.fieldBlock, { opacity: field1Fade, transform: [{ translateY: field1Slide }] }]}>
            <Text style={styles.fieldLabel}>Nome completo</Text>
            <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused, errors.name && touched.name && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="Ex: João Silva"
                autoCapitalize="words"
                placeholderTextColor="#555"
                value={name}
                onChangeText={handleNameChange}
                onBlur={() => { setNameFocused(false); setTouched(p => ({ ...p, name: true })); setErrors(p => ({ ...p, name: validateName(name) })); }}
                onFocus={() => setNameFocused(true)}
              />
            </View>
            {errors.name && touched.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </Animated.View>

          {/* Username field */}
          <Animated.View style={[styles.fieldBlock, { opacity: field2Fade, transform: [{ translateY: field2Slide }] }]}>
            <Text style={styles.fieldLabel}>Nome de usuário</Text>
            <View style={[styles.inputWrapper, usernameFocused && styles.inputWrapperFocused, errors.username && touched.username && styles.inputWrapperError]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="nomedeusuario"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#555"
                value={username}
                onChangeText={handleUsernameChange}
                onBlur={() => { setUsernameFocused(false); setTouched(p => ({ ...p, username: true })); setErrors(p => ({ ...p, username: validateUsername(username) })); }}
                onFocus={() => setUsernameFocused(true)}
              />
            </View>
            {errors.username && touched.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isFormValid}
            activeOpacity={0.85}
            style={[styles.continueBtn, !isFormValid && styles.continueBtnDisabled]}
          >
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueBtnText}>Próximo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
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
  fieldBlock: {
    marginBottom: 18,
  },
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
    gap: 8,
  },
  inputWrapperFocused: {
    borderColor: "rgba(116,86,200,0.5)",
    backgroundColor: "#201D2E",
  },
  inputWrapperError: {
    borderColor: "#E74C3C",
  },
  atSymbol: {
    color: "#7456C8",
    fontSize: 16,
    fontWeight: "700",
  },
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
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  continueBtn: {
    borderRadius: 999,
    overflow: "hidden",
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 999,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default SignUpName;
