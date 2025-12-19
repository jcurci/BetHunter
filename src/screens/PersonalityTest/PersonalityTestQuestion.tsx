import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CircularIconButton, GradientButton } from "../../components/common";

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: number;
  question: string;
  options: QuestionOption[];
}

// Exemplo de perguntas - depois pode vir de uma API ou constante
const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Quando você recebe seu salário ou renda, o que costuma fazer primeiro?",
    options: [
      { id: "a", text: "Pago minhas contas e o que sobra eu gasto ou guardo." },
      { id: "b", text: "Guardo uma parte logo de início." },
      { id: "c", text: "Gasto primeiro e vejo depois como lidar com o restante." },
    ],
  },
  // Adicionar mais perguntas aqui...
];

const TOTAL_QUESTIONS = 20;

const PersonalityTestQuestion: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const navigation = useNavigation<NavigationProp>();

  const currentQuestion = QUESTIONS[currentQuestionIndex] || QUESTIONS[0];
  const questionNumber = currentQuestionIndex + 1;

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNext = () => {
    if (!selectedOption) return;

    // Salvar resposta
    const newAnswers = { ...answers, [currentQuestion.id]: selectedOption };
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      // Próxima pergunta
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      // Fim do teste - navegar para resultado
      // TODO: Navegar para tela de resultado
      console.log("Teste finalizado:", newAnswers);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <CircularIconButton
            onPress={() => navigation.goBack()}
            size={50}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </CircularIconButton>
        </View>

        <View style={styles.content}>
          <Text style={styles.progress}>Pergunta: {questionNumber}/{TOTAL_QUESTIONS}</Text>
          <Text style={styles.question}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionRow}
                onPress={() => handleSelectOption(option.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioOuter,
                  selectedOption === option.id && styles.radioOuterSelected
                ]}>
                  {selectedOption === option.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <GradientButton 
            title={selectedOption ? "Continuar" : "Selecione uma resposta"} 
            onPress={handleNext} 
            disabled={!selectedOption}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progress: {
    fontSize: 14,
    color: "#8A8A8A",
    marginBottom: 10,
  },
  question: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 32,
    marginBottom: 30,
  },
  optionsContainer: {
    backgroundColor: "#1C1C1C",
    borderRadius: 20,
    padding: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#6B6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  radioOuterSelected: {
    borderColor: "#FFFFFF",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
});

export default PersonalityTestQuestion;

