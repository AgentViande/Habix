import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { Button } from '../ui/Button';
import { Sparkles, Snowflake, ArrowUp } from 'lucide-react';
import { sounds } from '../../lib/sounds';

export const LevelUpModal: React.FC = () => {
  const { levelUpModal, dismissLevelUp } = useGamificationStore();

  useEffect(() => {
    if (levelUpModal !== null) {
      sounds.playLevelUp();
    }
  }, [levelUpModal]);

  if (levelUpModal === null) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={dismissLevelUp}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          className="relative w-full max-w-sm bg-[var(--bg-elevated)] border border-indigo-500/40 rounded-3xl p-6 sm:p-7 text-center shadow-2xl shadow-indigo-500/20 z-10 overflow-hidden"
        >
          {/* Luminous Pulsing Glow */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-3xl pointer-events-none"
          />

          {/* Floating Sparkle Particles */}
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-10, -25], x: [0, 8] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.1 }}
            className="absolute top-12 left-10 text-amber-400 pointer-events-none"
          >
            <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-10, -28], x: [0, -8] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
            className="absolute top-16 right-10 text-pink-400 pointer-events-none"
          >
            <Sparkles className="w-4 h-4 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
          </motion.div>

          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ArrowUp className="w-3.5 h-3.5" /> Niveau Supérieur !
            </span>
          </div>

          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
            className="relative w-28 h-28 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white my-4 shadow-2xl shadow-indigo-500/40 border border-white/20"
          >
            <Sparkles className="w-8 h-8 mb-0.5 text-amber-300" />
            <span className="text-2xl font-black uppercase tracking-tight">
              Niv. {levelUpModal}
            </span>
          </motion.div>

          <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1">Félicitations !</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-5 max-w-xs mx-auto">
            Votre constance porte ses fruits. Vous débloquez de nouvelles prouesses et passez au
            niveau supérieur !
          </p>

          {/* Reward badge: +1 freeze day */}
          <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 mb-6 text-left">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Snowflake className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-300 block">Récompense de niveau</span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                +1 Jour de gel ❄️ ajouté à votre réserve
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={dismissLevelUp}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-none shadow-lg shadow-indigo-500/25"
          >
            Continuer l'aventure
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
