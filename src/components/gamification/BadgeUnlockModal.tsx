import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { Button } from '../ui/Button';
import { Sparkles, Trophy } from 'lucide-react';

export const BadgeUnlockModal: React.FC = () => {
  const { pendingBadge, levelUpModal, dismissBadgeUnlock } = useGamificationStore();

  useEffect(() => {
    if (pendingBadge && levelUpModal === null) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          dismissBadgeUnlock();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [pendingBadge, levelUpModal, dismissBadgeUnlock]);

  // If level up modal is currently active, wait in queue until it is dismissed
  if (levelUpModal !== null || !pendingBadge) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={dismissBadgeUnlock}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Déblocage du trophée : ${pendingBadge.name}`}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-sm bg-[var(--bg-elevated)] border border-amber-500/40 rounded-3xl p-6 sm:p-7 text-center shadow-2xl shadow-amber-500/10 z-10 overflow-hidden outline-none"
        >
          {/* Decorative glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" /> Nouveau Trophée !
            </span>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-4xl sm:text-5xl my-4 shadow-lg shadow-amber-500/20"
          >
            {pendingBadge.icon}
          </motion.div>

          <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-1">
            {pendingBadge.name}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-xs mx-auto leading-relaxed">
            {pendingBadge.description}
          </p>

          <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-400 font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Badge ajouté à votre galerie de succès !</span>
          </div>

          <Button
            variant="primary"
            onClick={dismissBadgeUnlock}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none shadow-lg shadow-amber-500/25"
          >
            Incroyable !
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
