import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GitGraph, Plus, Copy, MapPin, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { CharacterCard } from '@/components/character/CharacterCard';
import { CharacterForm } from '@/components/character/CharacterForm';
import { LocationsManagerModal } from '@/components/locations/LocationsManagerModal';
import { Toast } from '@/components/shared/Toast';
import { useAppStore } from '@/stores/appStore';
import { useCharacters } from '@/hooks/useCharacters';
import { useLocations } from '@/hooks/useLocations';
import { FALLBACK_LOCATION_COLOR } from '@/lib/constants';
import { useT } from '@/i18n';

export default function DashboardPage() {
  const t = useT();
  const navigate = useNavigate();
  const {
    session,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterLocationId,
    setFilterLocationId,
    showToast,
  } = useAppStore();
  const { characters } = useCharacters(session?.space.id);
  const { locations } = useLocations(session?.space.id);

  const [showForm, setShowForm] = useState(false);
  const [showLocations, setShowLocations] = useState(false);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  const filteredCharacters = useMemo(() => {
    let filtered = characters;

    if (filterType !== 'tous') {
      filtered = filtered.filter((c) => c.type === filterType);
    }
    if (filterLocationId !== 'tous') {
      if (filterLocationId === 'sans-lieu') {
        filtered = filtered.filter((c) => !c.location);
      } else {
        filtered = filtered.filter((c) => c.location === filterLocationId);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const locName = (id: string | undefined) =>
        id ? locations.find((l) => l.id === id)?.name?.toLowerCase() ?? '' : '';
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role?.toLowerCase().includes(q) ||
          locName(c.location).includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q)) ||
          c.traits?.some((t) => t.label.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [characters, filterType, filterLocationId, searchQuery, locations]);

  const handleCopyCode = () => {
    if (session?.space.invite_code) {
      navigator.clipboard.writeText(session.space.invite_code);
      showToast(t('header.inviteCodeCopied'));
    }
  };

  const sansLieuCount = useMemo(
    () => characters.filter((c) => !c.location).length,
    [characters]
  );

  if (!session) return null;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Titre du grimoire */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-none">
              {session.space.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--text-secondary)] font-body mt-5">
            <span>
              {t(characters.length === 1 ? 'dashboard.countOne' : 'dashboard.countOther', { n: characters.length })}
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span>{t('dashboard.inviteCode')}</span>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-paper)] rounded text-xs font-mono hover:bg-[var(--bg-card-alt)] transition-colors"
            >
              {session.space.invite_code}
              <Copy size={12} />
            </button>
          </div>
        </motion.div>

        {/* Actions principales */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <button onClick={() => setShowForm(true)} className="btn-ink">
            <Plus size={16} />
            {t('dashboard.addCharacter')}
          </button>
          <button onClick={() => navigate('/graph')} className="btn-outline">
            <GitGraph size={16} />
            {t('dashboard.graphView')}
          </button>
          <button
            onClick={() => setShowLocations(true)}
            className="btn-outline"
            title={t('dashboard.manageLocationsTitle')}
          >
            <Settings size={16} />
            {t('dashboard.manageLocations')}
          </button>
        </motion.div>

        {/* Toolbar : recherche + filtres */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          {/* Ligne 1 : recherche + filtre type */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                className="field-paper pl-11"
              />
            </div>

            <div className="flex rounded-lg overflow-hidden border border-[var(--border-paper)] bg-[var(--bg-card)]">
              {(['tous', 'PJ', 'PNJ'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-5 py-2.5 text-sm font-medium font-body capitalize transition-all ${
                    filterType === type
                      ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]'
                      : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card-alt)]'
                  }`}
                >
                  {type === 'tous' ? t('dashboard.typeAll') : type === 'PJ' ? t('dashboard.typePC') : t('dashboard.typeNPC')}
                </button>
              ))}
            </div>

          </div>

          {/* Ligne 2 : chips de location */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="label-overline mr-1 inline-flex items-center gap-1.5">
              <MapPin size={12} />
              {t('dashboard.locationsLabel')}
            </span>
            <LocationChip
              label={t('dashboard.allLocations')}
              active={filterLocationId === 'tous'}
              onClick={() => setFilterLocationId('tous')}
              color="#8C8279"
            />
            {sansLieuCount > 0 && (
              <LocationChip
                label={t('dashboard.noLocation')}
                active={filterLocationId === 'sans-lieu'}
                onClick={() => setFilterLocationId('sans-lieu')}
                color={FALLBACK_LOCATION_COLOR}
              />
            )}

            {locations.map((loc) => (
              <LocationChip
                key={loc.id}
                label={loc.name}
                active={filterLocationId === loc.id}
                onClick={() => setFilterLocationId(loc.id)}
                color={loc.color}
              />
            ))}
          </div>
        </motion.div>

        {/* Grille de personnages */}
        {filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCharacters.map((character, index) => (
              <CharacterCard
                key={character.id}
                character={character}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowForm(true)}
            className="cursor-pointer card-paper border-dashed p-16 text-center hover:bg-[var(--bg-card-alt)] transition-colors"
          >
            <p className="text-[var(--text-muted)] font-body">
              {searchQuery.trim() || filterType !== 'tous' || filterLocationId !== 'tous'
                ? t('dashboard.emptySearch')
                : t('dashboard.emptyAll')}
            </p>

          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showForm && <CharacterForm onClose={() => setShowForm(false)} />}
        {showLocations && session && (
          <LocationsManagerModal
            spaceId={session.space.id}
            onClose={() => setShowLocations(false)}
          />
        )}
      </AnimatePresence>

      <Toast />
    </div>
  );
}

function LocationChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-body border transition-all ${
        active
          ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)] border-[var(--accent-primary)]'
          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-paper)] hover:bg-[var(--bg-card-alt)]'
      }`}
    >
      <span
        aria-hidden
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: active ? '#fff' : color }}
      />
      {label}
    </button>
  );
}
