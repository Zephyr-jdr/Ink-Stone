import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useT } from '@/i18n';
import { useTimeline } from '@/hooks/useTimeline';
import type { Season } from '@/types';
import { SeasonField } from './SeasonField';
import { SeasonFocusModal } from './SeasonFocusModal';
import { SEASONS } from './seasons';
import './chronicles.css';

const DESKTOP_BREAKPOINT = 1280;
const TABLET_BREAKPOINT = 768;
const WHEEL_THROTTLE_MS = 180;
const SCROLL_HINT_FADE_MS = 400;

interface WheelTimelineProps {
  spaceId: string | undefined;
}

export function WheelTimeline({ spaceId }: WheelTimelineProps) {
  const t = useT();
  const { timeline, updateEntry, setRange } = useTimeline(spaceId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [focusSeason, setFocusSeason] = useState<Season | null>(null);

  const wheelStageRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(0);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startYear = timeline.start_year;
  const count = timeline.year_count;

  const years = useMemo(
    () => Array.from({ length: count }, (_, i) => startYear + i),
    [startYear, count],
  );

  // Clamp si la plage a changé
  useEffect(() => {
    setCurrentIndex((idx) => Math.max(0, Math.min(years.length - 1, idx)));
  }, [years.length]);

  const goTo = useCallback(
    (idx: number) => setCurrentIndex(Math.max(0, Math.min(years.length - 1, idx))),
    [years.length],
  );

  // Molette + tactile : la roue tourne à la molette ou au swipe horizontal
  useEffect(() => {
    const stage = wheelStageRef.current;
    if (!stage) return;

    const triggerScrollHint = () => {
      setIsScrolling(true);
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
      scrollDebounceRef.current = setTimeout(() => setIsScrolling(false), SCROLL_HINT_FADE_MS);
    };

    const step = (dir: number) => {
      const now = Date.now();
      if (now - wheelLockRef.current < WHEEL_THROTTLE_MS) return;
      wheelLockRef.current = now;
      setCurrentIndex((prev) => Math.max(0, Math.min(years.length - 1, prev + dir)));
      triggerScrollHint();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
      step(dir);
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastFireX = 0;
    let touchAxis: 'x' | 'y' | null = null;
    const SWIPE_PIXELS_PER_STEP = 40;
    const AXIS_DECIDE_THRESHOLD = 8;

    const onTouchStart = (e: TouchEvent) => {
      const tch = e.touches[0];
      touchStartX = tch.clientX;
      touchStartY = tch.clientY;
      touchLastFireX = tch.clientX;
      touchAxis = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const tch = e.touches[0];
      const dx = tch.clientX - touchStartX;
      const dy = tch.clientY - touchStartY;

      if (touchAxis === null) {
        if (Math.abs(dx) < AXIS_DECIDE_THRESHOLD && Math.abs(dy) < AXIS_DECIDE_THRESHOLD) return;
        touchAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (touchAxis === 'y') return;
      }
      if (touchAxis !== 'x') return;
      e.preventDefault();

      const dxFromLast = tch.clientX - touchLastFireX;
      if (Math.abs(dxFromLast) >= SWIPE_PIXELS_PER_STEP) {
        step(dxFromLast < 0 ? 1 : -1);
        touchLastFireX = tch.clientX;
      }
    };

    const onTouchEnd = () => {
      touchAxis = null;
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd, { passive: true });
    stage.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [years.length]);

  // Navigation clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentIndex((p) => Math.min(years.length - 1, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentIndex((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [years.length]);

  const addYearBefore = () => {
    setRange({ start_year: startYear - 1, year_count: count + 1 });
    setCurrentIndex((p) => p + 1);
  };
  const addYearAfter = () => setRange({ year_count: count + 1 });

  const updateStartYear = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    setRange({ start_year: parsed });
  };

  const resetStartYear = () => {
    if (!window.confirm(t('chronicles.resetConfirm'))) return;
    setRange({ start_year: 0, year_count: 11 });
    setCurrentIndex(0);
  };

  const currentYear = years[currentIndex] ?? startYear;
  const entryKey = String(currentYear);
  const entry = timeline.entries[entryKey] || {};

  const updateSeason = (season: Season, value: string) =>
    updateEntry(currentYear, season, value);

  // Rotation : place l'année courante en haut
  const stepDeg = (() => {
    if (typeof window === 'undefined') return 10;
    const w = window.innerWidth;
    if (w >= DESKTOP_BREAKPOINT) return 6;
    if (w >= TABLET_BREAKPOINT) return 8;
    if (w <= 640) return 12;
    return 10;
  })();
  const baseRotation = -stepDeg * currentIndex;
  const itemsCount = years.length || 1;

  return (
    <div className="chronicles-root">
      <header className="wheel-sticky">
        <div className="controls-bar">
          <button
            type="button"
            className="wt-btn wt-btn-ghost wt-btn-add"
            onClick={addYearBefore}
            aria-label={t('chronicles.addYearBefore')}
            title={t('chronicles.addYearBefore')}
          >
            <span className="wt-btn-icon" aria-hidden="true">←</span>
            <span className="wt-btn-text">{t('chronicles.yearBefore')}</span>
          </button>

          <span className="control-label">{t('chronicles.start')}</span>
          <input
            type="number"
            className="start-year-input"
            value={startYear}
            onChange={(e) => updateStartYear(e.target.value)}
            aria-label={t('chronicles.start')}
          />
          <button
            type="button"
            className="btn-reset"
            onClick={resetStartYear}
            aria-label={t('chronicles.reset')}
            title={t('chronicles.reset')}
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            className="wt-btn wt-btn-ghost wt-btn-add"
            onClick={addYearAfter}
            aria-label={t('chronicles.addYearAfter')}
            title={t('chronicles.addYearAfter')}
          >
            <span className="wt-btn-text">{t('chronicles.yearAfter')}</span>
            <span className="wt-btn-icon" aria-hidden="true">→</span>
          </button>
        </div>

        <div
          className={`wheel-stage ${isScrolling ? 'is-scrolling' : ''}`}
          ref={wheelStageRef}
        >
          <div className="wheel-pointer" aria-hidden="true">
            <div className="dot" />
            <div className="needle" />
          </div>

          <div
            className="cards-container"
            style={
              {
                '--items': itemsCount,
                '--base-rotation': `${baseRotation}deg`,
              } as React.CSSProperties
            }
          >
            <div className="wheel-rim" />
            <ul className="cards">
              {years.map((y, i) => {
                const distance = Math.abs(i - currentIndex);
                const cls = [
                  i === currentIndex ? 'is-current' : '',
                  distance > 0 && distance <= 2 ? 'is-near' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <li key={`${y}-${i}`} style={{ '--i': i } as React.CSSProperties} className={cls}>
                    <button type="button" className="year-label" onClick={() => goTo(i)}>
                      {y}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="wheel-veil" />
        </div>
        <div className="scroll-hint">{t('chronicles.scrollHint')}</div>
      </header>

      <main className="seasons-wrap">
        <section className="current-year-card">
          <div className="label">{t('chronicles.year')}</div>
          <div className="year-big">{currentYear}</div>
          <div className="ornament">
            <span className="line" />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            <span className="line" />
          </div>
        </section>

        <div className="seasons-grid">
          {SEASONS.map((season) => (
            <SeasonField
              key={season}
              season={season}
              value={entry[season]}
              onChange={(v) => updateSeason(season, v)}
              onFocus={setFocusSeason}
            />
          ))}
        </div>
      </main>

      <SeasonFocusModal
        season={focusSeason}
        year={currentYear}
        value={focusSeason ? entry[focusSeason] || '' : ''}
        onChange={(v) => focusSeason && updateSeason(focusSeason, v)}
        onClose={() => setFocusSeason(null)}
      />
    </div>
  );
}
