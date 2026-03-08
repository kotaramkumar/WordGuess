import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { getRandomWord } from '../utils/words';
import { checkGuess } from '../utils/gameLogic';

export const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F1948A', '#A9DFBF', '#FAD7A0', '#D7BDE2',
  '#A8E6CF', '#FFD3A3', '#C3A4FF', '#FFB7C5',
];

function generateCode() {
  const rand = () => Math.floor(Math.random() * 900 + 100);
  return `${rand()}-${rand()}-${rand()}`;
}

// ─── Create Session ───────────────────────────────────────────────────────────
export async function createSession(hostId, hostName, wordLength = 6) {
  const sessionRef = doc(collection(db, 'sessions'));
  const code = generateCode();

  await setDoc(sessionRef, {
    code,
    hostId,
    status: 'lobby',
    currentWord: '',
    currentRound: 0,
    wordLength,
    playerIds: [hostId],
    totalPlayers: 1,
    winner: null,
    createdAt: serverTimestamp(),
  });

  const playerRef = doc(db, 'sessions', sessionRef.id, 'players', hostId);
  await setDoc(playerRef, {
    name: hostName,
    color: PLAYER_COLORS[0],
    isHost: true,
    guesses: [],
    resultsJson: '[]',
    hasWon: false,
    score: 0,
    joinedAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  });

  return { sessionId: sessionRef.id, code };
}

// ─── Join Session ─────────────────────────────────────────────────────────────
export async function joinSession(code, playerId, playerName) {
  const q = query(collection(db, 'sessions'), where('code', '==', code.trim()));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error('Session not found. Check the code and try again.');

  const sessionDoc = snap.docs[0];
  const session = sessionDoc.data();

  if (session.status !== 'lobby') throw new Error('This game has already started.');
  if (session.totalPlayers >= 16) throw new Error('Session is full (max 16 players).');
  if (session.playerIds.includes(playerId)) {
    // Rejoin — player already exists
    return { sessionId: sessionDoc.id, code: session.code };
  }

  const colorIndex = session.totalPlayers % PLAYER_COLORS.length;

  await runTransaction(db, async (tx) => {
    const sessionRef = doc(db, 'sessions', sessionDoc.id);
    const fresh = await tx.get(sessionRef);
    const freshData = fresh.data();
    if (freshData.totalPlayers >= 16) throw new Error('Session is full.');
    tx.update(sessionRef, {
      playerIds: arrayUnion(playerId),
      totalPlayers: freshData.totalPlayers + 1,
    });

    const playerRef = doc(db, 'sessions', sessionDoc.id, 'players', playerId);
    tx.set(playerRef, {
      name: playerName,
      color: PLAYER_COLORS[colorIndex],
      isHost: false,
      guesses: [],
      resultsJson: '[]',
      hasWon: false,
      score: 0,
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  });

  return { sessionId: sessionDoc.id, code: session.code };
}

// ─── Start Game ───────────────────────────────────────────────────────────────
export async function startGame(sessionId) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);
  const { wordLength = 6 } = sessionSnap.data();
  const word = getRandomWord(wordLength);
  await updateDoc(sessionRef, {
    status: 'playing',
    currentWord: word,
    currentRound: 0,
  });
}

// ─── Submit Guess ─────────────────────────────────────────────────────────────
export async function submitGuess(sessionId, playerId, guess) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);

  // Step 1: read current session word
  const sessionSnap = await getDoc(sessionRef);
  const session = sessionSnap.data();
  const { currentWord, currentRound, wordLength = 6 } = session;

  // Step 2: compute results for this guess
  const result = checkGuess(guess, currentWord);
  const hasWon = result.every(r => r.status === 'correct');

  // Step 3: update player doc — serialize results as JSON string (Firestore forbids nested arrays)
  const playerSnap = await getDoc(playerRef);
  const player = playerSnap.data();
  const newGuesses = [...player.guesses, guess.toUpperCase()];
  const prevResults = player.resultsJson ? JSON.parse(player.resultsJson) : [];
  const newResults = [...prevResults, result];

  await updateDoc(playerRef, {
    guesses: newGuesses,
    resultsJson: JSON.stringify(newResults),
    hasWon,
    score: hasWon ? Math.max(0, wordLength - currentRound) : 0,
    lastActive: serverTimestamp(),
  });

  // Step 4: check if all players submitted for this round
  await _tryAdvanceRound(sessionId, sessionRef, currentRound, session.playerIds, session.totalPlayers);

  return { result, hasWon };
}

// ─── Internal: Advance Round If All Submitted ─────────────────────────────────
async function _tryAdvanceRound(sessionId, sessionRef, currentRound, playerIds, totalPlayers) {
  try {
    await runTransaction(db, async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      const session = sessionSnap.data();

      // Another transaction already advanced this round
      if (session.currentRound !== currentRound || session.status === 'gameOver') return;

      // Fetch all player docs
      const playerDocs = await Promise.all(
        playerIds.map(pid => tx.get(doc(db, 'sessions', sessionId, 'players', pid)))
      );

      const players = playerDocs.map(d => d.data()).filter(Boolean);
      const submittedCount = players.filter(p => p.guesses.length > currentRound).length;

      if (submittedCount < totalPlayers) return; // not everyone submitted yet

      const anyWon = players.some(p => p.hasWon);
      const isLastRound = currentRound >= (session.wordLength || 6);

      if (anyWon || isLastRound) {
        // Game over
        let winner = null;
        const winners = players
          .filter(p => p.hasWon)
          .sort((a, b) => b.score - a.score);
        if (winners.length > 0) {
          const winnerId = playerIds[players.indexOf(winners[0])];
          winner = { id: winnerId, name: winners[0].name };
        }
        tx.update(sessionRef, { status: 'gameOver', winner });
      } else {
        tx.update(sessionRef, { currentRound: currentRound + 1 });
      }
    });
  } catch (e) {
    // Transaction aborted — another client handled it, safe to ignore
    console.log('Round advance aborted (handled by another client):', e.message);
  }
}

// ─── Leave Session ────────────────────────────────────────────────────────────
export async function leaveSession(sessionId, playerId, isHost, playerIds) {
  try {
    const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
    await deleteDoc(playerRef);

    const sessionRef = doc(db, 'sessions', sessionId);
    const remaining = playerIds.filter(id => id !== playerId);

    if (remaining.length === 0) {
      await deleteDoc(sessionRef);
    } else {
      const updates = {
        playerIds: remaining,
        totalPlayers: remaining.length,
      };
      if (isHost) updates.hostId = remaining[0];
      await updateDoc(sessionRef, updates);
    }
  } catch (e) {
    console.error('leaveSession error:', e);
  }
}

// ─── Activity Tracking ────────────────────────────────────────────────────────
export async function updatePlayerActivity(sessionId, playerId) {
  try {
    const playerRef = doc(db, 'sessions', sessionId, 'players', playerId);
    await updateDoc(playerRef, { lastActive: serverTimestamp() });
  } catch (e) {
    // Player doc may already be gone — safe to ignore
  }
}

// Called by the host client every 60 seconds to remove players idle > 5 min
export async function checkAndKickInactivePlayers(sessionId, playerIds, myPlayerId) {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const now = Date.now();

  for (const pid of playerIds) {
    if (pid === myPlayerId) continue;
    try {
      const playerRef = doc(db, 'sessions', sessionId, 'players', pid);
      const snap = await getDoc(playerRef);
      if (!snap.exists()) continue;

      const { lastActive } = snap.data();
      if (lastActive && now - lastActive.toMillis() > FIVE_MINUTES) {
        await deleteDoc(playerRef);
        await updateDoc(doc(db, 'sessions', sessionId), {
          playerIds: arrayRemove(pid),
          totalPlayers: increment(-1),
        });
      }
    } catch (e) {
      console.log('kickInactive error for', pid, e.message);
    }
  }
}

// ─── Subscribe to open lobby sessions ─────────────────────────────────────────
export function subscribeToLobbySessions(callback) {
  const q = query(collection(db, 'sessions'), where('status', '==', 'lobby'));
  return onSnapshot(q, snap => {
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(sessions);
  });
}

// ─── Real-time Subscriptions ──────────────────────────────────────────────────
export function subscribeToSession(sessionId, callback) {
  const ref = doc(db, 'sessions', sessionId);
  return onSnapshot(ref, snap => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null));
}

export function subscribeToPlayers(sessionId, callback) {
  const ref = collection(db, 'sessions', sessionId, 'players');
  return onSnapshot(ref, snap => {
    const players = {};
    snap.forEach(d => {
      const data = d.data();
      players[d.id] = {
        ...data,
        // Decode resultsJson back to nested array for components
        results: data.resultsJson ? JSON.parse(data.resultsJson) : [],
      };
    });
    callback(players);
  });
}
