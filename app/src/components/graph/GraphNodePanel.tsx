import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
import { getRelationType } from '@/lib/constants';
import { useT } from '@/i18n';
import type { Character, Location, Relation } from '@/types';

interface GraphNodePanelProps {
  /** Personnage sélectionné (nœud tapé). */
  character: Character;
  characters: Character[];
  relations: Relation[];
  locations: Location[];
  /** Mêmes filtres que le graphe — on n'affiche que les liens visibles. */
  visibleCharacterIds: Set<string>;
  visibleRelationTypeIds: Set<string>;
  onClose: () => void;
  /** Ouvre la fiche d'un PNJ. */
  onOpenCharacter: (id: string) => void;
}

interface PanelLink {
  relationId: string;
  other: Character;
  detail?: string;
}

/**
 * Panneau semi-transparent affiché au tap d'un nœud (mobile). Liste les
 * liens directs du personnage, groupés par type de relation. Chaque nom
 * est cliquable et ouvre la fiche du PNJ correspondant.
 *
 * Mobile-only : rendu uniquement par GraphViewPage quand `!isDesktop`.
 */
export function GraphNodePanel({
  character,
  characters,
  relations,
  locations,
  visibleCharacterIds,
  visibleRelationTypeIds,
  onClose,
  onOpenCharacter,
}: GraphNodePanelProps) {
  const t = useT();
  const tr = t as (k: string) => string;

  const charById = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters]
  );

  const locationName = useMemo(() => {
    if (!character.location) return null;
    return locations.find((l) => l.id === character.location)?.name ?? null;
  }, [character.location, locations]);

  // Liens visibles du personnage, regroupés par type (ordre = relation_type).
  const grouped = useMemo(() => {
    const map = new Map<string, PanelLink[]>();
    relations.forEach((r) => {
      if (r.from_character_id !== character.id && r.to_character_id !== character.id)
        return;
      if (!visibleRelationTypeIds.has(r.relation_type)) return;
      const otherId =
        r.from_character_id === character.id
          ? r.to_character_id
          : r.from_character_id;
      if (!visibleCharacterIds.has(otherId)) return;
      const other = charById.get(otherId);
      if (!other) return;
      if (!map.has(r.relation_type)) map.set(r.relation_type, []);
      map.get(r.relation_type)!.push({
        relationId: r.id,
        other,
        detail: r.relation_detail?.trim() || undefined,
      });
    });
    return map;
  }, [relations, character.id, visibleRelationTypeIds, visibleCharacterIds, charById]);

  const totalLinks = useMemo(
    () => Array.from(grouped.values()).reduce((n, arr) => n + arr.length, 0),
    [grouped]
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute top-2 right-2 bottom-2 z-20 w-[80vw] max-w-[300px]
                 flex flex-col rounded-lg border border-[var(--border-paper)]
                 bg-[var(--bg-card)]/85 backdrop-blur-md shadow-2xl overflow-hidden"
      role="dialog"
      aria-label={character.name}
    >
      {/* En-tête */}
      <header className="px-4 pt-3 pb-3 border-b border-[var(--border-paper)]/70 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center
                     justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]
                     hover:bg-[var(--bg-card-alt)] transition-colors"
          aria-label={t('graph.panelClose')}
        >
          <X size={16} />
        </button>

        <p className="label-overline pr-8">
          {character.type === 'PJ' ? t('graph.typePC') : t('graph.typeNPC')}
          {locationName ? ` · ${locationName}` : ''}
        </p>
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)] leading-tight pr-8 mt-0.5">
          {character.name}
        </h2>
        {character.role && (
          <p className="text-sm text-[var(--text-secondary)] font-body italic mt-1">
            {character.role}
          </p>
        )}
      </header>

      {/* Corps scrollable — liste des liens */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {totalLinks === 0 ? (
          <p className="text-sm text-[var(--text-muted)] font-body italic">
            {t('graph.panelNoRelations')}
          </p>
        ) : (
          <>
            <p className="text-[10px] text-[var(--text-muted)] font-body mb-2.5">
              {t('graph.panelTapHint')}
            </p>
            <div className="space-y-4">
              {Array.from(grouped.entries()).map(([typeId, links]) => {
                const rt = getRelationType(typeId);
                const label = rt.labelKey ? tr(rt.labelKey) : rt.label;
                return (
                  <section key={typeId}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        aria-hidden
                        className="inline-block w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: rt.color }}
                      />
                      <span className="label-overline">
                        {label}{' '}
                        <span className="text-[var(--text-muted)]">({links.length})</span>
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {links.map((link) => (
                        <li key={link.relationId}>
                          <button
                            type="button"
                            onClick={() => onOpenCharacter(link.other.id)}
                            className="group w-full flex items-center gap-2 rounded-md px-2 py-1.5
                                       text-left hover:bg-[var(--bg-card-alt)] transition-colors"
                            title={link.detail ? `${link.other.name} — ${link.detail}` : link.other.name}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-body text-[var(--text-primary)] truncate">
                                {link.other.name}
                              </span>
                              {link.detail && (
                                <span className="block text-xs text-[var(--text-muted)] truncate">
                                  {link.detail}
                                </span>
                              )}
                            </span>
                            <ArrowUpRight
                              size={15}
                              className="flex-shrink-0 text-[var(--text-muted)] opacity-0
                                         group-hover:opacity-100 transition-opacity"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.aside>
  );
}
