import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { SigmaGraph } from '@/components/graph/SigmaGraph';
import { DEFAULT_FORCE_SETTINGS, type ForceSettings } from '@/components/graph/forceSettings';
import { GraphFiltersSidebar } from '@/components/graph/GraphFiltersSidebar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useAppStore } from '@/stores/appStore';
import { useCharacters } from '@/hooks/useCharacters';
import { useRelations } from '@/hooks/useRelations';
import { useLocations } from '@/hooks/useLocations';
import { RELATION_TYPES } from '@/lib/constants';
import { useT } from '@/i18n';



export default function GraphViewPage() {
  const t = useT();
  const navigate = useNavigate();
  const { session } = useAppStore();

  const { characters } = useCharacters(session?.space.id);
  const { relations } = useRelations(session?.space.id);
  const { locations } = useLocations(session?.space.id);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      if (!e.matches) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  
  const [search, setSearch] = useState('');
  const [showPJ, setShowPJ] = useState(true);
  const [showPNJ, setShowPNJ] = useState(true);
  const [showSansLieu, setShowSansLieu] = useState(true);
  const [visibleLocationIds, setVisibleLocationIds] = useState<Set<string>>(
    () => new Set()
  );
  const [visibleRelationTypeIds, setVisibleRelationTypeIds] = useState<Set<string>>(
    () => new Set(RELATION_TYPES.map((r) => r.id))
  );


  useEffect(() => {
    if (locations.length > 0 && visibleLocationIds.size === 0) {
      setVisibleLocationIds(new Set(locations.map((l) => l.id)));
    }
  }, [locations, visibleLocationIds.size]);

  const [forces, setForces] = useState<ForceSettings>(DEFAULT_FORCE_SETTINGS);
  const [reseedToken, setReseedToken] = useState(0);

  
  const visibleCharacterIds = useMemo(() => {
    const q = search.toLowerCase().trim();
    return new Set(
      characters
        .filter((c) => {
          if (c.type === 'PJ' && !showPJ) return false;
          if (c.type === 'PNJ' && !showPNJ) return false;
          if (c.location) {
            if (!visibleLocationIds.has(c.location)) return false;
          } else {
            if (!showSansLieu) return false;
          }
          if (q) {
            const matches =
              c.name.toLowerCase().includes(q) ||
              c.role?.toLowerCase().includes(q) ||
              c.tags?.some((t) => t.toLowerCase().includes(q));
            if (!matches) return false;
          }
          return true;
        })
        .map((c) => c.id)
    );
  }, [characters, showPJ, showPNJ, visibleLocationIds, showSansLieu, search]);

  const visibleRelCount = useMemo(
    () =>
      relations.filter(
        (r) =>
          visibleCharacterIds.has(r.from_character_id) &&
          visibleCharacterIds.has(r.to_character_id) &&
          visibleRelationTypeIds.has(r.relation_type)
      ).length,
    [relations, visibleCharacterIds, visibleRelationTypeIds]
  );

  // --- Handlers ---------------------------------------------------
  const toggleLocation = (id: string) => {
    setVisibleLocationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleRelationType = (id: string) => {
    setVisibleRelationTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!session) return null;


  const sidebarContent = (
    <GraphFiltersSidebar
      search={search}
      onSearchChange={setSearch}
      locations={locations}
      visibleLocationIds={visibleLocationIds}
      showSansLieu={showSansLieu}
      onToggleLocation={toggleLocation}
      onToggleSansLieu={() => setShowSansLieu((v) => !v)}
      onSelectAllLocations={() =>
        setVisibleLocationIds(new Set(locations.map((l) => l.id)))
      }
      onClearLocations={() => setVisibleLocationIds(new Set())}
      showPJ={showPJ}
      showPNJ={showPNJ}
      onTogglePJ={() => setShowPJ((v) => !v)}
      onTogglePNJ={() => setShowPNJ((v) => !v)}
      visibleRelationTypeIds={visibleRelationTypeIds}
      onToggleRelationType={toggleRelationType}
      forces={forces}
      onForcesChange={setForces}
      onReseed={() => setReseedToken((t) => t + 1)}
      visibleCharCount={visibleCharacterIds.size}
      totalCharCount={characters.length}
      visibleRelCount={visibleRelCount}
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 flex flex-col">
        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 sm:mb-4 flex items-center gap-3"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
            title={t('character.backToGrimoire')}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="label-overline">{t('graph.overline')}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-none truncate">
              {t('graph.title')}
            </h1>

          </div>
        </motion.div>

        {/* Layout sidebar + canvas */}
        <div className="flex-1 flex gap-0 md:gap-4 min-h-[calc(100dvh-180px)] relative">
          {/* Sidebar desktop : inline, animée en width */}
          <motion.aside
            initial={false}
            animate={{
              width: isDesktop && sidebarOpen ? 288 : 0,
              opacity: isDesktop && sidebarOpen ? 1 : 0,
              marginRight: isDesktop && sidebarOpen ? 0 : -16,
            }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="hidden md:block overflow-hidden flex-shrink-0"
            aria-hidden={!isDesktop || !sidebarOpen}
          >
            <div className="w-72 h-full">{sidebarContent}</div>
          </motion.aside>

          {/* Canvas */}
          <div className="flex-1 card-paper overflow-hidden relative min-h-[500px]">
            {/* Bouton toggle sidebar : flottant top-left */}
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-paper)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-alt)] transition-colors shadow-sm text-xs font-body"
              aria-label={sidebarOpen ? t('graph.closePanel') : t('graph.openPanel')}
              title={sidebarOpen ? t('graph.closePanel') : t('graph.openPanel')}

            >
              {sidebarOpen ? (
                <PanelLeftClose size={16} />
              ) : (
                <PanelLeftOpen size={16} />
              )}
              <span className="hidden sm:inline">
                {t('graph.filters')}
              </span>

            </button>

            {/* Compteur flottant top-right */}
            <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-md bg-[var(--bg-card)]/80 backdrop-blur border border-[var(--border-paper)] text-[10px] sm:text-xs font-body text-[var(--text-muted)] pointer-events-none">
              <span className="text-[var(--text-secondary)] font-medium">
                {visibleCharacterIds.size}
              </span>
              <span> / {characters.length}</span>
              <span className="hidden sm:inline">
                {' '}· {t('graph.summaryRels', { n: visibleRelCount })}
              </span>

            </div>

            <ErrorBoundary
              fallbackTitle={t('graph.error')}

              onReset={() => setReseedToken((t) => t + 1)}
            >
              <SigmaGraph
                characters={characters}
                relations={relations}
                locations={locations}
                visibleCharacterIds={visibleCharacterIds}
                visibleRelationTypes={visibleRelationTypeIds}
                forces={forces}
                reseedToken={reseedToken}
              />
            </ErrorBoundary>
          </div>

          {/* Drawer mobile (overlay) */}
          <AnimatePresence>
            {!isDesktop && sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="md:hidden fixed inset-0 bg-black/40 z-40"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] bg-[var(--bg-card)] shadow-2xl"
                >
                  <div className="h-full overflow-hidden">{sidebarContent}</div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
