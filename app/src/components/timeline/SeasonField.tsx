import { Maximize2 } from 'lucide-react';
import { useT } from '@/i18n';
import type { Season } from '@/types';
import { SEASON_COLOR, SEASON_MARKS, SEASON_NAME_KEY } from './seasons';

interface SeasonFieldProps {
  season: Season;
  value: string | undefined;
  onChange: (value: string) => void;
  onFocus: (season: Season) => void;
}

export function SeasonField({ season, value, onChange, onFocus }: SeasonFieldProps) {
  const t = useT();
  const name = t(SEASON_NAME_KEY[season]);
  const color = SEASON_COLOR[season];

  return (
    <article
      className={`season season-${season}`}
      style={{ '--season-color': color } as React.CSSProperties}
    >
      <span className="season-rail" aria-hidden="true" />
      <header className="season-head">
        <span className="season-mark" style={{ color }} aria-hidden="true">
          {SEASON_MARKS[season]}
        </span>
        <h3 className="season-name">{name}</h3>
      </header>

      <div className="season-body">
        <textarea
          className="season-text"
          placeholder={t('chronicles.seasonPlaceholder', { season: name.toLowerCase() })}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="season-focus-btn"
          onClick={() => onFocus(season)}
          aria-label={t('chronicles.fullscreen', { season: name })}
          title={t('chronicles.fullscreen', { season: name })}
        >
          <Maximize2 size={15} />
          <span>{t('chronicles.focus')}</span>
        </button>
      </div>
    </article>
  );
}
