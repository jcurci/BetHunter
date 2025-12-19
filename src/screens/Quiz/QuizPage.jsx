import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BackIconButton, QuizPrimaryButton, QuizDisabledButton } from "../../components";
import BettyIcon from "../../assets/Betty.png";

const QuizPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { title, moduleData } = route.params || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const checkTimeoutRef = useRef(null);
  const [isTipVisible, setIsTipVisible] = useState(false);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [tipText, setTipText] = useState("");
  const [displayedTipText, setDisplayedTipText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const tipTimeoutRef = useRef(null);
  const tipLoadingTimeoutRef = useRef(null);
  const typewriterIntervalRef = useRef(null);
  const tipOpacity = useRef(new Animated.Value(0)).current;
  const tipTranslate = useRef(new Animated.Value(40)).current;

  // Reset state when component mounts
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowAnswer(false);
    setHasChecked(false);
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    closeTip(true);
  }, [title]);

  // Mock do serviço do quiz (estrutura idêntica à resposta do backend)
  const getMockServiceData = (titleKey) => {
    // Você pode variar o conteúdo por módulo usando titleKey
    return [
      {
        id: "343ed31c-792a-4b6f-b0ee-2c431eae9d94",
        question_number: 1,
        statement: "Qual é o principal objetivo de um orçamento pessoal?",
        hint: "Um orçamento serve para dar clareza sobre entradas e saídas de dinheiro.",
        alternative: [
          {
            id: "2d6d9d6b-76e8-48e1-b9ab-46e782b5a06a",
            text: "Controlar melhor as finanças",
            correct: true,
          },
          {
            id: "faf44ac7-8c99-4c29-92c4-b48760c3462d",
            text: "Gastar mais com lazer",
            correct: false,
          },
          {
            id: "3a1c2b3d-1111-2222-3333-444444444444",
            text: "Evitar trabalhar",
            correct: false,
          },
          {
            id: "4b2c3d4e-5555-6666-7777-888888888888",
            text: "Pagar mais impostos",
            correct: false,
          },
        ],
      },
      {
        id: "a1e2f3c4-0001-0002-0003-000000000001",
        question_number: 2,
        statement: "O que é uma reserva de emergência?",
        hint: "Pense em algo que te ajuda quando surge um gasto inesperado.",
        alternative: [
          {
            id: "a1e2f3c4-1111-1111-1111-111111111111",
            text: "Valor guardado para imprevistos",
            correct: true,
          },
          {
            id: "a1e2f3c4-2222-2222-2222-222222222222",
            text: "Dinheiro destinado a lazer mensal",
            correct: false,
          },
          {
            id: "a1e2f3c4-3333-3333-3333-333333333333",
            text: "Parcela mínima do cartão de crédito",
            correct: false,
          },
          {
            id: "a1e2f3c4-4444-4444-4444-444444444444",
            text: "Saldo investido em ações",
            correct: false,
          },
        ],
      },
      {
        id: "a1e2f3c4-0001-0002-0003-000000000002",
        question_number: 3,
        statement: "Qual é uma boa prática ao usar cartão de crédito?",
        hint: "Evitar juros do cartão é sempre prioridade.",
        alternative: [
          {
            id: "b1e2f3c4-1111-1111-1111-111111111111",
            text: "Pagar sempre a fatura total até o vencimento",
            correct: true,
          },
          {
            id: "b1e2f3c4-2222-2222-2222-222222222222",
            text: "Pagar somente o valor mínimo da fatura",
            correct: false,
          },
          {
            id: "b1e2f3c4-3333-3333-3333-333333333333",
            text: "Aumentar o limite para gastar mais",
            correct: false,
          },
          {
            id: "b1e2f3c4-4444-4444-4444-444444444444",
            text: "Parcelar todas as compras",
            correct: false,
          },
        ],
      },
      {
        id: "a1e2f3c4-0001-0002-0003-000000000003",
        question_number: 4,
        statement: "A regra 50-30-20 sugere que:",
        hint: "A divisão clássica equilibra necessidades, desejos e futuro.",
        alternative: [
          {
            id: "c1e2f3c4-1111-1111-1111-111111111111",
            text: "50% necessidades, 30% desejos, 20% poupança/investimentos",
            correct: true,
          },
          {
            id: "c1e2f3c4-2222-2222-2222-222222222222",
            text: "50% lazer, 30% contas, 20% dívidas",
            correct: false,
          },
          {
            id: "c1e2f3c4-3333-3333-3333-333333333333",
            text: "50% investimentos, 30% desejos, 20% necessidades",
            correct: false,
          },
          {
            id: "c1e2f3c4-4444-4444-4444-444444444444",
            text: "50% impostos, 30% aluguel, 20% transporte",
            correct: false,
          },
        ],
      },
      {
        id: "a1e2f3c4-0001-0002-0003-000000000004",
        question_number: 5,
        statement: "Qual é a melhor ordem para organizar as finanças?",
        hint: "Resolva o que gera mais juros antes de pensar em investir.",
        alternative: [
          {
            id: "d1e2f3c4-1111-1111-1111-111111111111",
            text: "Quitar dívidas caras, montar reserva, depois investir",
            correct: true,
          },
          {
            id: "d1e2f3c4-2222-2222-2222-222222222222",
            text: "Investir primeiro e depois pensar em dívidas",
            correct: false,
          },
          {
            id: "d1e2f3c4-3333-3333-3333-333333333333",
            text: "Gastar tudo e usar o que sobrar para reserva",
            correct: false,
          },
          {
            id: "d1e2f3c4-4444-4444-4444-444444444444",
            text: "Ignorar dívidas enquanto a renda cresce",
            correct: false,
          },
        ],
      },
      {
        id: "a1e2f3c4-0001-0002-0003-000000000005",
        question_number: 6,
        statement: "Qual é um exemplo de despesa fixa mensal?",
        hint: "É aquela conta que vem todo mês, com valor previsível.",
        alternative: [
          {
            id: "e1e2f3c4-1111-1111-1111-111111111111",
            text: "Aluguel ou financiamento da casa",
            correct: true,
          },
          {
            id: "e1e2f3c4-2222-2222-2222-222222222222",
            text: "Compras de roupas ocasionais",
            correct: false,
          },
          {
            id: "e1e2f3c4-3333-3333-3333-333333333333",
            text: "Viagens de férias",
            correct: false,
          },
          {
            id: "e1e2f3c4-4444-4444-4444-444444444444",
            text: "Presentes de aniversário",
            correct: false,
          },
        ],
      },
    ];
  };

  const quizTitleMap = {
    fundamentos: "Fundamentos",
    "pratica-com-dinheiro": "Prática com Dinheiro",
    "conhecimento-aplicado": "Conhecimento Aplicado",
    "objetivos-e-planejamento": "Objetivos e Planejamento",
    "investimentos-de-baixo-risco": "Investimentos de Baixo Risco",
    "investimentos-de-alto-risco": "Investimentos de Alto Risco",
  };

  const serviceQuestions = getMockServiceData(title);
  const quizData = {
    title: quizTitleMap[title] || "Fundamentos",
    questions: serviceQuestions,
  };
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  const handleAnswerSelect = (answerId) => {
    setAnswers({ ...answers, [currentQuestion.id]: answerId });
    setSelectedAnswer(answerId);
    setHasChecked(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(
        answers[quizData.questions[currentQuestionIndex + 1]?.id] || null
      );
      setShowAnswer(false);
      setHasChecked(false);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      closeTip(true);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = () => {
    // calcula pontuação com base nas alternativas corretas
    const total = quizData.questions.length;
    let score = 0;
    quizData.questions.forEach((q) => {
      const chosen = answers[q.id];
      const isCorrect = q.alternative.some((a) => a.id === chosen && a.correct);
      if (isCorrect) score += 1;
    });

    // navega para a tela de resultado
    navigation.navigate("QuizResult", { score, total });
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setSelectedAnswer(
        answers[quizData.questions[currentQuestionIndex - 1]?.id] || null
      );
      setShowAnswer(false);
      setHasChecked(false);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      closeTip(true);
    } else {
      navigation.goBack();
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    setHasChecked(true);
    setShowAnswer(true);
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    checkTimeoutRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 1200);
  };

  const closeTip = (instant = false) => {
    if (!isTipVisible && !instant) return;
    if (tipTimeoutRef.current) {
      clearTimeout(tipTimeoutRef.current);
    }
    if (tipLoadingTimeoutRef.current) {
      clearTimeout(tipLoadingTimeoutRef.current);
    }
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }
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
      Animated.timing(tipOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(tipTranslate, {
        toValue: 40,
        duration: 180,
        useNativeDriver: true,
      }),
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
    let currentIndex = 0;
    
    typewriterIntervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedTipText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typewriterIntervalRef.current);
        setIsTyping(false);
      }
    }, 25); // Velocidade da digitação (25ms por caractere)
  };

  const handleBettyPress = () => {
    if (isTipVisible) {
      closeTip();
      return;
    }

    const hint = currentQuestion?.hint || "Vamos nessa! Pense no conceito principal.";
    setTipText(hint);
    setIsTipVisible(true);
    setIsTipLoading(true);
    setDisplayedTipText("");

    tipOpacity.setValue(0);
    tipTranslate.setValue(40);

    Animated.parallel([
      Animated.timing(tipOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(tipTranslate, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    // Primeiro mostra "Pensando em uma resposta..." por 1.5s
    tipLoadingTimeoutRef.current = setTimeout(() => {
      setIsTipLoading(false);
      // Depois inicia o efeito typewriter
      startTypewriter(hint);
    }, 1500);

    // Fecha automaticamente após 15s (mais tempo para ler o texto completo)
    tipTimeoutRef.current = setTimeout(() => {
      closeTip();
    }, 15000);
  };

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
      if (tipLoadingTimeoutRef.current) clearTimeout(tipLoadingTimeoutRef.current);
      if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    };
  }, []);

  const getOptionStyle = (option) => {
    if (!showAnswer) {
      return selectedAnswer === option.id
        ? [styles.optionButton, styles.optionButtonSelected]
        : styles.optionButton;
    }

    // Mostrar correta em verde e todas as outras em vermelho
    if (option.correct) {
      return [styles.optionButton, styles.optionButtonCorrect];
    }

    return [styles.optionButton, styles.optionButtonIncorrect];
  };

  const getOptionTextStyle = (option) => {
    if (!showAnswer) {
      return selectedAnswer === option.id
        ? [styles.optionText, styles.optionTextSelected]
        : styles.optionText;
    }

    if (option.correct) {
      return [styles.optionText, styles.optionTextCorrect];
    }

    return [styles.optionText, styles.optionTextIncorrect];
  };

  const getOptionIconProps = (option) => {
    if (!showAnswer) return null;
    if (option.correct) {
      return { name: "check", color: "#4CAF50", borderColor: "#4CAF50" };
    }
    return { name: "x", color: "#F44336", borderColor: "#F44336" };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <BackIconButton onPress={handleBack} size={42} />
        <Text style={styles.headerTitle}>
          {quizData.title} - {Math.round(progress / 25)}/4
        </Text>
        <TouchableOpacity onPress={handleBettyPress} activeOpacity={0.8}>
          <Image source={BettyIcon} style={styles.bettyIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Question Progress */}
      <View style={styles.questionProgress}>
        <Text style={styles.questionProgressText}>
          Pergunta: {currentQuestionIndex + 1}/{quizData.questions.length}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.statement}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.alternative.map((option, index) => {
          const icon = getOptionIconProps(option);
          const isSelected = selectedAnswer === option.id;
          return (
            <TouchableOpacity
              key={option.id || index}
              style={[getOptionStyle(option), styles.optionRow]}
              onPress={() => !showAnswer && handleAnswerSelect(option.id)}
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
                <Text
                  style={[getOptionTextStyle(option), styles.optionTextContent]}
                >
                  {option.text}
                </Text>
              </View>
              {icon && (
                <View
                  style={[styles.iconBadge, { borderColor: icon.borderColor }]}
                >
                  <Icon name={icon.name} size={18} color={icon.color} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        {!selectedAnswer ? (
          <QuizDisabledButton label="Selecione uma resposta" />
        ) : !hasChecked ? (
          <QuizPrimaryButton label="Checar" onPress={handleCheckAnswer} />
        ) : (
          <QuizDisabledButton label="Checando..." />
        )}
      </View>

      {isTipVisible && (
        <Animated.View
          style={[
            styles.tipModalWrapper,
            {
              opacity: tipOpacity,
              transform: [{ translateY: tipTranslate }],
            },
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
    paddingTop: 2,
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
    marginBottom: 30,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
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
  optionMarkerSelected: {
    borderColor: "#D783D8",
  },
  optionMarkerCorrect: {
    borderColor: "#4CAF50",
  },
  optionMarkerIncorrect: {
    borderColor: "#F44336",
  },
  optionMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D783D8",
  },
  optionMarkerInnerCorrect: {
    backgroundColor: "#4CAF50",
  },
  optionMarkerInnerIncorrect: {
    backgroundColor: "#F44336",
  },
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
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  optionTextCorrect: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  optionTextIncorrect: {
    color: "#F44336",
    fontWeight: "bold",
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  submitButton: {
    backgroundColor: "#2B2935",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#D783D8",
    alignItems: "center",
  },
  submitButtonDisabled: {
    borderColor: "#3A3842",
    backgroundColor: "#1A1923",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#D783D8",
    fontWeight: "500",
  },
  submitButtonTextDisabled: {
    color: "#A09CAB",
  },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 10,
  },
  completedSubtitle: {
    fontSize: 16,
    color: "#A09CAB",
    textAlign: "center",
    marginBottom: 40,
  },
  returnButton: {
    backgroundColor: "#D783D8",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  returnButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  tipWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tipBorder: {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: [{ translateX: -10 }],
    width: 20,
    height: 20,
    backgroundColor: "#000",
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2B2935",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2B2935",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  tipHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#3A3842",
    borderRadius: 2.5,
    marginBottom: 10,
  },
  tipHandleBar: {
    width: 30,
    height: 4,
    backgroundColor: "#3A3842",
    borderRadius: 2,
  },
  tipContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipAvatar: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  tipText: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
});

export default QuizPage;
