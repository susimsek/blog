import { act, fireEvent, render, screen, within } from '@testing-library/react';
import VisualMemoryTrainer from '@/components/games/VisualMemoryTrainer';
import useMediaQuery from '@/hooks/useMediaQuery';

jest.mock('@/hooks/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'games.visualMemory.trainer.completeMessage') {
        return `complete:${String(options?.level ?? '')}:${String(options?.score ?? '')}:${String(options?.tiles ?? '')}:${String(options?.mistakes ?? '')}`;
      }

      if (key === 'games.visualMemory.trainer.gridHint') {
        return `grid:${String(options?.size ?? '')}`;
      }

      if (key === 'games.visualMemory.trainer.livesHint') {
        return `lives:${String(options?.count ?? '')}`;
      }

      if (key === 'games.visualMemory.trainer.patternHint') {
        return `pattern:${String(options?.count ?? '')}`;
      }

      if (key === 'games.visualMemory.trainer.recentRunLabel') {
        return `level:${String(options?.level ?? '')}`;
      }

      if (key === 'games.visualMemory.trainer.recentRunScore') {
        return `score:${String(options?.score ?? '')}`;
      }

      if (
        key === 'games.visualMemory.trainer.recentRunTiles_one' ||
        key === 'games.visualMemory.trainer.recentRunTiles_other'
      ) {
        return `tiles:${String(options?.count ?? '')}`;
      }

      if (
        key === 'games.visualMemory.trainer.recentRunMistakes_one' ||
        key === 'games.visualMemory.trainer.recentRunMistakes_other'
      ) {
        return `mistakes:${String(options?.count ?? '')}`;
      }

      if (key === 'games.visualMemory.trainer.modes.easy.title') return 'Easy';
      if (key === 'games.visualMemory.trainer.modes.standard.title') return 'Standard';
      if (key === 'games.visualMemory.trainer.modes.expert.title') return 'Expert';
      if (key === 'games.visualMemory.trainer.modes.easy.copy') return 'Easy copy';
      if (key === 'games.visualMemory.trainer.modes.standard.copy') return 'Standard copy';
      if (key === 'games.visualMemory.trainer.modes.expert.copy') return 'Expert copy';

      return key;
    },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

describe('VisualMemoryTrainer', () => {
  let nowMs = 0;

  const setResponsiveState = ({ mobile = false, compact = false }: { mobile?: boolean; compact?: boolean }) => {
    (useMediaQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === '(max-width: 991px)') {
        return mobile;
      }

      if (query === '(max-width: 575px)') {
        return compact;
      }

      return false;
    });
  };

  const getSidebarValue = (labelKey: string) => {
    const label = screen.getByText(labelKey);
    const item = label.closest('.visual-memory-sidebar-meta-item');

    expect(item).not.toBeNull();
    return within(item as HTMLElement).getByRole('strong');
  };

  const getStatValue = (labelKey: string) => {
    const label = screen.getByText(labelKey);
    const tile = label.closest('.visual-memory-stat-tile');

    expect(tile).not.toBeNull();
    const value = (tile as HTMLElement).querySelector('.visual-memory-stat-value');
    expect(value).not.toBeNull();
    return value as HTMLElement;
  };

  beforeEach(() => {
    nowMs = 0;
    window.localStorage.clear();
    setResponsiveState({});
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('restores saved mode, best result, recent runs, and hint preference from storage', () => {
    window.localStorage.setItem(
      'visual-memory-best-results-v1',
      JSON.stringify({
        expert: { level: 9, score: 1800, rememberedTiles: 15 },
      }),
    );
    window.localStorage.setItem(
      'visual-memory-recent-runs-v1',
      JSON.stringify([{ mode: 'expert', level: 8, score: 1500, rememberedTiles: 12, mistakes: 1, durationMs: 5432 }]),
    );
    window.localStorage.setItem('visual-memory-mode-v1', 'expert');
    window.localStorage.setItem('visual-memory-show-hint-v1', 'false');

    render(<VisualMemoryTrainer />);

    expect(screen.getByRole('radio', { name: /Expert/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('games.visualMemory.trainer.showHint')).not.toBeChecked();
    expect(getSidebarValue('games.visualMemory.trainer.bestLevel')).toHaveTextContent('9');
    expect(getSidebarValue('games.visualMemory.trainer.bestScore')).toHaveTextContent('1800');
    expect(getSidebarValue('games.visualMemory.trainer.bestTiles')).toHaveTextContent('15');
    expect(screen.getByText('level:8')).toBeInTheDocument();
  });

  it('starts a round, advances to the next level, and tracks score', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.08)
      .mockReturnValueOnce(0.15)
      .mockReturnValueOnce(0.22)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.38)
      .mockReturnValueOnce(0.46)
      .mockReturnValueOnce(0.54)
      .mockReturnValueOnce(0.62);

    render(<VisualMemoryTrainer />);

    fireEvent.click(screen.getByText('games.visualMemory.trainer.startRound'));

    act(() => {
      jest.advanceTimersByTime(950);
    });

    const cellButtons = screen.getAllByRole('button').filter(button => button.className.includes('visual-memory-cell'));
    fireEvent.click(cellButtons[0]);
    fireEvent.click(cellButtons[1]);
    fireEvent.click(cellButtons[2]);
    fireEvent.click(cellButtons[3]);

    expect(getStatValue('games.visualMemory.trainer.score')).toHaveTextContent('400');
    expect(getStatValue('games.visualMemory.trainer.level')).toHaveTextContent('2');

    act(() => {
      jest.advanceTimersByTime(260);
    });

    expect(screen.getByText(/games\.visualMemory\.trainer\.memorizeRule/)).toBeInTheDocument();
    (Math.random as jest.Mock).mockRestore();
  });

  it('restarts the current level, then stores game-over result and recent runs after the last life is lost', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.08)
      .mockReturnValueOnce(0.15)
      .mockReturnValueOnce(0.22);

    render(<VisualMemoryTrainer />);

    fireEvent.click(screen.getByText('games.visualMemory.trainer.startRound'));

    act(() => {
      jest.advanceTimersByTime(950);
    });

    const cellButtons = screen.getAllByRole('button').filter(button => button.className.includes('visual-memory-cell'));
    fireEvent.click(cellButtons[15]);
    expect(getStatValue('games.visualMemory.trainer.lives')).toHaveTextContent('2');

    fireEvent.click(screen.getByText('games.visualMemory.trainer.restart'));
    expect(getStatValue('games.visualMemory.trainer.lives')).toHaveTextContent('3');
    expect(screen.getByText('pattern:4')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(950);
    });

    fireEvent.click(cellButtons[15]);
    act(() => {
      jest.advanceTimersByTime(420);
      jest.advanceTimersByTime(950);
    });
    fireEvent.click(cellButtons[15]);
    act(() => {
      jest.advanceTimersByTime(420);
      jest.advanceTimersByTime(950);
    });

    nowMs = 2500;
    fireEvent.click(cellButtons[15]);

    act(() => {
      jest.advanceTimersByTime(720);
    });

    expect(screen.getByText(/^complete:/)).toBeInTheDocument();
    expect(getSidebarValue('games.visualMemory.trainer.bestLevel')).not.toHaveTextContent(
      'games.visualMemory.trainer.noBestYet',
    );
    expect(JSON.parse(window.localStorage.getItem('visual-memory-recent-runs-v1') ?? '[]')).toMatchObject([
      { mode: 'standard', level: 1, score: 0, rememberedTiles: 0, mistakes: 3 },
    ]);
    (Math.random as jest.Mock).mockRestore();
  });

  it('can clear the best score for the active mode', () => {
    window.localStorage.setItem(
      'visual-memory-best-results-v1',
      JSON.stringify({
        standard: { level: 7, score: 1200, rememberedTiles: 10 },
      }),
    );

    render(<VisualMemoryTrainer />);

    expect(getSidebarValue('games.visualMemory.trainer.bestLevel')).toHaveTextContent('7');

    fireEvent.click(screen.getByText('games.visualMemory.trainer.clearBest'));

    expect(getSidebarValue('games.visualMemory.trainer.bestLevel')).toHaveTextContent(
      'games.visualMemory.trainer.noBestYet',
    );
    expect(JSON.parse(window.localStorage.getItem('visual-memory-best-results-v1') ?? '{}')).toEqual({});
  });

  it('renders mobile controls in an offcanvas and closes them after choosing a mode', () => {
    setResponsiveState({ mobile: true });

    render(<VisualMemoryTrainer />);

    fireEvent.click(screen.getByRole('button', { name: /games\.visualMemory\.trainer\.controls/i }));
    expect(screen.getAllByRole('radio', { name: /Easy/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('radio', { name: /Easy/i })[0]);

    expect(screen.getByRole('button', { name: /games\.visualMemory\.trainer\.controls/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
