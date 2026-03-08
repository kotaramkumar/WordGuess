import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const COLORS = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent: '#3a3a3c',
  empty: 'transparent',
  border: '#3a3a3c',
  activeBorder: '#565758',
  text: '#ffffff',
};

function Tile({ letter, status, animate, size = 52, fontSize = 22 }) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate && status) {
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [animate, status]);

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  const bgColor = status
    ? COLORS[status]
    : letter
    ? 'transparent'
    : 'transparent';

  const borderColor = status
    ? 'transparent'
    : letter
    ? COLORS.activeBorder
    : COLORS.border;

  return (
    <Animated.View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: bgColor, borderColor, transform: [{ rotateY }] },
      ]}
    >
      <Text style={[styles.tileLetter, { fontSize }]}>{letter || ''}</Text>
    </Animated.View>
  );
}

export default function WordGrid({
  guesses,        // string[] — submitted guesses
  results,        // {letter,status}[][] — per-guess results
  currentGuess,   // string — what the player is currently typing
  currentRound,   // number — which row is active
  wordLength = 6, // number of letters per word
}) {
  const rows = Array(wordLength + 1).fill(null);

  // Scale tile size down for longer words so they fit on screen
  const tileSize = wordLength <= 5 ? 56 : wordLength === 6 ? 52 : wordLength === 7 ? 44 : 38;
  const fontSize = wordLength <= 6 ? 22 : wordLength === 7 ? 18 : 15;

  return (
    <View style={styles.grid}>
      {rows.map((_, rowIndex) => {
        const isSubmitted = rowIndex < guesses.length;
        const isActive = rowIndex === currentRound;
        const rowWord = isSubmitted
          ? guesses[rowIndex]
          : isActive
          ? currentGuess
          : '';

        return (
          <View key={rowIndex} style={styles.row}>
            {Array(wordLength).fill(null).map((__, colIndex) => {
              const letter = rowWord ? rowWord[colIndex] || '' : '';
              const result = isSubmitted && results[rowIndex]
                ? results[rowIndex][colIndex]
                : null;
              return (
                <Tile
                  key={colIndex}
                  letter={letter}
                  status={result ? result.status : null}
                  animate={isSubmitted}
                  size={tileSize}
                  fontSize={fontSize}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignItems: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  tile: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLetter: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
