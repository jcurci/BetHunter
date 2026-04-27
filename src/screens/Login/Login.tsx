import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Logo from "../../assets/logo-img/LogoImgETexto.svg";
import MaskedView from "@react-native-masked-view/masked-view";
import { NavigationProp } from "../../types/navigation";
import {
  HORIZONTAL_GRADIENT,
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from "../../config/colors";
import { RadialGradientBackground } from "../../components";
import { useAuthStore } from "../../storage/authStore";
import { Container } from "../../infrastructure/di/Container";
import { ValidationError } from "../../domain/errors/CustomErrors";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { ENV } from "../../config/env";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const authStore = useAuthStore();

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Form entrance (delayed)
    Animated.parallel([
      Animated.timing(formFade, {
        toValue: 1,
        duration: 400,
        delay: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 400,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle float loop on logo
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -6,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const floatTimeout = setTimeout(() => floatLoop.start(), 600);
    return () => {
      clearTimeout(floatTimeout);
      floatLoop.stop();
    };
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      // webClientId precisa ser o Web Client ID (audience do idToken validado no backend)
      webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
      ...(Platform.OS === 'ios' && ENV.GOOGLE_IOS_CLIENT_ID
        ? { iosClientId: ENV.GOOGLE_IOS_CLIENT_ID }
        : {}),
    });
  }, []);

  const handleGoogleLogin = async (): Promise<void> => {
    setGoogleLoading(true);
    try {
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const signInResult = await GoogleSignin.signIn();
      if (signInResult.type !== "success") {
        return;
      }
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        Alert.alert("Erro", "Não foi possível obter o token do Google. Tente novamente.");
        return;
      }

      const container = Container.getInstance();
      const loginWithGoogleUseCase = container.getLoginWithGoogleUseCase();
      const session = await loginWithGoogleUseCase.execute(idToken);

      if (session.user && session.user.id) {
        const userMapeado = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          points: session.user.energy ?? 0,
          betcoins: 0,
        };
        await authStore.login(session.accessToken, userMapeado);
      } else {
        await authStore.setToken(session.accessToken);
      }

      navigation.reset({ index: 0, routes: [{ name: "OnboardingFlow" }] });
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        return;
      }
      console.error("Erro ao fazer login com Google:", error);
      Alert.alert("Erro", "Não foi possível entrar com Google. Tente novamente.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    setLoading(true);
    try {
      const container = Container.getInstance();
      const loginUseCase = container.getLoginUseCase();
      const session = await loginUseCase.execute(email, password);

      if (session.user && session.user.id) {
        const userMapeado = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          points: session.user.energy ?? 0,
          betcoins: 0,
        };
        await authStore.login(session.accessToken, userMapeado);
      } else {
        await authStore.setToken(session.accessToken);
      }

      navigation.navigate("Home");
    } catch (error: unknown) {
      console.error("Erro ao fazer login:", error);
      if (error instanceof ValidationError) {
        Alert.alert("Erro", error.message);
      } else {
        Alert.alert("Erro", "Erro ao fazer login. Verifique suas credenciais e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormReady = email.trim().length > 0 && password.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }, { translateY: logoFloat }],
              },
            ]}
          >
            <Logo width={180} height={46} />
          </Animated.View>

          {/* Form card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formFade,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            {/* Title */}
            <MaskedView maskElement={<Text style={styles.cardTitle}>Bem-vindo de volta</Text>}>
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.cardTitle, { opacity: 0 }]}>Bem-vindo de volta</Text>
              </LinearGradient>
            </MaskedView>
            <Text style={styles.cardSubtitle}>Entre na sua conta para continuar</Text>

            {/* Inputs */}
            <View style={styles.inputsSection}>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                ]}
              >
                <Icon name="mail" size={18} color={emailFocused ? "#B8A8E8" : "#555"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Icon name="lock" size={18} color={passwordFocused ? "#B8A8E8" : "#555"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name={showPassword ? "eye" : "eye-off"} size={18} color="#555" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("PasswordResetMethod")}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading || !isFormReady}
              activeOpacity={0.85}
              style={[styles.loginBtn, (!isFormReady || loading) && styles.loginBtnDisabled]}
            >
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                <Text style={styles.loginBtnText}>{loading ? "Entrando..." : "Entrar"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={googleLoading || loading}
              activeOpacity={0.85}
              style={[styles.googleBtn, (googleLoading || loading) && styles.loginBtnDisabled]}
            >
              <Text style={styles.googleBtnText}>
                {googleLoading ? "Conectando..." : "Continuar com Google"}
              </Text>
            </TouchableOpacity>

            {/* Sign up link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUpName")}
              activeOpacity={0.7}
              style={styles.signUpBtn}
            >
              <Text style={styles.signUpBtnText}>Criar uma conta</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  formCard: {
    backgroundColor: "rgba(22,20,31,0.85)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(116,86,200,0.2)",
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#7A7390",
    marginBottom: 28,
    lineHeight: 20,
  },
  inputsSection: {
    gap: 12,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1928",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  inputWrapperFocused: {
    borderColor: "rgba(116,86,200,0.5)",
    backgroundColor: "#201D2E",
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    padding: 0,
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  forgotText: {
    color: "#7456C8",
    fontSize: 13,
    fontWeight: "600",
  },
  loginBtn: {
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 20,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 999,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dividerText: {
    color: "#555",
    fontSize: 13,
  },
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  googleBtnText: {
    color: "#1C1928",
    fontSize: 15,
    fontWeight: "600",
  },
  signUpBtn: {
    backgroundColor: "rgba(116,86,200,0.12)",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(116,86,200,0.3)",
  },
  signUpBtnText: {
    color: "#B8A8E8",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default Login;
