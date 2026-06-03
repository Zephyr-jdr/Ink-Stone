import { motion, AnimatePresence } from 'framer-motion';
import { X, ScrollText, GitGraph, Coffee } from 'lucide-react';
import { useT } from '@/i18n';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KOFI_URL = 'https://ko-fi.com/zephyrjdr';

export function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const t = useT();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md card-paper p-7 my-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label={t('whatsNew.gotIt')}
            >
              <X size={20} />
            </button>

            <p className="label-overline mb-1">{t('whatsNew.overline')}</p>
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2 leading-tight">
              {t('whatsNew.title')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-body mb-5">
              {t('whatsNew.intro')}
            </p>

            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--bg-card-alt)] border border-[var(--border-paper)] flex items-center justify-center text-[var(--text-primary)]">
                  <ScrollText size={17} />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-[var(--text-primary)] leading-tight">
                    {t('whatsNew.chroniclesTitle')}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] font-body">
                    {t('whatsNew.chroniclesText')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--bg-card-alt)] border border-[var(--border-paper)] flex items-center justify-center text-[var(--text-primary)]">
                  <GitGraph size={17} />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-[var(--text-primary)] leading-tight">
                    {t('whatsNew.graphTitle')}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] font-body">
                    {t('whatsNew.graphText')}
                  </p>
                </div>
              </li>
            </ul>

            <div className="rounded-lg border border-[var(--border-paper)] bg-[var(--bg-card-alt)] p-4 mb-5">
              <p className="text-sm text-[var(--text-secondary)] font-body mb-3">
                {t('whatsNew.kofiText')}
              </p>
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ink w-full justify-center"
              >
                <Coffee size={16} />
                {t('whatsNew.kofiCta')}
              </a>
            </div>

            <button onClick={onClose} className="btn-outline w-full justify-center">
              {t('whatsNew.gotIt')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
