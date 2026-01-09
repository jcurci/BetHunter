import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton, GradientButton } from "../../components/common";
import { Container } from "../../infrastructure/di/Container";
import { ValidationError } from "../../domain/errors/CustomErrors";

const CODE_LENGTH = 6;

const SignUpVerification: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [countdown, setCountdown] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [sendingCode, setSendingCode] = useState<boolean>(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpVerification">>();
  const { name, username, email, phone } = route.params;
  const container = Container.getInstance();

  const firstName = name.split(" ")[0];

  // Enviar código quando o componente montar
  useEffect(() => {
    sendVerificationCode();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const sendVerificationCode = async () => {
    setSendingCode(true);
    try {
      const userUseCase = container.getUserUseCase();
      await userUseCase.sendVerificationCode({
        name,
        username,
        email,
        cellphone: phone,
      });
      console.log("✅ Código de verificação enviado");
      setCountdown(30);
      setCanResend(false);
    } catch (error: any) {
      console.error("❌ Erro ao enviar código:", error);
      
      const errorMessage = error.message || error.response?.data?.message || '';
      const statusCode = error.response?.status;
      
      if (error instanceof ValidationError) {
        Alert.alert("Erro de Validação", error.message);
      } else if (statusCode === 400 || statusCode === 409) {
        if (errorMessage.toLowerCase().includes('email')) {
          Alert.alert("Erro", "Este email já está cadastrado");
        } else if (errorMessage) {
          Alert.alert("Erro", errorMessage);
        } else {
          Alert.alert("Erro", "Dados inválidos. Verifique as informações");
        }
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        Alert.alert(
          "Erro de Conexão",
          "Não foi possível conectar ao servidor.\n\nVerifique se:\n• O backend está rodando\n• A URL está correta\n• Sua conexão com a internet está ativa"
        );
      } else if (errorMessage) {
        Alert.alert("Erro", errorMessage);
      } else {
        Alert.alert("Erro", "Erro ao enviar código de verificação. Tente novamente");
      }
    } finally {
      setSendingCode(false);
    }
  };

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
    if (canResend && !sendingCode) {
      await sendVerificationCode();
      Alert.alert("Código reenviado", "Um novo código foi enviado para seu email.");
    }
  };

  // Verifica se o código está completo
  const isCodeComplete = code.every(digit => digit !== "");

  const handleNext = async () => {
    const fullCode = code.join("");
    
    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert("Erro", "Por favor, preencha o código completo");
      return;
    }

    setLoading(true);
    try {
      const userUseCase = container.getUserUseCase();
      await userUseCase.verifyEmail(email, fullCode);
      
      console.log("✅ Email verificado");
      // Navegar para tela de senha após verificação bem-sucedida
      navigation.navigate("SignUpPassword", { name, username, email, phone });
    } catch (error: any) {
      console.error("❌ Erro ao verificar código:", error);
      
      const errorMessage = error.message || error.response?.data?.message || '';
      const statusCode = error.response?.status;
      
      if (error instanceof ValidationError) {
        Alert.alert("Erro de Validação", error.message);
      } else if (statusCode === 401 || statusCode === 400) {
        if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('inválido') || errorMessage.toLowerCase().includes('expirado')) {
          Alert.alert("Erro", "Código inválido ou expirado. Solicite um novo código.");
        } else if (errorMessage) {
          Alert.alert("Erro", errorMessage);
        } else {
          Alert.alert("Erro", "Código inválido ou expirado");
        }
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        Alert.alert(
          "Erro de Conexão",
          "Não foi possível conectar ao servidor.\n\nVerifique se:\n• O backend está rodando\n• A URL está correta\n• Sua conexão com a internet está ativa"
        );
      } else if (errorMessage) {
        Alert.alert("Erro", errorMessage);
      } else {
        Alert.alert("Erro", "Erro ao verificar código. Tente novamente");
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
              <Text style={styles.titleBold}>Quase lá, {firstName}</Text>
            </Text>
          </View>
          <Text style={styles.subtitle}>
            Escreva o código que recebeu em seu email para continuar.
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <View key={index} style={styles.codeInputWrapper}>
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={styles.codeInput}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleResendCode}
            disabled={!canResend || sendingCode}
            style={styles.resendButton}
          >
            <Text style={[styles.resendText, (!canResend || sendingCode) && styles.resendTextDisabled]}>
              {sendingCode ? "Enviando..." : `Reenviar o código de verificação ${!canResend && !sendingCode ? `(${countdown}s)` : ""}`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton 
            title={loading ? "Verificando..." : "Próximo"} 
            onPress={handleNext} 
            disabled={!isCodeComplete || loading || sendingCode} 
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  codeInputWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1C1C1C",
    justifyContent: "center",
    alignItems: "center",
  },
  codeInput: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  resendButton: {
    alignSelf: "flex-start",
  },
  resendText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  resendTextDisabled: {
    color: "#6B6B6B",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default SignUpVerification;

