import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent: '#3a3a3c',
  empty: '#1a1a1b',
  border: '#3a3a3c',
};

export default function MiniGrid({ player, playerColor, wordLength = 6 }) {
  const TILE_SIZE = wordLength <= 6 ? 18 : wordLength === 7 ? 15 : 13;
  const { name, guesses = [], results = [], hasWon, color } = player;
  const displayColor = playerColor || color;

  return (
    <View style={[styles.container, { width: TILE_SIZE * wordLength + (wordLength - 1) * 2 + 12 }]}>
      {/* Player name badge */}
      <View style={[styles.badge, { backgroundColor: displayColor }]}>
        <Text style={styles.badgeName} numberOfLines={1}>{name}</Text>
        {hasWon && <Text style={styles.crown}> 👑</Text>}
      </View>

      {/* Mini grid */}
      <View style={styles.grid}>
        {Array(wordLength + 1).fill(null).map((_, rowIdx) => {
          const isSubmitted = rowIdx < guesses.length;
          return (
            <View key={rowIdx} style={styles.row}>
              {Array(wordLength).fill(null).map((__, colIdx) => {
                const result = isSubmitted && results[rowIdx]
                  ? results[rowIdx][colIdx]
                  : null;
                const bgColor = result ? COLORS[result.status] : COLORS.empty;
                return (
                  <View
                    key={colIdx}
                    style={[styles.tile, { width: TILE_SIZE, height: TILE_SIZE, backgroundColor: bgColor, borderColor: COLORS.border }]}
                  />
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  crown: {
    fontSize: 10,
  },
  grid: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  tile: {
    borderWidth: 1,
    borderRadius: 2,
  },
});
