import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlayerCard({ player, playerId, isCurrentPlayer }) {
  const { name, color, hasWon, guesses = [] } = player;
  const initial = name ? name[0].toUpperCase() : '?';

  return (
    <View style={[styles.card, isCurrentPlayer && styles.cardHighlight]}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}{isCurrentPlayer ? ' (you)' : ''}
        </Text>
        <Text style={styles.status}>
          {hasWon ? '✅ Guessed!' : `${guesses.length}/6 guesses`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  cardHighlight: {
    borderColor: '#538d4e',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  status: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
});
