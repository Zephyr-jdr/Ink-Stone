import { X, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n';
import { useState } from 'react';

interface SpaceCreatedModalProps {
  isOpen: boolean;
  spaceName: string;
  loginCode: string;
  onClose: () => void;
}

export function SpaceCreatedModal({ isOpen, spaceName, loginCode, onClose }: SpaceCreatedModalProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(loginCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md card-paper p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label={t('common.close')}
            >
              <X size={20} />
            </button>

            <p className="label-overline mb-1">{t('spaceCreated.overline')}</p>
            <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
              {t('spaceCreated.title')}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="label-overline block mb-2">{t('spaceCreated.nameLabel')}</label>
                <div className="field-paper bg-[var(--paper-beige)] cursor-default">
                  {spaceName}
                </div>
              </div>

              <div>
                <label className="label-overline block mb-2">{t('spaceCreated.loginCodeLabel')}</label>
                <div className="flex gap-2">
                  <div className="field-paper bg-[var(--paper-beige)] flex-1 font-mono cursor-default">
                    {loginCode}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="btn-secondary px-4 flex items-center gap-2"
                    type="button"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? t('spaceCreated.copied') : t('spaceCreated.copyCode')}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-900 mb-2 font-body text-sm">
                  ⚠️ {t('spaceCreated.warningTitle')}
                </p>
                <p className="text-sm text-amber-800 font-body leading-relaxed">
                  {t('spaceCreated.warningText')}
                </p>
              </div>

              <button
                onClick={onClose}
                className="btn-ink w-full"
              >
                {t('spaceCreated.gotIt')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
