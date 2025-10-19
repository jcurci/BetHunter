import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../../types/navigation";

const SiginUp: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Bem vindo!</Text>
          <Text style={styles.subtitle}>Cadastre-se para continuar</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Escreva seu email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeContainer}>
                <TextInput
                  style={styles.countryCodeInput}
                  value="+55"
                  editable={false}
                  placeholderTextColor="#A0A0A0"
                />
              </View>
              <View style={styles.phoneNumberContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                  placeholderTextColor="#A0A0A0"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.nextButtonSolid}>
              <Text style={styles.buttonText}>Próximo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  backButton: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 1,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#7456C8",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#A09CAB",
    marginBottom: 20,
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1C1C1C",
    padding: 15,
    borderRadius: 10,
    color: "#FFFFFF",
    fontSize: 16,
  },
  phoneInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  countryCodeContainer: {
    width: "20%",
    marginRight: 10,
  },
  countryCodeInput: {
    backgroundColor: "#1C1C1C",
    padding: 15,
    borderRadius: 10,
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  phoneNumberContainer: {
    width: "75%",
  },
  nextButtonSolid: {
    width: "100%",
    backgroundColor: "#7456C8",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SiginUp;
