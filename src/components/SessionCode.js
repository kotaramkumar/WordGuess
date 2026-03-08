import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export default function SessionCode({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my WordGuess game! Code: ${code}`,
        title: 'WordGuess Session',
      });
    } catch (_) {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SESSION CODE</Text>
      <View style={styles.codeRow}>
        <Text style={styles.code}>{code}</Text>
        <TouchableOpacity style={styles.btn} onPress={handleCopy} activeOpacity={0.7}>
          <Text style={styles.btnText}>{copied ? '✓ Copied' : 'Copy'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.shareBtn]} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.btnText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1a1a1b',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  label: {
    color: '#818384',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  code: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btn: {
    backgroundColor: '#538d4e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareBtn: {
    backgroundColor: '#45B7D1',
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
