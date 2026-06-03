import type { ReactNode } from 'react';
import type { Season } from '@/types';
import type { TKey } from '@/i18n';

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** Couleur d'accent par saison (définie dans chronicles.css). */
export const SEASON_COLOR: Record<Season, string> = {
  spring: 'var(--accent-spring)',
  summer: 'var(--accent-summer)',
  autumn: 'var(--accent-autumn)',
  winter: 'var(--accent-winter)',
};

/** Clés i18n du nom de chaque saison. */
export const SEASON_NAME_KEY: Record<Season, TKey> = {
  spring: 'chronicles.spring',
  summer: 'chronicles.summer',
  autumn: 'chronicles.autumn',
  winter: 'chronicles.winter',
};

/** Pictogrammes tracés (line-art) pour chaque saison. */
export const SEASON_MARKS: Record<Season, ReactNode> = {
  spring: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c2 3 2 5 0 7-2-2-2-4 0-7zM5 12c3-2 5-2 7 0-2 2-4 2-7 0zM19 12c-3-2-5-2-7 0 2 2 4 2 7 0zM12 21c-2-3-2-5 0-7 2 2 2 4 0 7z" />
      <circle cx="12" cy="12" r="1.4" />
    </svg>
  ),
  summer: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.2v3M12 18.8v3M2.2 12h3M18.8 12h3M5 5l2.1 2.1M16.9 16.9L19 19M5 19l2.1-2.1M16.9 7.1L19 5" />
    </svg>
  ),
  autumn: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-3 4-5 8-3 12s7 4 9 0c2-4-2-8-6-12z" />
      <path d="M12 21V11" />
      <path d="M9 14l3 1 3-1" />
    </svg>
  ),
  winter: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
      <path d="M12 5l-1.5 1.5M12 5l1.5 1.5M12 19l-1.5-1.5M12 19l1.5-1.5M5 12l1.5-1.5M5 12l1.5 1.5M19 12l-1.5-1.5M19 12l-1.5 1.5" />
    </svg>
  ),
};
