import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { GameProvider } from './src/context/GameContext';
import AppNavigator from './src/navigation/index';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'ios') {
      requestTrackingPermissionsAsync();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </GameProvider>
    </SafeAreaProvider>
  );
}
