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
  { id: "bronze", label: "Bronze", colors: ["#443437", "#2A1F21"] },
  { id: "prata", label: "Prata", colors: ["#4C4F5C", "#2A2C35"] },
  { id: "campeao", label: "Campeão", colors: ["#9254FF", "#FF7A9E"] },
  { id: "diamante", label: "Diamante", colors: ["#5AD0FF", "#3F5AFF"] },
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
  },
  {
    position: 4,
    name: "Você",
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

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorLabel}>Promoção</Text>
              <View style={styles.separatorLine} />
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
                  <View>
                    <Text style={[styles.userName, item.highlight && styles.highlightedName]}>
                      {item.name}
                    </Text>
                    <Text style={styles.userLeague}>Campeão</Text>
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
    justifyContent: "space-evenly",
    marginBottom: 28,
  },
  leagueIcon: {
    width: 62,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.45,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  leagueIconActive: {
    opacity: 1,
    borderColor: "rgba(255,255,255,0.45)",
    shadowColor: "#FF7A9E",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
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
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  separatorLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(71, 222, 105, 0.35)",
    borderStyle: "dashed",
  },
  separatorLabel: {
    color: "#47DE69",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
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
  userLeague: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
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
