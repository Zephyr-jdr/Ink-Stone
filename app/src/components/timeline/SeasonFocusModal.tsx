import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useT } from '@/i18n';
import type { Season } from '@/types';
import { SEASON_COLOR, SEASON_MARKS, SEASON_NAME_KEY } from './seasons';

interface SeasonFocusModalProps {
  season: Season | null;
  year: number;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export function SeasonFocusModal({ season, year, value, onChange, onClose }: SeasonFocusModalProps) {
  const t = useT();

  useEffect(() => {
    if (!season) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [season, onClose]);

  if (!season) return null;
  const name = t(SEASON_NAME_KEY[season]);
  const color = SEASON_COLOR[season];

  return (
    <div
      className="focus-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — ${t('chronicles.year')} ${year}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('focus-overlay')) onClose();
      }}
    >
      <div className="focus-panel" style={{ '--season-color': color } as React.CSSProperties}>
        <header className="focus-head">
          <div className="focus-head-left">
            <span className="focus-mark" style={{ color }} aria-hidden="true">
              {SEASON_MARKS[season]}
            </span>
            <div className="focus-title-block">
              <span className="focus-year">
                {t('chronicles.year')} {year}
              </span>
              <h2 className="focus-title">{name}</h2>
            </div>
          </div>
          <button
            type="button"
            className="focus-close"
            onClick={onClose}
            aria-label={t('chronicles.close')}
            title={t('chronicles.close')}
          >
            <X size={18} />
          </button>
        </header>
        <textarea
          className="focus-textarea"
          autoFocus
          placeholder={t('chronicles.seasonPlaceholder', { season: name.toLowerCase() })}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <footer className="focus-footer">
          <span className="focus-hint">{t('chronicles.focusHint')}</span>
        </footer>
      </div>
    </div>
  );
}
