import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

class SoundService {
  constructor() {
    this.sounds = {};
    this.isLoaded = false;
  }

  async loadSounds() {
    try {
      console.log("Iniciando carregamento de sons...");

      // Configurar áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log("Áudio configurado com sucesso");

      // Criar sons simples usando frequências
      await this.createSimpleSounds();

      this.isLoaded = true;
      console.log("Sistema de feedback carregado com sucesso!");
    } catch (error) {
      console.log("Erro ao carregar sistema de feedback:", error);
    }
  }

  async createSimpleSounds() {
    try {
      // Sons mais simples e confiáveis
      const soundUrls = {
        correct:
          "https://cdn.freesound.org/previews/703/703945_11861866-lq.mp3",
        wrong: "https://cdn.freesound.org/previews/270/270402_5121231-lq.mp3",
        timer: "https://cdn.freesound.org/previews/274/274177_5121231-lq.mp3",
      };

      console.log("Carregando sons...");

      for (const [key, url] of Object.entries(soundUrls)) {
        try {
          console.log(`Carregando som: ${key}`);
          const { sound } = await Audio.Sound.createAsync({ uri: url });
          this.sounds[key] = sound;
          console.log(`Som ${key} carregado com sucesso`);
        } catch (error) {
          console.log(`Erro ao carregar som ${key}:`, error);
        }
      }

      console.log("Sons carregados:", Object.keys(this.sounds));
    } catch (error) {
      console.log("Erro ao criar sons:", error);
    }
  }

  async playCorrect() {
    console.log("Tentando tocar som de acerto...");
    try {
      // Tentar tocar som
      if (this.sounds.correct) {
        console.log("Tocando som de acerto...");
        await this.sounds.correct.replayAsync();
        console.log("Som de acerto tocado com sucesso");
      } else {
        console.log("Som de acerto não disponível");
      }

      // Vibração de sucesso como backup
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        console.log("Vibração de sucesso executada");
      } catch (hapticError) {
        console.log("Erro na vibração de sucesso:", hapticError);
      }
    } catch (error) {
      console.log("Erro ao tocar feedback de acerto:", error);
      // Fallback para apenas vibração
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        console.log("Fallback: vibração de sucesso executada");
      } catch (hapticError) {
        console.log("Erro no feedback háptico de sucesso:", hapticError);
      }
    }
  }

  async playWrong() {
    console.log("Tentando tocar som de erro...");
    try {
      // Tentar tocar som
      if (this.sounds.wrong) {
        console.log("Tocando som de erro...");
        await this.sounds.wrong.replayAsync();
        console.log("Som de erro tocado com sucesso");
      } else {
        console.log("Som de erro não disponível");
      }

      // Vibração de erro como backup
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.log("Vibração de erro executada");
      } catch (hapticError) {
        console.log("Erro na vibração de erro:", hapticError);
      }
    } catch (error) {
      console.log("Erro ao tocar feedback de erro:", error);
      // Fallback para apenas vibração
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.log("Fallback: vibração de erro executada");
      } catch (hapticError) {
        console.log("Erro no feedback háptico de erro:", hapticError);
      }
    }
  }

  async playTimer() {
    console.log("Tentando tocar som do timer...");
    try {
      // Tentar tocar som
      if (this.sounds.timer) {
        console.log("Tocando som do timer...");
        await this.sounds.timer.replayAsync();
        console.log("Som do timer tocado com sucesso");
      } else {
        console.log("Som do timer não disponível");
      }

      // Vibração de aviso como backup
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log("Vibração do timer executada");
      } catch (hapticError) {
        console.log("Erro na vibração do timer:", hapticError);
      }
    } catch (error) {
      console.log("Erro ao tocar feedback do timer:", error);
      // Fallback para apenas vibração
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log("Fallback: vibração do timer executada");
      } catch (hapticError) {
        console.log("Erro no feedback háptico do timer:", hapticError);
      }
    }
  }

  async unloadSounds() {
    try {
      console.log("Descarregando sons...");
      for (const sound of Object.values(this.sounds)) {
        if (sound) {
          await sound.unloadAsync();
        }
      }
      this.sounds = {};
      this.isLoaded = false;
      console.log("Sons descarregados com sucesso");
    } catch (error) {
      console.log("Erro ao descarregar sistema de feedback:", error);
    }
  }
}

export const soundService = new SoundService();
