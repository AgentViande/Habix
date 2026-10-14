import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, ShieldCheck } from 'lucide-react';

export interface StartupSplashProps {
  isLoading?: boolean;
  minDuration?: number;
  onFinish?: () => void;
}

export const StartupSplash: React.FC<StartupSplashProps> = ({
  isLoading = false,
  minDuration = 1400,
  onFinish,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Chargement de vos habitudes...');

  useEffect(() => {
    // Progress bar animation steps
    const timer1 = setTimeout(() => {
      setProgress(55);
      setStatusText('Synchronisation des streaks et XP...');
    }, 450);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Préparation de votre aventure...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Prêt !');
    }, 1250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    // Only dismiss once both minDuration has elapsed AND isLoading is false
    const dismissTimer = setTimeout(() => {
      if (!isLoading) {
        setIsVisible(false);
        if (onFinish) onFinish();
      }
    }, minDuration);

    return () => clearTimeout(dismissTimer);
  }, [isLoading, minDuration, onFinish]);

  // Allow clicking anywhere to skip immediately
  const handleSkip = () => {
    setIsVisible(false);
    if (onFinish) onFinish();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="habix-startup-splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.03,
            filter: 'blur(8px)',
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          }}
          onClick={handleSkip}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-primary)] select-none cursor-pointer overflow-hidden p-6"
        >
          {/* Ambient luminous glow backgrounds */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-[80px] pointer-events-none" />

          {/* Sparkles Floating Particle Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.7], scale: [0.5, 1.2, 1], y: [0, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute top-1/3 left-[42%] text-amber-400 pointer-events-none"
          >
            <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.9, 0.6], scale: [0.5, 1.1, 0.9], y: [0, 6, 0] }}
            transition={{ duration: 1.4, delay: 0.2, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute bottom-1/3 right-[42%] text-indigo-400 pointer-events-none"
          >
            <Sparkles className="w-4 h-4 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          </motion.div>

          {/* Central Animated Crest */}
          <div className="relative mb-6">
            {/* Animated Pulsing Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-lg opacity-40"
            />

            {/* Crest Box */}
            <motion.div
              initial={{ scale: 0, rotate: -15, y: 20 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
              className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 border border-white/20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Flame className="w-12 h-12 text-white fill-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]" />
              </motion.div>
            </motion.div>
          </div>

          {/* Brand Name & Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Habix
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1 tracking-wide">
              Habit RPG • Forgez vos victoires quotidiennes
            </p>
          </motion.div>

          {/* Smooth Progress Bar & Status */}
          <motion.div
            initial={{ opacity: 0, width: '0%' }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="w-full max-w-xs space-y-2"
          >
            <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-subtle)]/50">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                {statusText}
              </span>
              <span className="tabular-nums font-semibold">{progress}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
