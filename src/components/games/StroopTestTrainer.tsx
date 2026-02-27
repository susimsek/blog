'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useMediaQuery from '@/hooks/useMediaQuery';

type StroopMode = 'practice' | 'standard' | 'timed';
type TrainerStatus = 'idle' | 'running' | 'completed';
type StroopColorId = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

type StroopColor = {
  id: StroopColorId;
  hex: string;
  bg: string;
  border: string;
};

type StroopTask = {
  word: StroopColorId;
  ink: StroopColorId;
  options: StroopColorId[];
  congruent: boolean;
};

type BestResult = {
  score: number;
  accuracy: number;
  avgReactionMs: number;
};

type BestResults = Partial<Record<StroopMode, BestResult>>;
type BestResultsUpdater = BestResults | ((current: BestResults) => BestResults);

type ModeConfig = {
  palette: readonly StroopColorId[];
  totalRounds: number | null;
  timeLimitMs: number | null;
  congruentChance: number;
};

const STROOP_COLORS: readonly StroopColor[] = [
  { id: 'red', hex: '#e53935', bg: '#fbe3e1', border: '#e8b5b2' },
  { id: 'blue', hex: '#1e6de0', bg: '#e2ecfd', border: '#b6cbef' },
  { id: 'green', hex: '#169f59', bg: '#dff6ea', border: '#afdcc4' },
  { id: 'yellow', hex: '#c69300', bg: '#fff3c8', border: '#ecd77f' },
  { id: 'purple', hex: '#7a3fd1', bg: '#eee2ff', border: '#cdb3f0' },
  { id: 'orange', hex: '#e57b16', bg: '#ffe8d2', border: '#efc295' },
] as const;

const MODE_CONFIGS: Readonly<Record<StroopMode, ModeConfig>> = {
  practice: {
    palette: ['red', 'blue', 'green', 'yellow'],
    totalRounds: 20,
    timeLimitMs: null,
    congruentChance: 0.35,
  },
  standard: {
    palette: ['red', 'blue', 'green', 'yellow', 'purple'],
    totalRounds: 30,
    timeLimitMs: null,
    congruentChance: 0.2,
  },
  timed: {
    palette: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    totalRounds: null,
    timeLimitMs: 60000,
    congruentChance: 0.15,
  },
} as const;

const DEFAULT_MODE: StroopMode = 'standard';
const BEST_RESULTS_STORAGE_KEY = 'stroop-test-best-results-v1';
const MODE_STORAGE_KEY = 'stroop-test-mode-v1';
const HINT_STORAGE_KEY = 'stroop-test-show-hint-v1';

const getCurrentTimeMs = (): number => Date.now();
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const shuffle = <T,>(values: readonly T[]): T[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const formatDuration = (ms: number) => {
  const safe = Math.max(0, Math.round(ms));
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const centiseconds = Math.floor((safe % 1000) / 10);
  const parts = [minutes, seconds].map(value => value.toString().padStart(2, '0'));
  return `${parts.join(':')}.${centiseconds.toString().padStart(2, '0')}`;
};

const formatAccuracy = (value: number) => `${Math.round(value)}%`;

const parseStoredMode = (raw: string | null): StroopMode | null => {
  if (raw === 'practice' || raw === 'standard' || raw === 'timed') {
    return raw;
  }
  return null;
};

const parseStoredShowHint = (raw: string | null): boolean | null => {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
};

const parseStoredBestResults = (raw: string | null): BestResults => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, BestResult>;
    const next: BestResults = {};
    for (const mode of Object.keys(MODE_CONFIGS) as StroopMode[]) {
      const value = parsed[mode];
      if (
        value &&
        typeof value.score === 'number' &&
        typeof value.accuracy === 'number' &&
        typeof value.avgReactionMs === 'number'
      ) {
        next[mode] = {
          score: Math.round(value.score),
          accuracy: clamp(value.accuracy, 0, 100),
          avgReactionMs: Math.max(0, Math.round(value.avgReactionMs)),
        };
      }
    }
    return next;
  } catch {
    return {};
  }
};

const getModeConfig = (mode: StroopMode) => MODE_CONFIGS[mode];

const createDeterministicTask = (mode: StroopMode): StroopTask => {
  const palette = [...getModeConfig(mode).palette];
  return {
    word: palette[0],
    ink: palette[1] ?? palette[0],
    options: palette,
    congruent: false,
  };
};

const createTask = (mode: StroopMode): StroopTask => {
  const { palette, congruentChance } = getModeConfig(mode);
  const ink = palette[Math.floor(Math.random() * palette.length)] ?? palette[0];
  const congruent = Math.random() < congruentChance;
  let word = ink;

  if (!congruent) {
    const alternatives = palette.filter(color => color !== ink);
    word = alternatives[Math.floor(Math.random() * alternatives.length)] ?? ink;
  }

  return {
    word,
    ink,
    options: shuffle(palette),
    congruent,
  };
};

const getScore = (correctCount: number, mistakes: number) => Math.max(0, correctCount * 100 - mistakes * 25);

export default function StroopTestTrainer() {
  const { t } = useTranslation('games');
  const isMobile = useMediaQuery('(max-width: 991px)');
  const isCompactMobile = useMediaQuery('(max-width: 575px)');
  const [mode, setMode] = React.useState<StroopMode>(DEFAULT_MODE);
  const [task, setTask] = React.useState<StroopTask>(() => createDeterministicTask(DEFAULT_MODE));
  const [status, setStatus] = React.useState<TrainerStatus>('idle');
  const [isMobileControlsOpen, setIsMobileControlsOpen] = React.useState(false);
  const [showHint, setShowHint] = React.useState(true);
  const [startedAtMs, setStartedAtMs] = React.useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [taskStartedAtMs, setTaskStartedAtMs] = React.useState<number | null>(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [completedRounds, setCompletedRounds] = React.useState(0);
  const [lastResult, setLastResult] = React.useState<BestResult | null>(null);
  const [bestResults, setBestResults] = React.useState<BestResults>({});
  const [lastChoiceState, setLastChoiceState] = React.useState<'correct' | 'wrong' | null>(null);
  const [reactionTimes, setReactionTimes] = React.useState<number[]>([]);

  const modeConfig = getModeConfig(mode);
  const currentBest = bestResults[mode] ?? null;
  const currentScore = getScore(correctCount, mistakes);
  const answeredCount = correctCount + mistakes;
  const accuracy = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 100;
  const averageReactionMs =
    reactionTimes.length > 0 ? reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length : 0;
  const roundsTarget = modeConfig.totalRounds;
  const timeLimitMs = modeConfig.timeLimitMs;
  const progressPercent = roundsTarget
    ? (completedRounds / roundsTarget) * 100
    : timeLimitMs
      ? (elapsedMs / timeLimitMs) * 100
      : 0;
  const choices = task.options
    .map(optionId => STROOP_COLORS.find(color => color.id === optionId))
    .filter(Boolean) as StroopColor[];
  const wordColor = STROOP_COLORS.find(color => color.id === task.ink) ?? STROOP_COLORS[0];

  const persistBestResults = React.useCallback((updater: BestResultsUpdater) => {
    setBestResults(currentBestResults => {
      const nextBestResults = typeof updater === 'function' ? updater(currentBestResults) : updater;
      if (globalThis.localStorage !== undefined) {
        globalThis.localStorage.setItem(BEST_RESULTS_STORAGE_KEY, JSON.stringify(nextBestResults));
      }
      return nextBestResults;
    });
  }, []);

  const resetRoundState = React.useCallback(() => {
    setStatus('idle');
    setStartedAtMs(null);
    setElapsedMs(0);
    setTaskStartedAtMs(getCurrentTimeMs());
    setCorrectCount(0);
    setMistakes(0);
    setCompletedRounds(0);
    setReactionTimes([]);
    setLastChoiceState(null);
    setLastResult(null);
  }, []);

  const resetRound = React.useCallback(
    (nextMode: StroopMode) => {
      setTask(createTask(nextMode));
      resetRoundState();
    },
    [resetRoundState],
  );

  React.useEffect(() => {
    if (status !== 'running' || startedAtMs === null) {
      return;
    }

    const interval = globalThis.setInterval(() => {
      const now = getCurrentTimeMs();
      const nextElapsed = now - startedAtMs;
      setElapsedMs(nextElapsed);

      const limit = getModeConfig(mode).timeLimitMs;
      if (limit !== null && nextElapsed >= limit) {
        const safeElapsed = clamp(limit, 0, 60 * 60 * 1000);
        const nextAccuracy = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 100;
        const avgReaction =
          reactionTimes.length > 0 ? reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length : 0;
        const nextResult = {
          score: getScore(correctCount, mistakes),
          accuracy: nextAccuracy,
          avgReactionMs: Math.round(avgReaction),
        };

        setStatus('completed');
        setElapsedMs(safeElapsed);
        setLastResult(nextResult);
        persistBestResults(currentBestResults => {
          const previousBest = currentBestResults[mode];
          if (previousBest && previousBest.score >= nextResult.score) {
            return currentBestResults;
          }
          return { ...currentBestResults, [mode]: nextResult };
        });
      }
    }, 50);

    return () => globalThis.clearInterval(interval);
  }, [answeredCount, correctCount, mistakes, mode, persistBestResults, reactionTimes, startedAtMs, status]);

  React.useEffect(() => {
    if (lastChoiceState === null) {
      return;
    }

    const timeout = globalThis.setTimeout(() => setLastChoiceState(null), 220);
    return () => globalThis.clearTimeout(timeout);
  }, [lastChoiceState]);

  React.useEffect(() => {
    if (globalThis.localStorage === undefined) {
      resetRound(DEFAULT_MODE);
      return;
    }

    const storedMode = parseStoredMode(globalThis.localStorage.getItem(MODE_STORAGE_KEY)) ?? DEFAULT_MODE;
    const storedBestResults = parseStoredBestResults(globalThis.localStorage.getItem(BEST_RESULTS_STORAGE_KEY));
    const storedShowHint = parseStoredShowHint(globalThis.localStorage.getItem(HINT_STORAGE_KEY));

    setBestResults(storedBestResults);
    setMode(storedMode);
    if (storedShowHint !== null) {
      setShowHint(storedShowHint);
    }
    resetRound(storedMode);
  }, [resetRound]);

  React.useEffect(() => {
    if (!isMobile) {
      setIsMobileControlsOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (globalThis.localStorage === undefined) {
      return;
    }

    globalThis.localStorage.setItem(HINT_STORAGE_KEY, String(showHint));
  }, [showHint]);

  const completeRound = React.useCallback(
    (finalElapsedMs: number) => {
      const nextResult = {
        score: getScore(correctCount, mistakes),
        accuracy,
        avgReactionMs: Math.round(averageReactionMs),
      };
      setStatus('completed');
      setElapsedMs(finalElapsedMs);
      setLastResult(nextResult);
      persistBestResults(currentBestResults => {
        const previousBest = currentBestResults[mode];
        if (previousBest && previousBest.score >= nextResult.score) {
          return currentBestResults;
        }
        return { ...currentBestResults, [mode]: nextResult };
      });
    },
    [accuracy, averageReactionMs, correctCount, mistakes, mode, persistBestResults],
  );

  const startTimerIfNeeded = () => {
    if (status !== 'idle') {
      return startedAtMs ?? getCurrentTimeMs();
    }
    const now = getCurrentTimeMs();
    setStatus('running');
    setStartedAtMs(now);
    return now;
  };

  const queueNextTask = (nextMode: StroopMode) => {
    setTask(createTask(nextMode));
    setTaskStartedAtMs(getCurrentTimeMs());
  };

  const handleModeChange = (nextMode: StroopMode) => {
    setMode(nextMode);
    resetRound(nextMode);
    setIsMobileControlsOpen(false);
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    }
  };

  const handleRestart = () => {
    resetRound(mode);
    setIsMobileControlsOpen(false);
  };

  const handleChoice = (choice: StroopColorId) => {
    if (status === 'completed') {
      return;
    }

    const effectiveStartMs = startTimerIfNeeded();
    const reactionMs = taskStartedAtMs !== null ? clamp(getCurrentTimeMs() - taskStartedAtMs, 0, 60 * 1000) : 0;
    const isCorrect = choice === task.ink;

    setReactionTimes(currentReactionTimes => [...currentReactionTimes, reactionMs]);
    setLastChoiceState(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setCorrectCount(previous => previous + 1);
    } else {
      setMistakes(previous => previous + 1);
    }

    const nextCompletedRounds = completedRounds + 1;
    setCompletedRounds(nextCompletedRounds);

    if (modeConfig.totalRounds !== null && nextCompletedRounds >= modeConfig.totalRounds) {
      const finishMs = clamp(getCurrentTimeMs() - effectiveStartMs, 0, 60 * 60 * 1000);
      const nextCorrect = correctCount + (isCorrect ? 1 : 0);
      const nextMistakes = mistakes + (isCorrect ? 0 : 1);
      const nextReactionTimes = [...reactionTimes, reactionMs];
      const nextAccuracy = nextCompletedRounds > 0 ? (nextCorrect / nextCompletedRounds) * 100 : 100;
      const nextAverage =
        nextReactionTimes.length > 0
          ? nextReactionTimes.reduce((sum, value) => sum + value, 0) / nextReactionTimes.length
          : 0;
      const nextResult = {
        score: getScore(nextCorrect, nextMistakes),
        accuracy: nextAccuracy,
        avgReactionMs: Math.round(nextAverage),
      };
      setStatus('completed');
      setElapsedMs(finishMs);
      setLastResult(nextResult);
      persistBestResults(currentBestResults => {
        const previousBest = currentBestResults[mode];
        if (previousBest && previousBest.score >= nextResult.score) {
          return currentBestResults;
        }
        return { ...currentBestResults, [mode]: nextResult };
      });
      return;
    }

    if (modeConfig.timeLimitMs !== null && startedAtMs !== null) {
      const nextElapsed = clamp(getCurrentTimeMs() - startedAtMs, 0, modeConfig.timeLimitMs);
      setElapsedMs(nextElapsed);
      if (nextElapsed >= modeConfig.timeLimitMs) {
        completeRound(modeConfig.timeLimitMs);
        return;
      }
    }

    queueNextTask(mode);
  };

  const statusLabel = t(`games.stroop.trainer.status.${status}`);
  const modeOptions = Object.keys(MODE_CONFIGS) as StroopMode[];
  const modeLabel = t('games.stroop.trainer.mode');
  const currentTaskWord = t(`games.stroop.colors.${task.word}`);
  const targetInkLabel = t(`games.stroop.colors.${task.ink}`);
  const mobileControlsToggleLabel = isMobileControlsOpen
    ? t('games.stroop.trainer.hideControls')
    : t('games.stroop.trainer.showControls');

  const controlsPanel = (
    <div className="stroop-trainer-controls stack stack-16">
      <div className="stroop-sidebar-section stack stack-8">
        <span className="stroop-control-label">{modeLabel}</span>
        <div className="stroop-mode-list" role="radiogroup" aria-label={modeLabel}>
          {modeOptions.map(modeOption => {
            const isActive = modeOption === mode;
            return (
              <button
                key={modeOption}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={['stroop-mode-option', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                onClick={() => handleModeChange(modeOption)}
              >
                <span className="stroop-mode-option-title">{t(`games.stroop.trainer.modes.${modeOption}.title`)}</span>
                <span className="stroop-mode-option-copy">{t(`games.stroop.trainer.modes.${modeOption}.copy`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="stroop-sidebar-section stack stack-8">
        <span className="stroop-control-label">{t('games.stroop.trainer.statusLabel')}</span>
        <div className="stroop-sidebar-meta">
          <div className="stroop-sidebar-meta-item">
            <span>{t('games.stroop.trainer.statusLabel')}</span>
            <strong>{statusLabel}</strong>
          </div>
          <div className="stroop-sidebar-meta-item">
            <span>{t('games.stroop.trainer.bestScore')}</span>
            <strong>{currentBest ? currentBest.score : t('games.stroop.trainer.noBestYet')}</strong>
          </div>
        </div>
      </div>

      <div className="stroop-sidebar-section stack stack-8">
        <span className="stroop-control-label">{t('games.stroop.trainer.actions')}</span>
        <div className="stroop-action-list">
          <Button type="button" variant="primary" size="sm" onClick={() => handleRestart()}>
            {t('games.stroop.trainer.newRound')}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleRestart}>
            {t('games.stroop.trainer.restart')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              persistBestResults(currentBestResults => {
                const nextBestResults = { ...currentBestResults };
                delete nextBestResults[mode];
                return nextBestResults;
              });
              setIsMobileControlsOpen(false);
            }}
          >
            {t('games.stroop.trainer.clearBest')}
          </Button>
        </div>
      </div>

      <div className="stroop-sidebar-section stroop-sidebar-switch">
        <Form.Check
          id="stroop-show-hint"
          type="switch"
          checked={showHint}
          onChange={event => setShowHint(event.target.checked)}
          label={t('games.stroop.trainer.showHint')}
        />
      </div>
    </div>
  );

  return (
    <Card className="stroop-trainer-card">
      <Card.Body className="stroop-trainer-body">
        <button
          type="button"
          className="stroop-mobile-controls-toggle"
          aria-expanded={isMobileControlsOpen}
          aria-controls="stroop-trainer-sidebar"
          onClick={() => setIsMobileControlsOpen(previous => !previous)}
        >
          <span className="stroop-mobile-controls-toggle-label">{t('games.stroop.trainer.controls')}</span>
          <span className="stroop-mobile-controls-toggle-state">{mobileControlsToggleLabel}</span>
        </button>

        <div className="stroop-trainer-layout">
          {!isMobile && (
            <aside id="stroop-trainer-sidebar" className="stroop-trainer-sidebar" aria-label={modeLabel}>
              {controlsPanel}
            </aside>
          )}

          <div className="stroop-trainer-main">
            <div className="stroop-trainer-stats" aria-live="polite">
              <div className="stroop-stat-tile">
                <span className="stroop-stat-label">
                  <FontAwesomeIcon icon="clock" className="me-2" />
                  {t('games.stroop.trainer.timer')}
                </span>
                <strong className="stroop-stat-value tabular-nums">
                  {formatDuration(
                    modeConfig.timeLimitMs !== null && status !== 'completed'
                      ? Math.min(elapsedMs, modeConfig.timeLimitMs)
                      : elapsedMs,
                  )}
                </strong>
              </div>
              <div className="stroop-stat-tile">
                <span className="stroop-stat-label">
                  <FontAwesomeIcon icon="palette" className="me-2" />
                  {t('games.stroop.trainer.score')}
                </span>
                <strong className="stroop-stat-value tabular-nums">{currentScore}</strong>
              </div>
              <div className="stroop-stat-tile">
                <span className="stroop-stat-label">
                  <FontAwesomeIcon icon="clipboard-list" className="me-2" />
                  {t('games.stroop.trainer.mistakes')}
                </span>
                <strong className="stroop-stat-value tabular-nums">{mistakes}</strong>
              </div>
            </div>

            <div className="stroop-progress" aria-hidden="true">
              <div className="stroop-progress-bar" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>

            <div
              className={[
                'stroop-task-card',
                task.congruent ? 'is-congruent' : 'is-incongruent',
                lastChoiceState === 'correct' ? 'is-correct' : '',
                lastChoiceState === 'wrong' ? 'is-wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="stroop-task-header">
                <span className="stroop-task-eyebrow">{t('games.stroop.trainer.currentPrompt')}</span>
                <strong className="stroop-task-rule">{t('games.stroop.trainer.rule')}</strong>
              </div>

              <div className="stroop-task-word" style={{ color: wordColor.hex }}>
                {currentTaskWord}
              </div>

              <div className="stroop-task-meta">
                <span>{t('games.stroop.trainer.wordSays', { word: currentTaskWord })}</span>
                {showHint && <span>{t('games.stroop.trainer.inkHint', { color: targetInkLabel })}</span>}
              </div>
            </div>

            <div className="stroop-choice-grid" role="group" aria-label={t('games.stroop.trainer.choiceGroup')}>
              {choices.map(choice => (
                <button
                  key={choice.id}
                  type="button"
                  className="stroop-choice-button"
                  style={{
                    ['--stroop-choice-color' as string]: choice.hex,
                    ['--stroop-choice-bg' as string]: choice.bg,
                    ['--stroop-choice-border' as string]: choice.border,
                    ['--stroop-choice-text' as string]: choice.hex,
                  }}
                  onClick={() => handleChoice(choice.id)}
                  disabled={status === 'completed'}
                >
                  <span className="stroop-choice-swatch" aria-hidden="true" />
                  <span className="stroop-choice-label">{t(`games.stroop.colors.${choice.id}`)}</span>
                </button>
              ))}
            </div>

            <div className="stroop-trainer-footer">
              {lastResult ? (
                <div className="stroop-trainer-complete">
                  <FontAwesomeIcon icon="check-circle" className="me-2" />
                  {t('games.stroop.trainer.completeMessage', {
                    score: lastResult.score,
                    accuracy: formatAccuracy(lastResult.accuracy),
                    avgMs: lastResult.avgReactionMs,
                  })}
                </div>
              ) : (
                <p className="stroop-trainer-tip mb-0">
                  {showHint ? t('games.stroop.trainer.tipWithHint') : t('games.stroop.trainer.tip')}
                </p>
              )}

              <div className="stroop-trainer-meta">
                <span>
                  <strong>{t('games.stroop.trainer.accuracy')}:</strong> {formatAccuracy(accuracy)}
                </span>
                <span>
                  <strong>{t('games.stroop.trainer.avgReaction')}:</strong> {Math.round(averageReactionMs)} ms
                </span>
                <span>
                  <strong>{t('games.stroop.trainer.modeLabel')}:</strong>{' '}
                  {t(`games.stroop.trainer.modes.${mode}.title`)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>

      {isMobile && (
        <Offcanvas
          show={isMobileControlsOpen}
          onHide={() => setIsMobileControlsOpen(false)}
          placement={isCompactMobile ? 'bottom' : 'start'}
          className="stroop-controls-offcanvas"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{t('games.stroop.trainer.controls')}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>{controlsPanel}</Offcanvas.Body>
        </Offcanvas>
      )}
    </Card>
  );
}
