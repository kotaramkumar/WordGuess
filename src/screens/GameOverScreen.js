import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { subscribeToSession, subscribeToPlayers } from '../services/gameService';

export default function GameOverScreen({ navigation, route }) {
  const { sessionId, winner } = route.params;
  const { playerId } = useGame();

  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState({});

  useEffect(() => {
    const u1 = subscribeToSession(sessionId, setSession);
    const u2 = subscribeToPlayers(sessionId, setPlayers);
    return () => { u1(); u2(); };
  }, [sessionId]);

  const sortedPlayers = Object.entries(players)
    .sort(([, a], [, b]) => {
      if (a.hasWon && !b.hasWon) return -1;
      if (!a.hasWon && b.hasWon) return 1;
      return b.score - a.score;
    });

  const currentWord = session?.currentWord || '';
  const isWinner = winner?.id === playerId;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Result header */}
        <View style={styles.resultHeader}>
          {winner ? (
            <>
              <Text style={styles.emoji}>{isWinner ? '🏆' : '🎉'}</Text>
              <Text style={styles.winTitle}>
                {isWinner ? 'You won!' : `${winner.name} wins!`}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emoji}>😅</Text>
              <Text style={styles.winTitle}>Nobody got it!</Text>
            </>
          )}
          {currentWord !== '' && (
            <View style={styles.wordReveal}>
              <Text style={styles.wordRevealLabel}>The word was</Text>
              <Text style={styles.wordRevealWord}>{currentWord}</Text>
            </View>
          )}
        </View>

        {/* Leaderboard */}
        <Text style={styles.sectionLabel}>LEADERBOARD</Text>
        {sortedPlayers.map(([pid, player], index) => (
          <View
            key={pid}
            style={[
              styles.playerRow,
              index === 0 && player.hasWon && styles.playerRowFirst,
              pid === playerId && styles.playerRowMe,
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>
                {index === 0 && player.hasWon ? '🥇' : `#${index + 1}`}
              </Text>
            </View>
            <View style={[styles.colorDot, { backgroundColor: player.color }]} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {player.name}{pid === playerId ? ' (you)' : ''}
              </Text>
              <Text style={styles.playerGuesses}>
                {player.hasWon
                  ? `Guessed in ${player.guesses.length} attempt${player.guesses.length !== 1 ? 's' : ''}`
                  : `Did not guess — ${player.guesses.length} attempt${player.guesses.length !== 1 ? 's' : ''}`
                }
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{player.score}</Text>
              <Text style={styles.scoreLabel}>pts</Text>
            </View>
          </View>
        ))}

        {/* Play again */}
        <TouchableOpacity
          style={styles.playAgainBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121213' },
  container: { padding: 24, paddingBottom: 40 },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
    marginBottom: 24,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  winTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  wordReveal: { alignItems: 'center', marginTop: 16 },
  wordRevealLabel: { color: '#818384', fontSize: 13 },
  wordRevealWord: {
    color: '#538d4e',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 8,
    marginTop: 4,
  },
  sectionLabel: {
    color: '#818384', fontSize: 11, fontWeight: '600',
    letterSpacing: 2, marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  playerRowFirst: { borderColor: '#b59f3b' },
  playerRowMe: { borderColor: '#538d4e' },
  rankBadge: { width: 36, alignItems: 'center' },
  rankText: { color: '#818384', fontWeight: '700', fontSize: 14 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  playerInfo: { flex: 1 },
  playerName: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  playerGuesses: { color: '#818384', fontSize: 12, marginTop: 2 },
  scoreBox: { alignItems: 'center', minWidth: 48 },
  scoreText: { color: '#b59f3b', fontWeight: '800', fontSize: 20 },
  scoreLabel: { color: '#818384', fontSize: 10 },
  playAgainBtn: {
    backgroundColor: '#538d4e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  playAgainText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
});
