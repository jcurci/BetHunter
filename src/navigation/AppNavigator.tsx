import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../shared/contexts/AuthContext';

// Auth Screens
import Login from '../presentation/screens/Login-screens/Login';
import SiginUp from '../presentation/screens/Login-screens/SiginUp';

// Main Screens
import Home from '../presentation/screens/Home';
import Roulette from '../presentation/screens/Roulette';
import Aprender from '../presentation/screens/Aprender';
import Graficos from '../presentation/screens/Graficos';
import QuizScreen from '../features/learn/QuizScreen';

// Config Screens
import Config from '../presentation/screens/Config';
import Profile from '../presentation/screens/Profile-configs/Profile';
import ChangePassword from '../presentation/screens/Profile-configs/ChangePassword';
import Notifications from '../presentation/screens/Notifications';

// Components
import Footer from '../presentation/components/Footer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator para as telas principais
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <Footer {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Home}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Aprender" 
        component={Aprender}
        options={{
          tabBarLabel: 'Aprender',
        }}
      />
      <Tab.Screen 
        name="Gráficos" 
        component={Graficos}
        options={{
          tabBarLabel: 'Gráficos',
        }}
      />
      <Tab.Screen 
        name="Jogar" 
        component={Roulette}
        options={{
          tabBarLabel: 'Jogar',
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator para autenticação
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SiginUp" component={SiginUp} />
    </Stack.Navigator>
  );
};

// Stack Navigator principal
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="QuizScreen" component={QuizScreen} />
      <Stack.Screen name="Config" component={Config} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
      <Stack.Screen name="Notifications" component={Notifications} />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
