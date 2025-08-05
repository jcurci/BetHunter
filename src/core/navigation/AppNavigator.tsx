import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../shared/hooks';

// Auth Screens
import { Login, SiginUp } from '../../features/auth';

// Main Screens
import { Home } from '../../features/home';
import { Roulette } from '../../features/game';
import { Aprender } from '../../features/learn';
import { Graficos } from '../../features/charts';

// Config Screens
import { Config, Profile, ChangePassword, Notifications } from '../../features/config';

// Components
import { Footer } from '../../shared/components';

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
