import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HabixLogo } from './HabixLogo';
import { ShieldCheck } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export interface StartupSplashProps {
  isLoading?: boolean;
  minDuration?: number; // Minimum 800 ms
  maxDuration?: number; // Safety timeout (4000 ms max)
  onFinish?: () => void;
}

export const StartupSplash: React.FC<StartupSplashProps> = ({
  isLoading = false,
  minDuration = 800,
  maxDuration = 4000,
  onFinish,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(25);
  const [statusText, setStatusText] = useState('Chargement de vos habitudes...');
  const { settings } = useSettingsStore();

  const isReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animationsEnabled = (settings.animationsEnabled ?? true) && !isReducedMotion;

  useEffect(() => {
    // Stepped progress animation
    const step1 = setTimeout(
      () => {
        setProgress(60);
        setStatusText('Synchronisation locale...');
      },
      Math.floor(minDuration * 0.4)
    );

    const step2 = setTimeout(
      () => {
        setProgress(90);
        setStatusText('Préparation de votre aventure...');
      },
      Math.floor(minDuration * 0.75)
    );

    const step3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Prêt !');
    }, minDuration);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  }, [minDuration]);

  useEffect(() => {
    let splashDismissed = false;

    const dismiss = () => {
      if (!splashDismissed) {
        splashDismissed = true;
        setIsVisible(false);
        if (onFinish) onFinish();
      }
    };

    // Minimum display timer
    const minTimer = setTimeout(() => {
      if (!isLoading) {
        dismiss();
      }
    }, minDuration);

    // Safety maximum timer (never stay blocked beyond maxDuration)
    const safetyTimer = setTimeout(() => {
      dismiss();
    }, maxDuration);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(safetyTimer);
    };
  }, [isLoading, minDuration, maxDuration, onFinish]);

  // When isLoading becomes false, check if minDuration has elapsed
  useEffect(() => {
    if (!isLoading && progress >= 100) {
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 100);
      return () => clearTimeout(dismissTimer);
    }
  }, [isLoading, progress, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="habix-startup-splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: animationsEnabled ? 1.02 : 1,
            transition: { duration: animationsEnabled ? 0.35 : 0.05, ease: 'easeInOut' },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-primary)] select-none overflow-hidden p-6"
        >
          {/* Ambient luminous glow backgrounds */}
          {animationsEnabled && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
            </>
          )}

          {/* Central Logo with Animated Glow */}
          <div className="relative mb-6">
            {animationsEnabled && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.5, 0.25] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-30"
              />
            )}

            {animationsEnabled ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 18,
                }}
              >
                <HabixLogo size={96} animated={true} />
              </motion.div>
            ) : (
              <div>
                <HabixLogo size={96} animated={false} />
              </div>
            )}
          </div>

          {/* Brand Name & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Habix
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1 tracking-wide">
              Habit RPG • Forgez vos victoires quotidiennes
            </p>
          </div>

          {/* Smooth Progress Bar & Status */}
          <div className="w-full max-w-xs space-y-2">
            <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-subtle)]/50">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: animationsEnabled ? 0.35 : 0.05, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                {statusText}
              </span>
              <span className="tabular-nums font-semibold">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
