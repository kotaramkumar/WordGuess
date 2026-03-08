import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import {
  subscribeToSession, subscribeToPlayers,
  submitGuess, leaveSession,
  updatePlayerActivity, checkAndKickInactivePlayers,
} from '../services/gameService';
import { isValidWord, checkDictionaryWord } from '../utils/words';
import { buildLetterMap } from '../utils/gameLogic';
import WordGrid from '../components/WordGrid';
import MiniGrid from '../components/MiniGrid';
import Keyboard from '../components/Keyboard';


export default function GameScreen({ navigation, route }) {
  const { sessionId } = route.params;
  const { playerId } = useGame();

  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState({});
  const [currentGuess, setCurrentGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [showRoundEnd, setShowRoundEnd] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const messageTimer = useRef(null);
  const unsubs = useRef([]);
  const playerIdsRef = useRef([]);
  const wasInGame = useRef(false);

  // Flash a temporary message
  const showMessage = useCallback((msg, duration = 2000) => {
    setMessage(msg);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), duration);
  }, []);

  // Shake animation for invalid guess
  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  useEffect(() => {
    const u1 = subscribeToSession(sessionId, (sess) => {
      if (!sess) return;
      setSession(sess);
      if (sess.playerIds) playerIdsRef.current = sess.playerIds;
      if (sess.status === 'gameOver') {
        unsubs.current.forEach(u => u());
        navigation.replace('GameOver', { sessionId, winner: sess.winner });
      }
    });

    const u2 = subscribeToPlayers(sessionId, (p) => {
      setPlayers(p);
    });

    unsubs.current = [u1, u2];
    return () => {
      unsubs.current.forEach(u => u());
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, [sessionId]);

  // Activity ping every 60s + host kicks idle players
  useEffect(() => {
    if (!playerId) return;
    const pingInterval = setInterval(() => {
      updatePlayerActivity(sessionId, playerId);
    }, 60 * 1000);
    return () => clearInterval(pingInterval);
  }, [sessionId, playerId]);

  useEffect(() => {
    if (!session || session.hostId !== playerId) return;
    const kickInterval = setInterval(() => {
      checkAndKickInactivePlayers(sessionId, playerIdsRef.current, playerId);
    }, 60 * 1000);
    return () => clearInterval(kickInterval);
  }, [session?.hostId, playerId, sessionId]);

  // Detect being kicked: myPlayer disappears while game is still active
  const myPlayer = players[playerId];
  useEffect(() => {
    if (myPlayer) { wasInGame.current = true; return; }
    if (wasInGame.current && session && session.status !== 'gameOver') {
      Alert.alert('Removed', 'You were removed due to inactivity.', [
        { text: 'OK', onPress: () => navigation.replace('Home') },
      ]);
    }
  }, [myPlayer, session?.status]);

  // Detect round end (all players submitted)
  const currentRound = session?.currentRound ?? 0;

  const allSubmitted = session && Object.keys(players).length > 0 &&
    Object.values(players).every(p => p.guesses.length > currentRound - 1);

  // Show round-end overlay briefly when round advances
  const prevRound = useRef(currentRound);
  useEffect(() => {
    if (currentRound > prevRound.current && prevRound.current >= 0) {
      setShowRoundEnd(true);
      const t = setTimeout(() => setShowRoundEnd(false), 2000);
      prevRound.current = currentRound;
      return () => clearTimeout(t);
    }
    prevRound.current = currentRound;
  }, [currentRound]);

  const handleKey = useCallback((letter) => {
    if (submitting || validating || myPlayer?.hasWon) return;
    if (myPlayer && myPlayer.guesses.length > currentRound) return; // already submitted this round
    setCurrentGuess(prev => prev.length < (session?.wordLength || 6) ? prev + letter : prev);
  }, [submitting, myPlayer, currentRound]);

  const handleDelete = useCallback(() => {
    if (validating || submitting) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [validating, submitting]);

  const handleSubmit = useCallback(async () => {
    if (submitting || validating || !session) return;
    if (myPlayer?.guesses.length > currentRound) {
      showMessage('Already submitted! Waiting for others…');
      return;
    }
    if (myPlayer?.hasWon) {
      showMessage('You already won! 🎉');
      return;
    }

    const wordLen = session?.wordLength || 6;

    // 1. Length check — instant
    if (currentGuess.length < wordLen) {
      showMessage('Not enough letters');
      triggerShake();
      return;
    }

    // 2. Letters-only check — instant
    if (!isValidWord(currentGuess, wordLen)) {
      showMessage('Not a WORD');
      triggerShake();
      return;
    }

    // 3. Dictionary check — async, show feedback while waiting
    setValidating(true);
    showMessage('Checking word…');
    const dictResult = await checkDictionaryWord(currentGuess);
    setValidating(false);

    if (dictResult === 'invalid') {
      showMessage('Not a WORD');
      triggerShake();
      return;
    }

    // dictResult === 'valid' or 'unknown' (offline) → allow

    // 4. Submit to Firebase
    setSubmitting(true);
    try {
      const { result, hasWon } = await submitGuess(sessionId, playerId, currentGuess);
      setCurrentGuess('');
      if (hasWon) {
        showMessage('🎉 You got it!', 3000);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  }, [currentGuess, submitting, validating, session, myPlayer, currentRound, sessionId, playerId, showMessage, triggerShake]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            unsubs.current.forEach(u => u());
            await leaveSession(
              sessionId, playerId,
              session?.hostId === playerId,
              session?.playerIds || [],
            );
            navigation.replace('Home');
          },
        },
      ],
    );
  }, [sessionId, playerId, session, navigation]);

  if (!session || !myPlayer) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading game…</Text>
      </View>
    );
  }

  const wordLength = session?.wordLength || 6;
  const letterMap = buildLetterMap(myPlayer.results || []);
  const otherPlayers = Object.entries(players).filter(([pid]) => pid !== playerId);
  const hasSubmittedThisRound = myPlayer.guesses.length > currentRound;
  const totalPlayers = Object.keys(players).length;
  const submittedCount = Object.values(players).filter(p => p.guesses.length > currentRound).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.leftGroup}>
          <View style={styles.codeChip}>
            <Text style={styles.codeLabel}>{session.code}</Text>
          </View>
          <TouchableOpacity style={styles.quitBtn} onPress={handleCancel}>
            <Text style={styles.quitBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.roundText}>
          {wordLength}L · Round {Math.min(currentRound + 1, wordLength + 1)}/{wordLength + 1}
        </Text>
        <View style={styles.submitStatus}>
          <Text style={styles.submitStatusText}>{submittedCount}/{totalPlayers}</Text>
          <Text style={styles.submitLabel}>submitted</Text>
        </View>
      </View>

      {/* Message banner */}
      {message !== '' && (
        <View style={styles.messageBanner}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      {/* Round end overlay */}
      {showRoundEnd && (
        <View style={styles.roundEndOverlay}>
          <Text style={styles.roundEndText}>
            Round {currentRound}/{wordLength + 1} complete!
          </Text>
          <Text style={styles.roundEndSub}>Next round starting…</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Other players mini grids */}
        {otherPlayers.length > 0 && (
          <View style={styles.othersSection}>
            <Text style={styles.othersLabel}>OTHER PLAYERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {otherPlayers.map(([pid, player]) => (
                <MiniGrid key={pid} player={player} wordLength={wordLength} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* My grid */}
        <View style={styles.myGridSection}>
          {hasSubmittedThisRound && !myPlayer.hasWon && (
            <View style={styles.waitingBanner}>
              <Text style={styles.waitingText}>
                ⏳ Waiting for {totalPlayers - submittedCount} more player{totalPlayers - submittedCount !== 1 ? 's' : ''}…
              </Text>
            </View>
          )}
          {myPlayer.hasWon && (
            <View style={[styles.waitingBanner, { backgroundColor: '#538d4e' }]}>
              <Text style={styles.waitingText}>🎉 You guessed it! Watching others…</Text>
            </View>
          )}

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <WordGrid
              guesses={myPlayer.guesses}
              results={myPlayer.results}
              currentGuess={currentGuess}
              currentRound={currentRound}
              wordLength={wordLength}
            />
          </Animated.View>
        </View>
      </ScrollView>

      {/* Keyboard */}
      {!myPlayer.hasWon && (
        <View style={styles.keyboardSection}>
          <Keyboard
            onKey={handleKey}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            letterMap={letterMap}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121213' },
  loading: { flex: 1, backgroundColor: '#121213', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#818384', fontSize: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quitBtn: {
    backgroundColor: '#3a3a3c',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quitBtnText: { color: '#818384', fontSize: 13, fontWeight: '700' },
  codeChip: {
    backgroundColor: '#1a1a1b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  codeLabel: { color: '#818384', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  roundText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  submitStatus: { alignItems: 'center' },
  submitStatusText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  submitLabel: { color: '#818384', fontSize: 10 },
  messageBanner: {
    backgroundColor: '#1a1a1b',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  messageText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  roundEndOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  roundEndText: { color: '#b59f3b', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  roundEndSub: { color: '#818384', fontSize: 16, marginTop: 8 },
  scroll: { flexGrow: 1, padding: 16, gap: 16 },
  othersSection: { marginBottom: 8 },
  othersLabel: { color: '#818384', fontSize: 11, fontWeight: '600', letterSpacing: 2, marginBottom: 10 },
  myGridSection: { alignItems: 'center', gap: 10 },
  waitingBanner: {
    backgroundColor: '#1a1a1b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  waitingText: { color: '#ffffff', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  keyboardSection: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3c',
  },
});
