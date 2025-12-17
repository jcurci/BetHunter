import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Footer, StatsDisplay, Avatar, DayCounter, IconCard } from "../../components";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";

// Assets
const bookIcon = require("../../assets/icon-book.png");
const abcIcon = require("../../assets/icon-abc.png");
const diceIcon = require("../../assets/icon-dados.png");
const savedAbcIcon = require("../../assets/icon-saves-abc.png");
import EmojiHappy from "../../assets/emoji-happy.svg";
import { HORIZONTAL_GRADIENT_COLORS } from "../../config/colors";

// Constants
const XP_GRADIENT_COLORS = ["#443570", "#443045", "#2F2229", "#14121B"] as const;
const XP_GRADIENT_LOCATIONS = [0.0, 0.15, 0.32, 0.62] as const;

const MenuEducacional: React.FC = () => {
  const [user, setUser] = useState< | null>(null);
  
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
   
  }, []);

 

  const getInitials = (name: string | undefined): string => {
    if (!name) return "JD";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar initials={getInitials("John Doe")} size={48} style={styles.avatar} />
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit={false}>
                Menu{"\n"}Educacional
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <StatsDisplay energy={10} streak="3d" />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* XP Progress Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.xpCard}
            onPress={() => navigation.navigate("Ranking")}
          >
            <LinearGradient
              colors={XP_GRADIENT_COLORS}
              locations={XP_GRADIENT_LOCATIONS}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.xpCardGradient}
            >
              <View style={styles.xpCardContent}>
                <Image
                  source={require("../../assets/icon-ranking/Campeao.png")}
                  style={styles.xpIcon}
                  resizeMode="contain"
                />
                <View style={styles.xpTextContainer}>
                  <Text style={styles.xpValue}>410xp</Text>
                  <Text style={styles.xpRanking}>Você está em 4º lugar</Text>
                </View>
                <View style={styles.xpArrowContainer}>
                  <Image
                    source={require("../../assets/Icon-seta-efeito.png")}
                    style={styles.xpArrowEffect}
                    resizeMode="contain"
                  />
                  <Image
                    source={require("../../assets/Icon-seta.png")}
                    style={styles.xpArrow}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Streak Counter */}
          <DayCounter
            useFireIcons={true}
            activeFires={4}
            totalFires={6}
            finalNumber={27}
            style={styles.streakCounter}
          />

          {/* Opções Section */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Opções</Text>
            <Text style={styles.optionsSubtitle}>Cursos, aulas, e mais!</Text>
            
            <View style={styles.optionsGrid}>
              {/* Row 1 */}
              <View style={styles.optionsRow}>
                <IconCard
                  icon={<Image source={bookIcon} style={styles.optionIconImage} resizeMode="contain" />}
                  title="Cursos"
                  onPress={() => navigation.navigate("Cursos")}
                />
                <IconCard
                  icon={<Image source={abcIcon} style={styles.optionIconImage} resizeMode="contain" />}
                  title="Aulas"
                  onPress={() => navigation.navigate("Cursos")}
                />
                <IconCard
                  icon={<Image source={diceIcon} style={styles.optionIconImage} resizeMode="contain" />}
                  title="Roleta Bethunter"
                  onPress={() => navigation.navigate("Roulette")}
                />
              </View>

              {/* Row 2 */}
              <View style={styles.optionsRow}>
                <IconCard
                  icon={<Image source={bookIcon} style={styles.optionIconImage} resizeMode="contain" />}
                  title="Cursos Salvos"
                  onPress={() => navigation.navigate("CursosSalvos")}
                />
                <IconCard
                  icon={<Image source={savedAbcIcon} style={styles.optionIconImage} resizeMode="contain" />}
                  title="Aulas Salvas"
                />
                <IconCard
                  icon={<EmojiHappy width={32} height={32} />}
                  title="Parceiros Bethunter"
                />
              </View>
            </View>
          </View>

          {/* Estude Section */}
          <View style={styles.studySection}>
            <View style={styles.studyHeader}>
              <View style={styles.studyHeaderLeft}>
                <Text style={styles.studyTitle}>Estude</Text>
                <Text style={styles.studySubtitle}>Continue de onde parou</Text>
              </View>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Cursos")}
              >
                <Text style={styles.studyLink}>Ver cursos em progresso{" >"}</Text>
              </TouchableOpacity>
            </View>

            {/* Course Progress Card */}
            <TouchableOpacity activeOpacity={0.9} style={styles.courseCard}>
              <View style={styles.courseCardContent}>
                {/* Bloco interno decorativo */}
                <View style={styles.courseTextContainer}>
                  <View style={styles.courseTextInnerContainer}>
                  <MaskedView
                    style={styles.courseTitleContainer}
                    maskElement={
                        <Text style={[styles.courseTitle, { backgroundColor: "transparent" }]}>
                        Fundamentos
                      </Text>
                    }
                  >
                    <LinearGradient
                        colors={HORIZONTAL_GRADIENT_COLORS}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.courseTitleGradient}
                    >
                      <Text style={[styles.courseTitle, { opacity: 0 }]}>
                        Fundamentos
                      </Text>
                    </LinearGradient>
                  </MaskedView>
                  <Text style={styles.courseProgress}>1/4</Text>
                </View>
                </View>

                {/* Espaço flexível para distanciar a seta */}
                <View style={styles.courseSpacer} />

                {/* Seta de navegação com efeito */}
                <View style={styles.courseArrowContainer}>
                  <Image
                    source={require("../../assets/Icon-seta-efeito.png")}
                    style={styles.courseArrowEffect}
                    resizeMode="contain"
                  />
                  <Image
                    source={require("../../assets/Icon-seta.png")}
                    style={styles.courseArrow}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <Footer />
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
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    maxWidth: "70%",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
    flexWrap: "wrap",
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  streakCounter: {
    marginBottom: 20,
  },
  xpCard: {
    width: "100%",
    maxWidth: 348,
    height: 90,
    borderRadius: 26,
    marginBottom: 20,
    overflow: "hidden",
    alignSelf: "center",
  },
  xpCardGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    padding: 20,
    justifyContent: "center",
  },
  xpCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xpIcon: {
    width: 48,
    height: 48,
    marginRight: 16,
  },
  xpTextContainer: {
    flex: 1,
  },
  xpValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  xpRanking: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  xpArrowContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  xpArrowEffect: {
    position: "absolute",
    width: 48,
    height: 48,
    opacity: 1,
  },
  xpArrow: {
    width: 24,
    height: 24,
    zIndex: 1,
  },
  optionsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  optionsSubtitle: {
    fontSize: 14,
    color: "#A09CAB",
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  optionIconImage: {
    width: 32,
    height: 32,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    width: "100%",
  },
  studySection: {
    marginTop: 32,
    marginBottom: 40,
  },
  studyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  studyHeaderLeft: {
    flex: 1,
  },
  studyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  studySubtitle: {
    fontSize: 14,
    color: "#A09CAB",
  },
  studyLink: {
    fontSize: 14,
    color: "#A09CAB",
    textAlign: "right",
    marginLeft: 16,
  },
  courseCard: {
    width: 348,
    height: 78.93,
    backgroundColor: "#1A1825",
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#3D3A4D",
    overflow: "hidden",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  courseCardContent: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  courseTextContainer: {
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.36)",
    borderRadius: 26,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  courseTextInnerContainer: {
    justifyContent: "center",
  },
  courseTitleContainer: {
    height: 28,
    marginBottom: 2,
  },
  courseTitleGradient: {
    flex: 1,
    justifyContent: "center",
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 28,
  },
  courseProgress: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 2,
  },
  courseSpacer: {
    flex: 1,
  },
  courseArrowContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  courseArrowEffect: {
    position: "absolute",
    width: 48,
    height: 48,
    opacity: 1,
  },
  courseArrow: {
    width: 24,
    height: 24,
    zIndex: 1,
  },
});

export default MenuEducacional;




