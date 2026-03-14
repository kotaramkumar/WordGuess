import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { createSession, joinSession, startGame, subscribeToLobbySessions } from '../services/gameService';

const WORD_LENGTH_OPTIONS = [4, 5, 6, 7, 8];

export default function HomeScreen({ navigation }) {
  const { playerId, playerName, setPlayerName, isReturningUser } = useGame();

  const [nameInput, setNameInput] = useState(playerName);
  const [wordLength, setWordLength] = useState(6);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [lobbySessions, setLobbySessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');

  const unsubRef = useRef(null);

  useEffect(() => {
    unsubRef.current = subscribeToLobbySessions((sessions) => {
      setLobbySessions(sessions);
      setSessionsLoading(false);
    });
    return () => unsubRef.current?.();
  }, []);

  const handleCreateGame = async () => {
    const name = nameInput.trim();
    if (!name) { Alert.alert('Enter your name first!'); return; }
    if (!playerId) return;

    setLoading(true);
    try {
      await setPlayerName(name);
      const { sessionId, code } = await createSession(playerId, name, wordLength);
      navigation.navigate('Lobby', { sessionId, code, isHost: true });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSoloPractice = async () => {
    const name = nameInput.trim();
    if (!name) { Alert.alert('Enter your name first!'); return; }
    if (!playerId) return;

    setLoading(true);
    try {
      await setPlayerName(name);
      const { sessionId } = await createSession(playerId, name, wordLength);
      await startGame(sessionId);
      navigation.navigate('Game', { sessionId });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    const name = nameInput.trim();
    if (!name) { Alert.alert('Enter your name first!'); return; }
    if (!manualCode.trim()) { Alert.alert('Enter a session code'); return; }
    if (!playerId) return;

    setLoading(true);
    try {
      await setPlayerName(name);
      const { sessionId, code } = await joinSession(manualCode.trim().toUpperCase(), playerId, name);
      navigation.navigate('Lobby', { sessionId, code, isHost: false });
    } catch (e) {
      Alert.alert('Cannot join', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (session) => {
    const name = nameInput.trim();
    if (!name) { Alert.alert('Enter your name first!'); return; }
    if (!playerId) return;

    setLoading(true);
    try {
      await setPlayerName(name);
      const { sessionId, code } = await joinSession(session.code, playerId, name);
      navigation.navigate('Lobby', { sessionId, code, isHost: false });
    } catch (e) {
      Alert.alert('Cannot join', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>WORD</Text>
            <Text style={[styles.title, styles.titleAccent]}>GUESS</Text>
            <Text style={styles.subtitle}>Multiplayer Word Game</Text>
          </View>

          {/* Name input */}
          <View style={styles.section}>
            <Text style={styles.label}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name…"
              placeholderTextColor="#555"
              maxLength={20}
              autoCorrect={false}
            />
          </View>

          {/* Available sessions */}
          {!showCreate && (
            <View style={styles.section}>
              <Text style={styles.label}>AVAILABLE SESSIONS</Text>

              {sessionsLoading ? (
                <ActivityIndicator color="#538d4e" style={{ marginVertical: 20 }} />
              ) : lobbySessions.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No open sessions</Text>
                  <Text style={styles.emptySubText}>Create one to get started!</Text>
                </View>
              ) : (
                (isReturningUser ? lobbySessions.slice(0, 3) : lobbySessions).map(session => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionCard}
                    onPress={() => handleJoinSession(session)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionCode}>{session.code}</Text>
                      <View style={styles.sessionMeta}>
                        <Text style={styles.sessionMetaText}>
                          {session.wordLength}L · {session.totalPlayers} player{session.totalPlayers !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.joinArrow}>Join →</Text>
                    }
                  </TouchableOpacity>
                ))
              )}

              {/* Manual code entry — always visible */}
              <View style={styles.manualJoinBox}>
                <Text style={styles.label}>JOIN BY CODE</Text>
                <View style={styles.manualJoinRow}>
                  <TextInput
                    style={styles.codeInput}
                    value={manualCode}
                    onChangeText={setManualCode}
                    placeholder="e.g. 123-456-789"
                    placeholderTextColor="#555"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={11}
                  />
                  <TouchableOpacity
                    style={[styles.joinCodeBtn, loading && styles.btnDisabled]}
                    onPress={handleJoinByCode}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.joinCodeBtnText}>Join</Text>}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.createLink}
                onPress={() => setShowCreate(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.createLinkText}>+ Create a new session</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Create game panel */}
          {showCreate && (
            <View style={styles.section}>
              <Text style={styles.label}>WORD LENGTH</Text>
              <View style={styles.lengthRow}>
                {WORD_LENGTH_OPTIONS.map(len => (
                  <TouchableOpacity
                    key={len}
                    style={[styles.lengthBtn, wordLength === len && styles.lengthBtnActive]}
                    onPress={() => setWordLength(len)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.lengthBtnText, wordLength === len && styles.lengthBtnTextActive]}>
                      {len}
                    </Text>
                    <Text style={[styles.lengthBtnSub, wordLength === len && styles.lengthBtnTextActive]}>
                      letters
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={handleCreateGame}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Start Session →</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnSolo, loading && styles.btnDisabled]}
                onPress={handleSoloPractice}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Solo Practice →</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.back}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121213' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 100, height: 100, marginBottom: 8 },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
    lineHeight: 58,
  },
  titleAccent: { color: '#538d4e' },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
    lineHeight: 58,
  },
  titleAccent: { color: '#538d4e' },
  subtitle: { color: '#818384', fontSize: 14, marginTop: 6, letterSpacing: 2 },
  section: { marginBottom: 20 },
  label: { color: '#818384', fontSize: 11, fontWeight: '600', letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1b',
    borderWidth: 2,
    borderColor: '#3a3a3c',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3c',
    marginBottom: 12,
  },
  emptyText: { color: '#818384', fontSize: 15, fontWeight: '600' },
  emptySubText: { color: '#555', fontSize: 13, marginTop: 4 },
  sessionCard: {
    backgroundColor: '#1a1a1b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: { gap: 4 },
  sessionCode: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sessionMeta: { flexDirection: 'row', gap: 8 },
  sessionMetaText: { color: '#818384', fontSize: 13 },
  joinArrow: { color: '#538d4e', fontSize: 15, fontWeight: '800' },
  createLink: { alignItems: 'center', paddingVertical: 12 },
  createLinkText: { color: '#45B7D1', fontSize: 14, fontWeight: '600' },
  lengthRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  lengthBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3a3a3c',
    backgroundColor: '#1a1a1b',
  },
  lengthBtnActive: { borderColor: '#538d4e', backgroundColor: '#1e3a1e' },
  lengthBtnText: { color: '#818384', fontWeight: '800', fontSize: 16 },
  lengthBtnTextActive: { color: '#538d4e' },
  lengthBtnSub: { color: '#555', fontSize: 9, marginTop: 1 },
  btn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#538d4e' },
  btnSolo: { backgroundColor: '#3a3a3c', marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  back: { alignItems: 'center', marginTop: 12 },
  backText: { color: '#818384', fontSize: 14 },
  manualJoinBox: { marginTop: 4, marginBottom: 4 },
  manualJoinRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  codeInput: {
    flex: 1,
    backgroundColor: '#1a1a1b',
    borderWidth: 2,
    borderColor: '#3a3a3c',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  joinCodeBtn: {
    backgroundColor: '#538d4e',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinCodeBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
});
