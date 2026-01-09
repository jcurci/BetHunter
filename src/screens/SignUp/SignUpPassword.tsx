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

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

const SignUpPassword: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ password: boolean; confirmPassword: boolean }>({
    password: false,
    confirmPassword: false,
  });
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpPassword">>();
  const { name, username, email, phone } = route.params;
  const container = Container.getInstance();

  const validatePassword = (pass: string): string | undefined => {
    if (!pass) return undefined;
    if (pass.length < 8) {
      return "A senha deve ter no mínimo 8 caracteres";
    }
    const specialChars = /[!@#$%]/;
    if (!specialChars.test(pass)) {
      return "A senha deve conter pelo menos um caractere especial (!, @, #, $, %)";
    }
    return undefined;
  };

  const validateConfirmPassword = (confirm: string): string | undefined => {
    if (!confirm) return undefined;
    if (password && confirm !== password) {
      return "As senhas não coincidem";
    }
    return undefined;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      if (!value) {
        setErrors((prev) => ({ ...prev, password: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
      }
    }
    // Revalidar confirmPassword quando a senha muda
    if (confirmPassword && touched.confirmPassword) {
      if (value !== confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "As senhas não coincidem" }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Só limpa o erro se o campo estiver vazio, validação completa só no blur
    if (!value) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  };

  const handleConfirmPasswordBlur = () => {
    setTouched((prev) => ({ ...prev, confirmPassword: true }));
    setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
  };

  // Verifica se o formulário é válido para habilitar o botão
  const specialChars = /[!@#$%]/;
  const isFormValid = 
    password.length >= 8 && 
    specialChars.test(password) &&
    confirmPassword !== "" &&
    password === confirmPassword &&
    !errors.password &&
    !errors.confirmPassword;

  const handleRegister = async () => {
    // Marcar todos como touched
    setTouched({ password: true, confirmPassword: true });

    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword);

    setErrors({
      password: passwordError,
      confirmPassword: confirmError,
    });

    // Se houver erros, não prosseguir
    if (passwordError || confirmError) {
      return;
    }

    setLoading(true);
    try {
      const userUseCase = container.getUserUseCase();
      const result = await userUseCase.createPassword(email, password);

      console.log("✅ Registro verificado e usuário criado:", result);
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
      console.error("Erro ao verificar registro:", error);
      
      // Extrair mensagem de erro do backend
      const errorMessage = error.message || error.response?.data?.message || '';
      const statusCode = error.response?.status;
      
      // Verificar se é erro de email ou telefone já cadastrado
      if (statusCode === 400 || statusCode === 409) {
        if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('e-mail')) {
          Alert.alert("Erro", "Este email já está cadastrado");
        } else if (errorMessage.toLowerCase().includes('telefone') || errorMessage.toLowerCase().includes('phone') || errorMessage.toLowerCase().includes('cellphone')) {
          Alert.alert("Erro", "Este telefone já está cadastrado");
        } else if (errorMessage) {
          // Usar mensagem específica do backend se disponível
          Alert.alert("Erro", errorMessage);
        } else {
          Alert.alert("Erro", "Dados inválidos. Verifique as informações");
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error') || error.code === 'ECONNABORTED') {
        Alert.alert("Erro", "Erro de conexão. Verifique sua internet");
      } else if (error.message) {
        // Mostrar mensagem de erro específica se disponível
        Alert.alert("Erro", error.message);
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
            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                errors.password && touched.password && styles.inputError
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#6B6B6B"
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={handlePasswordBlur}
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
              {errors.password && touched.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>A senha:</Text>
              <Text style={styles.requirementItem}>• Deve conter no mínimo 8 caracteres</Text>
              <Text style={styles.requirementItem}>• Deve conter no mínimo um caractere especial (ex: !, @, #, $, %)</Text>
            </View>

            <View style={styles.inputWrapper}>
              <View style={[
                styles.inputContainer,
                errors.confirmPassword && touched.confirmPassword && styles.inputError
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirme sua senha"
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#6B6B6B"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
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
              {errors.confirmPassword && touched.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton 
            title={loading ? "Cadastrando..." : "Finalizar Cadastro"} 
            onPress={handleRegister}
            disabled={loading || !isFormValid}
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
  inputWrapper: {
    marginBottom: 15,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    paddingRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#E74C3C",
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
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginTop: 8,
    marginLeft: 18,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default SignUpPassword;

