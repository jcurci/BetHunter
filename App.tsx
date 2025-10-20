import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./src/components/pages/Login-screens/Login";
import SiginUp from "./src/components/pages/Login-screens/SiginUp";
import SignUpPassword from "./src/components/pages/Login-screens/SignUpPassword";
import Home from "./src/components/pages/Home";
import Config from "./src/components/pages/Config";
import Profile from "./src/components/pages/Profile-configs/Profile";
import ChangePassword from "./src/components/pages/Profile-configs/ChangePassword";
import Notifications from "./src/components/pages/Notifications";
import Roulette from "./src/components/pages/Roulette";
import Aprender from "./src/components/pages/Aprender";
import QuizPage from "./src/components/pages/QuizPage";
import Graficos from "./src/components/pages/Graficos";
import QuizResult from "./src/components/pages/QuizResult";
import AccountOverview from "./src/components/pages/AccountOverview";
import AccountHistory from "./src/components/pages/AccountHistory";
import TransactionForm from "./src/components/pages/TransactionForm";
import { RootStackParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SiginUp"
          component={SiginUp}
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
          name="Aprender"
          component={Aprender}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;


