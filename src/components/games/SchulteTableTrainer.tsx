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
type TrainerStatus = 'idle' | 'running' | 'completed';

type BestTimes = Partial<Record<GridSize, number>>;
type CellPaletteItem = {
  bg: string;
  fg: string;
  border: string;
};

const GRID_SIZES: readonly GridSize[] = [3, 4, 5, 6, 7, 8, 9] as const;
const DEFAULT_GRID_SIZE: GridSize = 5;
const STORAGE_KEY = 'schulte-table-best-times-v1';
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

const shuffle = (values: number[]): number[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const createOrderedBoard = (size: GridSize): number[] => Array.from({ length: size * size }, (_, index) => index + 1);
const createBoard = (size: GridSize): number[] => shuffle(Array.from({ length: size * size }, (_, index) => index + 1));
const getCurrentTimeMs = (): number => Date.now();

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatDuration = (ms: number) => {
  const safe = Math.max(0, Math.round(ms));
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const centiseconds = Math.floor((safe % 1000) / 10);
  const parts = [minutes, seconds].map(value => value.toString().padStart(2, '0'));
  return `${parts.join(':')}.${centiseconds.toString().padStart(2, '0')}`;
};

const parseStoredBestTimes = (raw: string | null): BestTimes => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: BestTimes = {};
    for (const size of GRID_SIZES) {
      const candidate = parsed[String(size)];
      if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
        next[size] = Math.round(candidate);
      }
    }
    return next;
  } catch {
    return {};
  }
};

export default function SchulteTableTrainer() {
  const { t, i18n } = useTranslation('games');
  const isMobile = useMediaQuery('(max-width: 991px)');
  const [size, setSize] = React.useState<GridSize>(DEFAULT_GRID_SIZE);
  const [cells, setCells] = React.useState<number[]>(() => createOrderedBoard(DEFAULT_GRID_SIZE));
  const [isMobileControlsOpen, setIsMobileControlsOpen] = React.useState(false);
  const [target, setTarget] = React.useState(1);
  const [foundNumbers, setFoundNumbers] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<TrainerStatus>('idle');
  const [startedAtMs, setStartedAtMs] = React.useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [showNextHint, setShowNextHint] = React.useState(true);
  const [lastResultMs, setLastResultMs] = React.useState<number | null>(null);
  const [bestTimes, setBestTimes] = React.useState<BestTimes>({});
  const [lastWrongNumber, setLastWrongNumber] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setBestTimes(parseStoredBestTimes(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  React.useEffect(() => {
    if (status !== 'running' || startedAtMs === null) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtMs);
    }, 50);

    return () => window.clearInterval(interval);
  }, [startedAtMs, status]);

  React.useEffect(() => {
    if (lastWrongNumber === null) {
      return;
    }

    const timeout = window.setTimeout(() => setLastWrongNumber(null), 220);
    return () => window.clearTimeout(timeout);
  }, [lastWrongNumber]);

  const totalCells = size * size;
  const foundSet = React.useMemo(() => new Set(foundNumbers), [foundNumbers]);
  const isCompleted = status === 'completed';
  const progressPercent = (foundNumbers.length / totalCells) * 100;
  const displayTime = isCompleted ? (lastResultMs ?? elapsedMs) : elapsedMs;
  const currentBest = bestTimes[size] ?? null;

  const persistBestTimes = (nextBestTimes: BestTimes) => {
    setBestTimes(nextBestTimes);
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBestTimes));
  };

  const resetRoundState = React.useCallback((options?: { preserveHint?: boolean }) => {
    setTarget(1);
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
  }, []);

  const resetRound = React.useCallback(
    (nextSize: GridSize, options?: { preserveHint?: boolean }) => {
      setCells(createBoard(nextSize));
      resetRoundState(options);
    },
    [resetRoundState],
  );

  const restartCurrentBoard = () => {
    resetRoundState({ preserveHint: true });
    setIsMobileControlsOpen(false);
  };

  React.useEffect(() => {
    resetRound(DEFAULT_GRID_SIZE, { preserveHint: true });
  }, [resetRound]);

  React.useEffect(() => {
    if (!isMobile) {
      setIsMobileControlsOpen(false);
    }
  }, [isMobile]);

  const handleSizeChange = (nextSize: GridSize) => {
    setSize(nextSize);
    resetRound(nextSize, { preserveHint: true });
    setIsMobileControlsOpen(false);
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

    const previousBest = bestTimes[size];
    if (previousBest === undefined || finishMs < previousBest) {
      persistBestTimes({ ...bestTimes, [size]: finishMs });
    }
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

    if (value >= totalCells) {
      const finishMs = clamp(getCurrentTimeMs() - effectiveStartMs, 0, 60 * 60 * 1000);
      completeRound(finishMs);
      return;
    }

    setTarget(value + 1);
  };

  const nextHintNumber = status === 'completed' ? null : target;
  const actionsLabel = t('games.schulte.trainer.actions');
  const resolvedActionsLabel =
    actionsLabel === 'games.schulte.trainer.actions'
      ? i18n.resolvedLanguage?.startsWith('tr')
        ? 'Aksiyonlar'
        : 'Actions'
      : actionsLabel;
  const mobileControlsToggleLabel = isMobileControlsOpen
    ? t('games.schulte.trainer.hideControls')
    : t('games.schulte.trainer.showControls');
  const controlsPanel = (
    <div className="schulte-trainer-controls stack stack-16">
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
              resetRound(size, { preserveHint: true });
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
              const nextBestTimes = { ...bestTimes };
              delete nextBestTimes[size];
              persistBestTimes(nextBestTimes);
              setIsMobileControlsOpen(false);
            }}
          >
            {t('games.schulte.trainer.clearBestForSize')}
          </Button>
        </div>
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
            <div className="schulte-trainer-stats" role="status" aria-live="polite">
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
              <div className="schulte-grid" style={{ ['--schulte-grid-size' as string]: String(size) }} role="grid">
                {cells.map(value => {
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
                    <button
                      key={value}
                      type="button"
                      role="gridcell"
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
                  );
                })}
              </div>
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
          placement="start"
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
