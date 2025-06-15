import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Importação das telas (serão criadas em seguida)
import HomeScreen from '../screens/HomeScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import NewEventScreen from '../screens/NewEventScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'NewEvent') {
            iconName = 'add-circle';
          } else if (route.name === 'Recommendations') {
            iconName = 'info';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Eventos' }}
      />
      <Tab.Screen 
        name="NewEvent" 
        component={NewEventScreen} 
        options={{ title: 'Novo Evento' }}
      />
      <Tab.Screen 
        name="Recommendations" 
        component={RecommendationsScreen} 
        options={{ title: 'Recomendações' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EventDetails" 
          component={EventDetailsScreen} 
          options={{ title: 'Detalhes do Evento' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 