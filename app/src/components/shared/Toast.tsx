import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

export function Toast() {
  const { toast } = useAppStore();

  return (
    <AnimatePresence>
      {toast?.visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[var(--accent-primary)] text-white rounded-full shadow-lg font-body text-sm font-medium"
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
