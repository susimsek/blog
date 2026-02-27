import { fireEvent, render, screen, within } from '@testing-library/react';
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

  const expectBestTimeToBe = (expected: string) => {
    const bestTimeLabel = screen.getByText('games.schulte.trainer.bestTime');
    const bestTimeContainer = bestTimeLabel.closest('.schulte-sidebar-meta-item');

    expect(bestTimeContainer).not.toBeNull();
    expect(within(bestTimeContainer as HTMLElement).getByText(expected)).toBeInTheDocument();
  };

  const completeBoard = (gridSize: 3 | 5, finishMs: number) => {
    fireEvent.click(screen.getByRole('radio', { name: `${gridSize}×${gridSize}` }));

    const grid = screen.getByRole('table');
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
});
