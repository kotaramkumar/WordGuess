import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthScreen     from '../screens/AuthScreen';
import HomeScreen     from '../screens/HomeScreen';
import LobbyScreen    from '../screens/LobbyScreen';
import GameScreen     from '../screens/GameScreen';
import GameOverScreen from '../screens/GameOverScreen';
import { useGame } from '../context/GameContext';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#121213' },
  animation: 'slide_from_right',
};

export default function AppNavigator() {
  const { isReturningUser, playerId } = useGame();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait until playerId is loaded from AsyncStorage
    if (playerId !== null) setReady(true);
  }, [playerId]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121213', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#538d4e" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!isReturningUser ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Home"     component={HomeScreen} />
            <Stack.Screen name="Lobby"    component={LobbyScreen} />
            <Stack.Screen name="Game"     component={GameScreen} />
            <Stack.Screen name="GameOver" component={GameOverScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
