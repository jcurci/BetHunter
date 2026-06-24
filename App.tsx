import React, { useState, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
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
import MinhaConta from "./src/screens/MinhaConta/MinhaConta";
import SobreNos from "./src/screens/MinhaConta/SobreNos";
import SejaParceiro from "./src/screens/MinhaConta/SejaParceiro";
import CustomerCenter from "./src/screens/CustomerCenter/CustomerCenter";
import Paywall from "./src/screens/Paywall/Paywall";
import CouponScreen from "./src/screens/Paywall/CouponScreen";
import { RootStackParamList } from "./src/types/navigation";
import OnboardingFlow from "./src/screens/OnboardingFlow/OnboardingFlow";
import { isOnboardingFlowCompleted } from "./src/screens/OnboardingFlow/onboardingStorage";
import {
  configureNotifications,
  hasPermission,
  scheduleDailyCheckInReminder,
  scheduleReengagementReminder,
} from "./src/services/notifications";
import { waitForRCSync } from "./src/utils/waitForRCSync";

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevIsPremiumRef = useRef<boolean | null>(null);
  const expirationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      const finishBoot = (route: keyof RootStackParamList) => {
        setInitialRoute(route);
        setIsReady(true);
      };

      await initRevenueCat();

      // Carrega a sessão antes de decidir a rota — independente do estado do onboarding.
      // Assim, mesmo se o onboarding não estiver completo (ex: reinstalação), o RevenueCat
      // é identificado com o userId real e o assinante não é bloqueado no Paywall.
      await useAuthStore.getState().initialize();
      const { isAuthenticated: authed, user } = useAuthStore.getState();

      if (authed && user?.id) {
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
            useSubscriptionStore.getState().setFromCustomerInfo({
              entitlements: { active: {}, all: {} },
            } as any);
          }
        }
        if (rcCustomerInfo) {
          useSubscriptionStore.getState().setFromCustomerInfo(rcCustomerInfo);
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
        finishBoot("Login");
        return;
      }

      const onboardingDone = await isOnboardingFlowCompleted();
      if (!onboardingDone) {
        finishBoot("OnboardingFlow");
        return;
      }

      // Wait for the RC listener to deliver server-fresh entitlements before
      // deciding the route. logIn() returns cached (possibly empty) data; the
      // listener fires ~1-2 s later with the real subscription status.
      // The AppLoadingScreen stays visible during this window — no Paywall flash.
      await waitForRCSync(3000);

      const { isPremium: premium } = useSubscriptionStore.getState();
      finishBoot(premium ? "Home" : "CouponScreen");
    };
    init();
  }, []);

  useEffect(() => {
    const removeListener = setupCustomerInfoListener();
    return removeListener;
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
          navigationRef.current?.reset({ index: 0, routes: [{ name: 'CouponScreen' }] });
        }
      }, 3000);
    } else if (isPremium && expirationTimerRef.current) {
      // Premium restored before timer fired — cancel redirect
      clearTimeout(expirationTimerRef.current);
      expirationTimerRef.current = null;
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


