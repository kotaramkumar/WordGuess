import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

const STATUS_COLORS = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent: '#3a3a3c',
};

export default function Keyboard({ onKey, onDelete, onSubmit, letterMap = {} }) {
  const handlePress = (key) => {
    if (key === '⌫') onDelete();
    else if (key === 'ENTER') onSubmit();
    else onKey(key);
  };

  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(key => {
            const status = letterMap[key];
            const bg = status ? STATUS_COLORS[status] : '#818384';
            const isWide = key === 'ENTER' || key === '⌫';
            return (
              <TouchableOpacity
                key={key}
                style={[styles.key, isWide && styles.wideKey, { backgroundColor: bg }]}
                onPress={() => handlePress(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.keyText, isWide && styles.wideKeyText]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  key: {
    minWidth: 30,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  wideKey: {
    minWidth: 54,
  },
  keyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  wideKeyText: {
    fontSize: 11,
  },
});
