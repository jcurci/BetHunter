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

type RecoveryMethod = 'email' | 'username' | 'phone';

interface MethodConfig {
  subtitle: string;
  placeholder: string;
  apiError: string;
  keyboardType: 'email-address' | 'default' | 'phone-pad';
}

const METHOD_CONFIG: Record<RecoveryMethod, MethodConfig> = {
  email: {
    subtitle: "Digite o email vinculado a sua conta.",
    placeholder: "exemplo@email.com.br",
    apiError: "Endereço de email deve estar vinculado a uma conta",
    keyboardType: "email-address",
  },
  username: {
    subtitle: "Digite o nome de usuário vinculado a sua conta.",
    placeholder: "nomedeusuario",
    apiError: "Nome de usuário deve estar vinculado a uma conta",
    keyboardType: "default",
  },
  phone: {
    subtitle: "Digite o telefone vinculado a sua conta.",
    placeholder: "(11) 99999-9999",
    apiError: "Número de telefone deve estar vinculado a uma conta",
    keyboardType: "phone-pad",
  },
};

const PasswordResetEmail: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "PasswordResetEmail">>();
  const { method } = route.params;

  const config = METHOD_CONFIG[method];

  // Validações específicas por método
  const validateEmail = (val: string): string => {
    if (!val.trim()) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Digite um endereço de email válido";
    return "";
  };

  const validateUsername = (val: string): string => {
    if (!val.trim()) return "";
    if (val.length < 3) return "O nome de usuário deve ter no mínimo 3 caracteres";
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(val)) return "Use apenas letras, números e underscore";
    return "";
  };

  const validatePhone = (val: string): string => {
    if (!val.trim()) return "";
    const digits = val.replace(/\D/g, "");
    if (digits.length !== 11) return "Digite um número de telefone válido";
    return "";
  };

  const validate = (val: string): string => {
    switch (method) {
      case 'email':
        return validateEmail(val);
      case 'username':
        return validateUsername(val);
      case 'phone':
        return validatePhone(val);
      default:
        return "";
    }
  };

  const handleChange = (val: string) => {
    // Limpa erro da API quando usuário começa a digitar novamente
    if (apiError) setApiError("");

    // Para username: remove espaços e converte para minúsculas
    let cleanVal = val;
    if (method === 'username') {
      cleanVal = val.toLowerCase().replace(/\s/g, "");
    }

    setValue(cleanVal);

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
    setError(validate(value));
  };

  // Verifica se o formulário é válido
  const isFormValid = (): boolean => {
    if (!value.trim() || error) return false;

    switch (method) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      case 'username':
        return value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value);
      case 'phone':
        const digits = value.replace(/\D/g, "");
        return digits.length === 11;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setTouched(true);
    const validation = validate(value);

    if (!value.trim()) {
      setError(getEmptyFieldError());
      return;
    }

    if (validation) {
      setError(validation);
      return;
    }

    if (method !== "email") {
      setApiError("No momento apenas a recuperação por e-mail está disponível.");
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      const container = Container.getInstance();
      await container.getRequestPasswordChangeUseCase().execute(value);
      navigation.navigate("PasswordResetVerification", { method, value });
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
    switch (method) {
      case 'email':
        return "Digite um endereço de email válido";
      case 'username':
        return "Digite um nome de usuário válido";
      case 'phone':
        return "Digite um número de telefone válido";
      default:
        return "Campo obrigatório";
    }
  };

  // Renderiza o input baseado no método
  const renderInput = () => {
    switch (method) {
      case 'username':
        return (
          <View style={[styles.usernameContainer, error && touched && styles.inputError]}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.usernameInput}
              placeholder={config.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#6B6B6B"
              value={value}
              onChangeText={handleChange}
              onBlur={handleBlur}
            />
          </View>
        );

      case 'phone':
        return (
          <View style={styles.phoneRow}>
            <View style={[styles.countryCodeContainer, error && touched && styles.inputError]}>
              <TextInput
                style={styles.countryCodeInput}
                value="+55"
                editable={false}
                placeholderTextColor="#6B6B6B"
              />
            </View>
            <View style={[styles.phoneContainer, error && touched && styles.inputError]}>
              <TextInput
                style={styles.phoneInput}
                placeholder={config.placeholder}
                keyboardType="phone-pad"
                placeholderTextColor="#6B6B6B"
                value={value}
                onChangeText={handleChange}
                onBlur={handleBlur}
              />
            </View>
          </View>
        );

      case 'email':
      default:
        return (
          <View style={[styles.inputContainer, error && touched && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder={config.placeholder}
              keyboardType={config.keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#6B6B6B"
              value={value}
              onChangeText={handleChange}
              onBlur={handleBlur}
            />
          </View>
        );
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
              {renderInput()}
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
  // Input de username com @
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  atSymbol: {
    color: "#6B6B6B",
    fontSize: 16,
    marginRight: 8,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 18,
    color: "#FFFFFF",
    fontSize: 16,
  },
  // Input de telefone com +55
  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryCodeContainer: {
    width: 80,
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "transparent",
  },
  countryCodeInput: {
    padding: 18,
    color: "#6B6B6B",
    fontSize: 16,
    textAlign: "center",
  },
  phoneContainer: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "transparent",
  },
  phoneInput: {
    padding: 18,
    color: "#FFFFFF",
    fontSize: 16,
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
