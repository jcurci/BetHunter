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

const SignUpContact: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpContact">>();
  const { name, username } = route.params;

  const firstName = name.split(" ")[0];

  // Validação de email
  const validateEmail = (value: string): string => {
    if (!value.trim()) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Digite um endereço de email válido";
    return "";
  };

  // Validação de telefone (11 dígitos: DDD + 9 dígitos)
  const validatePhone = (value: string): string => {
    if (!value.trim()) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) return "Digite um número de telefone válido";
    return "";
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Limpa o erro enquanto digita (se já estava válido)
    if (emailError && !validateEmail(value)) {
      setEmailError("");
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    // Limpa o erro enquanto digita (se já estava válido)
    if (phoneError && !validatePhone(value)) {
      setPhoneError("");
    }
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePhoneBlur = () => {
    setPhoneError(validatePhone(phone));
  };

  const handleNext = () => {
    // Validar campos vazios
    if (!email.trim()) {
      setEmailError("Digite um endereço de email válido");
      return;
    }
    if (!phone.trim()) {
      setPhoneError("Digite um número de telefone válido");
      return;
    }

    // Validar formato
    const emailValidation = validateEmail(email);
    const phoneValidation = validatePhone(phone);

    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }

    navigation.navigate("SignUpVerification", { name, username, email, phone });
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
              <Text style={styles.titleBold}>Perfeito, {firstName}</Text>
            </Text>
          </View>
          <Text style={styles.subtitle}>
            Cadastre seu email e telefone para continuar.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Escreva seu email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#6B6B6B"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.phoneInputWrapper}>
              <View style={styles.phoneRow}>
                <View style={styles.countryCodeContainer}>
                  <TextInput
                    style={[
                      styles.countryCodeInput,
                      phoneError ? styles.inputError : null,
                    ]}
                    value="+55"
                    editable={false}
                    placeholderTextColor="#6B6B6B"
                  />
                </View>
                <View style={styles.phoneContainer}>
                  <TextInput
                    style={[styles.phoneInput, phoneError ? styles.inputError : null]}
                    placeholder="(11) 99999-9999"
                    keyboardType="phone-pad"
                    placeholderTextColor="#6B6B6B"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                  />
                </View>
              </View>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton title="Próximo" onPress={handleNext} />
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
  },
  input: {
    backgroundColor: "#1C1C1C",
    padding: 18,
    borderRadius: 25,
    color: "#FFFFFF",
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#E53935",
  },
  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginTop: 8,
    marginLeft: 15,
  },
  phoneInputWrapper: {
    marginBottom: 15,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryCodeContainer: {
    width: 80,
  },
  countryCodeInput: {
    backgroundColor: "#1C1C1C",
    padding: 18,
    borderRadius: 25,
    color: "#6B6B6B",
    fontSize: 16,
    textAlign: "center",
  },
  phoneContainer: {
    flex: 1,
  },
  phoneInput: {
    backgroundColor: "#1C1C1C",
    padding: 18,
    borderRadius: 25,
    color: "#FFFFFF",
    fontSize: 16,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default SignUpContact;
