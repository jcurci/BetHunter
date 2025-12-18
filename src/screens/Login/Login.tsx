import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Container } from "../../infrastructure/di/Container";
import Logo from "../../assets/logo-img/LogoImgETexto.svg";
import MaskedView from "@react-native-masked-view/masked-view";
import { NavigationProp } from "../../types/navigation";
import { HORIZONTAL_GRADIENT } from "../../config/colors";
import { useAuthStore } from "../../storage/authStore";
import { toAuthUser } from "../../domain/entities/User";
import { ValidationError } from "../../domain/errors/CustomErrors";

// Constants
const BACKGROUND_GRADIENT_COLORS = ["#443570", "#443045", "#2F2229", "#0F0E11", "#000000"] as const;
const BACKGROUND_GRADIENT_LOCATIONS = [0, 0.15, 0.32, 0.62, 1] as const;

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const container = Container.getInstance();
  const authStore = useAuthStore();

  const toggleShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (): void => {
    // TODO: Restaurar autenticação real após testes
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Background Gradient - Top to Bottom */}
        <LinearGradient
          colors={BACKGROUND_GRADIENT_COLORS}
          locations={BACKGROUND_GRADIENT_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.backgroundGradient}
        />

        <View style={styles.content}>
          <MaskedView
            maskElement={<Text style={styles.moduleTitle}>Login</Text>}
          >
            <LinearGradient
              {...HORIZONTAL_GRADIENT}
            >
              <Text style={[styles.moduleTitle, { opacity: 0 }]}>Login</Text>
            </LinearGradient>
          </MaskedView>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Senha"
                secureTextEntry={!showPassword}
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={toggleShowPassword}
              >
                <Icon
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#A0A0A0"
                />
              </TouchableOpacity>
            </View>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButtonContainer}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={HORIZONTAL_GRADIENT.colors}
                locations={HORIZONTAL_GRADIENT.locations}
                start={HORIZONTAL_GRADIENT.start}
                end={HORIZONTAL_GRADIENT.end}
                style={[styles.loginButton, loading && styles.disabledButton]}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Entrando..." : "Logar"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate("SignUpName")}
              activeOpacity={0.7}
            >
              <View style={styles.registerLinkContainer}>
                <Text style={styles.registerLinkText}>Nao tem conta? </Text>
                <MaskedView
                  maskElement={<Text style={styles.registerLinkGradientText}>Cadastre-se!</Text>}
                >
                  <LinearGradient
                    colors={HORIZONTAL_GRADIENT.colors}
                    locations={HORIZONTAL_GRADIENT.locations}
                    start={HORIZONTAL_GRADIENT.start}
                    end={HORIZONTAL_GRADIENT.end}
                  >
                    <Text style={[styles.registerLinkGradientText, { opacity: 0 }]}>
                      Cadastre-se!
                    </Text>
                  </LinearGradient>
                </MaskedView>
              </View>
            </TouchableOpacity>

         
          </View>
        </View>
        <View style={styles.logoContainer}>
          <Logo width={211} height={53} style={styles.bethunterLogoImage} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    zIndex: -1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  gradientTitleContainer: {
    marginBottom: 10,
    alignSelf: "flex-start",
    width: "100%",
    height: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#7456C8",
    textAlign: "left",
    marginBottom: 20,
  },
  moduleTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "left",
    marginTop: 54,
    marginBottom: 20,
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 12,
    position: "relative",
  },
  input: {
    backgroundColor: "#14121B",
    padding: 16,
    paddingRight: 50,
    borderRadius: 10,
    color: "#4F4C56",
    fontSize: 16,
    marginBottom: 2,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  loginButtonContainer: {
    width: "100%",
    marginBottom: 10,
    marginTop: 6,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
  },
  registerLink: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 8,
    marginTop: 12,
  },
  registerLinkContainer: {
    flexDirection: "row",
    display: "flex",
    justifyContent: "flex-start",
  },
  registerLinkText: {
    color: "#A09CAB",
    fontSize: 14,
    fontWeight: "normal",
  },
  registerLinkGradientText: {
    fontSize: 14,
    fontWeight: "normal",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    width: "100%",
    textAlign: "center",
  },
  forgotPassword: {
    alignSelf: "flex-start",
    marginBottom: 12,
    marginTop: 6,
  },
  forgotPasswordText: {
    color: "#A09CAB",
    fontSize: 14,
    fontWeight: "bold",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  bethunterLogoImage: {
    width: 211,
    height: 53,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default Login;