import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '@/hooks/useSpace';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '@/i18n';

interface JoinSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinSpaceModal({ isOpen, onClose }: JoinSpaceModalProps) {
  const t = useT();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinSpace } = useSpace();
  const navigate = useNavigate();

  // Pre-fill invite code from URL (sync param → state UI modifiable)
  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInviteCode(joinCode);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !password.trim()) {
      setError(t('joinSpace.errorRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinSpace(inviteCode.trim(), password);
      navigate('/dashboard');
      onClose();
    } catch (err) {
      // Map stable error codes thrown by db.joinSpace → localised label.
      const code = err instanceof Error ? err.message : '';
      if (code === 'WRONG_PASSWORD')      setError(t('joinSpace.errorWrongPassword'));
      else if (code === 'SPACE_NOT_FOUND') setError(t('joinSpace.errorInvalid'));
      else                                setError(t('joinSpace.errorGeneric'));
    } finally {
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

            <p className="label-overline mb-1">{t('joinSpace.overline')}</p>
            <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
              {t('joinSpace.title')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-overline block mb-2">{t('joinSpace.codeLabel')}</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={t('joinSpace.codePlaceholder')}
                  className="field-paper"
                />
              </div>

              <div>
                <label className="label-overline block mb-2">{t('joinSpace.passwordLabel')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('joinSpace.passwordPlaceholder')}
                  className="field-paper"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 font-body">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-ink w-full"
              >
                {loading ? t('joinSpace.submitting') : t('joinSpace.submit')}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
