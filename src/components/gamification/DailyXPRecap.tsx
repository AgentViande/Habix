import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../db';
import type { Habit } from '../../models/habit';
import type { Completion } from '../../models/completion';
import type { FreezeDay } from '../../models/freeze-day';
import type { XPEvent } from '../../models/xp-event';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getLevelInfo, calculateXPGain } from '../../services/xp';
import { calculateStreak } from '../../lib/streaks';
import { weekDayToNumber } from '../../lib/date-utils';
import { Sparkles, Trophy, Flame, X, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DailyXPRecapProps {
  today: string;
  habits: Habit[];
  completions: Completion[];
  freezeDays: FreezeDay[];
  isAllDone?: boolean;
}

export const DailyXPRecap: React.FC<DailyXPRecapProps> = ({
  today,
  habits,
  completions,
  freezeDays,
  isAllDone = false,
}) => {
  const { profile, unlockedBadges } = useGamificationStore();
  const { settings } = useSettingsStore();
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([]);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [hasDismissedCelebration, setHasDismissedCelebration] = useState(false);

  // Load XP events for today
  useEffect(() => {
    let isMounted = true;
    async function loadTodayXP() {
      try {
        const events = await db.xpEvents.where('date').equals(today).toArray();
        if (isMounted) {
          setXpEvents(events);
        }
      } catch {
        // Table might be initializing
      }
    }
    loadTodayXP();
    return () => {
      isMounted = false;
    };
  }, [today, completions]);

  // When all habits are completed, show celebration modal once
  useEffect(() => {
    if (isAllDone && !hasDismissedCelebration) {
      setIsCelebrationModalOpen(true);
    }
  }, [isAllDone, hasDismissedCelebration]);

  const weekStartsOn = weekDayToNumber(settings.weekStartDay);

  // Active habits completed today
  const completedHabitsToday = habits.filter((h) => {
    const comp = completions.find((c) => c.habitId === h.id && c.date === today);
    if (!comp) return false;
    if (h.targetType === 'numeric' && h.targetValue !== null) {
      return comp.value >= h.targetValue;
    }
    return comp.value >= 1;
  });

  if (completedHabitsToday.length === 0) {
    return null;
  }

  // Calculate total XP gained today:
  // If we have recorded xpEvents, use their sum.
  // Otherwise estimate from completed habits today + perfect day bonus.
  const recordedXPSum = xpEvents.reduce((acc, ev) => acc + (ev.amount || 0), 0);

  const estimatedHabitsXP = completedHabitsToday.reduce((acc, h) => {
    const hComps = completions.filter((c) => c.habitId === h.id);
    const hFreezes = freezeDays.filter((f) => f.habitId === h.id);
    const streak = calculateStreak(h, hComps, hFreezes, { today, weekStartsOn });
    const gain = calculateXPGain({
      difficulty: h.difficulty,
      currentStreak: streak.current,
      isPerfectDay: false,
    });
    return acc + gain.totalXP;
  }, 0);

  const estimatedXP = estimatedHabitsXP + (isAllDone ? 50 : 0);

  const totalTodayXP = recordedXPSum > 0 ? recordedXPSum : estimatedXP;

  // Level progress
  const levelInfo = getLevelInfo(profile?.totalXP || 0);
  const xpRemainingForNext = Math.max(0, levelInfo.xpForNextLevel - levelInfo.currentLevelXP);

  // Badges unlocked today
  const badgesToday = unlockedBadges.filter((b) => {
    if (!b.unlockedAt) return false;
    const dateStr = new Intl.DateTimeFormat('fr-CA').format(new Date(b.unlockedAt));
    return dateStr === today;
  });

  const userName = settings.userName?.trim();

  const CardContent = (
    <div className="space-y-4">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)]">
                Ton résumé du jour
              </h3>
              {isAllDone && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                  Journée parfaite
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {userName ? `${userName}, voici` : 'Voici'} la synthèse de votre progression
              aujourd'hui.
            </p>
          </div>
        </div>

        {/* XP Counter Box */}
        <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] px-4 py-2.5 rounded-2xl self-start sm:self-auto">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
              XP Gagnés
            </span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <motion.span
                key={totalTodayXP}
                initial={{ scale: 1.2, color: '#f59e0b' }}
                animate={{ scale: 1, color: 'var(--text-primary)' }}
                className="text-xl font-black tabular-nums"
              >
                +{totalTodayXP} XP
              </motion.span>
            </div>
          </div>

          <div className="h-8 w-px bg-[var(--border-subtle)]" />

          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
              Prochain niveau
            </span>
            <span className="text-xs font-bold text-indigo-400 tabular-nums">
              {xpRemainingForNext} XP restants
            </span>
          </div>
        </div>
      </div>

      {/* Habits Done Detail List */}
      <div className="pt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
          Habitudes validées ({completedHabitsToday.length})
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {completedHabitsToday.map((h) => {
            const hComps = completions.filter((c) => c.habitId === h.id);
            const hFreezes = freezeDays.filter((f) => f.habitId === h.id);
            const streak = calculateStreak(h, hComps, hFreezes, { today, weekStartsOn });
            const event = xpEvents.find((e) => e.habitId === h.id);
            const gain = event
              ? event.amount
              : calculateXPGain({
                  difficulty: h.difficulty,
                  currentStreak: streak.current,
                  isPerfectDay: false,
                }).totalXP;

            return (
              <div
                key={h.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-tertiary)]/70 border border-[var(--border-subtle)]/50 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-base">{h.icon || '⚡'}</span>
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--text-primary)] block truncate">
                      {h.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                      <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                      Série de {streak.current} j
                    </span>
                  </div>
                </div>

                <span className="font-bold text-amber-400 tabular-nums flex-shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 text-[11px]">
                  +{gain} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges unlocked notice if any */}
      {badgesToday.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">
              {badgesToday.length} trophée(s) débloqué(s) aujourd'hui !
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Consultez votre page Profil pour admirer vos nouveaux succès.
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Inline Today Page Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        {CardContent}
      </motion.div>

      {/* End of Day Celebratory Modal (when 100% completed) */}
      <AnimatePresence>
        {isCelebrationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => {
                setIsCelebrationModalOpen(false);
                setHasDismissedCelebration(true);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 280 }}
              className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-500/15 z-10 overflow-hidden"
            >
              <button
                onClick={() => {
                  setIsCelebrationModalOpen(false);
                  setHasDismissedCelebration(true);
                }}
                className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">🎉</span>
                <h3 className="text-2xl font-black text-[var(--text-primary)]">
                  {userName ? `Bravo ${userName} !` : 'Toutes vos habitudes sont faites !'}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-400 font-semibold mt-1">
                  Journée 100% accomplie • +50 XP bonus de journée parfaite !
                </p>
              </div>

              {CardContent}

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsCelebrationModalOpen(false);
                    setHasDismissedCelebration(true);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none shadow-lg shadow-emerald-500/25"
                >
                  Continuer ma journée
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
