import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import StroopTestTrainer from '@/components/games/StroopTestTrainer';
import useMediaQuery from '@/hooks/useMediaQuery';

jest.mock('@/hooks/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key.startsWith('games.stroop.colors.')) {
        return key.split('.').pop() ?? key;
      }

      if (key === 'games.stroop.trainer.inkHint') {
        return `hint:${String(options?.color ?? '')}`;
      }

      if (key === 'games.stroop.trainer.completeMessage') {
        return `complete:${String(options?.score ?? '')}:${String(options?.accuracy ?? '')}:${String(options?.avgMs ?? '')}`;
      }

      if (key === 'games.stroop.trainer.recentRunLabel') {
        return `score:${String(options?.score ?? '')}`;
      }

      if (key === 'games.stroop.trainer.recentRunAccuracy') {
        return `accuracy:${String(options?.accuracy ?? '')}`;
      }

      if (key === 'games.stroop.trainer.recentRunAvg') {
        return `avg:${String(options?.avgMs ?? '')}`;
      }

      if (key === 'games.stroop.trainer.recentRunInterference') {
        return `interference:${String(options?.deltaMs ?? '')}`;
      }

      if (key === 'games.stroop.trainer.modes.practice.title') return 'Practice';
      if (key === 'games.stroop.trainer.modes.standard.title') return 'Standard';
      if (key === 'games.stroop.trainer.modes.timed.title') return 'Timed';
      if (key === 'games.stroop.trainer.modes.practice.copy') return 'Practice copy';
      if (key === 'games.stroop.trainer.modes.standard.copy') return 'Standard copy';
      if (key === 'games.stroop.trainer.modes.timed.copy') return 'Timed copy';

      return key;
    },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

describe('StroopTestTrainer', () => {
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

  const getBestScoreValue = () => {
    const label = screen.getByText('games.stroop.trainer.bestScore');
    const item = label.closest('.stroop-sidebar-meta-item');

    expect(item).not.toBeNull();
    return within(item as HTMLElement).getByRole('strong');
  };

  const getHintColor = () => {
    const hint = screen.getByText(/^hint:/);
    return hint.textContent!.replace('hint:', '');
  };

  const getCurrentWord = () => document.querySelector('.stroop-task-word')?.textContent ?? '';

  const getChoiceButtons = () =>
    screen.getAllByRole('button').filter(button => button.className.includes('stroop-choice-button'));

  const getAverageReactionValue = () => {
    const meta = document.querySelector('.stroop-trainer-meta');

    expect(meta).not.toBeNull();
    return meta?.textContent ?? '';
  };

  const answerCurrentTask = ({ correct = true, deltaMs = 300 }: { correct?: boolean; deltaMs?: number } = {}) => {
    nowMs += deltaMs;
    const correctColor = getHintColor();
    const choiceButton = correct
      ? screen.getByRole('button', { name: correctColor })
      : getChoiceButtons().find(button => button.textContent?.trim() !== correctColor);

    expect(choiceButton).toBeDefined();
    fireEvent.click(choiceButton!);
  };

  const completeMode = (modeName: 'Practice' | 'Standard', roundCount: number) => {
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(modeName, 'i') }));

    for (let round = 0; round < roundCount; round += 1) {
      answerCurrentTask();
    }
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('restores saved mode, best result, and hint preference from storage', () => {
    window.localStorage.setItem(
      'stroop-test-best-results-v1',
      JSON.stringify({
        timed: {
          score: 4200,
          accuracy: 88,
          avgReactionMs: 620,
          congruentAvgReactionMs: 510,
          incongruentAvgReactionMs: 690,
          interferenceMs: 180,
        },
      }),
    );
    window.localStorage.setItem(
      'stroop-test-recent-runs-v1',
      JSON.stringify([
        {
          mode: 'timed',
          score: 3800,
          accuracy: 86,
          avgReactionMs: 640,
          congruentAvgReactionMs: 520,
          incongruentAvgReactionMs: 710,
          interferenceMs: 190,
          completedRounds: 18,
          mistakes: 2,
          durationMs: 60000,
        },
      ]),
    );
    window.localStorage.setItem('stroop-test-mode-v1', 'timed');
    window.localStorage.setItem('stroop-test-show-hint-v1', 'false');

    render(<StroopTestTrainer />);

    expect(screen.getByRole('radio', { name: /Timed/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('games.stroop.trainer.showHint')).not.toBeChecked();
    expect(getBestScoreValue()).toHaveTextContent('4200');
    expect(screen.getByText('score:3800')).toBeInTheDocument();
  });

  it('falls back to defaults when stored values are invalid', () => {
    window.localStorage.setItem('stroop-test-best-results-v1', '{invalid');
    window.localStorage.setItem('stroop-test-mode-v1', 'unknown');
    window.localStorage.setItem('stroop-test-show-hint-v1', 'nope');

    render(<StroopTestTrainer />);

    expect(screen.getByRole('radio', { name: /Standard/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('games.stroop.trainer.showHint')).toBeChecked();
    expect(getBestScoreValue()).toHaveTextContent('games.stroop.trainer.noBestYet');
  });

  it('tracks mistakes and clears the wrong pulse after the timeout', () => {
    jest.useFakeTimers();

    try {
      render(<StroopTestTrainer />);

      answerCurrentTask({ correct: false });

      expect(screen.getByText('games.stroop.trainer.mistakes').closest('.stroop-stat-tile')).toHaveTextContent('1');
      expect(document.querySelector('.stroop-task-card')).toHaveClass('is-wrong');

      act(() => {
        jest.advanceTimersByTime(220);
      });

      expect(document.querySelector('.stroop-task-card')).not.toHaveClass('is-wrong');
    } finally {
      jest.useRealTimers();
    }
  });

  it('stores the best score for the selected mode and does not replace it with a slower run', () => {
    render(<StroopTestTrainer />);

    completeMode('Practice', 20);
    expect(getBestScoreValue()).toHaveTextContent('2000');

    fireEvent.click(screen.getByText('games.stroop.trainer.restart'));
    nowMs += 1000;
    answerCurrentTask({ correct: false, deltaMs: 200 });
    for (let round = 1; round < 20; round += 1) {
      answerCurrentTask({ deltaMs: 900 });
    }

    expect(getBestScoreValue()).toHaveTextContent('2000');
    expect(JSON.parse(window.localStorage.getItem('stroop-test-best-results-v1') ?? '{}')).toMatchObject({
      practice: { score: 2000, interferenceMs: expect.any(Number) },
    });
  });

  it('tracks congruent and incongruent reaction stats and stores recent runs', async () => {
    render(<StroopTestTrainer />);
    fireEvent.click(screen.getByRole('radio', { name: /Practice/i }));

    answerCurrentTask({ deltaMs: 300 });
    answerCurrentTask({ deltaMs: 500 });

    expect(getAverageReactionValue()).toContain('games.stroop.trainer.congruentAvg:');
    expect(getAverageReactionValue()).toContain('games.stroop.trainer.incongruentAvg:');
    expect(getAverageReactionValue()).toContain('games.stroop.trainer.interference:');

    for (let round = 0; round < 18; round += 1) {
      answerCurrentTask();
    }

    await waitFor(() => {
      const recentRuns = JSON.parse(window.localStorage.getItem('stroop-test-recent-runs-v1') ?? '[]');
      expect(recentRuns[0]).toMatchObject({
        mode: 'practice',
        score: expect.any(Number),
        congruentAvgReactionMs: expect.any(Number),
        incongruentAvgReactionMs: expect.any(Number),
        interferenceMs: expect.any(Number),
      });
    });
    expect(screen.getByText(/^score:/)).toBeInTheDocument();
  });

  it('restarts the current prompt instead of generating a new one', () => {
    render(<StroopTestTrainer />);

    answerCurrentTask({ correct: false, deltaMs: 250 });
    const promptWordBeforeRestart = getCurrentWord();
    const hintBeforeRestart = getHintColor();

    fireEvent.click(screen.getByText('games.stroop.trainer.restart'));

    expect(getCurrentWord()).toBe(promptWordBeforeRestart);
    expect(getHintColor()).toBe(hintBeforeRestart);
    expect(screen.getByText('games.stroop.trainer.score').closest('.stroop-stat-tile')).toHaveTextContent('0');
    expect(screen.getByText('games.stroop.trainer.mistakes').closest('.stroop-stat-tile')).toHaveTextContent('0');
  });

  it('does not count idle wait time toward the first reaction measurement', () => {
    render(<StroopTestTrainer />);

    nowMs = 5000;
    answerCurrentTask({ deltaMs: 0 });

    expect(getAverageReactionValue()).toContain('0 ms');
  });

  it('can clear the best score for the active mode', () => {
    render(<StroopTestTrainer />);

    completeMode('Practice', 20);
    expect(getBestScoreValue()).toHaveTextContent('2000');

    fireEvent.click(screen.getByText('games.stroop.trainer.clearBest'));

    expect(getBestScoreValue()).toHaveTextContent('games.stroop.trainer.noBestYet');
    expect(JSON.parse(window.localStorage.getItem('stroop-test-best-results-v1') ?? '{}')).toEqual({});
  });

  it('completes timed mode when the limit is reached', async () => {
    render(<StroopTestTrainer />);
    fireEvent.click(screen.getByRole('radio', { name: /Timed/i }));

    answerCurrentTask({ deltaMs: 200 });
    nowMs = 60200;
    answerCurrentTask({ deltaMs: 0 });

    await waitFor(() => {
      expect(screen.getByText(/^complete:/)).toBeInTheDocument();
      expect(getBestScoreValue()).not.toHaveTextContent('games.stroop.trainer.noBestYet');
    });
  });

  it('renders mobile controls in an offcanvas and closes them after choosing a mode', () => {
    setResponsiveState({ mobile: true });

    render(<StroopTestTrainer />);

    fireEvent.click(screen.getByRole('button', { name: /games\.stroop\.trainer\.controls/i }));
    expect(screen.getAllByRole('radio', { name: /Practice/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('radio', { name: /Practice/i })[0]);

    expect(screen.getByRole('button', { name: /games\.stroop\.trainer\.controls/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
