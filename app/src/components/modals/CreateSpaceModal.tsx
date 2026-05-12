import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '@/hooks/useSpace';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n';
import { SpaceCreatedModal } from './SpaceCreatedModal';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSpaceModal({ isOpen, onClose }: CreateSpaceModalProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdSpace, setCreatedSpace] = useState<{ name: string; invite_code: string } | null>(null);
  const { createSpace } = useSpace();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      setError(t('createSpace.errorRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const space = await createSpace(name.trim(), password);
      setCreatedSpace({ name: space.name, invite_code: space.invite_code });
    } catch (err) {
      void err;
      setError(t('createSpace.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setCreatedSpace(null);
    onClose();
    navigate('/dashboard');
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

            <p className="label-overline mb-1">{t('createSpace.overline')}</p>
            <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
              {t('createSpace.title')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-overline block mb-2">{t('createSpace.nameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('createSpace.namePlaceholder')}
                  className="field-paper"
                />
              </div>

              <div>
                <label className="label-overline block mb-2">{t('createSpace.passwordLabel')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('createSpace.passwordPlaceholder')}
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
                {loading ? t('createSpace.submitting') : t('createSpace.submit')}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
      {createdSpace && (
        <SpaceCreatedModal
          isOpen={!!createdSpace}
          spaceName={createdSpace.name}
          loginCode={createdSpace.invite_code}
          onClose={handleSuccessClose}
        />
      )}
    </AnimatePresence>
  );
}
