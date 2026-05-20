import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BackIconButton, QuizPrimaryButton, QuizDisabledButton } from "../../components";
import { Container } from "../../infrastructure/di/Container";
import BettyIcon from "../../assets/Betty.png";

const QuizPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { moduleId, moduleTitle } = route.params || {};

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitGuardRef = useRef(false);
  const checkTimeoutRef = useRef(null);

  const [isTipVisible, setIsTipVisible] = useState(false);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [displayedTipText, setDisplayedTipText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const tipTimeoutRef = useRef(null);
  const tipLoadingTimeoutRef = useRef(null);
  const typewriterIntervalRef = useRef(null);
  const tipOpacity = useRef(new Animated.Value(0)).current;
  const tipTranslate = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    loadQuestions();
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
      if (tipLoadingTimeoutRef.current) clearTimeout(tipLoadingTimeoutRef.current);
      if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    };
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await Container.getInstance()
        .getGetUnansweredQuestionsUseCase()
        .execute(moduleId);
      setQuestions(result);
    } catch (err) {
      setError(err.message || "Erro ao carregar perguntas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionState = () => {
    setShowAnswer(false);
    setHasChecked(false);
    closeTip(true);
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
  };

  const handleAnswerSelect = (answerId) => {
    if (showAnswer) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answerId }));
    setSelectedAnswer(answerId);
    setHasChecked(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(answers[questions[nextIndex]?.id] || null);
      resetQuestionState();
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (submitGuardRef.current || !moduleId || !questions.length) return;
    submitGuardRef.current = true;
    setIsSubmitting(true);

    const payload = questions.map((q) => ({
      questionId: q.id,
      alternativeId: answers[q.id],
    }));
    if (payload.some((p) => !p.alternativeId)) {
      submitGuardRef.current = false;
      setIsSubmitting(false);
      Alert.alert("Quiz", "Responda todas as perguntas antes de concluir.");
      return;
    }

    try {
      const result = await Container.getInstance()
        .getSubmitQuizModuleUseCase()
        .execute(moduleId, payload);

      const navQuizResultParams = {
        score: result.correctCount,
        total: result.totalQuestions,
        stars: result.stars,
        accuracy: result.accuracy,
      };
      if (__DEV__) {
        console.warn("[BetHunter] QuizPage submit OK — retorno use case (= serviço)", {
          moduleId,
          resultDoServicoCamadaApi: result,
          paramsQuizResult: navQuizResultParams,
        });
      }
      navigation.navigate("QuizResult", navQuizResultParams);
    } catch (err) {
      submitGuardRef.current = false;
      setIsSubmitting(false);
      if (__DEV__) {
        console.warn("[BetHunter] QuizPage handleSubmitQuiz", err);
      }
      const msg =
        err && typeof err.message === "string"
          ? err.message
          : "Erro ao submeter o quiz. Tente novamente.";
      Alert.alert("Quiz", msg);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setSelectedAnswer(answers[questions[prevIndex]?.id] || null);
      resetQuestionState();
    } else {
      navigation.goBack();
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    setHasChecked(true);
    setShowAnswer(true);
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 1200);
  };

  const closeTip = (instant = false) => {
    if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
    if (tipLoadingTimeoutRef.current) clearTimeout(tipLoadingTimeoutRef.current);
    if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);

    if (instant) {
      tipOpacity.setValue(0);
      tipTranslate.setValue(40);
      setIsTipVisible(false);
      setIsTipLoading(false);
      setDisplayedTipText("");
      setIsTyping(false);
      return;
    }

    Animated.parallel([
      Animated.timing(tipOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(tipTranslate, { toValue: 40, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsTipVisible(false);
        setIsTipLoading(false);
        setDisplayedTipText("");
        setIsTyping(false);
      }
    });
  };

  const startTypewriter = (text) => {
    setIsTyping(true);
    setDisplayedTipText("");
    let i = 0;
    typewriterIntervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedTipText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typewriterIntervalRef.current);
        setIsTyping(false);
      }
    }, 25);
  };

  const handleBettyPress = () => {
    if (isTipVisible) { closeTip(); return; }

    const hint = currentQuestion?.hint || "Vamos nessa! Pense no conceito principal.";
    setIsTipVisible(true);
    setIsTipLoading(true);
    setDisplayedTipText("");
    tipOpacity.setValue(0);
    tipTranslate.setValue(40);

    Animated.parallel([
      Animated.timing(tipOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(tipTranslate, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    tipLoadingTimeoutRef.current = setTimeout(() => {
      setIsTipLoading(false);
      startTypewriter(hint);
    }, 1500);

    tipTimeoutRef.current = setTimeout(() => { closeTip(); }, 15000);
  };

  const getOptionStyle = (option) => {
    if (!showAnswer) {
      return selectedAnswer === option.id
        ? [styles.optionButton, styles.optionButtonSelected]
        : styles.optionButton;
    }
    return option.correct
      ? [styles.optionButton, styles.optionButtonCorrect]
      : [styles.optionButton, styles.optionButtonIncorrect];
  };

  const getOptionTextStyle = (option) => {
    if (!showAnswer) {
      return selectedAnswer === option.id
        ? [styles.optionText, styles.optionTextSelected]
        : styles.optionText;
    }
    return option.correct
      ? [styles.optionText, styles.optionTextCorrect]
      : [styles.optionText, styles.optionTextIncorrect];
  };

  const getOptionIconProps = (option) => {
    if (!showAnswer) return null;
    return option.correct
      ? { name: "check", color: "#4CAF50", borderColor: "#4CAF50" }
      : { name: "x", color: "#F44336", borderColor: "#F44336" };
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <Text style={styles.headerTitle}>{moduleTitle}</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D783D8" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <Text style={styles.headerTitle}>{moduleTitle}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadQuestions} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <BackIconButton onPress={() => navigation.goBack()} size={42} />
          <Text style={styles.headerTitle}>{moduleTitle}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Tudo certo!</Text>
          <Text style={styles.emptyText}>
            Você já respondeu todas as perguntas deste módulo.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const total = questions.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <BackIconButton onPress={handleBack} size={42} />
        <Text style={styles.headerTitle} numberOfLines={1}>{moduleTitle}</Text>
        <TouchableOpacity onPress={handleBettyPress} activeOpacity={0.8}>
          <Image source={BettyIcon} style={styles.bettyIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Scrollable area: progress + question + options */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Question Progress */}
        <View style={styles.questionProgress}>
          <Text style={styles.questionProgressText}>
            Pergunta: {currentQuestionIndex + 1}/{total}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.statement}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.alternatives.map((option, index) => {
            const icon = getOptionIconProps(option);
            const isSelected = selectedAnswer === option.id;
            return (
              <TouchableOpacity
                key={option.id || index}
                style={[getOptionStyle(option), styles.optionRow]}
                onPress={() => handleAnswerSelect(option.id)}
                disabled={showAnswer}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.optionMarker,
                      isSelected && styles.optionMarkerSelected,
                      showAnswer && option.correct && styles.optionMarkerCorrect,
                      showAnswer && !option.correct && isSelected && styles.optionMarkerIncorrect,
                    ]}
                  >
                    {(showAnswer || isSelected) && (
                      <View
                        style={[
                          styles.optionMarkerInner,
                          showAnswer && option.correct && styles.optionMarkerInnerCorrect,
                          showAnswer && !option.correct && isSelected && styles.optionMarkerInnerIncorrect,
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[getOptionTextStyle(option), styles.optionTextContent]}>
                    {option.text}
                  </Text>
                </View>
                {icon && (
                  <View style={[styles.iconBadge, { borderColor: icon.borderColor }]}>
                    <Icon name={icon.name} size={18} color={icon.color} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Submit Button — fixed at bottom */}
      <View style={styles.submitContainer}>
        {!selectedAnswer ? (
          <QuizDisabledButton label="Selecione uma resposta" />
        ) : !hasChecked ? (
          <QuizPrimaryButton label="Checar" onPress={handleCheckAnswer} />
        ) : isSubmitting ? (
          <QuizDisabledButton label="Enviando..." />
        ) : (
          <QuizDisabledButton label="Checando..." />
        )}
      </View>

      {/* Betty Tip */}
      {isTipVisible && (
        <Animated.View
          style={[
            styles.tipModalWrapper,
            { opacity: tipOpacity, transform: [{ translateY: tipTranslate }] },
          ]}
        >
          <LinearGradient
            colors={["#7456C8", "#D783D8", "#FF90A5", "#FF8071"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tipGradientBorder}
          >
            <View style={styles.tipInnerContent}>
              <TouchableOpacity onPress={closeTip} style={styles.tipHandleWrapper} activeOpacity={0.7}>
                <View style={styles.tipHandleBar} />
              </TouchableOpacity>
              <View style={styles.tipContentRow}>
                <Image source={BettyIcon} style={styles.tipAvatarImage} resizeMode="contain" />
                {isTipLoading ? (
                  <Text style={styles.tipTextContent}>Pensando em uma resposta...</Text>
                ) : (
                  <Text style={styles.tipTextContent}>
                    {displayedTipText}
                    {isTyping && <Text style={styles.typingCursor}>|</Text>}
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  bettyIcon: {
    width: 44,
    height: 44,
    marginLeft: 12,
  },
  // ─── Loading / Error / Empty ──────────────────────────────────────────────
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#2B2740",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#A09CAB",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  // ─── Question ──────────────────────────────────────────────────────────────
  questionProgress: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  questionProgressText: {
    fontSize: 16,
    color: "#D783D8",
    fontWeight: "500",
  },
  questionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  // ─── Options ───────────────────────────────────────────────────────────────
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#2B2935",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3A3842",
  },
  optionButtonSelected: {
    borderColor: "#D783D8",
    backgroundColor: "#3A2B4A",
  },
  optionButtonCorrect: {
    borderColor: "#4CAF50",
    backgroundColor: "#2E4A2E",
  },
  optionButtonIncorrect: {
    borderColor: "#F44336",
    backgroundColor: "#4A2E2E",
  },
  optionMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  optionMarkerSelected: { borderColor: "#D783D8" },
  optionMarkerCorrect: { borderColor: "#4CAF50" },
  optionMarkerIncorrect: { borderColor: "#F44336" },
  optionMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D783D8",
  },
  optionMarkerInnerCorrect: { backgroundColor: "#4CAF50" },
  optionMarkerInnerIncorrect: { backgroundColor: "#F44336" },
  optionText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  optionTextContent: {
    flex: 1,
    paddingRight: 12,
    flexWrap: "wrap",
  },
  optionTextSelected: { color: "#FFFFFF", fontWeight: "500" },
  optionTextCorrect: { color: "#4CAF50", fontWeight: "bold" },
  optionTextIncorrect: { color: "#F44336", fontWeight: "bold" },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  // ─── Submit ────────────────────────────────────────────────────────────────
  submitContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // ─── Betty tip ─────────────────────────────────────────────────────────────
  tipModalWrapper: {
    position: "absolute",
    left: -20,
    right: -20,
    bottom: 0,
  },
  tipGradientBorder: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 2,
    paddingBottom: 0,
  },
  tipInnerContent: {
    backgroundColor: "#0D0B12",
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: 180,
  },
  tipHandleWrapper: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  tipHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tipContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  tipTextContent: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 2,
  },
  typingCursor: {
    color: "#D783D8",
    fontWeight: "bold",
  },
});

export default QuizPage;
