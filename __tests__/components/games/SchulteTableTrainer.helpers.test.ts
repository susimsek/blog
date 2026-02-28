import {
  clamp,
  chunkBoardRows,
  createBoard,
  getInitialTarget,
  getNextTarget,
  getBestTimeKey,
  createOrderedBoard,
  formatDuration,
  parseStoredBestTimes,
  parseStoredGridSize,
  parseStoredPlayMode,
  parseStoredRecentRuns,
  parseStoredShowHint,
  shuffle,
} from '@/components/games/SchulteTableTrainer';

describe('SchulteTableTrainer helpers', () => {
  it('creates boards, rows, and formatted durations', () => {
    expect(createOrderedBoard(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(chunkBoardRows([1, 2, 3, 4, 5, 6], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(formatDuration(61543)).toBe('01:01.54');
    expect(clamp(-10, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('parses stored settings safely', () => {
    expect(parseStoredBestTimes(null)).toEqual({});
    expect(parseStoredBestTimes('{')).toEqual({});
    expect(
      parseStoredBestTimes(
        JSON.stringify({
          3: 123.4,
          '3-reverse': 456.7,
          4: -1,
          5: 'bad',
        }),
      ),
    ).toEqual({ '3-classic': 123, '3-reverse': 457 });
    expect(parseStoredGridSize('5')).toBe(5);
    expect(parseStoredGridSize('2')).toBeNull();
    expect(parseStoredGridSize(null)).toBeNull();
    expect(parseStoredPlayMode('classic')).toBe('classic');
    expect(parseStoredPlayMode('reverse')).toBe('reverse');
    expect(parseStoredPlayMode('invalid')).toBeNull();
    expect(parseStoredShowHint(null)).toBeNull();
    expect(parseStoredShowHint('true')).toBe(true);
    expect(parseStoredShowHint('false')).toBe(false);
    expect(parseStoredShowHint('invalid')).toBeNull();
    expect(
      parseStoredRecentRuns(
        JSON.stringify([
          { size: 5, mode: 'classic', durationMs: 1234.4, mistakes: 1.2 },
          { size: 4, mode: 'reverse', durationMs: 2222, mistakes: 0 },
          { size: 2, mode: 'classic', durationMs: 3333, mistakes: 0 },
        ]),
      ),
    ).toEqual([
      { size: 5, mode: 'classic', durationMs: 1234, mistakes: 1 },
      { size: 4, mode: 'reverse', durationMs: 2222, mistakes: 0 },
    ]);
  });

  it('shuffles and creates randomized boards', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(shuffle([1, 2, 3])).toEqual([2, 3, 1]);
    expect(createBoard(3)).toHaveLength(9);
    expect(getBestTimeKey(5, 'classic')).toBe('5-classic');
    expect(getInitialTarget(5, 'classic')).toBe(1);
    expect(getInitialTarget(5, 'reverse')).toBe(25);
    expect(getNextTarget(7, 'classic')).toBe(8);
    expect(getNextTarget(7, 'reverse')).toBe(6);
    (Math.random as jest.Mock).mockRestore();
  });
});
