import * as Haptics from "expo-haptics";

// Função de teste para verificar se o sistema funciona
export const testSoundSystem = async () => {
  console.log("🧪 Testando sistema de feedback...");

  try {
    // Teste 1: Vibração de sucesso
    console.log("Teste 1: Vibração de sucesso");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("✅ Vibração de sucesso funcionou");

    // Aguardar 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Teste 2: Vibração de erro
    console.log("Teste 2: Vibração de erro");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    console.log("✅ Vibração de erro funcionou");

    // Aguardar 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Teste 3: Vibração de aviso
    console.log("Teste 3: Vibração de aviso");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("✅ Vibração de aviso funcionou");

    console.log("🎉 Todos os testes passaram!");
    return true;
  } catch (error) {
    console.log("❌ Erro no teste:", error);
    return false;
  }
};

// Função para testar no QuizScreen
export const testInQuiz = () => {
  console.log("🎵 Testando feedback no quiz...");
  testSoundSystem();
};
