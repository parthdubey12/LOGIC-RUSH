/**
 * LogicRush Fair Scoring Engine & Option Shuffler
 * 
 * Rules:
 * - Base points for correct answer: 1000 points
 * - Difficulty Multipliers: Easy = 1.0, Medium = 1.25, Hard = 1.5
 * - Speed Multiplier: Linear drop from 1.0 (instant) down to 0.4 (last second)
 *   Formula: 1.0 - 0.6 * (responseTimeMs / (totalTimeSec * 1000))
 * - Late submissions (> totalTimeSec + 1.5s tolerance for network latency) are rejected as 0 points.
 * - Incorrect answers: 0 points default (or negative marking -250 if host enabled).
 */

export function calculateScore({ isCorrect, responseTimeMs, totalTimeSec = 30, difficulty = 'medium', allowNegative = false }) {
  if (!isCorrect) {
    return allowNegative ? -250 : 0;
  }

  const basePoints = 1000;
  
  // Difficulty Multiplier
  let diffMultiplier = 1.25;
  if (difficulty === 'easy') diffMultiplier = 1.0;
  if (difficulty === 'hard') diffMultiplier = 1.5;

  // Speed Multiplier calculation
  const totalMs = totalTimeSec * 1000;
  const clampedTimeMs = Math.min(Math.max(responseTimeMs, 0), totalMs);
  const timeRatio = clampedTimeMs / totalMs;
  
  // Speed factor ranges from 1.0 (0s) down to 0.4 (30s)
  const speedMultiplier = Math.max(0.4, 1.0 - (0.6 * timeRatio));

  const finalScore = Math.round(basePoints * diffMultiplier * speedMultiplier);
  return finalScore;
}

/**
 * Shuffles answer options deterministically or randomly per player while preserving correct mapping.
 */
export function shuffleOptionsForPlayer(options, correctOptionIndex) {
  if (!options || !Array.isArray(options)) return { options: [], correctIndex: 0 };
  
  const indexed = options.map((opt, i) => ({ text: opt, originalIndex: i }));
  
  // Fisher-Yates shuffle
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  const newOptions = indexed.map(item => item.text);
  const newCorrectIndex = indexed.findIndex(item => item.originalIndex === correctOptionIndex);

  return {
    shuffledOptions: newOptions,
    newCorrectIndex
  };
}
