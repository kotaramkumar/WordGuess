import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext(null);

function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substring(2, 11);
}

export function GameProvider({ children }) {
  const [playerId, setPlayerId]           = useState(null);
  const [playerName, setPlayerNameState]  = useState('');
  const [isReturningUser, setIsReturning] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    (async () => {
      // Player identity
      let id = await AsyncStorage.getItem('wg_player_id');
      if (!id) {
        id = generatePlayerId();
        await AsyncStorage.setItem('wg_player_id', id);
      }
      setPlayerId(id);

      // Saved name
      const name = await AsyncStorage.getItem('wg_player_name');
      if (name) setPlayerNameState(name);

      // Returning user flag
      const returning = await AsyncStorage.getItem('wg_returning');
      if (returning === 'true') setIsReturning(true);
    })();
  }, []);

  const saveName = async (name) => {
    setPlayerNameState(name);
    await AsyncStorage.setItem('wg_player_name', name);
  };

  // Called when user completes the AuthScreen (first-time or returning)
  const markReturningUser = async () => {
    setIsReturning(true);
    await AsyncStorage.setItem('wg_returning', 'true');
  };

  return (
    <GameContext.Provider value={{
      playerId,
      playerName,
      setPlayerName: saveName,
      isReturningUser,
      markReturningUser,
      activeSessionId,
      setActiveSessionId,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
