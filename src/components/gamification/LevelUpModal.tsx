import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { Button } from '../ui/Button';
import { Sparkles, Snowflake, ArrowUp } from 'lucide-react';

export const LevelUpModal: React.FC = () => {
  const { levelUpModal, dismissLevelUp } = useGamificationStore();

  if (levelUpModal === null) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={dismissLevelUp}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          className="relative w-full max-w-sm bg-[var(--bg-elevated)] border border-indigo-500/40 rounded-3xl p-6 sm:p-7 text-center shadow-2xl shadow-indigo-500/15 z-10 overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ArrowUp className="w-3.5 h-3.5" /> Niveau Supérieur !
            </span>
          </div>

          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
            className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white my-4 shadow-xl shadow-indigo-500/30"
          >
            <Sparkles className="w-8 h-8 mb-0.5 text-amber-300" />
            <span className="text-xl font-black uppercase tracking-tight">Niv. {levelUpModal}</span>
          </motion.div>

          <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1">Félicitations !</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-5 max-w-xs mx-auto">
            Votre constance porte ses fruits. Vous passez au niveau supérieur !
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
