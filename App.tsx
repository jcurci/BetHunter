import React, { useState, useEffect, useRef } from "react";
import { AppState, NativeModules, Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { AppLoadingScreen } from "./src/components/AppLoadingScreen";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initRevenueCat, identifyUser } from "./src/services/revenueCat";
import type { CustomerInfo } from "react-native-purchases";
import {
  useSubscriptionStore,
  setupCustomerInfoListener,
} from "./src/storage/subscriptionStore";
import { useAuthStore } from "./src/storage/authStore";
import { syncBlockerWithPremium } from "./src/services/blockerPremiumGate";
import Login from "./src/screens/Login/Login";
import {
  SignUpName,
  SignUpContact,
  SignUpPassword,
} from "./src/screens/SignUp";
import { PasswordResetMethod, PasswordResetEmail, PasswordResetVerification, PasswordResetNewPassword } from "./src/screens/PasswordReset";
import Home from "./src/screens/Home/Home";
import Config from "./src/screens/Config/Config";
import Profile from "./src/screens/Profile/Profile";
import ChangePassword from "./src/screens/Profile/ChangePassword";
import DetalhesPessoais from "./src/screens/Profile/DetalhesPessoais";
import Notifications from "./src/screens/Config/Notifications";
import Roulette from "./src/screens/Roulette/Roulette";
import MenuEducacional from "./src/screens/Educacional/MenuEducacional";
import Cursos from "./src/screens/Educacional/Cursos";
import CourseModules from "./src/screens/Educacional/CourseModules";
import MaterialReader from "./src/screens/Educacional/MaterialReader";
import Ranking from "./src/screens/Educacional/Ranking";
import QuizPage from "./src/screens/Quiz/QuizPage";
import Graficos from "./src/screens/Graficos/Graficos";
import QuizResult from "./src/screens/Quiz/QuizResult";
import AccountOverview from "./src/screens/Account/AccountOverview";
import AccountHistory from "./src/screens/Account/AccountHistory";
import TransactionForm from "./src/screens/Account/TransactionForm";
import EmConstrucao from "./src/screens/EmConstrucao/EmConstrucao";
import EmBreve from "./src/screens/EmConstrucao/EmConstrucao";
// import Acessor from "./src/screens/Acessor/Acessor"; // temporariamente substituído por EmBreve
import HistoryList from "./src/screens/Acessor/HistoryList";
import ModoOrcamento from "./src/screens/ModoOrcamento/ModoOrcamento";
import BudgetHistoryScreen from "./src/screens/ModoOrcamento/BudgetHistoryScreen";
import BudgetMonthDetailScreen from "./src/screens/ModoOrcamento/BudgetMonthDetailScreen";
import MinhaJornada from "./src/screens/MinhaJornada/MinhaJornada";
import CursosSalvos from "./src/screens/Educacional/CursosSalvos";
import Meditacao from "./src/screens/Meditacao/Meditacao";
import SOSMenu from "./src/screens/SOS/SOSMenu";
import ChoqueFisiologico from "./src/screens/SOS/ChoqueFisiologico";
import EmergencyContactScreen from "./src/screens/SOS/EmergencyContactScreen";
import MinhaConta from "./src/screens/MinhaConta/MinhaConta";
import SobreNos from "./src/screens/MinhaConta/SobreNos";
import SejaParceiro from "./src/screens/MinhaConta/SejaParceiro";
import CustomerCenter from "./src/screens/CustomerCenter/CustomerCenter";
import Paywall from "./src/screens/Paywall/Paywall";
import CouponScreen from "./src/screens/Paywall/CouponScreen";
import { RootStackParamList } from "./src/types/navigation";
import OnboardingFlow from "./src/screens/OnboardingFlow/OnboardingFlow";
import { isOnboardingFlowCompleted } from "./src/screens/OnboardingFlow/onboardingStorage";
import { Container } from "./src/infrastructure/di/Container";
import {
  configureNotifications,
  hasPermission,
  scheduleDailyCheckInReminder,
  scheduleReengagementReminder,
} from "./src/services/notifications";
import { waitForRCSync } from "./src/utils/waitForRCSync";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Evita bater no RevenueCat a cada alt-tab do usuário. */
const FOREGROUND_CHECK_THROTTLE_MS = 60_000;

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevIsPremiumRef = useRef<boolean | null>(null);
  const expirationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const init = async () => {
      const finishBoot = (route: keyof RootStackParamList) => {
        setInitialRoute(route);
        setIsReady(true);
      };

      try {
        // Só registra o listener depois do configure — Purchases.shared antes disso
        // causa fatalError nativo (mesmo padrão do crash da App Store Review).
        const rcReady = await initRevenueCat();
        if (rcReady) {
          removeListener = setupCustomerInfoListener();
        }

        // Carrega a sessão antes de decidir a rota — independente do estado do onboarding.
        // Assim, mesmo se o onboarding não estiver completo (ex: reinstalação), o RevenueCat
        // é identificado com o userId real e o assinante não é bloqueado no Paywall.
        await useAuthStore.getState().initialize();
        const { isAuthenticated: authed, user } = useAuthStore.getState();

        if (authed && user?.id) {
          if (rcReady) {
            let rcCustomerInfo: CustomerInfo | null = null;
            try {
              rcCustomerInfo = await identifyUser(user.id, { email: user.email, name: user.name });
            } catch (firstErr) {
              console.warn('[REVENUECAT] identifyUser failed, retrying in 2s...', firstErr);
              try {
                await new Promise<void>((r) => setTimeout(r, 2000));
                rcCustomerInfo = await identifyUser(user.id, { email: user.email, name: user.name });
              } catch (retryErr) {
                console.warn('[REVENUECAT] identifyUser retry also failed — failing open', retryErr);
                // Do NOT fall back to anonymous getCustomerInfo() — it has no purchases.
                // Mark isInitialized so the expiration guard doesn't fire; listener will correct when network returns.
                // rcSynced:false — este CustomerInfo é fabricado, não é evidência
                // de não-assinatura e não pode derrubar o bloqueador.
                useSubscriptionStore.getState().setFromCustomerInfo(
                  { entitlements: { active: {}, all: {} } } as any,
                  { rcSynced: false },
                );
              }
            }
            if (rcCustomerInfo) {
              useSubscriptionStore.getState().setFromCustomerInfo(rcCustomerInfo);
            }
          } else {
            // Idem: SDK não configurado não é prova de nada (ver rcSynced).
            useSubscriptionStore.getState().setFromCustomerInfo(
              { entitlements: { active: {}, all: {} } } as any,
              { rcSynced: false },
            );
          }

          try {
            await configureNotifications();
            const permissionGranted = await hasPermission();
            if (permissionGranted) {
              await scheduleDailyCheckInReminder();
              await scheduleReengagementReminder(user.name);
            }
          } catch (notificationsError) {
            console.warn("[NOTIFICATIONS] Falha ao configurar lembretes locais", notificationsError);
          }
        }

        if (!authed) {
          // A sessão do NOSSO backend expira em 30 dias e não tem refresh; quando
          // ela cai, o worker de enforcement fica inerte e a licença do bloqueador
          // vence sozinha — a proteção de quem está pagando ia embora em silêncio,
          // sem nada que a trouxesse de volta.
          //
          // O RevenueCat não depende dessa sessão: o SDK guarda o último
          // app_user_id, e `computeIsPremium` trata "sem usuário logado" como
          // suficiente quando há entitlement ativo. Então dá para renovar a licença
          // aqui mesmo, antes de mandar o usuário para o Login.
          if (rcReady) {
            try {
              await useSubscriptionStore.getState().refresh();
              syncBlockerWithPremium("boot-unauthed");
            } catch (blockerGateError) {
              console.warn("[BLOCKER GATE] falha ao renovar licença sem sessão", blockerGateError);
            }
          }
          finishBoot("Login");
          return;
        }

        // OR, não ??: o backend retorna onboarding_completed=false (valor real, não
        // ausente) pra qualquer usuário que nunca chamou completeOnboarding — inclusive
        // quem já tinha terminado o onboarding localmente antes desse campo existir.
        // Um "??" nunca cairia no fallback local nesse caso. Com OR, o dispositivo
        // também conta como fonte de verdade, e sincronizamos de volta pro backend
        // quando só o local sabia disso.
        let onboardingDone = !!user?.onboardingCompleted;
        if (!onboardingDone) {
          onboardingDone = await isOnboardingFlowCompleted();
          if (onboardingDone) {
            Container.getInstance().getCompleteOnboardingUseCase().execute()
              .then(() => useAuthStore.getState().setUser({ ...user!, onboardingCompleted: true }))
              .catch(() => {});
          }
        }
        if (!onboardingDone) {
          finishBoot("OnboardingFlow");
          return;
        }

        // Wait for the RC listener to deliver server-fresh entitlements before
        // deciding the route. logIn() returns cached (possibly empty) data; the
        // listener fires ~1-2 s later with the real subscription status.
        // The AppLoadingScreen stays visible during this window — no Paywall flash.
        if (rcReady) {
          await waitForRCSync(3000);
        }

        const { isPremium: premium } = useSubscriptionStore.getState();

        // Reconcilia o bloqueador com a assinatura JÁ no boot. O guard abaixo só
        // reage a transições dentro da sessão, então quem abre o app com a
        // assinatura vencida caía no paywall com a VPN ainda de pé.
        syncBlockerWithPremium("boot");

        finishBoot(premium ? "Home" : "CouponScreen");
      } catch (bootError) {
        console.error("[BOOT] Falha no init — abrindo Login", bootError);
        finishBoot("Login");
      } finally {
        setIsReady(true);
      }
    };
    init();

    return () => {
      removeListener?.();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const hideNav = () => {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    };
    hideNav();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") hideNav();
    });
    return () => sub.remove();
  }, []);

  // Reconcilia o bloqueador a cada volta ao foreground. Cobre a assinatura que
  // venceu (ou renovou) com o app em background por dias — o guard abaixo só
  // enxerga transições que acontecem com o app em primeiro plano.
  useEffect(() => {
    let lastCheck = 0;
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      if (!useAuthStore.getState().isAuthenticated) return;
      if (Date.now() - lastCheck < FOREGROUND_CHECK_THROTTLE_MS) return;
      lastCheck = Date.now();

      await useSubscriptionStore.getState().refresh();
      syncBlockerWithPremium("foreground");
    });
    return () => sub.remove();
  }, []);

  // Redirect to Paywall when subscription expires while using the app (debounced + double-checked)
  useEffect(() => {
    const { isInitialized } = useSubscriptionStore.getState();

    // Don't fire during boot — RC logIn() triggers multiple listener updates before settling
    if (!isInitialized) {
      prevIsPremiumRef.current = isPremium;
      return;
    }

    if (prevIsPremiumRef.current === null) {
      prevIsPremiumRef.current = isPremium;
      return;
    }

    if (__DEV__) console.log('[EXPIRATION GUARD] state change:', { prev: prevIsPremiumRef.current, current: isPremium, isAuthenticated });

    if (prevIsPremiumRef.current && !isPremium && isAuthenticated) {
      if (expirationTimerRef.current) clearTimeout(expirationTimerRef.current);

      // Wait 3s then double-check: RC fires false negatives during logIn() transitions
      expirationTimerRef.current = setTimeout(async () => {
        await useSubscriptionStore.getState().refresh();
        const { isPremium: confirmedPremium } = useSubscriptionStore.getState();
        const { isAuthenticated: stillAuthed } = useAuthStore.getState();

        if (!confirmedPremium && stillAuthed) {
          // O bloqueador tem critério próprio (mais tolerante que o do paywall)
          // e faz a própria reconfirmação antes de pausar — ver blockerPremiumGate.
          syncBlockerWithPremium("expiration-guard");
          navigationRef.current?.reset({ index: 0, routes: [{ name: 'CouponScreen' }] });
        }
      }, 3000);
    } else if (isPremium && expirationTimerRef.current) {
      // Premium restored before timer fired — cancel redirect
      clearTimeout(expirationTimerRef.current);
      expirationTimerRef.current = null;
    } else if (isPremium && prevIsPremiumRef.current === false && isAuthenticated) {
      // Assinatura voltou: retoma a proteção que ficou pausada, sem obrigar o
      // usuário a reconfigurar.
      syncBlockerWithPremium("premium-restored");
    }

    prevIsPremiumRef.current = isPremium;

    return () => {
      if (expirationTimerRef.current) clearTimeout(expirationTimerRef.current);
    };
  }, [isPremium, isAuthenticated]);

  if (!isReady) {
    return <AppLoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar hidden={true} translucent={true} />
        <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="OnboardingFlow"
          component={OnboardingFlow}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SignUpName"
          component={SignUpName}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SignUpContact"
          component={SignUpContact}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SignUpPassword"
          component={SignUpPassword}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PasswordResetMethod"
          component={PasswordResetMethod}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PasswordResetEmail"
          component={PasswordResetEmail}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PasswordResetVerification"
          component={PasswordResetVerification}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PasswordResetNewPassword"
          component={PasswordResetNewPassword}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Config"
          component={Config}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DetalhesPessoais"
          component={DetalhesPessoais}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={Notifications}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Roulette"
          component={Roulette}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MenuEducacional"
          component={MenuEducacional}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Cursos"
          component={Cursos}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CourseModules"
          component={CourseModules}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Ranking"
          component={Ranking}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MaterialReader"
          component={MaterialReader}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizPage}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="QuizResult"
          component={QuizResult}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Graficos"
          component={Graficos}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AccountOverview"
          component={AccountOverview}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AccountHistory"
          component={AccountHistory}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TransactionForm"
          component={TransactionForm}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EmConstrucao"
          component={EmConstrucao}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Acessor"
          options={{ headerShown: false }}
        >
          {({ navigation: nav }) => (
            <EmBreve
              title="Em Breve!"
              subtitle="Essa funcionalidade estará disponível em breve."
              onBack={() => nav.navigate("Home")}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="ModoOrcamento"
          component={ModoOrcamento}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BudgetHistory"
          component={BudgetHistoryScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BudgetMonthDetail"
          component={BudgetMonthDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HistoryList"
          component={HistoryList}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MinhaJornada"
          component={MinhaJornada}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CursosSalvos"
          component={CursosSalvos}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Meditacao"
          component={Meditacao}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SOSMenu"
          component={SOSMenu}
          options={{
            headerShown: false,
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="ChoqueFisiologico"
          component={ChoqueFisiologico}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EmergencyContact"
          component={EmergencyContactScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MinhaConta"
          component={MinhaConta}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SobreNos"
          component={SobreNos}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SejaParceiro"
          component={SejaParceiro}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CustomerCenter"
          component={CustomerCenter}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CouponScreen"
          component={CouponScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Paywall"
          component={Paywall}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;


