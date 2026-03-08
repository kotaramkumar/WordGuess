/**
 * Check a guess against the target word.
 * Returns an array of { letter, status } objects where status is:
 *   'correct'  — right letter, right position (green)
 *   'present'  — right letter, wrong position (yellow)
 *   'absent'   — letter not in word (gray)
 */
export function checkGuess(guess, target) {
  const guessArr = guess.toUpperCase().split('');
  const targetArr = target.toUpperCase().split('');
  const result = Array(guessArr.length).fill(null).map((_, i) => ({
    letter: guessArr[i],
    status: 'absent',
  }));

  // Frequency map for remaining target letters (after correct matches are removed)
  const remaining = {};
  targetArr.forEach((letter, i) => {
    if (guessArr[i] !== letter) {
      remaining[letter] = (remaining[letter] || 0) + 1;
    }
  });

  // Pass 1: mark correct positions
  guessArr.forEach((letter, i) => {
    if (letter === targetArr[i]) {
      result[i].status = 'correct';
    }
  });

  // Pass 2: mark present / absent
  guessArr.forEach((letter, i) => {
    if (result[i].status === 'correct') return;
    if (remaining[letter] > 0) {
      result[i].status = 'present';
      remaining[letter]--;
    } else {
      result[i].status = 'absent';
    }
  });

  return result;
}

/**
 * Build a map of letter → best status across all submitted guesses.
 * Used to color keyboard keys.
 */
export function buildLetterMap(guessResults) {
  const map = {};
  const priority = { correct: 3, present: 2, absent: 1 };
  guessResults.forEach(row => {
    row.forEach(({ letter, status }) => {
      const cur = map[letter];
      if (!cur || priority[status] > priority[cur]) {
        map[letter] = status;
      }
    });
  });
  return map;
}
