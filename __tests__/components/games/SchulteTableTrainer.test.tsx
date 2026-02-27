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

  const completeBoard = (gridSize: 3 | 5, finishMs: number) => {
    fireEvent.click(screen.getByRole('radio', { name: `${gridSize}×${gridSize}` }));

    const grid = getTable();
    nowMs += 1000;

    for (let value = 1; value <= gridSize * gridSize; value += 1) {
      if (value === gridSize * gridSize) {
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
      3: 1300,
      5: 4000,
    });
  });

  it('restores the saved best time and selected grid size after a refresh', () => {
    window.localStorage.setItem(
      'schulte-table-best-times-v1',
      JSON.stringify({
        3: 1300,
        5: 4000,
      }),
    );
    window.localStorage.setItem('schulte-table-grid-size-v1', '3');

    render(<SchulteTableTrainer />);

    expectBestTimeToBe('00:01.30');
    expect(screen.getByRole('radio', { name: '3×3' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '5×5' })).toHaveAttribute('aria-checked', 'false');
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
    window.localStorage.setItem('schulte-table-show-hint-v1', 'maybe');

    render(<SchulteTableTrainer />);

    expect(screen.getByRole('radio', { name: '5×5' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('games.schulte.trainer.showNextHint')).toBeChecked();
    expectBestTimeToBe('games.schulte.trainer.noBestYet');
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
