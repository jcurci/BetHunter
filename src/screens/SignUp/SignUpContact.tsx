import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RouteProp as RNRouteProp } from "@react-navigation/native";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton, GradientButton } from "../../components/common";

const SignUpContact: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RNRouteProp<RootStackParamList, "SignUpContact">>();
  const { name, username } = route.params;

  const firstName = name.split(" ")[0];

  const handleNext = () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor, preencha seu email");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Erro", "Por favor, preencha seu telefone");
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
                style={styles.input}
                placeholder="Escreva seu email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#6B6B6B"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.phoneRow}>
              <View style={styles.countryCodeContainer}>
                <TextInput
                  style={styles.countryCodeInput}
                  value="+55"
                  editable={false}
                  placeholderTextColor="#6B6B6B"
                />
              </View>
              <View style={styles.phoneContainer}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                  placeholderTextColor="#6B6B6B"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
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

