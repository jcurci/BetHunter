import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

const Config = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configurações</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon name="user" size={24} color="#FFFFFF" />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Perfil</Text>
            <Text style={styles.optionSubtitle}>
              Foto de perfil, email, senha, etc
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Icon name="bell" size={24} color="#FFFFFF" />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Notificações</Text>
            <Text style={styles.optionSubtitle}>
              Configure as notificações do App
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Icon name="log-out" size={24} color="#FF0000" />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitleRed}>Sair</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  optionTextContainer: {
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  optionTitleRed: {
    fontSize: 18,
    color: "#FF0000",
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#A09CAB",
    marginTop: 2,
  },
});

export default Config;
