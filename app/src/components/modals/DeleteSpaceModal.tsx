
import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '@/hooks/useSpace';
import { useAppStore } from '@/stores/appStore';
import { useT } from '@/i18n';
import { ERR_WRONG_PASSWORD } from '@/lib/db';

interface DeleteSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceName: string;
  charactersCount: number;
  relationsCount: number;
  locationsCount: number;
}

export function DeleteSpaceModal({
  isOpen,
  onClose,
  spaceId,
  spaceName,
  charactersCount,
  relationsCount,
  locationsCount,
}: DeleteSpaceModalProps) {
  const t = useT();
  const navigate = useNavigate();
  const { deleteSpace } = useSpace();
  const { clearSession, showToast } = useAppStore();

  const [password, setPassword] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameMatches = confirmName.trim() === spaceName;
  const canSubmit = password.length > 0 && nameMatches && !loading;

  const reset = () => {
    setPassword('');
    setConfirmName('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    try {
      await deleteSpace(spaceId, password);
      // Succès : nettoyer la session, rediriger, notifier
      clearSession();
      showToast(t('deleteSpace.deleted', { name: spaceName }));
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === ERR_WRONG_PASSWORD) {
        setError(t('deleteSpace.errorWrongPassword'));
      } else {
        setError(t('deleteSpace.errorGeneric'));
      }
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md card-paper p-8 border-l-4 border-red-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              disabled={loading}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
              aria-label={t('common.close')}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-red-700" />
              <p className="label-overline text-red-700">
                {t('deleteSpace.overline')}
              </p>
            </div>
            <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
              {t('deleteSpace.title')}
            </h2>

            {/* Avertissement chiffré */}
            <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-5 text-sm font-body text-red-800 space-y-1">
              <p className="font-semibold">
                {t('deleteSpace.warning', { name: spaceName })}
              </p>
              <p>
                {t('deleteSpace.warningCounts', {
                  characters: charactersCount,
                  relations: relationsCount,
                  locations: locationsCount,
                })}
              </p>
              <p className="font-semibold">{t('deleteSpace.warningIrreversible')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-overline block mb-2">
                  {t('deleteSpace.passwordLabel')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('deleteSpace.passwordPlaceholder')}
                  className="field-paper"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label-overline block mb-2">
                  {t('deleteSpace.confirmNameLabel', { name: spaceName })}
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={spaceName}
                  className="field-paper"
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {error && <p className="text-sm text-red-700 font-body">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="btn-outline flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium font-body bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? t('deleteSpace.submitting') : t('deleteSpace.submit')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
