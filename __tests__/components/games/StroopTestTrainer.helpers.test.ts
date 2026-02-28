import {
  clamp,
  createEmptySplitStats,
  createDeterministicTask,
  createNextProgress,
  createResult,
  createTask,
  formatAccuracy,
  formatDuration,
  formatSignedMs,
  getAccuracy,
  getAverageReactionMs,
  getChoiceReactionMs,
  getDisplayedElapsedMs,
  getInterferenceMs,
  getModeConfig,
  getProgressPercent,
  getScore,
  getTaskCardClassName,
  getUpdatedBestResults,
  parseStoredBestResults,
  parseStoredMode,
  parseStoredRecentRuns,
  parseStoredShowHint,
  shuffle,
} from '@/components/games/StroopTestTrainer';

describe('StroopTestTrainer helpers', () => {
  it('formats durations, accuracy, and clamps values', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(formatDuration(61543)).toBe('01:01.54');
    expect(formatDuration(-1)).toBe('00:00.00');
    expect(formatAccuracy(83.6)).toBe('84%');
    expect(formatSignedMs(120)).toBe('+120 ms');
    expect(formatSignedMs(-30)).toBe('-30 ms');
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
    const splitStats = {
      congruent: { answeredCount: 2, correctCount: 2, reactionTimes: [100, 200] },
      incongruent: { answeredCount: 2, correctCount: 1, reactionTimes: [350, 450] },
    };

    expect(createResult(3, 1, 4, [100, 200], splitStats)).toEqual({
      score: 275,
      accuracy: 75,
      avgReactionMs: 150,
      congruentAvgReactionMs: 150,
      incongruentAvgReactionMs: 400,
      interferenceMs: 250,
    });
    expect(
      createNextProgress(
        {
          correctCount: 1,
          mistakes: 1,
          completedRounds: 1,
          reactionTimes: [100],
          splitStats: createEmptySplitStats(),
        },
        200,
        false,
        true,
      ),
    ).toEqual({
      correctCount: 1,
      mistakes: 2,
      completedRounds: 2,
      reactionTimes: [100, 200],
      splitStats: {
        congruent: { answeredCount: 1, correctCount: 0, reactionTimes: [200] },
        incongruent: { answeredCount: 0, correctCount: 0, reactionTimes: [] },
      },
    });

    const currentBest = {
      standard: {
        score: 500,
        accuracy: 90,
        avgReactionMs: 400,
        congruentAvgReactionMs: 350,
        incongruentAvgReactionMs: 480,
        interferenceMs: 130,
      },
    };
    expect(
      getUpdatedBestResults(currentBest, 'standard', {
        score: 450,
        accuracy: 95,
        avgReactionMs: 300,
        congruentAvgReactionMs: 280,
        incongruentAvgReactionMs: 390,
        interferenceMs: 110,
      }),
    ).toBe(currentBest);
    expect(
      getUpdatedBestResults(currentBest, 'timed', {
        score: 600,
        accuracy: 95,
        avgReactionMs: 300,
        congruentAvgReactionMs: 250,
        incongruentAvgReactionMs: 360,
        interferenceMs: 110,
      }),
    ).toEqual({
      ...currentBest,
      timed: {
        score: 600,
        accuracy: 95,
        avgReactionMs: 300,
        congruentAvgReactionMs: 250,
        incongruentAvgReactionMs: 360,
        interferenceMs: 110,
      },
    });

    expect(getInterferenceMs(splitStats)).toBe(250);

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
          practice: {
            score: 123.8,
            accuracy: 120,
            avgReactionMs: -20,
            congruentAvgReactionMs: -10,
            incongruentAvgReactionMs: 180.5,
            interferenceMs: 190.2,
          },
          standard: {
            score: 400,
            accuracy: 85,
            avgReactionMs: 350.4,
            congruentAvgReactionMs: 310.2,
            incongruentAvgReactionMs: 450.8,
            interferenceMs: 140.6,
          },
        }),
      ),
    ).toEqual({
      practice: {
        score: 124,
        accuracy: 100,
        avgReactionMs: 0,
        congruentAvgReactionMs: 0,
        incongruentAvgReactionMs: 181,
        interferenceMs: 190,
      },
      standard: {
        score: 400,
        accuracy: 85,
        avgReactionMs: 350,
        congruentAvgReactionMs: 310,
        incongruentAvgReactionMs: 451,
        interferenceMs: 141,
      },
    });
    expect(parseStoredBestResults('{')).toEqual({});
    expect(
      parseStoredRecentRuns(
        JSON.stringify([
          {
            mode: 'timed',
            score: 800,
            accuracy: 81.7,
            avgReactionMs: 520.2,
            congruentAvgReactionMs: 470.1,
            incongruentAvgReactionMs: 610.7,
            interferenceMs: 141.2,
            completedRounds: 19.4,
            mistakes: 2.1,
            durationMs: 60000.4,
          },
        ]),
      ),
    ).toEqual([
      {
        mode: 'timed',
        score: 800,
        accuracy: 81.7,
        avgReactionMs: 520,
        congruentAvgReactionMs: 470,
        incongruentAvgReactionMs: 611,
        interferenceMs: 141,
        completedRounds: 19,
        mistakes: 2,
        durationMs: 60000,
      },
    ]);
    expect(parseStoredRecentRuns('{')).toEqual([]);

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
