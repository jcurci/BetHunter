import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Container } from "../../infrastructure/di/Container";
import Logo from "../../assets/logo-img/logo.svg";
import MaskedView from "@react-native-masked-view/masked-view";
import { NavigationProp } from "../../types/navigation";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const container = Container.getInstance();

  console.log("Container initialized:", container);

  const toggleShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }
    navigation.navigate("Home");
    setLoading(true);
    // try {
    //   const userUseCase = container.getUserUseCase();
    //   const result = await userUseCase.login({ email, password });

    //   console.log("Login successful:", result);
    //   Alert.alert("Sucesso", "Login realizado com sucesso!", [
    //     {
    //       text: "OK",
    //       onPress: () => navigation.navigate("Home"),
    //     },
    //   ]);
    // } catch (error: any) {
    //   console.error("Login error:", error);
      
    //   // Tratamento específico de erros do backend
    //   if (error.response?.status === 401) {
    //     Alert.alert("Erro", "Email ou senha incorretos");
    //   } else if (error.response?.status === 404) {
    //     Alert.alert("Erro", "Usuário não encontrado");
    //   } else if (error.response?.status === 400) {
    //     Alert.alert("Erro", "Dados inválidos. Verifique email e senha");
    //   } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    //     Alert.alert("Erro", "Erro de conexão. Verifique sua internet");
    //   } else if (error.code === 'ECONNABORTED') {
    //     Alert.alert("Erro", "Timeout. Tente novamente");
    //   } else {
    //     Alert.alert("Erro", "Erro ao conectar com servidor. Tente novamente");
    //   }
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <ImageBackground
      source={require("../../assets/login_background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <MaskedView
            maskElement={<Text style={styles.moduleTitle}>Login</Text>}
          >
            <LinearGradient
              colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Entrando..." : "Logar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate("SiginUp")}
            >
              <LinearGradient
                colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Cadastrar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.logoContainer}>
          <Logo width={200} height={50} style={styles.bethunterLogoImage} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1923",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#1A1923",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#1A1923",
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
    backgroundColor: "#2B2935",
    padding: 16,
    paddingRight: 50,
    borderRadius: 10,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 2,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  loginButton: {
    backgroundColor: "#7456C8",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    marginTop: 6,
  },
  registerButtonGradient: {
    borderRadius: 10,
    width: "100%",
    marginBottom: 8,
    marginTop: 12,
  },
  registerButton: {
    borderRadius: 10,
    width: "100%",
    marginBottom: 8,
    marginTop: 12,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: "center",
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
    width: 200,
    height: 50,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
});

export default Login;