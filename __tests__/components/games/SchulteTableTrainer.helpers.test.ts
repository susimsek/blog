import {
  clamp,
  chunkBoardRows,
  createBoard,
  createOrderedBoard,
  formatDuration,
  parseStoredBestTimes,
  parseStoredGridSize,
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
          4: -1,
          5: 'bad',
        }),
      ),
    ).toEqual({ 3: 123 });
    expect(parseStoredGridSize('5')).toBe(5);
    expect(parseStoredGridSize('2')).toBeNull();
    expect(parseStoredGridSize(null)).toBeNull();
    expect(parseStoredShowHint(null)).toBeNull();
    expect(parseStoredShowHint('true')).toBe(true);
    expect(parseStoredShowHint('false')).toBe(false);
    expect(parseStoredShowHint('invalid')).toBeNull();
  });

  it('shuffles and creates randomized boards', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(shuffle([1, 2, 3])).toEqual([2, 3, 1]);
    expect(createBoard(3)).toHaveLength(9);
    (Math.random as jest.Mock).mockRestore();
  });
});
