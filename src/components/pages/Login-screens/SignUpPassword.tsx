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
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../../types/navigation";
import { Container } from "../../../infrastructure/di/Container";

const SignUpPassword: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpPassword">>();
  const { name, email, phone } = route.params;
  const container = Container.getInstance();

  const validatePassword = (pass: string): { valid: boolean; message: string } => {
    if (pass.length < 8) {
      return { valid: false, message: "A senha deve ter no mínimo 8 caracteres" };
    }
    
    const specialChars = /[!@#$%]/;
    if (!specialChars.test(pass)) {
      return { valid: false, message: "A senha deve conter pelo menos um caractere especial (!, @, #, $, %)" };
    }
    
    return { valid: true, message: "" };
  };

  const handleRegister = async () => {
    const validation = validatePassword(password);
    
    if (!validation.valid) {
      Alert.alert("Erro", validation.message);
      return;
    }

    setLoading(true);
    try {
      const userUseCase = container.getUserUseCase();
      const result = await userUseCase.register({
        name,
        email,
        password,
        cellphone: phone,
      });

      console.log("Registro bem-sucedido:", result);
      Alert.alert("Sucesso", "Cadastro realizado com sucesso! Faça login para continuar.", [
        {
          text: "OK",
          onPress: () => {
            // Reset navigation stack para voltar ao Login
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]);
    } catch (error: any) {
      console.error("Erro no registro:", error);
      
      if (error.response?.status === 409) {
        Alert.alert("Erro", "Este email já está cadastrado");
      } else if (error.response?.status === 400) {
        Alert.alert("Erro", "Dados inválidos. Verifique as informações");
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        Alert.alert("Erro", "Erro de conexão. Verifique sua internet");
      } else {
        Alert.alert("Erro", "Erro ao cadastrar. Tente novamente");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Crie sua senha</Text>
          <Text style={styles.subtitle}>Proteja sua conta</Text>

          <View style={styles.form}>
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>A senha:</Text>
              <Text style={styles.requirementItem}>• Deve conter no mínimo 8 caracteres</Text>
              <Text style={styles.requirementItem}>• Deve conter no mínimo um caractere especial (ex: !, @, #, $, %)</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
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
              style={[styles.registerButton, loading && styles.disabledButton]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  backButton: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 1,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#7456C8",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#A09CAB",
    marginBottom: 30,
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  passwordRequirements: {
    width: "100%",
    backgroundColor: "#1C1C1C",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  requirementItem: {
    fontSize: 14,
    color: "#A09CAB",
    marginBottom: 5,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
    position: "relative",
  },
  input: {
    backgroundColor: "#1C1C1C",
    padding: 15,
    paddingRight: 50,
    borderRadius: 10,
    color: "#FFFFFF",
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  registerButton: {
    width: "100%",
    backgroundColor: "#7456C8",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
});

export default SignUpPassword;

