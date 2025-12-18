import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton, GradientButton } from "../../components/common";

interface ValidationErrors {
  name?: string;
  username?: string;
}

const SignUpName: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ name: boolean; username: boolean }>({
    name: false,
    username: false,
  });
  const navigation = useNavigation<NavigationProp>();

  const validateName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Escreva seu nome completo";
    }
    if (value.trim().length < 3) {
      return "O nome deve ter no mínimo 3 caracteres";
    }
    return undefined;
  };

  const validateUsername = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Preencha o nome de usuário";
    }
    if (value.length < 3 || value.length > 32) {
      return "O nome de usuário deve ter entre 3 e 32 caracteres";
    }
    // Validar caracteres permitidos (letras, números, underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(value)) {
      return "Use apenas letras, números e underscore";
    }
    return undefined;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    
    // Marca como touched quando começar a digitar
    if (value.length > 0 && !touched.name) {
      setTouched((prev) => ({ ...prev, name: true }));
    }

    if (touched.name || value.length > 0) {
      // Se o campo estiver vazio, limpa o erro
      if (!value.trim()) {
        setErrors((prev) => ({ ...prev, name: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, name: validateName(value) }));
      }
    }
  };

  const handleUsernameChange = (value: string) => {
    // Remove espaços ao digitar
    const cleanValue = value.toLowerCase().replace(/\s/g, "");
    setUsername(cleanValue);

    // Marca como touched quando começar a digitar
    if (cleanValue.length > 0 && !touched.username) {
      setTouched((prev) => ({ ...prev, username: true }));
    }

    if (touched.username || cleanValue.length > 0) {
      // Se campo vazio, limpa o erro
      if (!cleanValue.trim()) {
        setErrors((prev) => ({ ...prev, username: undefined }));
      } else {
        // Usa a função de validação completa para ser consistente
        const error = validateUsername(cleanValue);
        setErrors((prev) => ({ ...prev, username: error }));
      }
    }
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setErrors((prev) => ({ ...prev, name: validateName(name) }));
  };

  const handleUsernameBlur = () => {
    setTouched((prev) => ({ ...prev, username: true }));
    setErrors((prev) => ({ ...prev, username: validateUsername(username) }));
  };

  // Verifica se o formulário é válido para habilitar o botão
  const isFormValid = 
    name.trim().length >= 3 && 
    username.length >= 3 && 
    username.length <= 32 &&
    /^[a-zA-Z0-9_]+$/.test(username) &&
    !errors.name && 
    !errors.username;

  const handleNext = () => {
    // Marcar todos como touched
    setTouched({ name: true, username: true });

    // Validar todos os campos
    const nameError = validateName(name);
    const usernameError = validateUsername(username);

    setErrors({
      name: nameError,
      username: usernameError,
    });

    // Se houver erros, não prosseguir
    if (nameError || usernameError) {
      return;
    }

    navigation.navigate("SignUpContact", { name, username });
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
              <Text style={styles.titleBold}>Qual o</Text>
              {"\n"}
              <Text style={styles.titleBold}>seu nome?</Text>
            </Text>
          </View>
          <Text style={styles.subtitle}>
            Cadastre seu nome de usuário para continuar.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.inputContainer,
                  errors.name && touched.name && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Escreva seu nome completo!"
                  autoCapitalize="words"
                  placeholderTextColor="#6B6B6B"
                  value={name}
                  onChangeText={handleNameChange}
                  onBlur={handleNameBlur}
                />
              </View>
              {errors.name && touched.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.usernameContainer,
                  errors.username && touched.username && styles.inputError,
                ]}
              >
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.usernameInput}
                  placeholder="nomedeusuario"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#6B6B6B"
                  value={username}
                  onChangeText={handleUsernameChange}
                  onBlur={handleUsernameBlur}
                />
              </View>
              {errors.username && touched.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton title="Próximo" onPress={handleNext} disabled={!isFormValid} />
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
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "transparent",
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 25,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  input: {
    padding: 18,
    color: "#FFFFFF",
    fontSize: 16,
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

export default SignUpName;
