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

const CODE_LENGTH = 6;

const SignUpVerification: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [countdown, setCountdown] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpVerification">>();
  const { name, username, email, phone } = route.params;

  const firstName = name.split(" ")[0];

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

  const handleResendCode = () => {
    if (canResend) {
      setCountdown(30);
      setCanResend(false);
      Alert.alert("Código reenviado", "Um novo código foi enviado para seu telefone.");
    }
  };

  // Verifica se o código está completo
  const isCodeComplete = code.every(digit => digit !== "");

  const handleNext = () => {
    const fullCode = code.join("");
    
    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert("Erro", "Por favor, preencha o código completo");
      return;
    }

    navigation.navigate("SignUpPassword", { name, username, email, phone });
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
            Escreva o código que recebeu em seu telefone para continuar.
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
            style={styles.resendButton}
          >
            <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
              Reenviar o código de verificação {!canResend && `(${countdown}s)`}
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

