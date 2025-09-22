import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Image,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { Container } from "../../../infrastructure/di/Container";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const container = Container.getInstance();

  console.log("Container initialized:", container);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const userUseCase = container.getUserUseCase();
      const result = await userUseCase.login({ email, password });

      console.log("Login successful:", result);
      Alert.alert("Sucesso", "Login realizado com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Home"),
        },
      ]);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Erro", "Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/login_background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Login</Text>

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
              <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/logo-img/logo_white.svg")}
            style={styles.bethunterLogoImage}
            resizeMode="contain"
          />
          <Image
            source={require("../../../assets/logo-img/text_white.svg")}
            style={styles.bethunterTextLogoImage}
            resizeMode="contain"
          />
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
  },
  safeArea: {
    flex: 1,
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
    backgroundColor: "#121212",
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
  },
  registerButton: {
    backgroundColor: "#FFA500",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
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
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
  bethunterLogoImage: {
    width: 60,
    height: 60,
    marginRight: 5,
  },
  bethunterTextLogoImage: {
    width: 100,
    height: 50,
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
});

export default Login;
