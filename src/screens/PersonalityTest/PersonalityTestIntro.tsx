import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton, GradientButton } from "../../components/common";

const PersonalityTestIntro: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleContinue = () => {
    navigation.navigate("PersonalityTestQuestion");
  };  

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <CircularIconButton
            onPress={() => navigation.goBack()}
            size={50}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </CircularIconButton>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            Complete o teste a seguir para definirmos o seu perfil!
          </Text>
          <Text style={styles.subtitle}>
            Não se preocupe, não existem repostas certas ou erradas no teste ! 
          </Text>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton title="Continuar!" onPress={handleContinue} />
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
  header: {
    padding: 20,
    paddingTop: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#8A8A8A",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default PersonalityTestIntro;

