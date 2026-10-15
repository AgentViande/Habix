import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HabixLogo } from '../ui/HabixLogo';
import { Button } from '../ui/Button';
import { ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { db } from '../../db';

export interface OnboardingModalProps {
  isOpen: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen }) => {
  const { updateSettings } = useSettingsStore();
  const { profile } = useGamificationStore();
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = firstName.trim();

    if (!trimmed) {
      setError('Veuillez entrer votre prénom pour continuer.');
      return;
    }

    if (trimmed.length > 30) {
      setError('Le prénom ne doit pas dépasser 30 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSettings({ userName: trimmed });

      // Synchronize with UserProfile if present
      if (profile) {
        await db.userProfile.update('default', { displayName: trimmed });
      }
    } catch (err) {
      console.error('Error saving onboarding name:', err);
      setError('Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="habix-onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-primary)] overflow-y-auto"
      >
        {/* Luminous background halos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 text-center z-10 my-auto"
        >
          {/* Centered Habix Logo with ambient glow */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-indigo-500 to-pink-500 blur-lg opacity-35" />
              <HabixLogo size={76} />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Bienvenue sur Habix
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1.5 mb-6 max-w-xs mx-auto leading-relaxed">
            Votre compagnon RPG pour forger vos habitudes quotidiennes et célébrer chacune de vos
            victoires.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="onboarding-firstname"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2"
              >
                Comment souhaitez-vous qu'on vous appelle ?
              </label>
              <div className="relative">
                <input
                  id="onboarding-firstname"
                  type="text"
                  autoFocus
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ex : Alex, Sarah..."
                  maxLength={30}
                  className="w-full h-12 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all"
                />
              </div>
              {error && (
                <p className="text-xs font-semibold text-rose-400 mt-2 flex items-center gap-1">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-pink-600 border-none shadow-lg shadow-indigo-500/25 text-sm font-bold flex items-center justify-center gap-2 mt-4"
            >
              <span>Commencer l'aventure</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Reassurance pills */}
          <div className="grid grid-cols-2 gap-2 mt-6 pt-5 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-medium text-left">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>100% Hors-ligne & local</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span>Gamification & XP</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
