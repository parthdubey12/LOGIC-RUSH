import assert from 'node:assert';
import test from 'node:test';
import { calculateScore, shuffleOptionsForPlayer } from '../src/socket/scoring.js';

test('Fair Scoring Engine - Correct Answer Calculation', () => {
  // Fast correct answer (1s out of 30s) on Medium
  const fastScore = calculateScore({ isCorrect: true, responseTimeMs: 1000, totalTimeSec: 30, difficulty: 'medium' });
  assert.strictEqual(fastScore > 1150, true, 'Fast response should earn near maximum points (>1150)');

  // Slow correct answer (29s out of 30s) on Medium
  const slowScore = calculateScore({ isCorrect: true, responseTimeMs: 29000, totalTimeSec: 30, difficulty: 'medium' });
  assert.strictEqual(slowScore < 600, true, 'Slow response should earn reduced points (<600)');
  assert.strictEqual(slowScore > 400, true, 'Slow response should still earn minimum speed threshold points');

  // Hard difficulty multiplier test
  const hardScore = calculateScore({ isCorrect: true, responseTimeMs: 1000, totalTimeSec: 30, difficulty: 'hard' });
  assert.strictEqual(hardScore > fastScore, true, 'Hard difficulty should yield higher score than medium');
});

test('Fair Scoring Engine - Incorrect Answer', () => {
  const incorrectScore = calculateScore({ isCorrect: false, responseTimeMs: 2000, totalTimeSec: 30 });
  assert.strictEqual(incorrectScore, 0, 'Incorrect answer should earn 0 points by default');

  const negativeScore = calculateScore({ isCorrect: false, responseTimeMs: 2000, allowNegative: true });
  assert.strictEqual(negativeScore, -250, 'Negative marking should deduct 250 points when enabled');
});

test('Option Shuffler - Correct Option Mapping Preservation', () => {
  const originalOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
  const originalCorrectIndex = 2; // Option C

  const { shuffledOptions, newCorrectIndex } = shuffleOptionsForPlayer(originalOptions, originalCorrectIndex);

  assert.strictEqual(shuffledOptions.length, 4);
  assert.strictEqual(shuffledOptions[newCorrectIndex], 'Option C', 'Shuffled correct option index must map to the same correct text');
});
