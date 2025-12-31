import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { Avatar, CloseIconButton, HelpIconButton, RadialGradientBackground } from "../../components";
import { NavigationProp } from "../../types/navigation";

const LEAGUES = [
  { id: "bronze", label: "Bronze", colors: ["#4C4F5C", "#2A2C35"] },
  { id: "prata", label: "Prata", colors: ["#9254FF", "#6B4D8A"] },
  { id: "campeao", label: "Campeão", colors: ["#FF7A9E", "#9254FF"] },
];

const RANKING_DATA = [
  {
    position: 1,
    name: "Enzo Vasconcelos",
    xp: 660,
    initials: "EV",
    avatarGradient: ["#FFB872", "#FF6F91"],
  },
  {
    position: 2,
    name: "Felipe Hideki",
    xp: 640,
    initials: "FH",
    avatarGradient: ["#6FC3FF", "#466DF6"],
  },
  {
    position: 3,
    name: "Ricardo Queiroz",
    xp: 530,
    initials: "RQ",
    avatarGradient: ["#A164FF", "#FF9DE6"],
    promotion: true,
  },
  {
    position: 4,
    name: "JD Você",
    xp: 410,
    initials: "JD",
    highlight: true,
    avatarGradient: ["#FF7A9E", "#8C5BFF"],
  },
  {
    position: 5,
    name: "Guilherme Milheiro",
    xp: 400,
    initials: "GM",
    avatarGradient: ["#5457FF", "#22246B"],
  },
  {
    position: 6,
    name: "Júlia Zang",
    xp: 320,
    initials: "JZ",
    avatarGradient: ["#FFB872", "#FF6F91"],
  },
  {
    position: 7,
    name: "Jhonathan Curci",
    xp: 320,
    initials: "JC",
    avatarGradient: ["#FFE27A", "#FF9A5F"],
  },
  {
    position: 8,
    name: "Felipe Santana",
    xp: 180,
    initials: "FS",
    avatarGradient: ["#80FFDB", "#5390D9"],
  },
  {
    position: 9,
    name: "Guilherme Matheus",
    xp: 150,
    initials: "GM",
    avatarGradient: ["#4C4F5C", "#2A2C35"],
  },
  {
    position: 10,
    name: "Pedro Silva",
    xp: 140,
    initials: "PS",
    avatarGradient: ["#6B4D8A", "#3D2B5A"],
  },
  {
    position: 11,
    name: "Ana Costa",
    xp: 130,
    initials: "AC",
    avatarGradient: ["#9B6FB8", "#6B4D8A"],
  },
  {
    position: 12,
    name: "Lucas Oliveira",
    xp: 120,
    initials: "LO",
    avatarGradient: ["#D783D8", "#9B6FB8"],
  },
  {
    position: 13,
    name: "Maria Santos",
    xp: 110,
    initials: "MS",
    avatarGradient: ["#FFB872", "#FF6F91"],
  },
  {
    position: 14,
    name: "Carlos Pereira",
    xp: 100,
    initials: "CP",
    avatarGradient: ["#6FC3FF", "#466DF6"],
  },
  {
    position: 15,
    name: "Fernanda Lima",
    xp: 90,
    initials: "FL",
    avatarGradient: ["#A164FF", "#FF9DE6"],
  },
  {
    position: 16,
    name: "Rafael Souza",
    xp: 80,
    initials: "RS",
    avatarGradient: ["#5457FF", "#22246B"],
  },
  {
    position: 17,
    name: "Juliana Alves",
    xp: 70,
    initials: "JA",
    avatarGradient: ["#FFE27A", "#FF9A5F"],
  },
  {
    position: 18,
    name: "Bruno Ferreira",
    xp: 60,
    initials: "BF",
    avatarGradient: ["#80FFDB", "#5390D9"],
  },
  {
    position: 19,
    name: "Patricia Rocha",
    xp: 50,
    initials: "PR",
    avatarGradient: ["#4C4F5C", "#2A2C35"],
  },
  {
    position: 20,
    name: "Thiago Martins",
    xp: 45,
    initials: "TM",
    avatarGradient: ["#6B4D8A", "#3D2B5A"],
  },
  {
    position: 21,
    name: "Camila Ribeiro",
    xp: 40,
    initials: "CR",
    avatarGradient: ["#9B6FB8", "#6B4D8A"],
  },
  {
    position: 22,
    name: "Nakahara Misaki",
    xp: 40,
    initials: "NM",
    avatarGradient: ["#D783D8", "#9B6FB8"],
  },
  {
    position: 23,
    name: "Pietro Manzini",
    xp: 40,
    initials: "PM",
    avatarGradient: ["#FFB872", "#FF6F91"],
  },
  {
    position: 24,
    name: "Victor Santos",
    xp: 30,
    initials: "VS",
    avatarGradient: ["#6FC3FF", "#466DF6"],
  },
  {
    position: 25,
    name: "Júlia Zang",
    xp: 30,
    initials: "JZ",
    avatarGradient: ["#A164FF", "#FF9DE6"],
  },
  {
    position: 26,
    name: "Guilherme Milheiro",
    xp: 30,
    initials: "GM",
    avatarGradient: ["#5457FF", "#22246B"],
  },
  {
    position: 27,
    name: "Júlia Zang",
    xp: 20,
    initials: "JZ",
    avatarGradient: ["#FFE27A", "#FF9A5F"],
    relegation: true,
  },
  {
    position: 28,
    name: "Jhonathan Curci",
    xp: 0,
    initials: "JC",
    avatarGradient: ["#80FFDB", "#5390D9"],
  },
  {
    position: 29,
    name: "Felipe Santana",
    xp: 0,
    initials: "FS",
    avatarGradient: ["#4C4F5C", "#2A2C35"],
  },
  {
    position: 30,
    name: "Guilherme Matheus",
    xp: 0,
    initials: "GM",
    avatarGradient: ["#6B4D8A", "#3D2B5A"],
  },
];

const Ranking: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const renderAvatar = (item: typeof RANKING_DATA[number]) => {
    if (item.initials) {
      return (
        <LinearGradient
          colors={item.avatarGradient || ["#4C4F5C", "#2A2C35"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userAvatarGradient}
        >
          <Text style={styles.userAvatarInitials}>{item.initials}</Text>
        </LinearGradient>
      );
    }

    return <Avatar initials="JD" size={40} style={styles.userAvatarFallback} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RadialGradientBackground style={styles.background}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <CloseIconButton onPress={() => navigation.goBack()} size={42} />
            <TouchableOpacity style={styles.dragIndicator} activeOpacity={1}>
              <View style={styles.dragHandle} />
            </TouchableOpacity>
            <HelpIconButton size={42} />
          </View>

          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Ranking</Text>
            <Text style={styles.headerSubtitle}>Você está na liga Campeão</Text>

            <View style={styles.leagueIconsRow}>
              {LEAGUES.map((league) => (
                <LinearGradient
                  key={league.id}
                  colors={league.colors}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[styles.leagueIcon, league.id === "campeao" && styles.leagueIconActive]}
                >
                  <View style={[styles.leagueGlow, league.id === "campeao" && styles.leagueGlowActive]} />
                  <Text style={styles.leagueIconText}>{league.label.charAt(0)}</Text>
                </LinearGradient>
              ))}
            </View>

          </View>

          <View style={styles.listContainer}>
            {RANKING_DATA.map((item) => (
              <View
                key={item.position}
                style={[styles.listItem, item.highlight && styles.highlightedItem]}
              >
                <View style={styles.listLeft}>
                  <Text style={[styles.positionText, item.highlight && styles.highlightedPosition]}>
                    {item.position}
                  </Text>
                  {renderAvatar(item)}
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, item.highlight && styles.highlightedName]}>
                      {item.name}
                    </Text>
                    {(item.promotion || item.relegation) && (
                      <Text
                        style={[
                          styles.statusBadge,
                          item.promotion && styles.promotionBadge,
                          item.relegation && styles.relegationBadge,
                        ]}
                      >
                        {item.promotion ? "Promoção" : "Rebaixamento"}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.userXP, item.highlight && styles.highlightedXP]}>
                  {item.xp}xp
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </RadialGradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  background: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dragIndicator: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  leagueIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 28,
  },
  leagueIcon: {
    width: 62,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  leagueIconActive: {
    opacity: 1,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#FF7A9E",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 8,
  },
  leagueGlow: {
    position: "absolute",
    top: -18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  leagueGlowActive: {
    backgroundColor: "rgba(255,255,255,0.35)",
    opacity: 0.7,
  },
  leagueIconText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    backgroundColor: "#1E1A26",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  highlightedItem: {
    backgroundColor: "#32283C",
    borderWidth: 1,
    borderColor: "rgba(255,122,158,0.4)",
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userInfo: {
    flex: 1,
  },
  positionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  highlightedPosition: {
    color: "#FF7A9E",
  },
  userAvatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarInitials: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  userAvatarFallback: {
    marginRight: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  highlightedName: {
    color: "#FFFFFF",
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  promotionBadge: {
    color: "#47DE69",
  },
  relegationBadge: {
    color: "#FF4444",
  },
  userXP: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  highlightedXP: {
    color: "#FF7A9E",
  },
});

export default Ranking;
