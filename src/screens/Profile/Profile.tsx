import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  BackIconButton,
  RadialGradientBackground,
  MenuItem,
  MenuSection,
} from "../../components";
import { NavigationProp } from "../../types/navigation";

const Profile: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

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
            <MenuSection>
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
            </MenuSection>

            <MenuSection>
              <MenuItem
                icon="heart"
                label="Desativar conta"
                onPress={() => {}}
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
