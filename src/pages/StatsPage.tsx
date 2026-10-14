import React, { useMemo } from 'react';
import { useHabitStore } from '../stores/useHabitStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { StatCard } from '../components/stats/StatCard';
import { HeatmapCalendar } from '../components/stats/HeatmapCalendar';
import { CompletionTrendChart } from '../components/stats/CompletionTrendChart';
import { DayOfWeekChart } from '../components/stats/DayOfWeekChart';
import { HabitComparisonChart } from '../components/stats/HabitComparisonChart';
import { MoodCorrelationChart } from '../components/stats/MoodCorrelationChart';
import { useMoodStore } from '../stores/useMoodStore';
import { calculateStreak } from '../lib/streaks';
import { getTodayLocal, weekDayToNumber, getDayOfWeek } from '../lib/date-utils';
import { Flame, CheckCircle, Trophy, Sparkles } from 'lucide-react';

export const StatsPage: React.FC = () => {
  const { habits, completions, freezeDays, categories } = useHabitStore();
  const { settings } = useSettingsStore();
  const { moods } = useMoodStore();

  const today = getTodayLocal(settings.timezone);
  const weekStartsOn = weekDayToNumber(settings.weekStartDay);

  const activeHabits = useMemo(() => habits.filter((h) => !h.isArchived), [habits]);

  // Overall statistics
  const totalCompletions = completions.length;

  const { maxCurrentStreak, habitWithMaxCurrent, maxBestStreak } = useMemo(() => {
    let maxCur = 0;
    let habitCur: string | undefined;
    let maxBest = 0;

    habits.forEach((h) => {
      const hComps = completions.filter((c) => c.habitId === h.id);
      const hFreezes = freezeDays.filter((f) => f.habitId === h.id);
      const s = calculateStreak(h, hComps, hFreezes, { today, weekStartsOn });
      if (s.current > maxCur) {
        maxCur = s.current;
        habitCur = h.name;
      }
      if (s.best > maxBest) {
        maxBest = s.best;
      }
    });

    return {
      maxCurrentStreak: maxCur,
      habitWithMaxCurrent: habitCur,
      maxBestStreak: maxBest,
    };
  }, [habits, completions, freezeDays, today, weekStartsOn]);

  // Determine best weekday (highest completion count)
  const bestDay = useMemo(() => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    completions.forEach((c) => {
      if (c.value >= 1) {
        const dow = getDayOfWeek(c.date);
        counts[dow] += 1;
      }
    });

    let bestIdx = 1;
    let maxVal = counts[1];
    for (let i = 0; i < 7; i++) {
      if (counts[i] > maxVal) {
        maxVal = counts[i];
        bestIdx = i;
      }
    }

    return {
      name: days[bestIdx],
      count: maxVal,
    };
  }, [completions]);

  return (
    <div className="space-y-7">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Statistiques & Analyses
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Suivez votre régularité, mesurez votre progression et observez vos tendances.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Streak actuel"
          value={`${maxCurrentStreak} j`}
          subtitle={habitWithMaxCurrent ? `Sur "${habitWithMaxCurrent}"` : 'Aucun streak actif'}
          icon={<Flame className="w-5 h-5" />}
          iconBg="rgba(251, 146, 60, 0.15)"
          iconColor="#fb923c"
        />

        <StatCard
          title="Record absolu"
          value={`${maxBestStreak} j`}
          subtitle="Meilleure série historique"
          icon={<Trophy className="w-5 h-5" />}
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#f59e0b"
        />

        <StatCard
          title="Total complétions"
          value={totalCompletions}
          subtitle={`${activeHabits.length} habitudes actives`}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBg="rgba(52, 211, 153, 0.15)"
          iconColor="#34d399"
        />

        <StatCard
          title="Meilleur jour"
          value={bestDay.name}
          subtitle={`${bestDay.count} complétions au total`}
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="rgba(129, 140, 248, 0.15)"
          iconColor="#818cf8"
        />
      </div>

      {/* Heatmap Annuelle GitHub Style */}
      <HeatmapCalendar
        habits={habits}
        completions={completions}
        freezeDays={freezeDays}
        today={today}
      />

      {/* Courbe de Progression du Taux de Réussite (7j, 30j, 90j, 1 an) */}
      <CompletionTrendChart habits={habits} completions={completions} today={today} />

      {/* Two Column Section: Day of Week & Habit Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DayOfWeekChart completions={completions} />

        <HabitComparisonChart
          habits={habits}
          completions={completions}
          freezeDays={freezeDays}
          categories={categories}
          today={today}
          weekStartsOn={weekStartsOn}
        />
      </div>

      {/* Mood vs Habit Correlation Chart */}
      <MoodCorrelationChart moods={moods} completions={completions} habits={habits} />
    </div>
  );
};

export default StatsPage;
