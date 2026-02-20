import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton } from "../../components/common";
import { NavigationProp } from "../../types/navigation";

const BlockerConfig: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <CircularIconButton onPress={() => navigation.goBack()} size={50}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </CircularIconButton>
          <Text style={styles.title}>Configuração avançada</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.placeholder}>Em breve</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF", marginLeft: 15 },
  content: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  placeholder: { fontSize: 16, color: "#8A8A8A" },
});

export default BlockerConfig;
