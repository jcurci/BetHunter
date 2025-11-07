import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./src/screens/Login/Login";
import SiginUp from "./src/screens/Login/SignUp";
import SignUpPassword from "./src/screens/Login/SignUpPassword";
import Home from "./src/screens/Home/Home";
import Config from "./src/screens/Config/Config";
import Profile from "./src/screens/Profile/Profile";
import ChangePassword from "./src/screens/Profile/ChangePassword";
import Notifications from "./src/screens/Config/Notifications";
import Roulette from "./src/screens/Roulette/Roulette";
import MenuEducacional from "./src/screens/Educacional/MenuEducacional";
import Cursos from "./src/screens/Educacional/Cursos";
import Ranking from "./src/screens/Educacional/Ranking";
import QuizPage from "./src/screens/Quiz/QuizPage";
import Graficos from "./src/screens/Graficos/Graficos";
import QuizResult from "./src/screens/Quiz/QuizResult";
import AccountOverview from "./src/screens/Account/AccountOverview";
import AccountHistory from "./src/screens/Account/AccountHistory";
import TransactionForm from "./src/screens/Account/TransactionForm";
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
          name="Ranking"
          component={Ranking}
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


