'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@/hooks/useMediaQuery';

type VisualMemoryMode = 'easy' | 'standard' | 'expert';
type TrainerStatus = 'idle' | 'memorize' | 'guess' | 'completed';
type BestResult = {
  level: number;
  score: number;
  rememberedTiles: number;
};
type BestResults = Partial<Record<VisualMemoryMode, BestResult>>;
type BestResultsUpdater = BestResults | ((current: BestResults) => BestResults);

type ModeConfig = {
  size: 3 | 4 | 5;
  flashMs: number;
  baseRevealCount: number;
};

type RevealAccent = {
  bg: string;
  border: string;
  glow: string;
};

const MODE_CONFIGS: Readonly<Record<VisualMemoryMode, ModeConfig>> = {
  easy: {
    size: 3,
    flashMs: 1100,
    baseRevealCount: 3,
  },
  standard: {
    size: 4,
    flashMs: 950,
    baseRevealCount: 4,
  },
  expert: {
    size: 5,
    flashMs: 850,
    baseRevealCount: 5,
  },
} as const;

const DEFAULT_MODE: VisualMemoryMode = 'standard';
const BEST_RESULTS_STORAGE_KEY = 'visual-memory-best-results-v1';
const MODE_STORAGE_KEY = 'visual-memory-mode-v1';
const HINT_STORAGE_KEY = 'visual-memory-show-hint-v1';
const REVEAL_ACCENTS: readonly RevealAccent[] = [
  { bg: '#f59e0b', border: '#d97706', glow: '#fbbf24' },
  { bg: '#14b8a6', border: '#0f766e', glow: '#2dd4bf' },
  { bg: '#eab308', border: '#ca8a04', glow: '#fde047' },
  { bg: '#8b5cf6', border: '#6d28d9', glow: '#a78bfa' },
  { bg: '#f97316', border: '#ea580c', glow: '#fb923c' },
] as const;

export const getCurrentTimeMs = (): number => Date.now();
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const formatDuration = (ms: number) => {
  const safe = Math.max(0, Math.round(ms));
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const centiseconds = Math.floor((safe % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds
    .toString()
    .padStart(2, '0')}`;
};

export const parseStoredMode = (raw: string | null): VisualMemoryMode | null => {
  if (raw === 'easy' || raw === 'standard' || raw === 'expert') {
    return raw;
  }
  return null;
};

export const parseStoredShowHint = (raw: string | null): boolean | null => {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
};

export const parseStoredBestResults = (raw: string | null): BestResults => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, BestResult>;
    const next: BestResults = {};
    for (const mode of Object.keys(MODE_CONFIGS) as VisualMemoryMode[]) {
      const value = parsed[mode];
      if (
        value &&
        typeof value.level === 'number' &&
        typeof value.score === 'number' &&
        typeof value.rememberedTiles === 'number'
      ) {
        next[mode] = {
          level: Math.max(1, Math.round(value.level)),
          score: Math.max(0, Math.round(value.score)),
          rememberedTiles: Math.max(0, Math.round(value.rememberedTiles)),
        };
      }
    }
    return next;
  } catch {
    return {};
  }
};

export const createDeterministicPattern = (mode: VisualMemoryMode): number[] => {
  const { size, baseRevealCount } = MODE_CONFIGS[mode];
  return Array.from({ length: baseRevealCount }, (_, index) => index % (size * size));
};

export const createPattern = (mode: VisualMemoryMode, level: number): number[] => {
  const { size, baseRevealCount } = MODE_CONFIGS[mode];
  const cellCount = size * size;
  const revealCount = Math.min(cellCount, baseRevealCount + level - 1);
  const selected = new Set<number>();

  while (selected.size < revealCount) {
    selected.add(Math.floor(Math.random() * cellCount));
  }

  return Array.from(selected).sort((a, b) => a - b);
};

export const getRevealAccent = (cellIndex: number): RevealAccent => REVEAL_ACCENTS[cellIndex % REVEAL_ACCENTS.length];

export const getUpdatedBestResults = (
  currentBestResults: BestResults,
  mode: VisualMemoryMode,
  nextResult: BestResult,
): BestResults => {
  const previousBest = currentBestResults[mode];
  if (!previousBest) {
    return { ...currentBestResults, [mode]: nextResult };
  }

  if (nextResult.level < previousBest.level) {
    return currentBestResults;
  }

  if (nextResult.level === previousBest.level && nextResult.score <= previousBest.score) {
    return currentBestResults;
  }

  return { ...currentBestResults, [mode]: nextResult };
};

export default function VisualMemoryTrainer() {
  const { t } = useTranslation('games');
  const isMobile = useMediaQuery('(max-width: 991px)');
  const isCompactMobile = useMediaQuery('(max-width: 575px)');
  const [mode, setMode] = React.useState<VisualMemoryMode>(DEFAULT_MODE);
  const [status, setStatus] = React.useState<TrainerStatus>('idle');
  const [isMobileControlsOpen, setIsMobileControlsOpen] = React.useState(false);
  const [showHint, setShowHint] = React.useState(true);
  const [level, setLevel] = React.useState(1);
  const [score, setScore] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [startedAtMs, setStartedAtMs] = React.useState<number | null>(null);
  const [activePattern, setActivePattern] = React.useState<number[]>(() => createDeterministicPattern(DEFAULT_MODE));
  const [selectedCells, setSelectedCells] = React.useState<number[]>([]);
  const [lastMissedCell, setLastMissedCell] = React.useState<number | null>(null);
  const [bestResults, setBestResults] = React.useState<BestResults>({});
  const [lastResult, setLastResult] = React.useState<BestResult | null>(null);
  const hidePatternTimeoutRef = React.useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const nextRoundTimeoutRef = React.useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const modeConfig = MODE_CONFIGS[mode];
  const cellCount = modeConfig.size * modeConfig.size;
  const activePatternSet = React.useMemo(() => new Set(activePattern), [activePattern]);
  const selectedCellSet = React.useMemo(() => new Set(selectedCells), [selectedCells]);
  const currentBest = bestResults[mode] ?? null;
  const progressPercent = activePattern.length > 0 ? (selectedCells.length / activePattern.length) * 100 : 0;
  const rememberedTiles = Math.max(0, score / 100);
  const statusLabel = t(`games.visualMemory.trainer.status.${status}`);
  const modeOptions = Object.keys(MODE_CONFIGS) as VisualMemoryMode[];
  const mobileControlsToggleLabel = isMobileControlsOpen
    ? t('games.visualMemory.trainer.hideControls')
    : t('games.visualMemory.trainer.showControls');

  const persistBestResults = React.useCallback((updater: BestResultsUpdater) => {
    setBestResults(currentBestResults => {
      const nextBestResults = typeof updater === 'function' ? updater(currentBestResults) : updater;
      if (globalThis.localStorage !== undefined) {
        globalThis.localStorage.setItem(BEST_RESULTS_STORAGE_KEY, JSON.stringify(nextBestResults));
      }
      return nextBestResults;
    });
  }, []);

  const clearTimers = React.useCallback(() => {
    if (hidePatternTimeoutRef.current !== null) {
      globalThis.clearTimeout(hidePatternTimeoutRef.current);
      hidePatternTimeoutRef.current = null;
    }
    if (nextRoundTimeoutRef.current !== null) {
      globalThis.clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  const initializeGame = React.useCallback(
    (nextMode: VisualMemoryMode) => {
      clearTimers();
      setMode(nextMode);
      setStatus('idle');
      setLevel(1);
      setScore(0);
      setMistakes(0);
      setElapsedMs(0);
      setStartedAtMs(null);
      setActivePattern(createDeterministicPattern(nextMode));
      setSelectedCells([]);
      setLastMissedCell(null);
      setLastResult(null);
    },
    [clearTimers],
  );

  React.useEffect(() => {
    if (status === 'idle' || status === 'completed' || startedAtMs === null) {
      return;
    }

    const interval = globalThis.setInterval(() => {
      setElapsedMs(getCurrentTimeMs() - startedAtMs);
    }, 50);

    return () => globalThis.clearInterval(interval);
  }, [startedAtMs, status]);

  React.useEffect(() => {
    if (lastMissedCell === null) {
      return;
    }

    const timeout = globalThis.setTimeout(() => setLastMissedCell(null), 240);
    return () => globalThis.clearTimeout(timeout);
  }, [lastMissedCell]);

  const prepareRound = React.useCallback(
    (nextMode: VisualMemoryMode, nextLevel: number, existingPattern?: number[]) => {
      clearTimers();
      const pattern = existingPattern ?? createPattern(nextMode, nextLevel);
      setActivePattern(pattern);
      setSelectedCells([]);
      setLastMissedCell(null);
      setLastResult(null);
      setStatus('memorize');

      hidePatternTimeoutRef.current = globalThis.setTimeout(() => {
        setStatus('guess');
      }, MODE_CONFIGS[nextMode].flashMs);
    },
    [clearTimers],
  );

  const startNewGame = React.useCallback(
    (nextMode: VisualMemoryMode) => {
      clearTimers();
      setMode(nextMode);
      setLevel(1);
      setScore(0);
      setMistakes(0);
      setElapsedMs(0);
      setLastResult(null);
      setStartedAtMs(getCurrentTimeMs());
      prepareRound(nextMode, 1);
    },
    [clearTimers, prepareRound],
  );

  const restartCurrentLevel = React.useCallback(() => {
    if (status === 'idle') {
      startNewGame(mode);
      setIsMobileControlsOpen(false);
      return;
    }
    setElapsedMs(0);
    setMistakes(0);
    setStartedAtMs(getCurrentTimeMs());
    prepareRound(mode, level, activePattern);
    setIsMobileControlsOpen(false);
  }, [activePattern, level, mode, prepareRound, startNewGame, status]);

  React.useEffect(() => {
    if (globalThis.localStorage === undefined) {
      initializeGame(DEFAULT_MODE);
      return;
    }

    const storedMode = parseStoredMode(globalThis.localStorage.getItem(MODE_STORAGE_KEY)) ?? DEFAULT_MODE;
    const storedBestResults = parseStoredBestResults(globalThis.localStorage.getItem(BEST_RESULTS_STORAGE_KEY));
    const storedShowHint = parseStoredShowHint(globalThis.localStorage.getItem(HINT_STORAGE_KEY));

    setBestResults(storedBestResults);
    if (storedShowHint !== null) {
      setShowHint(storedShowHint);
    }
    initializeGame(storedMode);
  }, [initializeGame]);

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

  const completeGame = React.useCallback(
    (nextMistakes: number) => {
      clearTimers();
      const elapsed = startedAtMs === null ? elapsedMs : clamp(getCurrentTimeMs() - startedAtMs, 0, 60 * 60 * 1000);
      const result = {
        level,
        score,
        rememberedTiles,
      } satisfies BestResult;
      setElapsedMs(elapsed);
      setMistakes(nextMistakes);
      setStatus('completed');
      setLastResult(result);
      persistBestResults(currentBestResults => getUpdatedBestResults(currentBestResults, mode, result));
    },
    [clearTimers, elapsedMs, level, mode, persistBestResults, rememberedTiles, score, startedAtMs],
  );

  const handleModeChange = (nextMode: VisualMemoryMode) => {
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    }
    initializeGame(nextMode);
    setIsMobileControlsOpen(false);
  };

  const handleCellClick = (cellIndex: number) => {
    if (status !== 'guess' || selectedCellSet.has(cellIndex)) {
      return;
    }

    if (!activePatternSet.has(cellIndex)) {
      const nextMistakes = mistakes + 1;
      setLastMissedCell(cellIndex);
      completeGame(nextMistakes);
      return;
    }

    const nextSelectedCells = [...selectedCells, cellIndex];
    setSelectedCells(nextSelectedCells);

    if (nextSelectedCells.length < activePattern.length) {
      return;
    }

    const nextLevel = level + 1;
    const nextScore = score + activePattern.length * 100;
    setScore(nextScore);
    setLevel(nextLevel);
    setStatus('memorize');
    nextRoundTimeoutRef.current = globalThis.setTimeout(() => {
      prepareRound(mode, nextLevel);
    }, 260);
  };

  const controlsPanel = (
    <div className="visual-memory-trainer-controls stack stack-16">
      <div className="visual-memory-sidebar-section stack stack-8">
        <span className="visual-memory-control-label">{t('games.visualMemory.trainer.mode')}</span>
        <div className="visual-memory-mode-list" role="radiogroup" aria-label={t('games.visualMemory.trainer.mode')}>
          {modeOptions.map(modeOption => {
            const isActive = modeOption === mode;
            return (
              <button
                key={modeOption}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={['visual-memory-mode-option', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                onClick={() => handleModeChange(modeOption)}
              >
                <span className="visual-memory-mode-option-title">
                  {t(`games.visualMemory.trainer.modes.${modeOption}.title`)}
                </span>
                <span className="visual-memory-mode-option-copy">
                  {t(`games.visualMemory.trainer.modes.${modeOption}.copy`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="visual-memory-sidebar-section stack stack-8">
        <span className="visual-memory-control-label">{t('games.visualMemory.trainer.statusLabel')}</span>
        <div className="visual-memory-sidebar-meta">
          <div className="visual-memory-sidebar-meta-item">
            <span>{t('games.visualMemory.trainer.statusLabel')}</span>
            <strong>{statusLabel}</strong>
          </div>
          <div className="visual-memory-sidebar-meta-item">
            <span>{t('games.visualMemory.trainer.bestLevel')}</span>
            <strong>{currentBest ? currentBest.level : t('games.visualMemory.trainer.noBestYet')}</strong>
          </div>
        </div>
      </div>

      <div className="visual-memory-sidebar-section stack stack-8">
        <span className="visual-memory-control-label">{t('games.visualMemory.trainer.actions')}</span>
        <div className="visual-memory-action-list">
          <Button type="button" variant="primary" size="sm" onClick={() => startNewGame(mode)}>
            {t('games.visualMemory.trainer.newRound')}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={restartCurrentLevel}>
            {t('games.visualMemory.trainer.restart')}
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
            {t('games.visualMemory.trainer.clearBest')}
          </Button>
        </div>
      </div>

      <div className="visual-memory-sidebar-section visual-memory-sidebar-switch">
        <Form.Check
          id="visual-memory-show-hint"
          type="switch"
          checked={showHint}
          onChange={event => setShowHint(event.target.checked)}
          label={t('games.visualMemory.trainer.showHint')}
        />
      </div>
    </div>
  );

  return (
    <Card className="visual-memory-trainer-card">
      <Card.Body className="visual-memory-trainer-body">
        <button
          type="button"
          className="visual-memory-mobile-controls-toggle"
          aria-expanded={isMobileControlsOpen}
          aria-controls="visual-memory-trainer-sidebar"
          onClick={() => setIsMobileControlsOpen(previous => !previous)}
        >
          <span className="visual-memory-mobile-controls-toggle-label">{t('games.visualMemory.trainer.controls')}</span>
          <span className="visual-memory-mobile-controls-toggle-state">{mobileControlsToggleLabel}</span>
        </button>

        <div className="visual-memory-trainer-layout">
          {!isMobile && (
            <aside
              id="visual-memory-trainer-sidebar"
              className="visual-memory-trainer-sidebar"
              aria-label={t('games.visualMemory.trainer.mode')}
            >
              {controlsPanel}
            </aside>
          )}

          <div className="visual-memory-trainer-main">
            <div className="visual-memory-trainer-stats" aria-live="polite">
              <div className="visual-memory-stat-tile">
                <span className="visual-memory-stat-label">
                  <FontAwesomeIcon icon="clock" className="me-2" />
                  {t('games.visualMemory.trainer.timer')}
                </span>
                <strong className="visual-memory-stat-value tabular-nums">{formatDuration(elapsedMs)}</strong>
              </div>
              <div className="visual-memory-stat-tile">
                <span className="visual-memory-stat-label">
                  <FontAwesomeIcon icon="layer-group" className="me-2" />
                  {t('games.visualMemory.trainer.level')}
                </span>
                <strong className="visual-memory-stat-value tabular-nums">{level}</strong>
              </div>
              <div className="visual-memory-stat-tile">
                <span className="visual-memory-stat-label">
                  <FontAwesomeIcon icon="palette" className="me-2" />
                  {t('games.visualMemory.trainer.score')}
                </span>
                <strong className="visual-memory-stat-value tabular-nums">{score}</strong>
              </div>
              <div className="visual-memory-stat-tile">
                <span className="visual-memory-stat-label">
                  <FontAwesomeIcon icon="clipboard-list" className="me-2" />
                  {t('games.visualMemory.trainer.mistakes')}
                </span>
                <strong className="visual-memory-stat-value tabular-nums">{mistakes}</strong>
              </div>
            </div>

            <div className="visual-memory-progress" aria-hidden="true">
              <div className="visual-memory-progress-bar" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>

            <div className="visual-memory-board-card">
              <div className="visual-memory-board-header">
                <span className="visual-memory-board-eyebrow">{t('games.visualMemory.trainer.currentRound')}</span>
                <strong className="visual-memory-board-rule">
                  {status === 'idle'
                    ? t('games.visualMemory.trainer.idleRule')
                    : status === 'memorize'
                      ? t('games.visualMemory.trainer.memorizeRule', { count: activePattern.length })
                      : t('games.visualMemory.trainer.recallRule', { count: activePattern.length })}
                </strong>
              </div>

              <div className="visual-memory-board-meta">
                <span>{t('games.visualMemory.trainer.gridHint', { size: modeConfig.size })}</span>
                {showHint && (
                  <span>{t('games.visualMemory.trainer.patternHint', { count: activePattern.length })}</span>
                )}
              </div>

              <div
                className="visual-memory-grid"
                style={{ ['--visual-memory-grid-size' as string]: String(modeConfig.size) }}
              >
                {Array.from({ length: cellCount }, (_, index) => {
                  const isPatternCell = activePatternSet.has(index);
                  const isSelected = selectedCellSet.has(index);
                  const isMissed = lastMissedCell === index;
                  const revealAccent = getRevealAccent(index);
                  const className = [
                    'visual-memory-cell',
                    status === 'memorize' && isPatternCell ? 'is-pattern' : '',
                    isSelected ? 'is-selected' : '',
                    isMissed ? 'is-missed' : '',
                    status === 'guess' ? 'is-clickable' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <button
                      key={index}
                      type="button"
                      className={className}
                      style={
                        status === 'memorize' && isPatternCell
                          ? ({
                              ['--visual-memory-cell-accent' as string]: revealAccent.bg,
                              ['--visual-memory-cell-accent-border' as string]: revealAccent.border,
                              ['--visual-memory-cell-accent-glow' as string]: revealAccent.glow,
                            } as React.CSSProperties)
                          : undefined
                      }
                      onClick={() => handleCellClick(index)}
                      disabled={status !== 'guess' || isSelected}
                      aria-label={t('games.visualMemory.trainer.cellAriaLabel', { index: index + 1 })}
                    >
                      <span className="visual-memory-cell-inner" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="visual-memory-trainer-footer">
              {lastResult ? (
                <div className="visual-memory-trainer-complete">
                  <FontAwesomeIcon icon="check-circle" className="me-2" />
                  {t('games.visualMemory.trainer.completeMessage', {
                    level: lastResult.level,
                    score: lastResult.score,
                    tiles: lastResult.rememberedTiles,
                  })}
                </div>
              ) : (
                <p className="visual-memory-trainer-tip mb-0">
                  {showHint ? t('games.visualMemory.trainer.tipWithHint') : t('games.visualMemory.trainer.tip')}
                </p>
              )}

              <div className="visual-memory-trainer-meta">
                <span>
                  <strong>{t('games.visualMemory.trainer.targetTiles')}:</strong> {activePattern.length}
                </span>
                <span>
                  <strong>{t('games.visualMemory.trainer.rememberedTiles')}:</strong> {rememberedTiles}
                </span>
                <span>
                  <strong>{t('games.visualMemory.trainer.modeLabel')}:</strong>{' '}
                  {t(`games.visualMemory.trainer.modes.${mode}.title`)}
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
          className="visual-memory-controls-offcanvas"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{t('games.visualMemory.trainer.controls')}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>{controlsPanel}</Offcanvas.Body>
        </Offcanvas>
      )}
    </Card>
  );
}
