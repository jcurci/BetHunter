import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./src/presentation/screens/Login-screens/Login";
import SiginUp from "./src/presentation/screens/Login-screens/SiginUp";
import Home from "./src/presentation/screens/Home";
import Config from "./src/presentation/screens/Config";
import Profile from "./src/presentation/screens/Profile-configs/Profile";
import ChangePassword from "./src/presentation/screens/Profile-configs/ChangePassword";
import Notifications from "./src/presentation/screens/Notifications";
import Roulette from "./src/presentation/screens/Roulette";
import Aprender from "./src/presentation/screens/Aprender";
import Graficos from "./src/presentation/screens/Graficos";
import AccountOverview from "./src/presentation/screens/AccountOverview";
import AccountHistory from "./src/presentation/screens/AccountHistory";
import TransactionForm from "./src/presentation/screens/TransactionForm";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SiginUp"
          component={SiginUp}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Config"
          component={Config}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Notifications"
          component={Notifications}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Roulette"
          component={Roulette}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Aprender"
          component={Aprender}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Graficos"
          component={Graficos}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AccountOverview"
          component={AccountOverview}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AccountHistory"
          component={AccountHistory}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TransactionForm"
          component={TransactionForm}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
