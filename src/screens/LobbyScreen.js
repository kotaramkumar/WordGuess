import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { subscribeToSession, subscribeToPlayers, startGame, leaveSession } from '../services/gameService';
import SessionCode from '../components/SessionCode';
import PlayerCard from '../components/PlayerCard';

export default function LobbyScreen({ navigation, route }) {
  const { sessionId, code, isHost: initialIsHost } = route.params;
  const { playerId } = useGame();

  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState({});
  const [starting, setStarting] = useState(false);

  const unsubs = useRef([]);

  useEffect(() => {
    const u1 = subscribeToSession(sessionId, (sess) => {
      if (!sess) {
        Alert.alert('Session ended', 'The host left the game.');
        navigation.navigate('Home');
        return;
      }
      setSession(sess);
      if (sess.status === 'playing') {
        navigation.replace('Game', { sessionId });
      }
    });

    const u2 = subscribeToPlayers(sessionId, setPlayers);
    unsubs.current = [u1, u2];

    return () => unsubs.current.forEach(u => u());
  }, [sessionId]);

  const handleStart = async () => {
    if (Object.keys(players).length < 1) {
      Alert.alert('Need at least 1 player to start!');
      return;
    }
    setStarting(true);
    try {
      await startGame(sessionId);
    } catch (e) {
      Alert.alert('Error', e.message);
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert('Leave session?', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          unsubs.current.forEach(u => u());
          await leaveSession(sessionId, playerId, session?.hostId === playerId, session?.playerIds || []);
          navigation.navigate('Home');
        },
      },
    ]);
  };

  const isHost = session?.hostId === playerId;
  const playerList = Object.entries(players).sort((a, b) => {
    if (a[0] === session?.hostId) return -1;
    if (b[0] === session?.hostId) return 1;
    return 0;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleLeave} style={styles.leaveBtn}>
            <Text style={styles.leaveText}>✕ Leave</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Game Lobby</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Session code */}
          <SessionCode code={code} />

          {/* Info */}
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>
              {isHost ? '👑 You are the host' : '⏳ Waiting for host to start…'}
            </Text>
            <Text style={styles.infoText}>
              {Object.keys(players).length} / 16 players
            </Text>
          </View>

          {/* Rules reminder */}
          <View style={styles.rules}>
            <Text style={styles.rulesTitle}>How to play</Text>
            <Text style={styles.rulesText}>
              • Guess the secret 6-letter word{'\n'}
              • You have 6 attempts{'\n'}
              • 🟩 = correct spot  🟨 = wrong spot  ⬛ = not in word{'\n'}
              • Round advances when everyone submits{'\n'}
              • Score based on how quickly you guess
            </Text>
          </View>

          {/* Player list */}
          <Text style={styles.sectionLabel}>PLAYERS</Text>
          {playerList.map(([pid, player]) => (
            <PlayerCard
              key={pid}
              player={player}
              playerId={pid}
              isCurrentPlayer={pid === playerId}
            />
          ))}
        </ScrollView>

        {/* Start button (host only) */}
        {isHost && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.startBtn, starting && styles.startBtnDisabled]}
              onPress={handleStart}
              disabled={starting}
              activeOpacity={0.8}
            >
              {starting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.startBtnText}>Start Game →</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121213' },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
  },
  leaveBtn: { padding: 6 },
  leaveText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' },
  heading: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 24 },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoText: { color: '#818384', fontSize: 13 },
  rules: {
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  rulesTitle: { color: '#b59f3b', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  rulesText: { color: '#818384', fontSize: 13, lineHeight: 20 },
  sectionLabel: {
    color: '#818384', fontSize: 11, fontWeight: '600',
    letterSpacing: 2, marginBottom: 10,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3c',
  },
  startBtn: {
    backgroundColor: '#538d4e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
});
