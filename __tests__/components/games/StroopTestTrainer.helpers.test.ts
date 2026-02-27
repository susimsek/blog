import {
  clamp,
  createDeterministicTask,
  createNextProgress,
  createResult,
  createTask,
  formatAccuracy,
  formatDuration,
  getAccuracy,
  getAverageReactionMs,
  getChoiceReactionMs,
  getDisplayedElapsedMs,
  getModeConfig,
  getProgressPercent,
  getScore,
  getTaskCardClassName,
  getUpdatedBestResults,
  parseStoredBestResults,
  parseStoredMode,
  parseStoredShowHint,
  shuffle,
} from '@/components/games/StroopTestTrainer';

describe('StroopTestTrainer helpers', () => {
  it('formats durations, accuracy, and clamps values', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(formatDuration(61543)).toBe('01:01.54');
    expect(formatDuration(-1)).toBe('00:00.00');
    expect(formatAccuracy(83.6)).toBe('84%');
  });

  it('computes averages, scores, accuracy, progress, and elapsed time', () => {
    expect(getAverageReactionMs([])).toBe(0);
    expect(getAverageReactionMs([100, 200])).toBe(150);
    expect(getAccuracy(3, 0)).toBe(100);
    expect(getAccuracy(3, 4)).toBe(75);
    expect(getProgressPercent(3, 10, 0, null)).toBe(30);
    expect(getProgressPercent(0, null, 500, 1000)).toBe(50);
    expect(getProgressPercent(0, null, 0, null)).toBe(0);
    expect(getDisplayedElapsedMs(1200, null, 'running')).toBe(1200);
    expect(getDisplayedElapsedMs(1200, 1000, 'running')).toBe(1000);
    expect(getDisplayedElapsedMs(1200, 1000, 'completed')).toBe(1200);
    expect(getScore(1, 10)).toBe(0);
    expect(getScore(3, 1)).toBe(275);
  });

  it('builds results, next progress, best results, and task card classes', () => {
    expect(createResult(3, 1, 4, [100, 200])).toEqual({
      score: 275,
      accuracy: 75,
      avgReactionMs: 150,
    });
    expect(
      createNextProgress({ correctCount: 1, mistakes: 1, completedRounds: 1, reactionTimes: [100] }, 200, false),
    ).toEqual({
      correctCount: 1,
      mistakes: 2,
      completedRounds: 2,
      reactionTimes: [100, 200],
    });

    const currentBest = { standard: { score: 500, accuracy: 90, avgReactionMs: 400 } };
    expect(getUpdatedBestResults(currentBest, 'standard', { score: 450, accuracy: 95, avgReactionMs: 300 })).toBe(
      currentBest,
    );
    expect(getUpdatedBestResults(currentBest, 'timed', { score: 600, accuracy: 95, avgReactionMs: 300 })).toEqual({
      ...currentBest,
      timed: { score: 600, accuracy: 95, avgReactionMs: 300 },
    });

    expect(getTaskCardClassName(true, 'correct')).toContain('is-congruent');
    expect(getTaskCardClassName(false, 'wrong')).toContain('is-wrong');
  });

  it('parses stored values and computes reaction times', () => {
    expect(parseStoredMode('practice')).toBe('practice');
    expect(parseStoredMode('invalid')).toBeNull();
    expect(parseStoredShowHint('true')).toBe(true);
    expect(parseStoredShowHint('false')).toBe(false);
    expect(parseStoredShowHint('invalid')).toBeNull();
    expect(
      parseStoredBestResults(
        JSON.stringify({
          practice: { score: 123.8, accuracy: 120, avgReactionMs: -20 },
          standard: { score: 400, accuracy: 85, avgReactionMs: 350.4 },
        }),
      ),
    ).toEqual({
      practice: { score: 124, accuracy: 100, avgReactionMs: 0 },
      standard: { score: 400, accuracy: 85, avgReactionMs: 350 },
    });
    expect(parseStoredBestResults('{')).toEqual({});

    jest.spyOn(Date, 'now').mockReturnValue(2500);
    expect(getChoiceReactionMs(null)).toBe(0);
    expect(getChoiceReactionMs(1000)).toBe(1500);
    expect(getChoiceReactionMs(100000)).toBe(0);
    (Date.now as jest.Mock).mockRestore();
  });

  it('creates deterministic and randomized tasks', () => {
    const deterministic = createDeterministicTask('practice');
    expect(deterministic.word).toBe('red');
    expect(deterministic.ink).toBe('blue');
    expect(deterministic.congruent).toBe(false);
    expect(getModeConfig('timed').timeLimitMs).toBe(60000);

    jest.spyOn(Math, 'random').mockReturnValue(0);
    const shuffled = shuffle(['a', 'b', 'c']);
    const task = createTask('standard');
    expect(shuffled).toEqual(['b', 'c', 'a']);
    expect(task.options).toHaveLength(getModeConfig('standard').palette.length);
    (Math.random as jest.Mock).mockRestore();
  });
});
