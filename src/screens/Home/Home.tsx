import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeModules,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Keyboard,
  InteractionManager,
  Animated,
  Easing,
  Linking,
  useWindowDimensions,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Entypo";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaskedView from "@react-native-masked-view/masked-view";

// Components
import { Footer, StatsDisplay, IconCard, GradientBorderButton } from "../../components";
import Modal from "../../components/common/Modal/Modal";
import { AppLoadingScreen } from "../../components/AppLoadingScreen";

// Config
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
  BUTTON_INNER_BACKGROUND,
} from "../../config/colors";

// Assets
import BetHunterIcon from "../../assets/home/bethunter.svg";
import AcessorIcon from "../../assets/home/acessor.svg";
import CursosIcon from "../../assets/home/cursos.svg";

// Domain & Infrastructure

import { Container } from "../../infrastructure/di/Container";
import type {
  AlwaysOnVpnStatus,
  OpenAlwaysOnResult,
} from "../../infrastructure/native/blockerModule";
import { ValidationError } from "../../domain/errors/CustomErrors";
import { useAuthStore } from "../../storage/authStore";
import { useDashboardStore } from "../../storage/dashboardStore";
import { useCoursesStore, selectCurrentCourse } from "../../storage/coursesStore";
import { NavigationProp, RootStackParamList } from "../../types/navigation";
import { notifyStreakMilestone } from "../../services/notifications";

// Constants
const GRADIENT_HEIGHT_EXPANDED = 450;
/** Só corre com o app em primeiro plano — ver armBlockingTimeout. */
const VPN_REQUEST_TIMEOUT_MS = 20000;
/** Atraso antes de reexibir os banners depois que a jornada fecha (evita flash). */
const BANNER_REVEAL_DELAY_MS = 600;
/** Chave por usuário — garante que cada conta veja o modal exatamente uma vez. */
const blockerPromoSeenKey = (userId: string): string =>
  `@bethunter_blocker_promo_seen_${userId}`;

type BlockFlowStep = "choices" | "report";

// Passos da jornada guiada de proteção — um único modal do começo ao fim.
// Cada passo dispara um diálogo de sistema isolado e explicado, em vez de
// empilhá-los ou deixar o aviso vazar como banner depois. Passos já satisfeitos
// (bateria já isenta / device admin já ativo / always-on confirmada) são pulados
// automaticamente.
//
// "alwaysOn" é OBRIGATÓRIO e por isso fica por último: é o único passo sem
// "Agora não", e é o mais trabalhoso (o usuário precisa ligar uma chave na tela
// do sistema, não só aceitar um diálogo). A posição também é técnica: o toggle
// "VPN sempre ativa" só existe para app que já tem consentimento de VPN, então
// ele NÃO pode vir antes do passo "intro". Reordenar quebra o passo.
type SetupStep = "intro" | "battery" | "deviceAdmin" | "alwaysOn" | "done";

/**
 * Desfecho da jornada, por dispositivo (as permissões são do aparelho, não da
 * conta). Governa os banners de reforço da Home: eles são recuperação de um
 * "Agora não" explícito, não um aviso genérico de permissão faltando.
 * Chave ausente = usuário legado (instalou antes da jornada única) — nesse caso
 * o comportamento antigo é preservado: banner aparece se a permissão faltar.
 */
const SETUP_OUTCOME_KEY = "@bethunter_protection_setup_v1";
/**
 * Não existe valor para "always-on pendente" de propósito: o passo é obrigatório,
 * então não há "Agora não" para registrar. A pendência é derivada da verdade
 * nativa (`alwaysOnStatus`), revalidada a cada foco, e vale inclusive para
 * usuário `legacy`. Persistir isso aqui criaria o pior bug possível: o banner
 * obrigatório escondido por um `setupOutcome !== "completed"`.
 */
type SetupOutcome = "legacy" | "completed" | "skipped_battery" | "skipped_admin";

/** Saudação segundo o relógio local do dispositivo (pt-BR). */
function periodGreetingLabel(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia,";
  if (hour >= 12 && hour < 18) return "Boa tarde,";
  return "Boa noite,";
}

const { BetBlocker, BetBlocking } = NativeModules;

/**
 * O bundle JS pode ser atualizado à frente do binário nativo. Sem os métodos de
 * always-on na ponte, o passo 4 é INTANGÍVEL (não há como abrir a tela nem
 * detectar o estado): nesse caso a jornada volta ao formato de 3 passos, em vez
 * de travar num passo obrigatório que o usuário não consegue cumprir.
 */
const alwaysOnSupported =
  Platform.OS === "android" && typeof BetBlocker?.getAlwaysOnVpnStatus === "function";

// Module-level flag: persists for the entire app session, survives component remounts
let sessionBooted = false;

const CARD_GAP = 10;
const SCROLL_HORIZONTAL_PADDING = 40; // 20px each side (scrollContent style)

/** Número oficial de suporte (DDI 55 + DDD 11). Formato wa.me evita depender de scheme no iOS. */
const SUPPORT_WHATSAPP_URL =
  "https://wa.me/5511997274798?text=" +
  encodeURIComponent("Olá, preciso de ajuda com o BetHunter.");

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "Home">>();
  const user = useAuthStore((s) => s.user);
  const { width: screenWidth } = useWindowDimensions();
  const cardSize = Math.floor((screenWidth - SCROLL_HORIZONTAL_PADDING - CARD_GAP * 2) / 3);
  
  // Dashboard store
  const {
    dashboard,
    betStreak,
    canCheckIn,
    isLoading,
    loadAll,
    loadDashboard,
    loadBetStreak,
    loadError,
    clearLoadError,
    updateAfterCheckIn
  } = useDashboardStore();

  const [hasBooted, setHasBooted] = useState<boolean>(sessionBooted);

  // Blocker state
  const [isBlockerEnabled, setIsBlockerEnabled] = useState<boolean>(false);
  const [isDeviceAdminActive, setIsDeviceAdminActive] = useState<boolean>(false);
  const [isRequestingDeviceAdmin, setIsRequestingDeviceAdmin] = useState<boolean>(false);
  const [isBlockerLoading, setIsBlockerLoading] = useState<boolean>(false);
  // true por padrão para não piscar o banner antes da primeira checagem nativa
  const [isBatteryExempt, setIsBatteryExempt] = useState<boolean>(true);
  const [hasRequestedBatteryExemptionBefore, setHasRequestedBatteryExemptionBefore] =
    useState<boolean>(false);
  const [isBatteryWarningSuppressed, setIsBatteryWarningSuppressed] = useState<boolean>(false);
  const [isXiaomi, setIsXiaomi] = useState<boolean>(false);
  const [showBatteryHintModal, setShowBatteryHintModal] = useState<boolean>(false);
  const blockingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockingTimedOutRef = useRef<boolean>(false);
  // Desfecho persistido da jornada; "legacy" até a primeira leitura/gravação.
  const [setupOutcome, setSetupOutcome] = useState<SetupOutcome>("legacy");
  // true depois que o usuário voltou do diálogo de bateria sem ter concedido —
  // permite o passo dar feedback em vez de ficar mudo.
  const [batteryAttemptFailed, setBatteryAttemptFailed] = useState<boolean>(false);

  // Estado da VPN sempre ativa (passo obrigatório). null = ainda não consultado;
  // o passo e o banner só reagem depois da primeira leitura, para não piscar.
  const [alwaysOnStatus, setAlwaysOnStatus] = useState<AlwaysOnVpnStatus | null>(null);
  const [isCheckingAlwaysOn, setIsCheckingAlwaysOn] = useState<boolean>(false);
  // true quando o sistema PROVOU que a opção continua desligada depois de o
  // usuário ter dito "já ativei" — deixa o passo responder em vez de ficar mudo.
  const [alwaysOnCheckFailed, setAlwaysOnCheckFailed] = useState<boolean>(false);
  // Qual tela o sistema realmente abriu, para o guia ajustar as instruções.
  const [alwaysOnGuideTarget, setAlwaysOnGuideTarget] =
    useState<OpenAlwaysOnResult["target"] | null>(null);

  /** Passo 4 cumprido (ou inaplicável, em iOS / binário nativo antigo). */
  const alwaysOnSatisfied = !alwaysOnSupported || alwaysOnStatus?.state === "confirmed";
  /** Pendência real: só depois da primeira leitura, para o banner não piscar. */
  const alwaysOnPending =
    alwaysOnSupported && alwaysOnStatus != null && alwaysOnStatus.state !== "confirmed";

  const persistSetupOutcome = useCallback(async (outcome: SetupOutcome) => {
    setSetupOutcome(outcome);
    try {
      await AsyncStorage.setItem(SETUP_OUTCOME_KEY, outcome);
    } catch {}
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SETUP_OUTCOME_KEY)
      .then((v) => {
        if (v) setSetupOutcome(v as SetupOutcome);
      })
      .catch(() => {});
  }, []);

  const checkBatteryExemption = useCallback(async () => {
    try {
      if (Platform.OS === "android" && BetBlocker?.isBatteryOptimizationExempt) {
        const exempt: boolean = await BetBlocker.isBatteryOptimizationExempt();
        setIsBatteryExempt(exempt);
      }
      if (Platform.OS === "android" && BetBlocker?.isBatteryExemptionRequested) {
        const requested: boolean = await BetBlocker.isBatteryExemptionRequested();
        setHasRequestedBatteryExemptionBefore(requested);
      }
      if (Platform.OS === "android" && BetBlocker?.isBatteryWarningSuppressed) {
        const suppressed: boolean = await BetBlocker.isBatteryWarningSuppressed();
        setIsBatteryWarningSuppressed(suppressed);
      }
      if (Platform.OS === "android" && BetBlocker?.getManufacturerInfo) {
        const info: { isXiaomi: boolean } = await BetBlocker.getManufacturerInfo();
        setIsXiaomi(!!info?.isXiaomi);
      }
    } catch {}
  }, []);

  /**
   * Atualiza SOMENTE o device admin. `vpnEnabled` aqui é a flag persistida, que
   * não reflete queda do serviço — a fonte de verdade de `isBlockerEnabled` é o
   * checkAndSyncBlockingStatus em checkBlockerStatus. Duas fontes para o mesmo
   * booleano faziam o estado oscilar ao voltar de um diálogo de sistema.
   */
  const checkProtectionStatus = useCallback(async () => {
    try {
      if (Platform.OS !== "android" || !BetBlocker?.getProtectionStatus) return;
      const status: { vpnEnabled?: boolean; deviceAdminActive?: boolean } =
        await BetBlocker.getProtectionStatus();
      if (typeof status?.deviceAdminActive === "boolean") {
        setIsDeviceAdminActive(status.deviceAdminActive);
      }
      return status;
    } catch {}
  }, []);

  /**
   * Reconsulta o estado da VPN sempre ativa e devolve se está confirmado.
   *
   * FAIL-CLOSED: qualquer erro na ponte conta como NÃO confirmado, e o passo
   * obrigatório é pedido. O contrário (assumir confirmado num catch vazio) já foi
   * o bug que fazia a jornada inteira ser pulada em silêncio.
   */
  const refreshAlwaysOnStatus = useCallback(async (): Promise<boolean> => {
    if (!alwaysOnSupported) return true;
    try {
      const status: AlwaysOnVpnStatus = await BetBlocker.getAlwaysOnVpnStatus();
      setAlwaysOnStatus(status ?? null);
      return status?.state === "confirmed";
    } catch {
      // Preserva uma leitura anterior boa, se houver; senão registra "unknown"
      // para o passo/banner terem o que mostrar.
      setAlwaysOnStatus((prev) =>
        prev ?? {
          state: "unknown",
          detectedBySetting: false,
          detectedBySystemStart: false,
          userAttested: false,
          lockdown: false,
          lockdownKnown: false,
          blockedByOtherApp: false,
        },
      );
      return false;
    }
  }, []);

  const checkBlockerStatus = useCallback(async () => {
    try {
      if (Platform.OS === "android" && BetBlocker) {
        let enabled = false;
        // Fonte do estado "ligado": checkAndSyncBlockingStatus verifica o estado REAL
        // da VPN e RELIGA automaticamente se estava ligada mas o serviço caiu (ex.:
        // após um ANR/crash). getProtectionStatus só lê a flag persistida e não
        // reinicia — por isso não servia para religar ao reabrir o app.
        if (BetBlocker.checkAndSyncBlockingStatus) {
          enabled = !!(await BetBlocker.checkAndSyncBlockingStatus());
        } else if (BetBlocker.getProtectionStatus) {
          const status = await BetBlocker.getProtectionStatus();
          enabled = !!status?.vpnEnabled;
        } else if (BetBlocker.isBlockingEnabled) {
          enabled = !!(await BetBlocker.isBlockingEnabled());
        }
        setIsBlockerEnabled(enabled);

        // Ponto de integração ÚNICO da revalidação de always-on: pendurar aqui dá
        // de graça a checagem no mount, no useFocusEffect e no AppState "active" —
        // e é esse último que detecta a volta do usuário das configurações de VPN.
        if (enabled) void refreshAlwaysOnStatus();

        // deviceAdminActive continua vindo de getProtectionStatus (quando disponível).
        if (BetBlocker.getProtectionStatus) {
          try {
            const status = await BetBlocker.getProtectionStatus();
            setIsDeviceAdminActive(!!status?.deviceAdminActive);
          } catch {}
        }

        if (enabled && BetBlocker?.refreshBlockedDomains) {
          BetBlocker.refreshBlockedDomains().catch(() => {});
        }
        checkBatteryExemption();
      } else if (Platform.OS === "ios" && BetBlocking?.isBlockingEnabled) {
        const enabled: boolean = await BetBlocking.isBlockingEnabled();
        setIsBlockerEnabled(enabled);
      }
    } catch {}
  }, [checkBatteryExemption, refreshAlwaysOnStatus]);

  useEffect(() => {
    checkBlockerStatus();
  }, [checkBlockerStatus]);

  useFocusEffect(
    useCallback(() => {
      checkBlockerStatus();
    }, [checkBlockerStatus])
  );

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        // Re-checa ao voltar de background/configurações para reconciliar
        // quedas/revogações da VPN com o estado exibido na Home.
        checkBlockerStatus();
      }
    });
    return () => subscription.remove();
  }, [checkBlockerStatus]);

  /**
   * Abre o pedido de isenção de bateria e reconcilia o resultado. Com o nativo
   * usando startActivityForResult a promise já volta com o estado real; o
   * re-check aqui cobre o fallback (telas de fabricante que não devolvem
   * resultado) e builds antigos que resolviam só "abri a tela".
   */
  const handleRequestBatteryExemption = useCallback(async () => {
    if (!BetBlocker?.requestBatteryExemption) return false;
    setBatteryAttemptFailed(false);
    try {
      await BetBlocker.requestBatteryExemption();
      let exempt = false;
      if (BetBlocker?.isBatteryOptimizationExempt) {
        exempt = !!(await BetBlocker.isBatteryOptimizationExempt());
      }
      setIsBatteryExempt(exempt);
      setBatteryAttemptFailed(!exempt);
      return exempt;
    } catch {
      return false;
    }
  }, []);

  const handleBatteryBannerPress = useCallback(() => {
    setShowBatteryHintModal(true);
  }, []);

  const handleConfirmBatteryHint = useCallback(async () => {
    setShowBatteryHintModal(false);
    await handleRequestBatteryExemption();
  }, [handleRequestBatteryExemption]);

  const handleConfirmBatteryExceptionManually = useCallback(async () => {
    try {
      if (BetBlocker?.confirmBatteryExceptionManually) {
        await BetBlocker.confirmBatteryExceptionManually();
      }
      setIsBatteryWarningSuppressed(true);
    } catch {}
  }, []);

  const handleOpenAutoStartSettings = useCallback(async () => {
    try {
      if (BetBlocker?.openAutoStartSettings) {
        await BetBlocker.openAutoStartSettings();
      }
    } catch {}
  }, []);

  /**
   * Passo 4: abre a tela de VPN do sistema e guarda qual tela realmente abriu,
   * para o guia complementar as instruções quando o aparelho não tem a tela de
   * VPN direta. Não existe intent público para a página POR APP (a que tem o
   * toggle) — ver o comentário de openAlwaysOnVpnSettings em BetBlockerModule.kt.
   */
  const handleOpenAlwaysOnVpnSettings = useCallback(async () => {
    setAlwaysOnCheckFailed(false);
    try {
      const result: OpenAlwaysOnResult | undefined =
        await BetBlocker?.openAlwaysOnVpnSettings?.();
      setAlwaysOnGuideTarget(
        result?.opened === false ? "none" : (result?.target ?? "vpn_settings"),
      );
    } catch {
      setAlwaysOnGuideTarget("none");
    }
  }, []);

  /**
   * "Já ativei — verificar de novo": tenta DETECTAR primeiro e só aceita o
   * autoatestado quando a detecção não consegue concluir (ROM que esconde a
   * chave). Se o sistema provar que está desligada, o nativo recusa e o passo
   * continua bloqueado com aviso honesto — em vez de dar por cumprido.
   */
  const handleRecheckAlwaysOn = useCallback(async () => {
    if (isCheckingAlwaysOn) return;
    setIsCheckingAlwaysOn(true);
    setAlwaysOnCheckFailed(false);
    try {
      if (await refreshAlwaysOnStatus()) return; // o useEffect leva para "done"
      const accepted: boolean = !!(await BetBlocker?.confirmAlwaysOnManually?.());
      if (accepted) await refreshAlwaysOnStatus();
      else setAlwaysOnCheckFailed(true);
    } catch {
      setAlwaysOnCheckFailed(true);
    } finally {
      setIsCheckingAlwaysOn(false);
    }
  }, [isCheckingAlwaysOn, refreshAlwaysOnStatus]);

  /** Banner de pendência → reabre a jornada direto no passo obrigatório. */
  const handleAlwaysOnBannerPress = useCallback(() => {
    setAlwaysOnCheckFailed(false);
    setAlwaysOnGuideTarget(null);
    setSetupStep("alwaysOn");
    setShowSetupModal(true);
  }, []);

  const handleSupport = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(SUPPORT_WHATSAPP_URL);
      if (!supported) {
        Alert.alert(
          "Indisponível",
          "Não foi possível abrir o WhatsApp neste dispositivo."
        );
        return;
      }
      await Linking.openURL(SUPPORT_WHATSAPP_URL);
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp. Tente novamente.");
    }
  }, []);

  const handleRequestDeviceAdmin = useCallback(async () => {
    if (Platform.OS !== "android" || !BetBlocker?.requestDeviceAdmin) return;
    setIsRequestingDeviceAdmin(true);
    try {
      const accepted: boolean = await BetBlocker.requestDeviceAdmin();
      await checkProtectionStatus();
      if (accepted) {
        // Dentro da jornada guiada, avança para o passo 4 (ou direto para "Tudo
        // pronto" se a VPN sempre ativa já estiver confirmada). Fora dela (toque
        // no banner da Home), o modal já está fechado — no-op.
        setIsDeviceAdminActive(true);
        // Usa o RETORNO do refresh, não o derivado alwaysOnSatisfied: este
        // callback foi criado com um valor de closure que pode estar velho.
        setSetupStep((await refreshAlwaysOnStatus()) ? "done" : "alwaysOn");
      }
    } catch {
      triggerError("Não foi possível ativar a proteção contra remoção. Tente novamente.");
    } finally {
      setIsRequestingDeviceAdmin(false);
    }
  }, [checkProtectionStatus, refreshAlwaysOnStatus]);

  // Decide o próximo passo pendente depois que a VPN foi concedida. Consulta o
  // estado real no nativo (bateria/device admin são por-app, valem pro device
  // inteiro) e pula o que já estiver satisfeito. Com tudo concedido, cai direto
  // em "done" e o modal só confirma o sucesso.
  //
  // Fail-closed: se a ponte nativa falhar, assume NÃO concedido e pede mesmo
  // assim. O contrário (assumir concedido) fazia a jornada inteira ser pulada
  // em silêncio por causa de um catch vazio.
  const advanceToFirstPendingStep = useCallback(async () => {
    if (Platform.OS !== "android") {
      setSetupStep("done");
      return;
    }
    let batteryExempt = false;
    let adminActive = false;
    try {
      if (BetBlocker?.isBatteryOptimizationExempt) {
        batteryExempt = !!(await BetBlocker.isBatteryOptimizationExempt());
      }
    } catch {}
    try {
      if (BetBlocker?.getProtectionStatus) {
        const status = await BetBlocker.getProtectionStatus();
        adminActive = !!status?.deviceAdminActive;
      }
    } catch {}
    // Mesma filosofia fail-closed: refreshAlwaysOnStatus devolve false em erro.
    const alwaysOnOk = await refreshAlwaysOnStatus();
    setIsBatteryExempt(batteryExempt);
    setIsDeviceAdminActive(adminActive);
    setSetupStep(
      !batteryExempt
        ? "battery"
        : !adminActive
          ? "deviceAdmin"
          : !alwaysOnOk
            ? "alwaysOn"
            : "done",
    );
  }, [refreshAlwaysOnStatus]);

  // "Agora não" no passo de bateria: registra o skip (é ele que autoriza o
  // banner de reforço depois) e segue para device admin, ou conclui.
  const skipBatteryStep = useCallback(() => {
    void persistSetupOutcome("skipped_battery");
    setSetupStep(
      !isDeviceAdminActive ? "deviceAdmin" : alwaysOnSatisfied ? "done" : "alwaysOn",
    );
  }, [isDeviceAdminActive, alwaysOnSatisfied, persistSetupOutcome]);

  // "Agora não" no passo de device admin: registra o skip e segue para o passo
  // obrigatório de VPN sempre ativa — não fecha mais o modal aqui, porque o
  // device admin deixou de ser o último passo da jornada.
  const skipDeviceAdminStep = useCallback(() => {
    void persistSetupOutcome(
      setupOutcome === "skipped_battery" ? "skipped_battery" : "skipped_admin",
    );
    setSetupStep(alwaysOnSatisfied ? "done" : "alwaysOn");
  }, [alwaysOnSatisfied, persistSetupOutcome, setupOutcome]);

  // Fechamento do passo final: jornada cumprida (o que não foi concedido já foi
  // registrado como skip no passo correspondente).
  const finishSetupJourney = useCallback(() => {
    if (setupOutcome === "legacy") void persistSetupOutcome("completed");
    setShowSetupModal(false);
  }, [persistSetupOutcome, setupOutcome]);

  // Error modal
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCallback, setRetryCallback] = useState<(() => Promise<void>) | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [blockCloseHint, setBlockCloseHint] = useState<boolean>(false);

  const triggerError = useCallback((msg?: string, retry?: () => Promise<void>) => {
    setErrorMessage(msg ?? 'Ocorreu um erro ao processar sua solicitação. Tente novamente.');
    setRetryCallback(retry ? () => retry : null);
    setShowErrorModal(true);
    setBlockCloseHint(false);
  }, []);

  const handleErrorAction = useCallback(async () => {
    if (!retryCallback) {
      setShowErrorModal(false);
      clearLoadError();
      return;
    }
    setIsRetrying(true);
    try {
      await retryCallback();
      setShowErrorModal(false);
      clearLoadError();
    } catch {
      setErrorMessage('Não foi possível, tente novamente mais tarde.');
    } finally {
      setIsRetrying(false);
    }
  }, [retryCallback, clearLoadError]);

  const handleErrorModalClose = useCallback(() => {
    if (retryCallback) {
      setBlockCloseHint(true);
      setTimeout(() => setBlockCloseHint(false), 2500);
      return;
    }
    setShowErrorModal(false);
    clearLoadError();
  }, [retryCallback, clearLoadError]);

  useEffect(() => {
    if (loadError) {
      triggerError(loadError, async () => {
        await Promise.all([loadDashboard(true), loadBetStreak(true)]);
      });
    }
  }, [loadError, triggerError, loadDashboard, loadBetStreak]);

  // ── Timeout de segurança do pedido de VPN ──────────────────────────────────
  // O diálogo de consentimento do Android tira o app do primeiro plano. Contar
  // o tempo enquanto o usuário lê esse diálogo transformava "usuário lento" em
  // erro — e o erro abortava a jornada de proteção inteira. O relógio agora só
  // corre com o app em foreground; ele protege contra travamento real, não
  // contra leitura demorada.
  const awaitingVpnRef = useRef<boolean>(false);

  const clearBlockingTimeout = useCallback(() => {
    if (blockingTimeoutRef.current) {
      clearTimeout(blockingTimeoutRef.current);
      blockingTimeoutRef.current = null;
    }
  }, []);

  const armBlockingTimeout = useCallback(() => {
    clearBlockingTimeout();
    blockingTimeoutRef.current = setTimeout(() => {
      blockingTimedOutRef.current = true;
      awaitingVpnRef.current = false;
      setIsBlockerLoading(false);
      setShowSetupModal(false);
      triggerError(
        'O sistema demorou para responder. Verifique as permissões de VPN nas configurações do Android e tente novamente.'
      );
    }, VPN_REQUEST_TIMEOUT_MS);
  }, [clearBlockingTimeout, triggerError]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (!awaitingVpnRef.current) return;
      if (nextState === "active") armBlockingTimeout();
      else clearBlockingTimeout();
    });
    return () => subscription.remove();
  }, [armBlockingTimeout, clearBlockingTimeout]);

  // Modal states
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showBlockFlowModal, setShowBlockFlowModal] = useState<boolean>(false);
  const [blockFlowStep, setBlockFlowStep] = useState<BlockFlowStep>("choices");
  const blockFlowFade = useRef(new Animated.Value(1)).current;
  const [reportHouseUrl, setReportHouseUrl] = useState<string>("");
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  const animateBlockFlowToStep = useCallback(
    (step: BlockFlowStep) => {
      Keyboard.dismiss();
      Animated.timing(blockFlowFade, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(({ finished }) => {
        if (!finished) return;
        setBlockFlowStep(step);
        Animated.timing(blockFlowFade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      });
    },
    [blockFlowFade]
  );
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("done");

  // Avanço automático dos passos da jornada guiada: dispara na transição
  // false→true da isenção de bateria (detectada por checkBatteryExemption no
  // AppState "active", ao voltar do diálogo de sistema) e do device admin. Só
  // age com o modal aberto, então voltar ao foreground por outro motivo não
  // avança nada.
  useEffect(() => {
    if (!showSetupModal) return;
    if (setupStep === "battery" && isBatteryExempt) {
      setSetupStep(
        !isDeviceAdminActive ? "deviceAdmin" : alwaysOnSatisfied ? "done" : "alwaysOn",
      );
    } else if (setupStep === "deviceAdmin" && isDeviceAdminActive) {
      setSetupStep(alwaysOnSatisfied ? "done" : "alwaysOn");
    } else if (setupStep === "alwaysOn" && alwaysOnSatisfied) {
      // Detecção automática: o refresh no AppState "active" percebe a volta das
      // configurações com a chave ligada, e o passo se conclui sozinho.
      setSetupStep("done");
    }
  }, [showSetupModal, setupStep, isBatteryExempt, isDeviceAdminActive, alwaysOnSatisfied]);

  // Anti-flash: os banners de reforço ficam retidos enquanto a jornada está
  // aberta e por um instante depois. Antes eles surgiam no mesmo frame em que o
  // modal fechava, o que dava a impressão de "o aviso vazou de novo".
  const [bannersHeld, setBannersHeld] = useState<boolean>(false);
  useEffect(() => {
    if (showSetupModal) {
      setBannersHeld(true);
      return;
    }
    const timer = setTimeout(() => setBannersHeld(false), BANNER_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showSetupModal]);

  // Banner é recuperação de um "Agora não", não aviso genérico de permissão
  // faltando. "legacy" (instalou antes da jornada única) mantém o comportamento
  // antigo de propósito — senão a base instalada perderia o aviso em silêncio.
  const canShowReinforcementBanners = !bannersHeld && setupOutcome !== "completed";

  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [showAlreadyMarkedModal, setShowAlreadyMarkedModal] = useState<boolean>(false);
  const [isCheckInSubmitting, setIsCheckInSubmitting] = useState<boolean>(false);

  // Blocker promo modal — exibido apenas no primeiro acesso
  const [showBlockerPromoModal, setShowBlockerPromoModal] = useState<boolean>(false);
  const promoCheckedRef = useRef<boolean>(false);
  
  // Calcula statsReady baseado no store
  const statsReady = !isLoading && dashboard !== null;

  const [greetingLine, setGreetingLine] = useState<string>(() => periodGreetingLabel());

  const { courses, isLoading: coursesLoading, loadCourses } = useCoursesStore();
  const currentCourse = selectCurrentCourse(courses);
  const currentCourseLoading = coursesLoading && courses.length === 0;

  // Boot: run all data services in parallel before showing Home
  useEffect(() => {
    const loadCoursesHandled = async () => {
      try {
        await loadCourses();
      } catch {
        if (courses.length === 0) {
          triggerError(undefined, () => loadCourses(true));
        }
      }
    };
    Promise.all([loadAll(), loadCoursesHandled()]).finally(() => {
      sessionBooted = true;
      setHasBooted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exibe o modal de promo do bloqueador apenas na primeira entrada do usuário na Home.
  // A chave é por userId para que contas diferentes no mesmo dispositivo
  // recebam o modal independentemente.
  useEffect(() => {
    if (!hasBooted || promoCheckedRef.current || !user?.id) return;
    promoCheckedRef.current = true;
    AsyncStorage.getItem(blockerPromoSeenKey(user.id))
      .then((seen) => { if (!seen) setShowBlockerPromoModal(true); })
      .catch(() => {});
  }, [hasBooted, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.openBlockFlow !== true) return;
      blockFlowFade.setValue(1);
      setBlockFlowStep("choices");
      setShowBlockFlowModal(true);
      navigation.setParams({ openBlockFlow: undefined });
    }, [navigation, route.params?.openBlockFlow, blockFlowFade]),
  );

  useFocusEffect(
    useCallback(() => {
      setGreetingLine(periodGreetingLabel());
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!hasBooted) return;
      void loadCourses().catch(() => {});
    }, [loadCourses, hasBooted]),
  );

  // Auto-close reset confirm modal after 3 seconds
  useEffect(() => {
    if (showResetConfirmModal) {
      const timer = setTimeout(() => {
        setShowResetConfirmModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showResetConfirmModal]);

  // Cleanup do timeout de segurança da VPN ao desmontar o componente
  useEffect(() => {
    return () => {
      if (blockingTimeoutRef.current) {
        clearTimeout(blockingTimeoutRef.current);
      }
    };
  }, []);


  const handleDaysPress = () => {
    if (canCheckIn) {
      setShowCheckInModal(true);
    } else {
      setShowAlreadyMarkedModal(true);
    }
  };

  const handleCheckIn = async () => {
    setShowCheckInModal(false);
    setIsCheckInSubmitting(true);
    try {
      const container = Container.getInstance();
      const result = await container.getBetCheckInUseCase().execute();
      updateAfterCheckIn(result.betStreak, result.nextCheckInAt);
      await notifyStreakMilestone(result.betStreak);
    } catch (error: any) {
      console.log("BetCheckIn POST:", error?.message ?? error);
      triggerError('Não foi possível registrar o check-in. Tente novamente.', async () => {
        setIsCheckInSubmitting(true);
        try {
          const container = Container.getInstance();
          const result = await container.getBetCheckInUseCase().execute();
          updateAfterCheckIn(result.betStreak, result.nextCheckInAt);
          await notifyStreakMilestone(result.betStreak);
        } finally {
          setIsCheckInSubmitting(false);
        }
      });
    } finally {
      setIsCheckInSubmitting(false);
    }
  };

  /**
   * Passo "intro" da jornada: pede o consentimento de VPN ao Android e, ao ser
   * concedido, avança para o próximo passo DENTRO DO MESMO MODAL. Não há mais
   * fechar-um-e-abrir-outro no mesmo frame (o Modal do Android engolia o
   * segundo), nem retorno à Home entre as permissões.
   */
  const handleBlockContinue = async () => {
    if (Platform.OS !== "android") {
      setShowSetupModal(false);
      Alert.alert(
        "Disponível no Android",
        "O bloqueio de apostas via VPN está disponível apenas no Android."
      );
      return;
    }
    if (!BetBlocker) {
      console.log("BetBlocker: módulo nativo não disponível");
      setShowSetupModal(false);
      Alert.alert(
        "Indisponível",
        "O recurso de bloqueio não está disponível neste ambiente."
      );
      return;
    }

    // Guard: evita múltiplos cliques em paralelo
    if (isBlockerLoading) return;

    // Ativa loading imediatamente — antes de qualquer await
    setIsBlockerLoading(true);
    blockingTimedOutRef.current = false;
    awaitingVpnRef.current = true;
    armBlockingTimeout();

    try {
      // Atualização da blocklist em background: fire-and-forget.
      // A lista local já está disponível (carregada no onCreate do service),
      // então não bloqueamos o fluxo principal esperando a rede aqui.
      if (BetBlocker.refreshBlockedDomains) {
        BetBlocker.refreshBlockedDomains().catch(() => {
          // Falha silenciosa: blocklist local continua funcional
        });
      }

      // Solicita permissão VPN ao sistema. A Promise só resolve quando o
      // usuário age no diálogo nativo (aprova ou rejeita).
      const granted: boolean = await BetBlocker.startBlocking();

      clearBlockingTimeout();
      awaitingVpnRef.current = false;
      setIsBlockerLoading(false);

      if (granted) {
        setIsBlockerEnabled(true);
        // Chegada tardia (o timeout já tinha desistido e mostrado o erro): a
        // permissão VALE, então recolhe o erro e retoma a jornada em vez de
        // abandonar o usuário com a VPN ligada e nenhum passo pedido — era
        // exatamente assim que bateria e device admin ficavam para trás.
        if (blockingTimedOutRef.current) {
          blockingTimedOutRef.current = false;
          setShowErrorModal(false);
          setRetryCallback(null);
        }
        await advanceToFirstPendingStep();
        setShowSetupModal(true);
      } else if (!blockingTimedOutRef.current) {
        setShowSetupModal(false);
        Alert.alert(
          "Permissão necessária",
          "Para ativar o bloqueio, autorize a conexão VPN quando o Android solicitar. Você pode habilitá-la a qualquer momento nas Configurações.",
          [
            { text: "Agora não", style: "cancel" },
            {
              text: "Abrir configurações",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } catch (error: any) {
      clearBlockingTimeout();
      awaitingVpnRef.current = false;
      if (blockingTimedOutRef.current) return;
      setIsBlockerLoading(false);
      console.log("BetBlocker error", error);
      setShowSetupModal(false);
      triggerError('Não foi possível ativar o bloqueio. Tente novamente.');
    }
  };

  /**
   * "Ativar bloqueio" no modal de escolhas: abre a jornada única no passo de
   * introdução. O hop com atraso continua sendo necessário aqui porque são dois
   * modais distintos (escolhas → jornada) — é o único do fluxo agora.
   */
  const handleActivateBlockFlow = () => {
    setShowBlockFlowModal(false);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (Platform.OS === "ios" && BetBlocking?.openBlockingFlow) {
          try {
            BetBlocking.openBlockingFlow();
          } catch (e: unknown) {
            console.warn("BetBlocking.openBlockingFlow", e);
          }
          return;
        }
        setBatteryAttemptFailed(false);
        setSetupStep("intro");
        setShowSetupModal(true);
      }, 400);
    });
  };

  const closeBlockFlowModal = (): void => {
    if (isSubmittingReport) return;
    setShowBlockFlowModal(false);
    setBlockFlowStep("choices");
    blockFlowFade.setValue(1);
    setReportHouseUrl("");
  };

  const dismissBlockerPromo = useCallback((): void => {
    setShowBlockerPromoModal(false);
    if (user?.id) {
      AsyncStorage.setItem(blockerPromoSeenKey(user.id), "1").catch(() => {});
    }
  }, [user?.id]);

  const handleBlockerPromoActivate = useCallback((): void => {
    setShowBlockerPromoModal(false);
    if (user?.id) {
      AsyncStorage.setItem(blockerPromoSeenKey(user.id), "1").catch(() => {});
    }
    // Abre o fluxo existente após o modal promo fechar (evita dois modais simultâneos)
    InteractionManager.runAfterInteractions(() => {
      blockFlowFade.setValue(1);
      setBlockFlowStep("choices");
      setShowBlockFlowModal(true);
    });
  }, [blockFlowFade, user?.id]);

  const handleSubmitBettingHouseReport = async (): Promise<void> => {
    Keyboard.dismiss();
    setIsSubmittingReport(true);
    try {
      const useCase = Container.getInstance().getSubmitBettingHouseReportUseCase();
      await useCase.execute(reportHouseUrl);
      closeBlockFlowModal();
      Alert.alert(
        "Obrigado!",
        "Recebemos sua denúncia. Vamos avaliar para incluir na lista de bloqueio."
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Não foi possível enviar. Tente novamente.';
      // ValidationError = dado inválido; retry com o mesmo input repetiria o mesmo erro
      const retry = error instanceof ValidationError
        ? undefined
        : async () => {
            const useCase = Container.getInstance().getSubmitBettingHouseReportUseCase();
            await useCase.execute(reportHouseUrl);
            closeBlockFlowModal();
            Alert.alert(
              "Obrigado!",
              "Recebemos sua denúncia. Vamos avaliar para incluir na lista de bloqueio."
            );
          };
      triggerError(msg, retry);
    } finally {
      setIsSubmittingReport(false);
    }
  };



  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{greetingLine}</Text>
        <MaskedView
          maskElement={
            <Text style={[styles.greetingText, { backgroundColor: 'transparent' }]}>
              {user?.name || "Usuário"}
            </Text>
          }
        >
          <LinearGradient
            colors={HORIZONTAL_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          >
            <Text style={[styles.greetingText, { opacity: 0 }]}>
              {user?.name || "Usuário"}
            </Text>
          </LinearGradient>
        </MaskedView>
      </View>
      
      <StatsDisplay 
        loading={!statsReady}
        energy={statsReady && dashboard ? dashboard.energy : undefined}
        streak={statsReady ? `${betStreak}d` : undefined}
      />
    </View>
  );

  const renderGradientText = (text: string, style: object) => (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        colors={HORIZONTAL_GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );

  const renderFreeOfBetDaysDisplay = () => (
    <View style={styles.freeOfBetDaysContainer}>
      <Text style={styles.freeOfBetDaysLabel}>
        Você está livre de apostas por:
      </Text>
      <TouchableOpacity
        onPress={statsReady ? handleDaysPress : undefined}
        activeOpacity={statsReady && canCheckIn ? 0.7 : 1}
        disabled={!statsReady || isCheckInSubmitting}
        style={styles.freeOfBetDaysValueWrapper}
      >
        {!statsReady ? (
          <View style={styles.daysSkeleton}>
            <View style={styles.daysNumberPlaceholder} />
            <View style={styles.daysUnitPlaceholder} />
          </View>
        ) : isCheckInSubmitting ? (
          <ActivityIndicator size="small" color="#B8A8E8" />
        ) : (
          <>
            {/* betStreak inicia em 0, se loadBetStreak falhar mantém 0 - fallback honesto */}
            {renderGradientText(`${betStreak}`, styles.freeOfBetDaysNumber)}
            {renderGradientText(" dias", styles.freeOfBetDaysUnit)}
          </>
        )}
      </TouchableOpacity>
      {statsReady && canCheckIn && (
        <TouchableOpacity
          onPress={handleDaysPress}
          activeOpacity={0.7}
          style={styles.checkInHint}
        >
          <Text style={styles.checkInHintText}>Toque para marcar se apostou hoje</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFreeOfBetBox = () => (
    <View style={styles.freeOfBetContainer}>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("SOSMenu")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="SOS: ferramentas de socorro imediato contra a fissura"
        >
          <View style={styles.actionIconCircle}>
            <MaterialCommunityIcons name="shield-alert" size={26} color="#A09CAB" />
          </View>
          <Text style={styles.actionText}>SOS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowResetModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconCircle}>
            <MaterialCommunityIcons name="timer-sand" size={26} color="#A09CAB" />
          </View>
          <Text style={styles.actionText}>Resetar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            blockFlowFade.setValue(1);
            setBlockFlowStep("choices");
            setShowBlockFlowModal(true);
          }}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconCircle}>
            <MaterialCommunityIcons name="cancel" size={26} color="#A09CAB" />
          </View>
          <Text style={styles.actionText}>Bloquear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSupport}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconCircle}>
            <MaterialCommunityIcons name="headset" size={26} color="#A09CAB" />
          </View>
          <Text style={styles.actionText}>Suporte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  if (!hasBooted) {
    return <AppLoadingScreen />;
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Background Gradient - Radial Effect */}
          <View
            style={[
              styles.backgroundGradient,
              {
                height: GRADIENT_HEIGHT_EXPANDED,
                backgroundColor: '#000000',
              },
            ]}
          >
            {/* Vertical gradient from top center */}
            <LinearGradient
              colors={BACKGROUND_GRADIENT_COLORS}
              locations={BACKGROUND_GRADIENT_LOCATIONS}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Left shadow overlay */}
            <LinearGradient
              colors={SHADOW_OVERLAY_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Right shadow overlay */}
            <LinearGradient
              colors={SHADOW_OVERLAY_COLORS}
              start={{ x: 1, y: 0 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {renderHeader()}

          {renderFreeOfBetDaysDisplay()}
          
          {renderFreeOfBetBox()}

          {/* Reforço: proteção contra remoção (Device Admin) */}
          {Platform.OS === "android" &&
            isBlockerEnabled &&
            canShowReinforcementBanners &&
            !isDeviceAdminActive && (
              <TouchableOpacity
                style={styles.removalProtectionBanner}
                onPress={handleRequestDeviceAdmin}
                activeOpacity={0.85}
                disabled={isRequestingDeviceAdmin}
              >
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={22}
                  color="#C9A7E8"
                />
                <View style={styles.batteryWarningTextBox}>
                  <Text style={styles.removalProtectionTitle}>
                    Reforce: ative a proteção contra remoção
                  </Text>
                  <Text style={styles.batteryWarningDesc}>
                    Impede desinstalar o BetHunter enquanto o bloqueio estiver ativo.
                  </Text>
                </View>
                <Icon name="chevron-right" size={22} color="#C9A7E8" />
              </TouchableOpacity>
            )}

          {/* Pendência obrigatória: VPN sempre ativa.
              NÃO passa por canShowReinforcementBanners de propósito — aquele gate
              é recuperação de um "Agora não", e este passo não tem "Agora não".
              Vale também para usuário legado, que nunca viu a jornada. */}
          {Platform.OS === "android" &&
            isBlockerEnabled &&
            !bannersHeld &&
            alwaysOnPending && (
              <TouchableOpacity
                style={styles.alwaysOnBanner}
                onPress={handleAlwaysOnBannerPress}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="shield-sync-outline"
                  size={22}
                  color="#7AC7E8"
                />
                <View style={styles.batteryWarningTextBox}>
                  <Text style={styles.alwaysOnBannerTitle}>
                    Falta 1 passo: VPN sempre ativa
                  </Text>
                  <Text style={styles.batteryWarningDesc}>
                    Sem ela, o Android pode desligar o bloqueio e não religar. Toque para
                    concluir.
                  </Text>
                </View>
                <Icon name="chevron-right" size={22} color="#7AC7E8" />
              </TouchableOpacity>
            )}

          {/* Selo: VPN sempre ativa confirmada pelo SISTEMA. Autoatestado não
              entra aqui — não pintamos de verde algo que só o usuário afirmou. */}
          {Platform.OS === "android" &&
            isBlockerEnabled &&
            (alwaysOnStatus?.detectedBySetting ||
              alwaysOnStatus?.detectedBySystemStart) && (
              <View style={styles.removalProtectionActiveBadge}>
                <MaterialCommunityIcons name="shield-sync" size={20} color="#7BE8A7" />
                <Text style={styles.removalProtectionActiveText}>
                  VPN sempre ativa
                </Text>
              </View>
            )}

          {/* Selo: proteção contra remoção ativa */}
          {Platform.OS === "android" &&
            isBlockerEnabled &&
            isDeviceAdminActive && (
              <View style={styles.removalProtectionActiveBadge}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={20}
                  color="#7BE8A7"
                />
                <Text style={styles.removalProtectionActiveText}>
                  Proteção contra remoção ativa
                </Text>
              </View>
            )}

          {/* Aviso: otimização de bateria pode matar a VPN de bloqueio.
              Só aparece para quem adiou o passo na jornada (ou é legado): lá a
              permissão é pedida de forma explícita e explicada. */}
          {Platform.OS === "android" &&
            isBlockerEnabled &&
            !isBatteryExempt &&
            !isBatteryWarningSuppressed &&
            canShowReinforcementBanners && (
              <>
                <TouchableOpacity
                  style={styles.batteryWarningBanner}
                  onPress={handleBatteryBannerPress}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="battery-alert-variant-outline"
                    size={22}
                    color="#E8B07A"
                  />
                  <View style={styles.batteryWarningTextBox}>
                    <Text style={styles.batteryWarningTitle}>
                      {hasRequestedBatteryExemptionBefore
                        ? "Ainda não protegido"
                        : "Proteja o bloqueio contra a economia de bateria"}
                    </Text>
                    <Text style={styles.batteryWarningDesc}>
                      {hasRequestedBatteryExemptionBefore
                        ? "Na tela de bateria do seu aparelho, escolha 'Sem restrições' para o BetHunter."
                        : "O Android pode desligar o bloqueio em segundo plano. Toque para permitir que o BetHunter continue ativo."}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={22} color="#E8B07A" />
                </TouchableOpacity>
                {hasRequestedBatteryExemptionBefore && (
                  <TouchableOpacity
                    style={styles.batteryWarningManualLink}
                    onPress={handleConfirmBatteryExceptionManually}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.batteryWarningManualLinkText}>
                      Já configurei, mas o aviso continua aparecendo
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

          {/* Divider */}
          <View style={styles.dividerTouchable}>
            <LinearGradient
              colors={HORIZONTAL_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />
          </View>

          {/* Continue de onde parou */}
          <View style={styles.continueBoxOuter}>
            <View style={styles.rouletteBox}>
              <LinearGradient
                colors={BACKGROUND_GRADIENT_COLORS}
                locations={BACKGROUND_GRADIENT_LOCATIONS}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={SHADOW_OVERLAY_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={SHADOW_OVERLAY_COLORS}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.continueBoxTitle}>Continue de onde parou</Text>
              {currentCourseLoading && !currentCourse ? (
                <View style={styles.continueSkeletonCard}>
                  <View style={styles.continueSkeletonLine} />
                  <View style={styles.continueSkeletonChevron} />
                </View>
              ) : currentCourse ? (
                <LinearGradient
                  colors={[...HORIZONTAL_GRADIENT_COLORS]}
                  locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueCardBorder}
                >
                  <TouchableOpacity
                    style={styles.continueCardInner}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("CourseModules", {
                        courseId: currentCourse.id,
                        courseTitle: currentCourse.title,
                        modulesCompleted: currentCourse.modulesCompleted,
                      })
                    }
                  >
                    <Text style={styles.continueText} numberOfLines={1}>
                      {currentCourse.title}: {currentCourse.modulesCompleted}/{currentCourse.modulesQuantity}
                    </Text>
                    <Icon name="chevron-right" size={22} color="#B8B3BF" />
                  </TouchableOpacity>
                </LinearGradient>
              ) : null}
            </View>
          </View>

          {/* Minha conta, Meu acessor, Menu Educacional */}
          <View style={styles.cardsContainer}>
            <IconCard
              icon={<BetHunterIcon width={20} height={20} />}
              title={"Minha\nConta"}
              cardBackgroundColor="#14121B"
              size={cardSize}
              onPress={() => navigation.navigate("MinhaConta")}
            />
            <IconCard
              icon={<AcessorIcon width={20} height={20} />}
              title={"Meu\nAcessor"}
              cardBackgroundColor="#14121B"
              size={cardSize}
              onPress={() => navigation.navigate("Acessor")}
            />
            <IconCard
              icon={<CursosIcon width={20} height={20} />}
              title={"Menu\nEducacional"}
              cardBackgroundColor="#14121B"
              size={cardSize}
              onPress={() => navigation.navigate("MenuEducacional")}
            />
          </View>
        </ScrollView>
      </View>
      
      <Footer />

      <Modal
        visible={showBlockFlowModal}
        onClose={closeBlockFlowModal}
        size="bigger"
        title="Proteção e denúncias"
        subtitle="Configure o bloqueio neste dispositivo ou nos informe um site ou app para incluir na lista."
      >
        <Animated.View style={{ opacity: blockFlowFade }}>
          {blockFlowStep === "choices" ? (
            <View style={styles.blockActionModalContent}>
              <View style={styles.blockChoiceCard}>
                <View style={styles.blockChoiceHeader}>
                  <View style={styles.blockChoiceIconCircle}>
                    <MaterialCommunityIcons
                      name={isBlockerEnabled ? "shield-check" : "shield-lock-outline"}
                      size={26}
                      color={isBlockerEnabled ? "#7BE8A7" : "#C9A7E8"}
                    />
                  </View>
                  <View style={styles.blockChoiceHeaderText}>
                    <Text style={styles.blockChoiceTitle}>
                      {isBlockerEnabled
                        ? "Proteção ativa"
                        : Platform.OS === "ios"
                        ? "Proteção neste iPhone"
                        : "Ativar bloqueio (VPN)"}
                    </Text>
                    <Text style={styles.blockChoiceDesc}>
                      {isBlockerEnabled
                        ? isDeviceAdminActive
                          ? "O bloqueio e a proteção contra remoção estão ativos neste dispositivo."
                          : "O bloqueio está ativo neste dispositivo e não pode ser desativado pelo app."
                        : Platform.OS === "ios"
                        ? "Abre Tempo de Uso para escolher apps e aplicar bloqueios."
                        : "Instalação do perfil VPN para filtrar sites de apostas no dispositivo."}
                    </Text>
                  </View>
                </View>
                {isBlockerEnabled && isDeviceAdminActive && (
                  <View style={styles.blockChoiceAdminBadge}>
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={16}
                      color="#7BE8A7"
                    />
                    <Text style={styles.blockChoiceAdminBadgeText}>
                      Proteção contra remoção ativa
                    </Text>
                  </View>
                )}
                {!isBlockerEnabled && (
                  <GradientBorderButton
                    label={
                      Platform.OS === "ios"
                        ? "Configurar bloqueio"
                        : "Ativar bloqueio"
                    }
                    onPress={handleActivateBlockFlow}
                  />
                )}
              </View>

              <View style={styles.blockActionOrRow}>
                <View style={styles.blockActionOrLine} />
                <Text style={styles.blockActionOrText}>ou</Text>
                <View style={styles.blockActionOrLine} />
              </View>

              <View style={[styles.blockChoiceCard, styles.blockChoiceCardMuted]}>
                <View style={styles.blockChoiceHeader}>
                  <View style={[styles.blockChoiceIconCircle, styles.blockChoiceIconCircleMuted]}>
                    <MaterialCommunityIcons
                      name="flag-outline"
                      size={26}
                      color="#E8B07A"
                    />
                  </View>
                  <View style={styles.blockChoiceHeaderText}>
                    <Text style={styles.blockChoiceTitle}>Informar casa de apostas</Text>
                    <Text style={styles.blockChoiceDesc}>
                      Envie o nome e a URL para avaliarmos e incluir na lista de bloqueio.
                    </Text>
                  </View>
                </View>
                <GradientBorderButton
                  label="Denunciar casa de apostas"
                  onPress={() => animateBlockFlowToStep("report")}
                />
              </View>
            </View>
          ) : (
            <View style={styles.reportForm}>
              <TouchableOpacity
                style={styles.blockFlowBackButton}
                onPress={() => animateBlockFlowToStep("choices")}
                disabled={isSubmittingReport}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10 }}
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color="#9E9AA8" />
                <Text style={styles.blockFlowBackText}>Voltar às opções</Text>
              </TouchableOpacity>
              <Text style={styles.reportLabel}>URL</Text>
              <TextInput
                style={styles.reportInput}
                value={reportHouseUrl}
                onChangeText={setReportHouseUrl}
                placeholder="exemplo.com ou https://..."
                placeholderTextColor="#726E7C"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmittingReport}
              />
              <GradientBorderButton
                label="Enviar denúncia"
                onPress={() => void handleSubmitBettingHouseReport()}
                loading={isSubmittingReport}
              />
            </View>
          )}
        </Animated.View>
      </Modal>

      {/* Modal de Confirmação de Reset */}
      <Modal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        size="small"
        title="Tem certeza?"
        subtitle="Seu contador será completamente reinicializado."
      >
        <View style={styles.resetModalContent}>
          <GradientBorderButton
            label="Continuar"
            onPress={async () => {
              try {
                const container = Container.getInstance();
                await container.getResetBetStreakUseCase().execute();
                setShowResetModal(false);
                setShowResetConfirmModal(true);
                loadAll(true).catch(() => {});
              } catch (error: any) {
                console.log("ResetBetStreak:", error?.message ?? error);
                setShowResetModal(false);
                triggerError();
              }
            }}
          />
        </View>
      </Modal>

      {/* Modal de Reset Confirmado - Menor */}
      <Modal
        visible={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        size="smaller"
        title="Poxa, que pena!"
        subtitle="Sentimos muito. Vamos recomeçar!"
        showCloseButton={false}
      >
        <View style={styles.resetConfirmModalContent} />
      </Modal>

      {/* Modal de Instrução - Isenção de bateria (caminho do banner de reforço;
          na jornada única o mesmo conteúdo é exibido no passo "battery"). */}
      <Modal
        visible={showBatteryHintModal}
        onClose={() => setShowBatteryHintModal(false)}
        size="small"
        title="Antes de continuar"
        subtitle="Na próxima tela, escolha a opção 'Sem restrições' (pode aparecer como 'Nenhuma restrição' ou 'Permitir'). Isso garante que o bloqueio continue ativo mesmo com o app em segundo plano.

Dica: na tela de apps recentes, toque e segure o card do BetHunter e escolha o cadeado para travá-lo — assim a limpeza de memória do aparelho não fecha o app."
      >
        <View style={styles.blockModalContent}>
          <GradientBorderButton label="Entendi, continuar" onPress={handleConfirmBatteryHint} />
          {isXiaomi && (
            <TouchableOpacity
              style={styles.batteryWarningManualLink}
              onPress={handleOpenAutoStartSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.batteryWarningManualLinkText}>
                Ativar Início automático (MIUI)
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.batteryWarningManualLink}
            onPress={handleOpenAlwaysOnVpnSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.batteryWarningManualLinkText}>
              Ativar VPN sempre ativa (proteção mais forte)
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Jornada única de proteção: VPN → bateria → não desinstalar → pronto.
          Um só modal do começo ao fim; os diálogos do sistema saem um de cada
          vez, sempre a partir daqui, e o usuário nunca volta para a Home no
          meio do caminho. */}
      <Modal
        visible={showSetupModal}
        onClose={() => {
          // Não deixa fechar enquanto um diálogo do sistema está pendente
          if (isBlockerLoading || isRequestingDeviceAdmin || isCheckingAlwaysOn) return;
          // Sair no passo obrigatório NÃO é um skip: a pendência é derivada do
          // estado nativo e o banner fixo da Home retoma de onde parou. O modal
          // continua fechável de propósito — prender a UI seria dark pattern e,
          // pior, impediria o usuário de chegar às configurações do sistema.
          if (setupStep === "alwaysOn" && setupOutcome === "legacy") {
            void persistSetupOutcome("completed");
          }
          setShowSetupModal(false);
        }}
        size={
          setupStep === "done" ? "smaller" : setupStep === "alwaysOn" ? "big" : "medium"
        }
        title={
          setupStep === "intro"
            ? "Ativar bloqueio"
            : setupStep === "battery"
              ? "Passo 2 de 4 — Manter ativo"
              : setupStep === "deviceAdmin"
                ? "Passo 3 de 4 — Evitar remoção"
                : setupStep === "alwaysOn"
                  ? "Passo 4 de 4 — VPN sempre ativa"
                  : "Tudo pronto!"
        }
        subtitle={
          setupStep === "intro"
            ? (isBlockerLoading
                ? "Aguardando autorização do Android…"
                : "São 4 permissões rápidas, uma de cada vez. O BetHunter usa uma VPN local no seu dispositivo — nenhum dado é enviado para fora do aparelho.")
            : setupStep === "battery"
              ? "Na próxima tela, escolha 'Sem restrições' (pode aparecer como 'Nenhuma restrição' ou 'Permitir'). Sem isso, a economia de bateria do Android desliga o bloqueio em segundo plano."
              : setupStep === "deviceAdmin"
                ? "Ative a proteção contra remoção para impedir desinstalar o BetHunter enquanto o bloqueio estiver ativo."
                : setupStep === "alwaysOn"
                  ? "Com a VPN sempre ativa, quem religa o bloqueio depois de uma queda é o próprio Android — não o app. É o passo que fecha a porta dos fundos."
                  : "Bloqueamos apps e sites de aposta, para você usar seu dispositivo tranquilo."
        }
        showCloseButton={false}
      >
        <View style={styles.blockModalContent}>
          {setupStep === "intro" && (
            <>
              <View style={styles.setupStepsPreview}>
                <Text style={styles.setupStepsPreviewItem}>1. Autorizar a VPN local</Text>
                <Text style={styles.setupStepsPreviewItem}>2. Manter ativo em segundo plano</Text>
                <Text style={styles.setupStepsPreviewItem}>3. Impedir a desinstalação</Text>
                <Text style={styles.setupStepsPreviewItem}>4. Deixar a VPN sempre ativa</Text>
              </View>
              <GradientBorderButton
                label={isBlockerLoading ? "Aguardando…" : "Começar"}
                onPress={handleBlockContinue}
                loading={isBlockerLoading}
                disabled={isBlockerLoading}
              />
            </>
          )}

          {setupStep === "battery" && (
            <>
              {batteryAttemptFailed && (
                <Text style={styles.setupStepWarning}>
                  Ainda não está liberado. Abra de novo e escolha 'Sem restrições'.
                </Text>
              )}
              <GradientBorderButton
                label={batteryAttemptFailed ? "Tentar novamente" : "Permitir"}
                onPress={handleRequestBatteryExemption}
              />
              {isXiaomi && (
                <TouchableOpacity
                  style={styles.batteryWarningManualLink}
                  onPress={handleOpenAutoStartSettings}
                  activeOpacity={0.7}
                >
                  <Text style={styles.batteryWarningManualLinkText}>
                    Ativar Início automático (MIUI)
                  </Text>
                </TouchableOpacity>
              )}
              {/* O link "VPN sempre ativa" saiu daqui: virou o passo 4, obrigatório.
                  Mantê-lo permitia cumprir o passo 4 no meio do passo 2 e
                  embaralhava a leitura da jornada. */}
              <TouchableOpacity
                style={styles.blockerPromoDismissButton}
                onPress={skipBatteryStep}
                activeOpacity={0.7}
              >
                <Text style={styles.blockerPromoDismissText}>Agora não</Text>
              </TouchableOpacity>
            </>
          )}

          {setupStep === "deviceAdmin" && (
            <>
              <GradientBorderButton
                label="Permitir"
                onPress={handleRequestDeviceAdmin}
                loading={isRequestingDeviceAdmin}
                disabled={isRequestingDeviceAdmin}
              />
              <TouchableOpacity
                style={styles.blockerPromoDismissButton}
                onPress={skipDeviceAdminStep}
                activeOpacity={0.7}
                disabled={isRequestingDeviceAdmin}
              >
                <Text style={styles.blockerPromoDismissText}>Agora não</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Passo obrigatório: não tem "Agora não". O Android não permite que o
              app ligue a VPN sempre ativa sozinho (só um Device Owner/MDM pode),
              nem expõe API pública para ler o estado — por isso o passo libera por
              detecção automática OU por autoatestado explícito, e a pendência
              continua cobrada por banner fixo na Home. */}
          {setupStep === "alwaysOn" && (
            <>
              <View style={styles.setupStepsPreview}>
                <Text style={styles.setupStepsPreviewItem}>
                  1. Toque em "Abrir configurações de VPN"
                </Text>
                <Text style={styles.setupStepsPreviewItem}>
                  2. Toque no{" "}
                  <MaterialCommunityIcons name="cog" size={13} color="#A7A3AE" />
                  {" "}ao lado de "BetHunter"
                </Text>
                <Text style={styles.setupStepsPreviewItem}>
                  3. Ligue "VPN sempre ativa"
                </Text>
                <Text style={styles.setupStepsPreviewItem}>
                  4. Volte para o BetHunter
                </Text>
              </View>
              <Text style={styles.setupStepHint}>
                Os nomes mudam conforme o fabricante — pode aparecer como "VPN
                permanente", "Sempre ativada" ou "Always-on VPN".
              </Text>
              {alwaysOnGuideTarget === "settings" && (
                <Text style={styles.setupStepHint}>
                  Seu aparelho não abriu a tela de VPN direto: nas Configurações, busque
                  por "VPN".
                </Text>
              )}
              {alwaysOnGuideTarget === "app_details" && (
                <Text style={styles.setupStepHint}>
                  Seu aparelho abriu os detalhes do app. Volte às Configurações e busque
                  por "VPN".
                </Text>
              )}
              {alwaysOnStatus?.blockedByOtherApp && (
                <Text style={styles.setupStepWarning}>
                  Outro app está definido como VPN sempre ativa — isso impede o bloqueio
                  do BetHunter. Troque para o BetHunter nessa tela.
                </Text>
              )}
              {alwaysOnCheckFailed && (
                <Text style={styles.setupStepWarning}>
                  O Android ainda mostra a VPN sempre ativa desligada. Abra de novo e
                  ligue a chave.
                </Text>
              )}
              <GradientBorderButton
                label="Abrir configurações de VPN"
                onPress={handleOpenAlwaysOnVpnSettings}
              />
              <TouchableOpacity
                style={styles.batteryWarningManualLink}
                onPress={handleRecheckAlwaysOn}
                activeOpacity={0.7}
                disabled={isCheckingAlwaysOn}
              >
                <Text style={styles.batteryWarningManualLinkText}>
                  {isCheckingAlwaysOn ? "Verificando…" : "Já ativei — verificar de novo"}
                </Text>
              </TouchableOpacity>

              {/* Opcional de propósito: com o lockdown ligado, uma VPN que não
                  sobe deixa o aparelho sem internet nenhuma. O ganho é real, o
                  custo também — então é escolha informada do usuário. */}
              <View style={styles.alwaysOnLockdownRow}>
                <MaterialCommunityIcons
                  name={alwaysOnStatus?.lockdown ? "lock-check" : "lock-outline"}
                  size={18}
                  color={alwaysOnStatus?.lockdown ? "#7BE8A7" : "#9E9AA8"}
                />
                <View style={styles.batteryWarningTextBox}>
                  <Text style={styles.alwaysOnLockdownTitle}>
                    Opcional — proteção máxima: "Bloquear conexões sem VPN"
                  </Text>
                  <Text style={styles.batteryWarningDesc}>
                    Está na mesma tela. Fecha qualquer brecha, mas se a VPN cair o
                    aparelho fica sem internet até ela voltar.
                  </Text>
                </View>
              </View>
            </>
          )}

          {setupStep === "done" && (
            <GradientBorderButton
              label="Fechar"
              onPress={finishSetupJourney}
              disabled={isRequestingDeviceAdmin}
            />
          )}
        </View>
      </Modal>

      {/* Modal de Check-in (Apostou / Não apostei) */}
      <Modal
        visible={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        size="small"
        title="Marcar check-in"
        subtitle="Você apostou hoje?"
      >
        <View style={styles.checkInModalContent}>
          <GradientBorderButton
            label="Não apostei"
            onPress={handleCheckIn}
            loading={isCheckInSubmitting}
          />
          <GradientBorderButton
            label="Apostou"
            onPress={async () => {
              try {
                const container = Container.getInstance();
                await container.getResetBetStreakUseCase().execute();
                setShowCheckInModal(false);
                setShowResetConfirmModal(true);
                loadAll(true).catch(() => {});
              } catch (error: any) {
                console.log("BetCheckIn apostou (reset):", error?.message ?? error);
                setShowCheckInModal(false);
                triggerError();
              }
            }}
            disabled={isCheckInSubmitting}
          />
        </View>
      </Modal>

      {/* Modal Já marcado */}
      <Modal
        visible={showAlreadyMarkedModal}
        onClose={() => setShowAlreadyMarkedModal(false)}
        size="small"
        title="Já marcado"
        subtitle="Já foi marcado. Aguarde 1 dia para marcar novamente."
      >
        <View style={styles.resetModalContent}>
          <GradientBorderButton
            label="Entendi"
            onPress={() => setShowAlreadyMarkedModal(false)}
          />
        </View>
      </Modal>

      {/* Modal de Erro */}
      <Modal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        size="small"
        title="Atenção"
        subtitle={blockCloseHint
          ? 'Algo deu errado. Tente novamente.'
          : errorMessage}
      >
        <View style={styles.resetModalContent}>
          <GradientBorderButton
            label={retryCallback ? 'Tentar novamente' : 'Fechar'}
            onPress={() => void handleErrorAction()}
            loading={isRetrying}
            disabled={isRetrying}
          />
        </View>
      </Modal>

      {/* Modal de Promo do Bloqueador — primeiro acesso */}
      <Modal
        visible={showBlockerPromoModal}
        onClose={dismissBlockerPromo}
        size="medium"
        title="Bloqueie as apostas agora"
        subtitle="Impeça o acesso a sites e apps de apostas diretamente neste dispositivo. Ative o bloqueador e mantenha o foco na sua recuperação."
        scrollEnabled={false}
      >
        <View style={styles.blockerPromoContent}>
          <GradientBorderButton
            label="Ativar Bloqueador"
            onPress={handleBlockerPromoActivate}
          />
          <TouchableOpacity
            style={styles.blockerPromoDismissButton}
            onPress={dismissBlockerPromo}
            activeOpacity={0.7}
          >
            <Text style={styles.blockerPromoDismissText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container Styles
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  mainContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    flexGrow: 1,
  },

  // Background
  backgroundGradient: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    zIndex: -1,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // Free of Bet Days Display (substitui o calendário de círculos 1–8)
  freeOfBetDaysContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  freeOfBetDaysLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 8,
  },
  freeOfBetDaysValueWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  checkInHint: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  checkInHintText: {
    color: "#B8B3BF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  freeOfBetDaysNumber: {
    fontSize: 56,
    fontWeight: "bold",
  },
  freeOfBetDaysUnit: {
    fontSize: 56,
    fontWeight: "bold",
    marginLeft: 4,
  },
  daysSkeleton: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysNumberPlaceholder: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  daysUnitPlaceholder: {
    width: 120,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 4,
  },

  // Free of Bet Box Styles
  freeOfBetContainer: {
    width: "96%",
    height: 140,
    alignSelf: "center",
    marginBottom: 0,
    marginTop: 10,
    padding: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
  },
  actionIconCircle: {
    backgroundColor: "#201F2A",
    borderRadius: 999,
    width: 65,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },

  // Divider
  dividerTouchable: {
    alignSelf: "center",
    width: "50%",
    paddingVertical: 10,
    marginTop: 10,
  },
  divider: {
    width: "100%",
    height: 5,
    borderRadius: 20,
  },

  // Cards Container
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: CARD_GAP,
    marginTop: 0,
  },




  continueBoxTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  continueCardBorder: {
    borderRadius: 16,
    padding: 1,
    overflow: "hidden",
  },
  continueCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  continueText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  continueSkeletonCard: {
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  continueSkeletonLine: {
    height: 16,
    width: "62%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  continueSkeletonChevron: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  // Continue Box (reuses roulette visual)
  continueBoxOuter: {
    marginVertical: 20,
    marginBottom: 24,
  },
  rouletteBox: {
    borderRadius: 24,
    padding: 20,
    paddingBottom: 20,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  // Reset Modal Styles
  resetModalContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  blockModalContent: {
    alignItems: "center",
    paddingTop: 10,
  },
  setupStepsPreview: {
    width: "100%",
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 18,
  },
  setupStepsPreviewItem: {
    color: "#9E9AA8",
    fontSize: 13,
    lineHeight: 18,
  },
  setupStepWarning: {
    color: "#E8B07A",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingBottom: 12,
  },
  setupStepHint: {
    color: "#9E9AA8",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingBottom: 12,
  },
  alwaysOnLockdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A3A44",
    backgroundColor: "rgba(122, 199, 232, 0.06)",
  },
  alwaysOnLockdownTitle: {
    color: "#9AC7DD",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  blockActionModalContent: {
    width: "100%",
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    gap: 20,
    alignSelf: "stretch",
  },
  blockChoiceCard: {
    width: "100%",
    backgroundColor: "#14121B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2F2A3E",
    padding: 18,
    gap: 16,
  },
  blockChoiceCardMuted: {
    borderColor: "#3A3428",
    backgroundColor: "#121018",
  },
  batteryWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3A3428",
    backgroundColor: "rgba(232, 176, 122, 0.08)",
  },
  removalProtectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3A2F4A",
    backgroundColor: "rgba(168, 120, 220, 0.08)",
  },
  removalProtectionTitle: {
    color: "#C9A7E8",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  alwaysOnBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A3A44",
    backgroundColor: "rgba(122, 199, 232, 0.08)",
  },
  alwaysOnBannerTitle: {
    color: "#7AC7E8",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  removalProtectionActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(123, 232, 167, 0.35)",
    backgroundColor: "rgba(123, 232, 167, 0.1)",
  },
  removalProtectionActiveText: {
    color: "#7BE8A7",
    fontSize: 12,
    fontWeight: "700",
  },
  blockChoiceAdminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(123, 232, 167, 0.1)",
    alignSelf: "flex-start",
  },
  blockChoiceAdminBadgeText: {
    color: "#7BE8A7",
    fontSize: 12,
    fontWeight: "600",
  },
  blockSuccessHint: {
    color: "#A09CAB",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    textAlign: "center",
  },
  batteryWarningTextBox: {
    flex: 1,
    minWidth: 0,
  },
  batteryWarningTitle: {
    color: "#E8B07A",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  batteryWarningDesc: {
    color: "#A09CAB",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  batteryWarningManualLink: {
    marginHorizontal: 20,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  batteryWarningManualLinkText: {
    color: "#A09CAB",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  blockChoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  blockChoiceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(168, 120, 220, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  blockChoiceIconCircleMuted: {
    backgroundColor: "rgba(232, 176, 122, 0.12)",
  },
  blockChoiceHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  blockChoiceTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  blockChoiceDesc: {
    color: "#A09CAB",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  blockActionOrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
    width: "100%",
  },
  blockActionOrLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  blockActionOrText: {
    color: "#726E7C",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  reportForm: {
    paddingTop: 4,
    gap: 10,
    width: "100%",
    alignSelf: "stretch",
  },
  blockFlowBackButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    marginBottom: 6,
    paddingVertical: 4,
    paddingRight: 8,
    opacity: 0.92,
  },
  blockFlowBackText: {
    color: "#9E9AA8",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: -2,
  },
  reportLabel: {
    color: "#B8B3BF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  reportInput: {
    backgroundColor: "#201F2A",
    borderWidth: 1,
    borderColor: "#34303D",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 8,
    width: "100%",
  },
  checkInModalContent: {
    alignItems: "center",
    gap: 12,
  },
  resetConfirmModalContent: {
    display: "none",
  },

  // Blocker promo modal
  blockerPromoContent: {
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 12 : 4,
  },
  blockerPromoDismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  blockerPromoDismissText: {
    color: "#726E7C",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default Home;