import { useCallback, useEffect, useRef, useState } from 'react';
import { db, subscribeSpace } from '@/lib/db';
import type { Season, Timeline } from '@/types';

const DEFAULT_START_YEAR = 0;
const DEFAULT_YEAR_COUNT = 11;
const SAVE_DEBOUNCE_MS = 600;

function defaultTimeline(spaceId: string): Timeline {
  return {
    id: '',
    space_id: spaceId,
    start_year: DEFAULT_START_YEAR,
    year_count: DEFAULT_YEAR_COUNT,
    entries: {},
    updated_at: '',
  };
}

/**
 * Charge et expose la frise « Chroniques » du grimoire courant.
 *
 *  - Les modifications mettent à jour l'état local *immédiatement* (saisie
 *    fluide), puis sont persistées en Supabase via un upsert *debouncé*.
 *  - Le temps réel rafraîchit la frise quand un autre joueur édite, MAIS on
 *    n'écrase jamais une saisie locale en cours (`dirtyRef`) : le refetch
 *    distant est ignoré tant qu'une sauvegarde locale est en attente.
 *  - Conflits = dernier qui écrit gagne (choix assumé du stockage « 1 bloc »).
 */
export function useTimeline(spaceId: string | undefined) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loaded, setLoaded] = useState(false);

  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!spaceId) return;
    const remote = await db.getTimeline(spaceId);
    // Ne pas clobberer une édition locale non encore sauvegardée.
    if (!dirtyRef.current) {
      setTimeline(remote ?? defaultTimeline(spaceId));
    }
    setLoaded(true);
  }, [spaceId]);

  useEffect(() => {
    if (!spaceId) return;
    fetchTimeline();
    const unsub = subscribeSpace(spaceId, fetchTimeline);
    return () => {
      unsub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [spaceId, fetchTimeline]);

  const scheduleSave = useCallback(
    (next: Timeline) => {
      if (!spaceId) return;
      dirtyRef.current = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const saved = await db.saveTimeline(spaceId, {
            start_year: next.start_year,
            year_count: next.year_count,
            entries: next.entries,
          });
          // Récupère l'id/updated_at réels sans perdre d'éventuelles frappes
          setTimeline((cur) =>
            cur ? { ...cur, id: saved.id, updated_at: saved.updated_at } : saved,
          );
        } catch (err) {
          console.error('[Chroniques] save failed:', err);
        } finally {
          dirtyRef.current = false;
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [spaceId],
  );

  const mutate = useCallback(
    (producer: (cur: Timeline) => Timeline) => {
      setTimeline((cur) => {
        const base = cur ?? defaultTimeline(spaceId ?? '');
        const next = producer(base);
        scheduleSave(next);
        return next;
      });
    },
    [spaceId, scheduleSave],
  );

  const updateEntry = useCallback(
    (year: number, season: Season, value: string) => {
      const key = String(year);
      mutate((cur) => ({
        ...cur,
        entries: {
          ...cur.entries,
          [key]: { ...(cur.entries[key] || {}), [season]: value },
        },
      }));
    },
    [mutate],
  );

  const setRange = useCallback(
    (patch: Partial<Pick<Timeline, 'start_year' | 'year_count'>>) => {
      mutate((cur) => ({ ...cur, ...patch }));
    },
    [mutate],
  );

  return {
    timeline: timeline ?? defaultTimeline(spaceId ?? ''),
    loaded,
    updateEntry,
    setRange,
  };
}
