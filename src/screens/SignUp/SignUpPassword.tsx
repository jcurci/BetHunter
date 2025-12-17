import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { Container } from "../../infrastructure/di/Container";
import { CircularIconButton, GradientButton } from "../../components/common";

const SignUpPassword: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpPassword">>();
  const { name, username, email, phone } = route.params;
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

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <CircularIconButton
              onPress={() => navigation.goBack()}
              size={50}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </CircularIconButton>
            <Text style={styles.title}>
              <Text style={styles.titleBold}>Última etapa!</Text>
            </Text>
          </View>
          <Text style={styles.subtitle}>
            Cadastre uma senha para continuar.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                secureTextEntry={!showPassword}
                placeholderTextColor="#6B6B6B"
                value={password}
                onChangeText={setPassword}
              />
              <CircularIconButton
                onPress={() => setShowPassword(!showPassword)}
                size={40}
                containerStyle={styles.eyeButton}
              >
                <Icon
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#FFFFFF"
                />
              </CircularIconButton>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>A senha:</Text>
              <Text style={styles.requirementItem}>• Deve conter no mínimo 8 caracteres</Text>
              <Text style={styles.requirementItem}>• Deve conter no mínimo um caractere especial (ex: !, @, #, $, %)</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirme sua senha"
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#6B6B6B"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <CircularIconButton
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                size={40}
                containerStyle={styles.eyeButton}
              >
                <Icon
                  name={showConfirmPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#FFFFFF"
                />
              </CircularIconButton>
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton 
            title={loading ? "Cadastrando..." : "Próximo"} 
            onPress={handleRegister}
            disabled={loading}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    marginLeft: 15,
  },
  titleBold: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#8A8A8A",
    marginBottom: 30,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    padding: 18,
    color: "#FFFFFF",
    fontSize: 16,
  },
  eyeButton: {
    marginLeft: 8,
  },
  passwordRequirements: {
    width: "100%",
    marginBottom: 15,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  requirementItem: {
    fontSize: 14,
    color: "#8A8A8A",
    marginBottom: 5,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default SignUpPassword;

