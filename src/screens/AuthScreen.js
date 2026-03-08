import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';

export default function AuthScreen() {
  const { markReturningUser } = useGame();

  const handleSocial = (provider) => {
    Alert.alert(
      `${provider} Sign In`,
      `Sign in with ${provider} is available in the App Store version. Use "Continue as Guest" to play now.`,
      [{ text: 'OK' }]
    );
  };

  const handleGuest = async () => {
    await markReturningUser();
    // Navigation updates automatically — GameContext's playerId is already set
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo tiles */}
        <View style={styles.logoTiles}>
          <View style={styles.tileRow}>
            <View style={[styles.tile, styles.tileGreen]}><Text style={styles.tileLetter}>W</Text></View>
            <View style={[styles.tile, styles.tileYellow]}><Text style={styles.tileLetter}>G</Text></View>
          </View>
          <View style={styles.tileRow}>
            <View style={[styles.tile, styles.tileGray]}><Text style={styles.tileLetter}>R</Text></View>
            <View style={[styles.tile, styles.tileGreen]}><Text style={styles.tileLetter}>D</Text></View>
          </View>
        </View>

        <Text style={styles.title}>WORD <Text style={styles.titleAccent}>GUESS</Text></Text>
        <Text style={styles.subtitle}>Sign in to play</Text>

        <View style={styles.buttons}>
          {/* Google */}
          <TouchableOpacity
            style={[styles.btn, styles.btnGoogle]}
            onPress={() => handleSocial('Google')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnIcon, { color: '#4285F4' }]}>G</Text>
            <Text style={[styles.btnText, { color: '#121213' }]}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnApple]}
              onPress={() => handleSocial('Apple')}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnIcon, { color: '#ffffff' }]}></Text>
              <Text style={[styles.btnText, { color: '#ffffff' }]}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          {/* Facebook */}
          <TouchableOpacity
            style={[styles.btn, styles.btnFacebook]}
            onPress={() => handleSocial('Facebook')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnIcon, { color: '#ffffff' }]}>f</Text>
            <Text style={[styles.btnText, { color: '#ffffff' }]}>Continue with Facebook</Text>
          </TouchableOpacity>

          {/* Guest */}
          <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.7}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121213' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  logoTiles: { gap: 8, marginBottom: 20 },
  tileRow: { flexDirection: 'row', gap: 8 },
  tile: { width: 52, height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tileGreen:  { backgroundColor: '#538d4e' },
  tileYellow: { backgroundColor: '#b59f3b' },
  tileGray:   { backgroundColor: '#3a3a3c' },
  tileLetter: { color: '#fff', fontSize: 22, fontWeight: '900' },
  title: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: 6, marginBottom: 6 },
  titleAccent: { color: '#538d4e' },
  subtitle: { color: '#818384', fontSize: 14, letterSpacing: 2, marginBottom: 40 },
  buttons: { width: '100%', gap: 12 },
  btn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, gap: 12,
  },
  btnGoogle:   { backgroundColor: '#ffffff' },
  btnApple:    { backgroundColor: '#000000', borderWidth: 1, borderColor: '#3a3a3c' },
  btnFacebook: { backgroundColor: '#1877F2' },
  btnIcon: { fontSize: 18, fontWeight: '900', width: 24, textAlign: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  guestBtn: { alignItems: 'center', paddingVertical: 14 },
  guestText: { color: '#818384', fontSize: 14, fontWeight: '600' },
});
