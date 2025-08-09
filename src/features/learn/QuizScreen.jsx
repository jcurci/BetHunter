import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getQuizData } from "./quizData";
import { simpleSoundService as soundService } from "../../shared/services/simpleSoundService";
import { testInQuiz } from "../../shared/services/testSound";

// Obter dados do quiz baseado no tipo (padrão: fundamentos)
const getQuizDataFromRoute = () => {
  return getQuizData("fundamentos");
};

const QuizScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Obter dados do quiz
  const QUIZ_DATA = getQuizDataFromRoute();

  // Carregar sistema de feedback
  useEffect(() => {
    soundService.loadSounds();
    return () => {
      soundService.unloadSounds();
    };
  }, []);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 segundos por questão

  const currentQuestion = QUIZ_DATA.questions[currentQuestionIndex];

  useEffect(() => {
    if (!showResult && !quizCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAnswer(null); // Tempo esgotado
            return 30;
          }
          // Tocar feedback quando restam 5 segundos
          if (prev === 5) {
            soundService.playTimer();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestionIndex, showResult, quizCompleted]);

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);

    // Verificar se a resposta está correta
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      // Tocar feedback de acerto
      soundService.playCorrect();
    } else {
      // Tocar feedback de erro
      soundService.playWrong();
    }

    // Mostrar resultado da questão
    setShowResult(true);

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(30);

    if (currentQuestionIndex < QUIZ_DATA.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz finalizado
      setQuizCompleted(true);
      showFinalResult();
    }
  };

  const showFinalResult = () => {
    const percentage = Math.round((score / QUIZ_DATA.questions.length) * 100);

    Alert.alert(
      "Quiz Concluído!",
      `Você acertou ${score} de ${QUIZ_DATA.questions.length} questões (${percentage}%)`,
      [
        {
          text: "Ver Resultados",
          onPress: () =>
            navigation.navigate("QuizResult", {
              score,
              total: QUIZ_DATA.questions.length,
            }),
        },
        {
          text: "Voltar",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const getOptionStyle = (optionIndex) => {
    if (selectedAnswer === null) {
      return styles.option;
    }

    if (optionIndex === currentQuestion.correctAnswer) {
      return [styles.option, styles.correctOption];
    }

    if (
      selectedAnswer === optionIndex &&
      optionIndex !== currentQuestion.correctAnswer
    ) {
      return [styles.option, styles.incorrectOption];
    }

    return styles.option;
  };

  const getOptionTextStyle = (optionIndex) => {
    if (selectedAnswer === null) {
      return styles.optionText;
    }

    if (optionIndex === currentQuestion.correctAnswer) {
      return [styles.optionText, styles.correctOptionText];
    }

    if (
      selectedAnswer === optionIndex &&
      optionIndex !== currentQuestion.correctAnswer
    ) {
      return [styles.optionText, styles.incorrectOptionText];
    }

    return styles.optionText;
  };

  if (quizCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <Icon name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.completedTitle}>Quiz Concluído!</Text>
          <Text style={styles.completedScore}>
            {score} de {QUIZ_DATA.questions.length} acertos
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar ao Aprender</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{QUIZ_DATA.title}</Text>
          <TouchableOpacity style={styles.testButton} onPress={testInQuiz}>
            <Text style={styles.testButtonText}>🔊</Text>
          </TouchableOpacity>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Icon name="clock" size={16} color="#FF6B35" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getOptionStyle(index)}
              onPress={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
            >
              <Text style={getOptionTextStyle(index)}>{option}</Text>
              {selectedAnswer !== null &&
                index === currentQuestion.correctAnswer && (
                  <Icon
                    name="check"
                    size={20}
                    color="#4CAF50"
                    style={styles.optionIcon}
                  />
                )}
              {selectedAnswer === index &&
                index !== currentQuestion.correctAnswer && (
                  <Icon
                    name="x"
                    size={20}
                    color="#F44336"
                    style={styles.optionIcon}
                  />
                )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Explanation */}
        {showResult && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === currentQuestion.correctAnswer
                ? "✅ Correto!"
                : "❌ Incorreto"}
            </Text>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Pontuação: {score}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  testButton: {
    backgroundColor: "#7456C8",
    padding: 8,
    borderRadius: 20,
  },
  testButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  progressContainer: {
    backgroundColor: "#7456C8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B35",
    marginLeft: 8,
  },
  questionContainer: {
    backgroundColor: "#1A1A1A",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  option: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#333",
  },
  correctOption: {
    borderColor: "#4CAF50",
    backgroundColor: "#1B5E20",
  },
  incorrectOption: {
    borderColor: "#F44336",
    backgroundColor: "#B71C1C",
  },
  optionText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  correctOptionText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  incorrectOptionText: {
    color: "#FFFFFF",
  },
  optionIcon: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  explanationContainer: {
    backgroundColor: "#2A1B3D",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: "#A0A0A0",
    lineHeight: 20,
  },
  scoreContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7456C8",
  },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 10,
  },
  completedScore: {
    fontSize: 18,
    color: "#7456C8",
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: "#7456C8",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default QuizScreen;
