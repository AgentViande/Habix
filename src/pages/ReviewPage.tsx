import React, { useMemo } from 'react';
import { useHabitStore } from '../stores/useHabitStore';
import { useMoodStore } from '../stores/useMoodStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { generateWeeklyReview } from '../services/review';
import { getTodayLocal, weekDayToNumber } from '../lib/date-utils';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Smile,
  Flame,
  CalendarCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ReviewPage: React.FC = () => {
  const { habits, completions, freezeDays } = useHabitStore();
  const { moods } = useMoodStore();
  const { settings } = useSettingsStore();

  const today = getTodayLocal(settings.timezone);
  const weekStartsOn = weekDayToNumber(settings.weekStartDay);

  const review = useMemo(() => {
    return generateWeeklyReview(habits, completions, freezeDays, moods, today, weekStartsOn);
  }, [habits, completions, freezeDays, moods, today, weekStartsOn]);

  const moodEmoji =
    review.averageMood === null
      ? '😐'
      : review.averageMood >= 4.5
        ? '😄'
        : review.averageMood >= 3.5
          ? '😊'
          : review.averageMood >= 2.5
            ? '😐'
            : review.averageMood >= 1.5
              ? '😔'
              : '😢';

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold mb-2">
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>
            Semaine du {review.weekStart} au {review.weekEnd}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Revue Hebdomadaire
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Bilan de vos accomplissements et pistes d'amélioration pour la semaine à venir.
        </p>
      </div>

      {/* Global Score Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] relative overflow-hidden shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Score global de complétion
          </span>
          <div className="flex items-baseline gap-3 my-1">
            <span className="text-4xl sm:text-5xl font-black text-[var(--text-primary)] tabular-nums">
              {review.completionRate}%
            </span>

            {/* Delta vs S-1 */}
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                review.rateDelta >= 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {review.rateDelta >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {review.rateDelta >= 0 ? `+${review.rateDelta}%` : `${review.rateDelta}%`} vs S-1
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {review.totalCompletionsThisWeek} habitudes validées cette semaine.
          </p>
        </div>

        {/* Progress ring or summary badge */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] self-start sm:self-auto">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl flex-shrink-0">
            <Flame className="w-6 h-6 fill-orange-400" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
              Meilleur streak en cours
            </span>
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {review.bestStreakThisWeek.habitName} ({review.bestStreakThisWeek.streak} j)
            </span>
          </div>
        </div>
      </motion.div>

      {/* Grid: Top Habits & Points to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Habits */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-emerald-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Habitudes performantes
            </h3>
          </div>

          {review.topHabits.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Pas encore assez de complétions enregistrées cette semaine.
            </p>
          ) : (
            <div className="space-y-2.5">
              {review.topHabits.map(({ habit, completionCount, rate }) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-tertiary)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon || '⚡'}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {habit.name}
                      </h4>
                      <span className="text-xs text-[var(--text-muted)]">
                        {completionCount} fois cette semaine
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full tabular-nums">
                    {rate}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Struggling Habits */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-amber-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">Points à améliorer</h3>
          </div>

          {review.strugglingHabits.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Toutes vos habitudes ont été parfaitement respectées ! ✨
            </p>
          ) : (
            <div className="space-y-2.5">
              {review.strugglingHabits.map(({ habit, completionCount, rate }) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-tertiary)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon || '⚡'}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {habit.name}
                      </h4>
                      <span className="text-xs text-[var(--text-muted)]">
                        {completionCount} fois seulement
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full tabular-nums">
                    {rate}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mood Summary of the Week */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-3xl">
            {moodEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                Humeur moyenne de la semaine
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {review.averageMood !== null
                ? `Note moyenne de ${review.averageMood}/5 sur ${review.moodCount} jours renseignés.`
                : 'Aucune humeur enregistrée cette semaine.'}
            </p>
          </div>
        </div>

        <div className="text-xs text-indigo-300 bg-indigo-500/10 px-3.5 py-2 rounded-xl border border-indigo-500/20 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
          Prendre soin de son humeur décuple la régularité !
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
