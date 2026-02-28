import {
  clamp,
  createDeterministicPattern,
  createPattern,
  formatDuration,
  getRevealAccent,
  getUpdatedBestResults,
  parseStoredBestResults,
  parseStoredMode,
  parseStoredRecentRuns,
  parseStoredShowHint,
} from '@/components/games/VisualMemoryTrainer';

describe('VisualMemoryTrainer helpers', () => {
  it('formats durations and clamps values', () => {
    expect(clamp(-10, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(formatDuration(61543)).toBe('01:01.54');
    expect(formatDuration(-1)).toBe('00:00.00');
  });

  it('parses stored mode, hint, best results, and recent runs safely', () => {
    expect(parseStoredMode('standard')).toBe('standard');
    expect(parseStoredMode('invalid')).toBeNull();
    expect(parseStoredShowHint('true')).toBe(true);
    expect(parseStoredShowHint('false')).toBe(false);
    expect(parseStoredShowHint('invalid')).toBeNull();
    expect(
      parseStoredBestResults(
        JSON.stringify({
          standard: { level: 7.4, score: 1200.9, rememberedTiles: 10.2 },
          expert: { level: -1, score: 400, rememberedTiles: 5 },
        }),
      ),
    ).toEqual({
      standard: { level: 7, score: 1201, rememberedTiles: 10 },
      expert: { level: 1, score: 400, rememberedTiles: 5 },
    });
    expect(parseStoredBestResults('{')).toEqual({});

    expect(
      parseStoredRecentRuns(
        JSON.stringify([
          { mode: 'standard', level: 6.2, score: 900.4, rememberedTiles: 9.7, mistakes: 1.2, durationMs: 3234.8 },
          { mode: 'expert', level: 8, score: 1500, rememberedTiles: 12, mistakes: 0, durationMs: 5510 },
          { mode: 'bad', level: 3, score: 200, rememberedTiles: 3, mistakes: 0, durationMs: 1000 },
        ]),
      ),
    ).toEqual([
      { mode: 'standard', level: 6, score: 900, rememberedTiles: 10, mistakes: 1, durationMs: 3235 },
      { mode: 'expert', level: 8, score: 1500, rememberedTiles: 12, mistakes: 0, durationMs: 5510 },
    ]);
    expect(parseStoredRecentRuns('{')).toEqual([]);
  });

  it('creates deterministic and randomized patterns and updates best results correctly', () => {
    expect(createDeterministicPattern('easy')).toEqual([0, 1, 2]);

    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.8);
    expect(createPattern('easy', 1)).toEqual([0, 1, 3]);
    expect(createPattern('standard', 2)).toHaveLength(5);
    expect(getRevealAccent(0)).toMatchObject({ bg: expect.any(String), border: expect.any(String) });
    expect(
      getUpdatedBestResults({ standard: { level: 5, score: 800, rememberedTiles: 8 } }, 'standard', {
        level: 5,
        score: 700,
        rememberedTiles: 7,
      }),
    ).toEqual({
      standard: { level: 5, score: 800, rememberedTiles: 8 },
    });
    expect(
      getUpdatedBestResults({ standard: { level: 5, score: 800, rememberedTiles: 8 } }, 'expert', {
        level: 6,
        score: 900,
        rememberedTiles: 9,
      }),
    ).toEqual({
      standard: { level: 5, score: 800, rememberedTiles: 8 },
      expert: { level: 6, score: 900, rememberedTiles: 9 },
    });
    (Math.random as jest.Mock).mockRestore();
  });
});
