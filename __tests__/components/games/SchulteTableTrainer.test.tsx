import { act, fireEvent, render, screen, within } from '@testing-library/react';
import SchulteTableTrainer from '@/components/games/SchulteTableTrainer';
import useMediaQuery from '@/hooks/useMediaQuery';

jest.mock('@/hooks/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

describe('SchulteTableTrainer', () => {
  let nowMs = 0;

  const getTable = () => screen.getByRole('table');

  const getCellButton = (value: number) => {
    const table = getTable();
    const cell = within(table)
      .getAllByText(String(value))
      .find(element => element.closest('button'));

    expect(cell).toBeDefined();
    return cell!.closest('button') as HTMLButtonElement;
  };

  const getStatValue = (labelKey: string) => {
    const label = screen.getByText(labelKey);
    const tile = label.closest('.schulte-stat-tile');

    expect(tile).not.toBeNull();
    const value = (tile as HTMLElement).querySelector('.schulte-stat-value');
    expect(value).not.toBeNull();
    return value as HTMLElement;
  };

  const expectBestTimeToBe = (expected: string) => {
    const bestTimeLabel = screen.getByText('games.schulte.trainer.bestTime');
    const bestTimeContainer = bestTimeLabel.closest('.schulte-sidebar-meta-item');

    expect(bestTimeContainer).not.toBeNull();
    expect(within(bestTimeContainer as HTMLElement).getByText(expected)).toBeInTheDocument();
  };

  const completeBoard = (gridSize: 3 | 5, finishMs: number, mode: 'classic' | 'reverse' = 'classic') => {
    fireEvent.click(screen.getByRole('radio', { name: `${gridSize}×${gridSize}` }));
    fireEvent.click(
      screen.getByRole('radio', { name: new RegExp(`games\\.schulte\\.trainer\\.modes\\.${mode}\\.title`) }),
    );

    const grid = getTable();
    nowMs += 1000;
    const values =
      mode === 'reverse'
        ? Array.from({ length: gridSize * gridSize }, (_, index) => gridSize * gridSize - index)
        : Array.from({ length: gridSize * gridSize }, (_, index) => index + 1);

    for (const value of values) {
      if (value === values[values.length - 1]) {
        nowMs += finishMs;
      }

      const cell = within(grid)
        .getAllByText(String(value))
        .find(element => element.closest('button'));

      expect(cell).toBeDefined();
      fireEvent.click(cell!.closest('button')!);
    }
  };

  beforeEach(() => {
    nowMs = 0;
    window.localStorage.clear();
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    window.matchMedia =
      window.matchMedia ||
      (((query: string) =>
        ({
          matches: query === '(max-width: 991px)' || query === '(max-width: 575px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }) as MediaQueryList) as typeof window.matchMedia);
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves the best time for each grid size when switching sizes', () => {
    render(<SchulteTableTrainer />);

    completeBoard(3, 1300);
    expectBestTimeToBe('00:01.30');

    completeBoard(5, 4000);
    expectBestTimeToBe('00:04.00');

    fireEvent.click(screen.getByRole('radio', { name: '3×3' }));

    expectBestTimeToBe('00:01.30');
    expect(JSON.parse(window.localStorage.getItem('schulte-table-best-times-v1') ?? '{}')).toEqual({
      '3-classic': 1300,
      '5-classic': 4000,
    });
  });

  it('restores the saved best time and selected grid size after a refresh', () => {
    window.localStorage.setItem(
      'schulte-table-best-times-v1',
      JSON.stringify({
        '3-reverse': 1300,
        '5-classic': 4000,
      }),
    );
    window.localStorage.setItem('schulte-table-grid-size-v1', '3');
    window.localStorage.setItem('schulte-table-play-mode-v1', 'reverse');

    render(<SchulteTableTrainer />);

    expectBestTimeToBe('00:01.30');
    expect(screen.getByRole('radio', { name: '3×3' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '5×5' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /games\.schulte\.trainer\.modes\.reverse\.title/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('persists the show hint preference across refreshes', () => {
    const { unmount } = render(<SchulteTableTrainer />);

    fireEvent.click(screen.getByLabelText('games.schulte.trainer.showNextHint'));

    expect(window.localStorage.getItem('schulte-table-show-hint-v1')).toBe('false');

    unmount();
    render(<SchulteTableTrainer />);

    expect(screen.getByLabelText('games.schulte.trainer.showNextHint')).not.toBeChecked();
  });

  it('falls back to defaults when stored values are invalid', () => {
    window.localStorage.setItem('schulte-table-best-times-v1', '{invalid-json');
    window.localStorage.setItem('schulte-table-grid-size-v1', '42');
    window.localStorage.setItem('schulte-table-play-mode-v1', 'sideways');
    window.localStorage.setItem('schulte-table-show-hint-v1', 'maybe');

    render(<SchulteTableTrainer />);

    expect(screen.getByRole('radio', { name: '5×5' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /games\.schulte\.trainer\.modes\.classic\.title/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByLabelText('games.schulte.trainer.showNextHint')).toBeChecked();
    expectBestTimeToBe('games.schulte.trainer.noBestYet');
  });

  it('supports reverse mode and starts from the largest value', () => {
    render(<SchulteTableTrainer />);

    fireEvent.click(screen.getByRole('radio', { name: '3×3' }));
    fireEvent.click(screen.getByRole('radio', { name: /games\.schulte\.trainer\.modes\.reverse\.title/ }));

    expect(getStatValue('games.schulte.trainer.next')).toHaveTextContent('9');

    fireEvent.click(getCellButton(9));
    expect(getStatValue('games.schulte.trainer.next')).toHaveTextContent('8');
  });

  it('tracks mistakes and clears the wrong pulse after the timeout', () => {
    jest.useFakeTimers();
    try {
      render(<SchulteTableTrainer />);

      const wrongCell = getCellButton(2);
      fireEvent.click(wrongCell);

      expect(getStatValue('games.schulte.trainer.mistakes')).toHaveTextContent('1');
      expect(wrongCell).toHaveClass('is-wrong');

      act(() => {
        jest.advanceTimersByTime(220);
      });

      expect(getCellButton(2)).not.toHaveClass('is-wrong');
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not overwrite the stored best time with a slower result and can clear it', () => {
    render(<SchulteTableTrainer />);

    completeBoard(3, 1300);
    expectBestTimeToBe('00:01.30');

    fireEvent.click(screen.getByText('games.schulte.trainer.newBoard'));
    completeBoard(3, 1800);
    expectBestTimeToBe('00:01.30');

    fireEvent.click(screen.getByText('games.schulte.trainer.clearBestForSize'));
    expectBestTimeToBe('games.schulte.trainer.noBestYet');
    expect(JSON.parse(window.localStorage.getItem('schulte-table-best-times-v1') ?? '{}')).toEqual({});
  });

  it('stores best times separately for classic and reverse mode', () => {
    render(<SchulteTableTrainer />);

    completeBoard(3, 1300, 'classic');
    expectBestTimeToBe('00:01.30');

    completeBoard(3, 1500, 'reverse');
    expectBestTimeToBe('00:01.50');

    fireEvent.click(screen.getByRole('radio', { name: /games\.schulte\.trainer\.modes\.classic\.title/ }));
    expectBestTimeToBe('00:01.30');

    expect(JSON.parse(window.localStorage.getItem('schulte-table-best-times-v1') ?? '{}')).toEqual({
      '3-classic': 1300,
      '3-reverse': 1500,
    });
  });

  it('stores recent runs with mode and keeps the latest entries first', () => {
    render(<SchulteTableTrainer />);

    completeBoard(3, 1300, 'classic');
    completeBoard(3, 1400, 'reverse');

    expect(JSON.parse(window.localStorage.getItem('schulte-table-recent-runs-v1') ?? '[]')).toEqual([
      { size: 3, mode: 'reverse', durationMs: 1400, mistakes: 0 },
      { size: 3, mode: 'classic', durationMs: 1300, mistakes: 0 },
    ]);
    expect(screen.getByText('games.schulte.trainer.recentRuns')).toBeInTheDocument();
  });

  it('can render mobile controls in an offcanvas and close them after selecting a size', () => {
    (useMediaQuery as jest.Mock).mockImplementation((query: string) => query === '(max-width: 991px)');

    render(<SchulteTableTrainer />);

    fireEvent.click(screen.getByRole('button', { name: /games\.schulte\.trainer\.controls/i }));
    expect(screen.getAllByRole('radio', { name: '3×3' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('radio', { name: '3×3' })[0]);

    expect(screen.getByRole('button', { name: /games\.schulte\.trainer\.controls/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
