import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
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
  }, [title]);

  // Mock do serviço do quiz (estrutura idêntica à resposta do backend)
  const getMockServiceData = (titleKey) => {
    // Você pode variar o conteúdo por módulo usando titleKey
    return [
      {
        id: "343ed31c-792a-4b6f-b0ee-2c431eae9d94",
        question_number: 1,
        statement: "Qual é o principal objetivo de um orçamento pessoal?",
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
        <Image source={BettyIcon} style={styles.bettyIcon} resizeMode="contain" />
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
});

export default QuizPage;
