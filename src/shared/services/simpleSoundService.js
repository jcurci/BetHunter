import * as Haptics from "expo-haptics";

class SimpleSoundService {
  constructor() {
    this.isLoaded = false;
  }

  async loadSounds() {
    try {
      console.log("Carregando sistema de feedback simples...");
      this.isLoaded = true;
      console.log("Sistema de feedback carregado!");
    } catch (error) {
      console.log("Erro ao carregar sistema:", error);
    }
  }

  async playCorrect() {
    console.log("🎵 Tocando feedback de ACERTO");
    try {
      // Vibração de sucesso
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("✅ Vibração de sucesso executada");
    } catch (error) {
      console.log("❌ Erro na vibração de sucesso:", error);
    }
  }

  async playWrong() {
    console.log("🎵 Tocando feedback de ERRO");
    try {
      // Vibração de erro
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log("❌ Vibração de erro executada");
    } catch (error) {
      console.log("❌ Erro na vibração de erro:", error);
    }
  }

  async playTimer() {
    console.log("⏰ Tocando feedback do TIMER");
    try {
      // Vibração de aviso
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log("⏰ Vibração do timer executada");
    } catch (error) {
      console.log("❌ Erro na vibração do timer:", error);
    }
  }

  async unloadSounds() {
    try {
      console.log("Descarregando sistema de feedback...");
      this.isLoaded = false;
      console.log("Sistema descarregado!");
    } catch (error) {
      console.log("Erro ao descarregar:", error);
    }
  }
}

export const simpleSoundService = new SimpleSoundService();
