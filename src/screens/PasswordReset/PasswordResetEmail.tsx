import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton, GradientButton } from "../../components/common";
import { Container } from "../../infrastructure/di/Container";
import { ValidationError, AuthenticationError } from "../../domain/errors/CustomErrors";

interface MethodConfig {
  subtitle: string;
  placeholder: string;
  apiError: string;
  keyboardType: 'email-address';
}

const METHOD_CONFIG: MethodConfig = {
  subtitle: "Digite o email vinculado a sua conta.",
  placeholder: "exemplo@email.com.br",
  apiError: "Endereço de email deve estar vinculado a uma conta",
  keyboardType: "email-address",
};

const PasswordResetEmail: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "PasswordResetEmail">>();
  const { method: methodFromRoute } = route.params;

  // Independente do que vier na rota, esta tela só suporta recuperação por e-mail.
  const method: "email" = "email";
  const config = METHOD_CONFIG;

  const validateEmail = (val: string): string => {
    if (!val.trim()) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Digite um endereço de email válido";
    return "";
  };

  const validate = (val: string): string => {
    return validateEmail(val);
  };

  const handleChange = (val: string) => {
    // Limpa erro da API quando usuário começa a digitar novamente
    if (apiError) setApiError("");

    const cleanVal = val;
    setEmail(cleanVal);

    if (cleanVal.length > 0 && !touched) {
      setTouched(true);
    }

    if (touched || cleanVal.length > 0) {
      if (!cleanVal.trim()) {
        setError("");
      } else {
        setError(validate(cleanVal));
      }
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(email));
  };

  // Verifica se o formulário é válido
  const isFormValid = (): boolean => {
    if (!email.trim() || error) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = async () => {
    setTouched(true);
    const validation = validate(email);

    if (!email.trim()) {
      setError(getEmptyFieldError());
      return;
    }

    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      const container = Container.getInstance();
      await container.getRequestPasswordChangeUseCase().execute(email);
      navigation.navigate("PasswordResetVerification", { method, value: email });
    } catch (err: any) {
      const message =
        err instanceof ValidationError || err instanceof AuthenticationError
          ? err.message
          : "Erro ao enviar. Tente novamente.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const getEmptyFieldError = (): string => {
    return "Digite um endereço de email válido";
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
              <Text style={styles.titleBold}>Confirme sua</Text>
              {"\n"}
              <Text style={styles.titleBold}>conta!</Text>
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {config.subtitle}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, error && touched && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder={config.placeholder}
                  keyboardType={config.keyboardType}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#6B6B6B"
                  value={email}
                  onChangeText={handleChange}
                  onBlur={handleBlur}
                />
              </View>
              {error && touched && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>
          </View>

          {/* Container de erro da API */}
          {apiError && (
            <View style={styles.apiErrorContainer}>
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          )}
          {!!methodFromRoute && methodFromRoute !== 'email' && (
            <View style={styles.apiErrorContainer}>
              <Text style={styles.apiErrorText}>
                No momento, a recuperação de senha está disponível apenas por e-mail.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton
            title={loading ? "Enviando..." : "Próximo"}
            onPress={handleNext}
            disabled={!isFormValid() || loading}
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
  // Input padrão (email)
  inputContainer: {
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "transparent",
  },
  input: {
    padding: 18,
    color: "#FFFFFF",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginTop: 8,
    marginLeft: 18,
  },
  // Container de erro da API
  apiErrorContainer: {
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "#E74C3C",
    borderRadius: 15,
    padding: 16,
    marginTop: 20,
  },
  apiErrorText: {
    color: "#E74C3C",
    fontSize: 15,
    lineHeight: 22,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default PasswordResetEmail;
