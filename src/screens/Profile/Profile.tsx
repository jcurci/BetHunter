import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  BackIconButton,
  RadialGradientBackground,
  MenuItem,
  MenuSection,
} from "../../components";
import { NavigationProp } from "../../types/navigation";

const ACCOUNT_DELETION_FORM_URL =
  "https://docs.google.com/forms/d/1XTdVTJxxeEgB7tzYcWab3TTOJIXX270DhCUBbDplz8w/viewform";

const Profile: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const openAccountDeletionForm = async () => {
    try {
      const supported = await Linking.canOpenURL(ACCOUNT_DELETION_FORM_URL);
      if (supported) {
        await Linking.openURL(ACCOUNT_DELETION_FORM_URL);
      } else {
        Alert.alert("Erro", "Não foi possível abrir o formulário.");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o formulário.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.backgroundGradient}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackIconButton onPress={() => navigation.goBack()} size={42} />
            <Text style={styles.headerTitle}>Conta</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Menu Sections */}
            {/* <MenuSection>
              <MenuItem
                icon="user"
                label="Detalhes pessoais"
                onPress={() => navigation.navigate("DetalhesPessoais")}
              />
              <MenuItem
                icon="key"
                label="Passkeys"
                onPress={() => {}}
                showSeparator={false}
              />
            </MenuSection>

            <MenuSection>
              <MenuItem
                icon="file-text"
                label="Política de privacidade"
                onPress={() => {}}
              />
              <MenuItem
                icon="info"
                label="Termos & condições"
                onPress={() => {}}
                showSeparator={false}
              />
            </MenuSection> */}

            <MenuSection>
              <MenuItem
                icon="heart"
                label="Desativar conta"
                onPress={openAccountDeletionForm}
                iconColor="#FF4444"
                textColor="#FF4444"
                showSeparator={false}
              />
            </MenuSection>
          </ScrollView>
        </View>
      </RadialGradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export default Profile;
