'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useMediaQuery from '@/hooks/useMediaQuery';

type GridSize = 3 | 4 | 5 | 6 | 7 | 8 | 9;
type PlayMode = 'classic' | 'reverse';
type TrainerStatus = 'idle' | 'running' | 'completed';
type BestTimeKey = `${GridSize}-${PlayMode}`;
type BestTimes = Partial<Record<BestTimeKey, number>>;
type BestTimesUpdater = BestTimes | ((current: BestTimes) => BestTimes);
type RecentRun = {
  size: GridSize;
  mode: PlayMode;
  durationMs: number;
  mistakes: number;
};
type CellPaletteItem = {
  bg: string;
  fg: string;
  border: string;
};

const GRID_SIZES: readonly GridSize[] = [3, 4, 5, 6, 7, 8, 9] as const;
const DEFAULT_GRID_SIZE: GridSize = 5;
const DEFAULT_PLAY_MODE: PlayMode = 'classic';
const STORAGE_KEY = 'schulte-table-best-times-v1';
const GRID_SIZE_STORAGE_KEY = 'schulte-table-grid-size-v1';
const PLAY_MODE_STORAGE_KEY = 'schulte-table-play-mode-v1';
const SHOW_HINT_STORAGE_KEY = 'schulte-table-show-hint-v1';
const RECENT_RUNS_STORAGE_KEY = 'schulte-table-recent-runs-v1';
const MAX_RECENT_RUNS = 5;
const CELL_PALETTE: readonly CellPaletteItem[] = [
  { bg: '#2b83c6', fg: '#ffffff', border: '#2f6f99' },
  { bg: '#46b68b', fg: '#ffffff', border: '#2f8f6d' },
  { bg: '#c8b31f', fg: '#ffffff', border: '#9d8c18' },
  { bg: '#7a3fd1', fg: '#ffffff', border: '#5e31a3' },
  { bg: '#bf4a9f', fg: '#ffffff', border: '#92397b' },
  { bg: '#ce3a3a', fg: '#ffffff', border: '#a52e2e' },
  { bg: '#d08a2f', fg: '#ffffff', border: '#a96d23' },
  { bg: '#86a937', fg: '#ffffff', border: '#69852b' },
  { bg: '#59b7c6', fg: '#ffffff', border: '#438e9a' },
  { bg: '#ff7a1a', fg: '#ffffff', border: '#d96310' },
  { bg: '#1f5fbf', fg: '#ffffff', border: '#194f9d' },
  { bg: '#d53ae2', fg: '#ffffff', border: '#ac2eb6' },
  { bg: '#16d94f', fg: '#ffffff', border: '#11aa3d' },
  { bg: '#ef1515', fg: '#ffffff', border: '#c21111' },
  { bg: '#f2cc0f', fg: '#ffffff', border: '#c8a90f' },
  { bg: '#226a9b', fg: '#ffffff', border: '#1a5277' },
  { bg: '#7a7d1f', fg: '#ffffff', border: '#5f6118' },
  { bg: '#2e9f83', fg: '#ffffff', border: '#237a65' },
] as const;

export const shuffle = (values: number[]): number[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const createOrderedBoard = (size: GridSize): number[] =>
  Array.from({ length: size * size }, (_, index) => index + 1);
export const createBoard = (size: GridSize): number[] =>
  shuffle(Array.from({ length: size * size }, (_, index) => index + 1));
export const getCurrentTimeMs = (): number => Date.now();
export const getBestTimeKey = (size: GridSize, mode: PlayMode): BestTimeKey => `${size}-${mode}`;
export const getInitialTarget = (size: GridSize, mode: PlayMode) => (mode === 'reverse' ? size * size : 1);
export const getNextTarget = (target: number, mode: PlayMode) => target + (mode === 'reverse' ? -1 : 1);
export const chunkBoardRows = (values: readonly number[], size: GridSize): number[][] => {
  const rows: number[][] = [];
  for (let index = 0; index < values.length; index += size) {
    rows.push(values.slice(index, index + size));
  }
  return rows;
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const formatDuration = (ms: number) => {
  const safe = Math.max(0, Math.round(ms));
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const centiseconds = Math.floor((safe % 1000) / 10);
  const parts = [minutes, seconds].map(value => value.toString().padStart(2, '0'));
  return `${parts.join(':')}.${centiseconds.toString().padStart(2, '0')}`;
};

export const parseStoredBestTimes = (raw: string | null): BestTimes => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: BestTimes = {};
    for (const size of GRID_SIZES) {
      const legacyCandidate = parsed[String(size)];
      if (typeof legacyCandidate === 'number' && Number.isFinite(legacyCandidate) && legacyCandidate > 0) {
        next[getBestTimeKey(size, 'classic')] = Math.round(legacyCandidate);
      }

      for (const mode of ['classic', 'reverse'] as const) {
        const candidate = parsed[getBestTimeKey(size, mode)];
        if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
          next[getBestTimeKey(size, mode)] = Math.round(candidate);
        }
      }
    }
    return next;
  } catch {
    return {};
  }
};

export const parseStoredGridSize = (raw: string | null): GridSize | null => {
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return GRID_SIZES.includes(parsed as GridSize) ? (parsed as GridSize) : null;
};

export const parseStoredPlayMode = (raw: string | null): PlayMode | null => {
  if (raw === 'classic' || raw === 'reverse') {
    return raw;
  }

  return null;
};

export const parseStoredShowHint = (raw: string | null): boolean | null => {
  if (raw === null) {
    return null;
  }

  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    return false;
  }

  return null;
};

export const parseStoredRecentRuns = (raw: string | null): RecentRun[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as RecentRun[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        run =>
          typeof run?.durationMs === 'number' &&
          run.durationMs > 0 &&
          typeof run?.mistakes === 'number' &&
          run.mistakes >= 0 &&
          GRID_SIZES.includes(run?.size) &&
          (run?.mode === 'classic' || run?.mode === 'reverse'),
      )
      .slice(0, MAX_RECENT_RUNS)
      .map(run => ({
        size: run.size,
        mode: run.mode,
        durationMs: Math.round(run.durationMs),
        mistakes: Math.round(run.mistakes),
      }));
  } catch {
    return [];
  }
};

export default function SchulteTableTrainer() {
  const { t, i18n } = useTranslation('games');
  const isMobile = useMediaQuery('(max-width: 991px)');
  const isCompactMobile = useMediaQuery('(max-width: 575px)');
  const [size, setSize] = React.useState<GridSize>(DEFAULT_GRID_SIZE);
  const [mode, setMode] = React.useState<PlayMode>(DEFAULT_PLAY_MODE);
  const [cells, setCells] = React.useState<number[]>(() => createOrderedBoard(DEFAULT_GRID_SIZE));
  const [isMobileControlsOpen, setIsMobileControlsOpen] = React.useState(false);
  const [target, setTarget] = React.useState(getInitialTarget(DEFAULT_GRID_SIZE, DEFAULT_PLAY_MODE));
  const [foundNumbers, setFoundNumbers] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<TrainerStatus>('idle');
  const [startedAtMs, setStartedAtMs] = React.useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [showNextHint, setShowNextHint] = React.useState(true);
  const [lastResultMs, setLastResultMs] = React.useState<number | null>(null);
  const [bestTimes, setBestTimes] = React.useState<BestTimes>({});
  const [recentRuns, setRecentRuns] = React.useState<RecentRun[]>([]);
  const [lastWrongNumber, setLastWrongNumber] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (status !== 'running' || startedAtMs === null) {
      return;
    }

    const interval = globalThis.setInterval(() => {
      setElapsedMs(Date.now() - startedAtMs);
    }, 50);

    return () => globalThis.clearInterval(interval);
  }, [startedAtMs, status]);

  React.useEffect(() => {
    if (lastWrongNumber === null) {
      return;
    }

    const timeout = globalThis.setTimeout(() => setLastWrongNumber(null), 220);
    return () => globalThis.clearTimeout(timeout);
  }, [lastWrongNumber]);

  const totalCells = size * size;
  const foundSet = React.useMemo(() => new Set(foundNumbers), [foundNumbers]);
  const isCompleted = status === 'completed';
  const progressPercent = (foundNumbers.length / totalCells) * 100;
  const displayTime = isCompleted ? (lastResultMs ?? elapsedMs) : elapsedMs;
  const currentBest = bestTimes[getBestTimeKey(size, mode)] ?? null;
  const cellRows = React.useMemo(() => chunkBoardRows(cells, size), [cells, size]);

  const persistBestTimes = React.useCallback((updater: BestTimesUpdater) => {
    setBestTimes(currentBestTimes => {
      const nextBestTimes = typeof updater === 'function' ? updater(currentBestTimes) : updater;
      if (globalThis.localStorage !== undefined) {
        globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBestTimes));
      }
      return nextBestTimes;
    });
  }, []);

  const persistRecentRuns = React.useCallback((updater: RecentRun[] | ((current: RecentRun[]) => RecentRun[])) => {
    setRecentRuns(currentRecentRuns => {
      const nextRecentRuns = typeof updater === 'function' ? updater(currentRecentRuns) : updater;
      if (globalThis.localStorage !== undefined) {
        globalThis.localStorage.setItem(RECENT_RUNS_STORAGE_KEY, JSON.stringify(nextRecentRuns));
      }
      return nextRecentRuns;
    });
  }, []);

  const resetRoundState = React.useCallback(
    (nextSize: GridSize, nextMode: PlayMode, options?: { preserveHint?: boolean }) => {
      setTarget(getInitialTarget(nextSize, nextMode));
      setFoundNumbers([]);
      setStatus('idle');
      setStartedAtMs(null);
      setElapsedMs(0);
      setMistakes(0);
      setLastResultMs(null);
      setLastWrongNumber(null);
      if (options?.preserveHint !== true) {
        setShowNextHint(true);
      }
    },
    [],
  );

  const resetRound = React.useCallback(
    (nextSize: GridSize, nextMode: PlayMode, options?: { preserveHint?: boolean }) => {
      setCells(createBoard(nextSize));
      resetRoundState(nextSize, nextMode, options);
    },
    [resetRoundState],
  );

  const restartCurrentBoard = () => {
    resetRoundState(size, mode, { preserveHint: true });
    setIsMobileControlsOpen(false);
  };

  React.useEffect(() => {
    if (globalThis.localStorage === undefined) {
      return;
    }

    const storedBestTimes = parseStoredBestTimes(globalThis.localStorage.getItem(STORAGE_KEY));
    const storedGridSize =
      parseStoredGridSize(globalThis.localStorage.getItem(GRID_SIZE_STORAGE_KEY)) ?? DEFAULT_GRID_SIZE;
    const storedPlayMode =
      parseStoredPlayMode(globalThis.localStorage.getItem(PLAY_MODE_STORAGE_KEY)) ?? DEFAULT_PLAY_MODE;
    const storedShowHint = parseStoredShowHint(globalThis.localStorage.getItem(SHOW_HINT_STORAGE_KEY));
    const storedRecentRuns = parseStoredRecentRuns(globalThis.localStorage.getItem(RECENT_RUNS_STORAGE_KEY));

    setBestTimes(storedBestTimes);
    setRecentRuns(storedRecentRuns);
    setSize(storedGridSize);
    setMode(storedPlayMode);
    setCells(createBoard(storedGridSize));
    if (storedShowHint !== null) {
      setShowNextHint(storedShowHint);
    }
    resetRoundState(storedGridSize, storedPlayMode, { preserveHint: true });
  }, [resetRoundState]);

  React.useEffect(() => {
    if (!isMobile) {
      setIsMobileControlsOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (globalThis.localStorage === undefined) {
      return;
    }

    globalThis.localStorage.setItem(SHOW_HINT_STORAGE_KEY, String(showNextHint));
  }, [showNextHint]);

  const handleSizeChange = (nextSize: GridSize) => {
    setSize(nextSize);
    resetRound(nextSize, mode, { preserveHint: true });
    setIsMobileControlsOpen(false);
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem(GRID_SIZE_STORAGE_KEY, String(nextSize));
    }
  };

  const handleModeChange = (nextMode: PlayMode) => {
    setMode(nextMode);
    resetRound(size, nextMode, { preserveHint: true });
    setIsMobileControlsOpen(false);
    if (globalThis.localStorage !== undefined) {
      globalThis.localStorage.setItem(PLAY_MODE_STORAGE_KEY, nextMode);
    }
  };

  const startTimerIfNeeded = () => {
    if (status !== 'idle') {
      return startedAtMs ?? getCurrentTimeMs();
    }
    const now = getCurrentTimeMs();
    setStatus('running');
    setStartedAtMs(now);
    setElapsedMs(0);
    return now;
  };

  const completeRound = (finishMs: number) => {
    setStatus('completed');
    setElapsedMs(finishMs);
    setLastResultMs(finishMs);
    persistRecentRuns(currentRecentRuns =>
      [{ size, mode, durationMs: finishMs, mistakes }, ...currentRecentRuns].slice(0, MAX_RECENT_RUNS),
    );
    persistBestTimes(currentBestTimes => {
      const bestTimeKey = getBestTimeKey(size, mode);
      const previousBest = currentBestTimes[bestTimeKey];
      if (previousBest !== undefined && finishMs >= previousBest) {
        return currentBestTimes;
      }
      return { ...currentBestTimes, [bestTimeKey]: finishMs };
    });
  };

  const handleCellClick = (value: number) => {
    if (isCompleted || foundSet.has(value)) {
      return;
    }

    const effectiveStartMs = startTimerIfNeeded();

    if (value !== target) {
      setMistakes(previous => previous + 1);
      setLastWrongNumber(value);
      return;
    }

    const nextFound = [...foundNumbers, value];
    setFoundNumbers(nextFound);

    if (nextFound.length >= totalCells) {
      const finishMs = clamp(getCurrentTimeMs() - effectiveStartMs, 0, 60 * 60 * 1000);
      completeRound(finishMs);
      return;
    }

    setTarget(getNextTarget(value, mode));
  };

  const nextHintNumber = status === 'completed' ? null : target;
  const actionsLabel = t('games.schulte.trainer.actions');
  let resolvedActionsLabel = actionsLabel;
  if (actionsLabel === 'games.schulte.trainer.actions') {
    resolvedActionsLabel = i18n.resolvedLanguage?.startsWith('tr') ? 'Aksiyonlar' : 'Actions';
  }
  const mobileControlsToggleLabel = isMobileControlsOpen
    ? t('games.schulte.trainer.hideControls')
    : t('games.schulte.trainer.showControls');
  const controlsPanel = (
    <div className="schulte-trainer-controls stack stack-16">
      <div className="schulte-sidebar-section stack stack-8">
        <span className="schulte-control-label">{t('games.schulte.trainer.mode')}</span>
        <div className="schulte-mode-list" role="radiogroup" aria-label={t('games.schulte.trainer.mode')}>
          {(['classic', 'reverse'] as const).map(modeOption => {
            const isActive = modeOption === mode;

            return (
              <button
                key={modeOption}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={['schulte-mode-option', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                onClick={() => handleModeChange(modeOption)}
              >
                <span className="schulte-mode-option-title">
                  {t(`games.schulte.trainer.modes.${modeOption}.title`)}
                </span>
                <span className="schulte-mode-option-copy">{t(`games.schulte.trainer.modes.${modeOption}.copy`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="schulte-sidebar-section stack stack-8">
        <span className="schulte-control-label">{t('games.schulte.trainer.gridSize')}</span>
        <div className="schulte-size-list" role="radiogroup" aria-label={t('games.schulte.trainer.gridSize')}>
          {GRID_SIZES.map(gridSize => {
            const isActive = gridSize === size;
            return (
              <button
                key={gridSize}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={['schulte-size-option', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                onClick={() => handleSizeChange(gridSize)}
              >
                <span className="schulte-size-option-label">
                  {gridSize}×{gridSize}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="schulte-sidebar-section stack stack-8">
        <span className="schulte-control-label">{t('games.schulte.trainer.statusLabel')}</span>
        <div className="schulte-sidebar-meta">
          <div className="schulte-sidebar-meta-item">
            <span>{t('games.schulte.trainer.statusLabel')}</span>
            <strong>{t(`games.schulte.trainer.status.${status}`)}</strong>
          </div>
          <div className="schulte-sidebar-meta-item">
            <span>{t('games.schulte.trainer.bestTime')}</span>
            <strong>{currentBest ? formatDuration(currentBest) : t('games.schulte.trainer.noBestYet')}</strong>
          </div>
        </div>
      </div>

      <div className="schulte-sidebar-section stack stack-8">
        <span className="schulte-control-label">{resolvedActionsLabel}</span>
        <div className="schulte-action-list">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              resetRound(size, mode, { preserveHint: true });
              setIsMobileControlsOpen(false);
            }}
          >
            {t('games.schulte.trainer.newBoard')}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={restartCurrentBoard}>
            {t('games.schulte.trainer.restart')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              persistBestTimes(currentBestTimes => {
                const nextBestTimes = { ...currentBestTimes };
                delete nextBestTimes[getBestTimeKey(size, mode)];
                return nextBestTimes;
              });
              setIsMobileControlsOpen(false);
            }}
          >
            {t('games.schulte.trainer.clearBestForSize')}
          </Button>
        </div>
      </div>

      <div className="schulte-sidebar-section stack stack-8">
        <span className="schulte-control-label">{t('games.schulte.trainer.recentRuns')}</span>
        {recentRuns.length > 0 ? (
          <div className="schulte-recent-runs-list">
            {recentRuns.map((run, index) => (
              <div
                key={`${run.size}-${run.mode}-${run.durationMs}-${run.mistakes}-${index}`}
                className="schulte-recent-run-item"
              >
                <div className="schulte-recent-run-main">
                  <strong>{formatDuration(run.durationMs)}</strong>
                  <span>
                    {run.size}×{run.size} · {t(`games.schulte.trainer.modes.${run.mode}.title`)}
                  </span>
                </div>
                <span className="schulte-recent-run-meta">
                  {t('games.schulte.trainer.recentRunMistakes', { count: run.mistakes })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="schulte-sidebar-meta">
            <div className="schulte-sidebar-meta-item">
              <strong>{t('games.schulte.trainer.noRecentRuns')}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="schulte-sidebar-section schulte-sidebar-switch">
        <Form.Check
          id="schulte-show-hint"
          type="switch"
          checked={showNextHint}
          onChange={event => setShowNextHint(event.target.checked)}
          label={t('games.schulte.trainer.showNextHint')}
        />
      </div>
    </div>
  );

  return (
    <Card className="schulte-trainer-card">
      <Card.Body className="schulte-trainer-body">
        <button
          type="button"
          className="schulte-mobile-controls-toggle"
          aria-expanded={isMobileControlsOpen}
          aria-controls="schulte-trainer-sidebar"
          onClick={() => setIsMobileControlsOpen(previous => !previous)}
        >
          <span className="schulte-mobile-controls-toggle-label">{t('games.schulte.trainer.controls')}</span>
          <span className="schulte-mobile-controls-toggle-state">{mobileControlsToggleLabel}</span>
        </button>

        <div className="schulte-trainer-layout">
          {!isMobile && (
            <aside
              id="schulte-trainer-sidebar"
              className="schulte-trainer-sidebar"
              aria-label={t('games.schulte.trainer.gridSize')}
            >
              {controlsPanel}
            </aside>
          )}

          <div className="schulte-trainer-main">
            <div className="schulte-trainer-stats" aria-live="polite">
              <div className="schulte-stat-tile">
                <span className="schulte-stat-label">
                  <FontAwesomeIcon icon="clock" className="me-2" />
                  {t('games.schulte.trainer.timer')}
                </span>
                <strong className="schulte-stat-value tabular-nums">{formatDuration(displayTime)}</strong>
              </div>
              <div className="schulte-stat-tile">
                <span className="schulte-stat-label">
                  <FontAwesomeIcon icon="table-cells" className="me-2" />
                  {t('games.schulte.trainer.next')}
                </span>
                <strong className="schulte-stat-value tabular-nums">{isCompleted ? '✓' : target}</strong>
              </div>
              <div className="schulte-stat-tile">
                <span className="schulte-stat-label">
                  <FontAwesomeIcon icon="clipboard-list" className="me-2" />
                  {t('games.schulte.trainer.mistakes')}
                </span>
                <strong className="schulte-stat-value tabular-nums">{mistakes}</strong>
              </div>
            </div>

            <div className="schulte-progress" aria-hidden="true">
              <div className="schulte-progress-bar" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="schulte-grid-shell">
              <table className="schulte-grid" style={{ ['--schulte-grid-size' as string]: String(size) }}>
                <tbody>
                  {cellRows.map(row => (
                    <tr key={row.join('-')}>
                      {row.map(value => {
                        const isFound = foundSet.has(value);
                        const isTarget = nextHintNumber === value && showNextHint;
                        const isWrongPulse = lastWrongNumber === value;
                        const palette = CELL_PALETTE[(value - 1) % CELL_PALETTE.length];
                        const cellStyle = {
                          ['--schulte-cell-bg' as string]: palette.bg,
                          ['--schulte-cell-fg' as string]: palette.fg,
                          ['--schulte-cell-border' as string]: palette.border,
                        } as React.CSSProperties;

                        return (
                          <td key={value} className="schulte-grid-cell">
                            <button
                              type="button"
                              className={[
                                'schulte-cell',
                                isFound ? 'is-found' : '',
                                isTarget ? 'is-target' : '',
                                isWrongPulse ? 'is-wrong' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              style={cellStyle}
                              onClick={() => handleCellClick(value)}
                              aria-label={t('games.schulte.trainer.cellAriaLabel', { number: value })}
                              aria-disabled={isFound ? 'true' : undefined}
                              disabled={isFound}
                            >
                              <span>{value}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="schulte-trainer-footer">
              {isCompleted ? (
                <div className="schulte-trainer-complete">
                  <FontAwesomeIcon icon="check-circle" className="me-2" />
                  {t('games.schulte.trainer.completeMessage', {
                    time: formatDuration(displayTime),
                    mistakes,
                  })}
                </div>
              ) : (
                <p className="schulte-trainer-tip mb-0">{t('games.schulte.trainer.tip')}</p>
              )}
            </div>
          </div>
        </div>
      </Card.Body>

      {isMobile && (
        <Offcanvas
          show={isMobileControlsOpen}
          onHide={() => setIsMobileControlsOpen(false)}
          placement={isCompactMobile ? 'bottom' : 'start'}
          className="schulte-controls-offcanvas"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{t('games.schulte.trainer.controls')}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>{controlsPanel}</Offcanvas.Body>
        </Offcanvas>
      )}
    </Card>
  );
}
