import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton } from "../../components/common";

type RecoveryMethod = 'email' | 'username' | 'phone';

interface MethodOption {
  id: RecoveryMethod;
  label: string;
  icon: string;
}

const RECOVERY_METHODS: MethodOption[] = [
  { id: 'email', label: 'Endereço de email', icon: 'mail-outline' },
  { id: 'username', label: 'Nome de usuário', icon: 'person-outline' },
  { id: 'phone', label: 'Número de telefone', icon: 'smartphone' },
];

const PasswordResetMethod: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleMethodSelect = (method: RecoveryMethod) => {
    navigation.navigate("PasswordResetEmail", { method });
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
              <Text style={styles.titleBold}>Sem problemas!</Text>
            </Text>
          </View>
          
          <Text style={styles.subtitle}>
            Escolha que método prefere utilizar para recuperar sua conta.
          </Text>

          <View style={styles.methodsContainer}>
            {RECOVERY_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodOption}
                onPress={() => handleMethodSelect(method.id)}
                activeOpacity={0.7}
              >
                <Icon name={method.icon} size={24} color="#FFFFFF" />
                <Text style={styles.methodLabel}>{method.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  methodsContainer: {
    backgroundColor: "#1C1C1C",
    borderRadius: 20,
    overflow: "hidden",
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  methodLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 15,
  },
});

export default PasswordResetMethod;


