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
import { ValidationError, AuthenticationError } from "../../domain/errors/CustomErrors";

const CODE_LENGTH = 6;

const PasswordResetVerification: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [countdown, setCountdown] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "PasswordResetVerification">>();
  const { method, value } = route.params;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
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
    try {
      const container = Container.getInstance();
      await container.getRequestPasswordChangeUseCase().execute(value);
      setCountdown(30);
      setCanResend(false);
      Alert.alert("Código reenviado", "Um novo código foi enviado para o seu e-mail.");
    } catch (err: any) {
      const message =
        err?.message ?? "Não foi possível reenviar. Tente novamente.";
      Alert.alert("Erro", message);
    }
  };

  const handleTryAnotherMethod = () => {
    // Volta para a tela de seleção de método
    navigation.navigate("PasswordResetMethod");
  };

  // Verifica se o código está completo
  const isCodeComplete = code.every(digit => digit !== "");

  const handleNext = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert("Erro", "Por favor, preencha o código completo");
      return;
    }

    try {
      const container = Container.getInstance();
      await container.getVerifyPasswordChangeCodeUseCase().execute(value, fullCode);
      navigation.navigate("PasswordResetNewPassword", { method, value, code: fullCode });
    } catch (err: any) {
      const message =
        err instanceof ValidationError || err instanceof AuthenticationError
          ? err.message
          : err?.message ?? "Erro ao verificar código. Tente novamente.";
      Alert.alert("Erro", message);
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
              <Text style={styles.titleBold}>Só mais um pouco!</Text>
            </Text>
          </View>
          <Text style={styles.subtitle}>
            Digite o código que enviamos para o seu e-mail.
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
            disabled={!canResend}
            style={styles.linkButton}
          >
            <Text style={[styles.linkText, !canResend && styles.linkTextDisabled]}>
              Reenviar o código de verificação {!canResend && `(${countdown}s)`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTryAnotherMethod}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              Tentar outro método de recuperação
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton title="Próximo" onPress={handleNext} disabled={!isCodeComplete} />
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
  linkButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  linkTextDisabled: {
    color: "#6B6B6B",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default PasswordResetVerification;

