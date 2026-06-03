import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { WheelTimeline } from '@/components/timeline/WheelTimeline';
import { useAppStore } from '@/stores/appStore';
import { useT } from '@/i18n';

export default function ChroniclesPage() {
  const t = useT();
  const navigate = useNavigate();
  const { session } = useAppStore();

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-0 flex flex-col">
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
            <p className="label-overline">{t('chronicles.overline')}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-none truncate">
              {t('chronicles.title')}
            </h1>
          </div>
        </motion.div>

        <div className="flex-1 card-paper overflow-hidden relative min-h-[500px]">
          <WheelTimeline spaceId={session.space.id} />
        </div>
      </main>
    </div>
  );
}
