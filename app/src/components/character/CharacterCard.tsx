import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { FALLBACK_LOCATION_COLOR } from '@/lib/constants';
import { useT } from '@/i18n';
import type { Character } from '@/types';


interface CharacterCardProps {
  character: Character;
  index: number;
}


const animatedIds = new Set<string>();

export function CharacterCard({ character, index }: CharacterCardProps) {
  const t = useT();
  const navigate = useNavigate();
  const { locations } = useAppStore();

  const loc = character.location
    ? locations.find((l) => l.id === character.location)
    : undefined;
  const locationColor = loc?.color ?? FALLBACK_LOCATION_COLOR;
  const locationName = loc?.name;

  const alreadyAnimated = animatedIds.has(character.id);
  if (!alreadyAnimated) animatedIds.add(character.id);

  return (
    <motion.div
      initial={alreadyAnimated ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: alreadyAnimated ? 0 : 0.4,
        delay: alreadyAnimated ? 0 : index * 0.04,
        ease: 'easeOut',
      }}
      onClick={() => navigate(`/character/${character.id}`)}
      className="group cursor-pointer card-paper p-6 hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(28,22,14,0.3)] transition-all duration-200 relative overflow-hidden"
    >
      {/* Filet de couleur du lieu sur le côté gauche */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: locationColor }}
      />

      {/* En-tête : nom + shield + flèche */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-hover)] transition-colors leading-tight truncate">
            {character.name}
          </h3>
          <span
            className={`text-[10px] uppercase tracking-[0.15em] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${
              character.type === 'PJ'
                ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)] border-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] border-[var(--border-paper)]'
            }`}
          >
            {character.type === 'PJ' ? t('character.typePC') : t('character.typeNPC')}
          </span>

        </div>
        <ArrowUpRight
          size={18}
          className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors flex-shrink-0 mt-1.5"
        />
      </div>

      {/* Rôle */}
      {character.role && (
        <p className="text-sm text-[var(--text-secondary)] font-body mb-3 leading-snug">
          {character.role}
        </p>
      )}

      {/* Lieu */}
      {locationName && (
        <div className="inline-flex items-center gap-1.5 mb-3 text-xs text-[var(--text-muted)] font-body">
          <MapPin size={12} style={{ color: locationColor }} />
          <span>{locationName}</span>
        </div>
      )}

      {/* Tags */}
      {character.tags && character.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {character.tags.map((tag, i) => (
            <span key={i} className="tag-pill">{tag}</span>
          ))}
        </div>
      )}

      {/* Aperçu des traits cochés */}
      {character.traits && character.traits.length > 0 && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 pt-1 border-t border-[var(--border-subtle)]/60 mt-3">
          {character.traits.slice(0, 3).map((trait, i) => (
            <span
              key={i}
              className={`text-xs font-body inline-flex items-center gap-1 ${
                trait.checked
                  ? 'text-[var(--text-secondary)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                  trait.checked
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                    : 'border-[var(--border-paper)]'
                }`}
              >
                {trait.checked && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7L8 3"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {trait.label}
            </span>
          ))}
          {character.traits.length > 3 && (
            <span className="text-xs text-[var(--text-muted)] font-body">
              +{character.traits.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
