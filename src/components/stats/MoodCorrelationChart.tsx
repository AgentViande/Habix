import React, { useMemo } from 'react';
import type { MoodEntry } from '../../models/mood';
import type { Completion } from '../../models/completion';
import type { Habit } from '../../models/habit';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Smile, Sparkles } from 'lucide-react';

export interface MoodCorrelationChartProps {
  moods: MoodEntry[];
  completions: Completion[];
  habits: Habit[];
}

const EMOJI_BY_LEVEL: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '😊',
  5: '😄',
};

const LABEL_BY_LEVEL: Record<number, string> = {
  1: 'Difficile',
  2: 'Bof',
  3: 'Neutre',
  4: 'Bien',
  5: 'Au top',
};

export const MoodCorrelationChart: React.FC<MoodCorrelationChartProps> = ({
  moods,
  completions,
  habits,
}) => {
  const activeHabitsCount = habits.filter((h) => !h.isArchived).length || 1;

  // Compute correlation: for each mood level, average completion rate on those days
  const { correlationData, totalMoodLogs, insight } = useMemo(() => {
    // Map date -> completions count
    const compsByDate = new Map<string, number>();
    completions.forEach((c) => {
      if (c.value >= 1) {
        compsByDate.set(c.date, (compsByDate.get(c.date) || 0) + 1);
      }
    });

    // Level stats: count of days, total completion rate
    const stats: Record<number, { dayCount: number; totalCompletions: number }> = {
      1: { dayCount: 0, totalCompletions: 0 },
      2: { dayCount: 0, totalCompletions: 0 },
      3: { dayCount: 0, totalCompletions: 0 },
      4: { dayCount: 0, totalCompletions: 0 },
      5: { dayCount: 0, totalCompletions: 0 },
    };

    moods.forEach((m) => {
      if (stats[m.level]) {
        stats[m.level].dayCount += 1;
        const comps = compsByDate.get(m.date) || 0;
        stats[m.level].totalCompletions += comps;
      }
    });

    const data = [1, 2, 3, 4, 5].map((lvl) => {
      const s = stats[lvl];
      const avgRate =
        s.dayCount > 0
          ? Math.min(100, Math.round((s.totalCompletions / (s.dayCount * activeHabitsCount)) * 100))
          : 0;

      return {
        level: lvl,
        emoji: EMOJI_BY_LEVEL[lvl],
        label: LABEL_BY_LEVEL[lvl],
        name: `${EMOJI_BY_LEVEL[lvl]} ${LABEL_BY_LEVEL[lvl]}`,
        dayCount: s.dayCount,
        avgRate,
      };
    });

    const highMoodRate = Math.round(
      ((stats[4].totalCompletions + stats[5].totalCompletions) /
        Math.max(1, (stats[4].dayCount + stats[5].dayCount) * activeHabitsCount)) *
        100
    );
    const lowMoodRate = Math.round(
      ((stats[1].totalCompletions + stats[2].totalCompletions) /
        Math.max(1, (stats[1].dayCount + stats[2].dayCount) * activeHabitsCount)) *
        100
    );

    let generatedInsight =
      'Enregistrez votre humeur pour découvrir la corrélation avec vos habitudes.';
    if (moods.length >= 3) {
      if (highMoodRate > lowMoodRate) {
        generatedInsight = `Vous complétez ${highMoodRate}% de vos habitudes quand vous êtes de bonne humeur, contre ${lowMoodRate}% les jours plus difficiles.`;
      } else {
        generatedInsight = 'Votre discipline reste stable quelle que soit votre humeur du jour !';
      }
    }

    return {
      correlationData: data,
      totalMoodLogs: moods.length,
      insight: generatedInsight,
    };
  }, [moods, completions, activeHabitsCount]);

  if (totalMoodLogs === 0) {
    return (
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center gap-2">
          <Smile className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Corrélation Humeur & Habitudes
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Commencez à enregistrer votre humeur sur la page d'accueil pour voir l'impact de votre
          état d'esprit sur votre constance !
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Corrélation Humeur & Réussite
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Taux de réussite moyen des habitudes selon votre niveau d'énergie.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{totalMoodLogs} jours enregistrés</span>
        </div>
      </div>

      {/* Insight banner */}
      <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-3">
        <span className="text-xl">💡</span>
        <span className="leading-relaxed font-medium">{insight}</span>
      </div>

      {/* Bar Chart: Success Rate by Mood Level */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={correlationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span className="text-lg">{d.emoji}</span>
                        <span>{d.label}</span>
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--text-secondary)]">Taux moyen :</span>
                        <span className="font-bold text-emerald-400 tabular-nums">
                          {d.avgRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--text-muted)]">Jours notés :</span>
                        <span className="text-[var(--text-secondary)] tabular-nums">
                          {d.dayCount}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="avgRate" radius={[6, 6, 0, 0]}>
              {correlationData.map((entry) => {
                const colors = ['#f87171', '#fb923c', '#fbbf24', '#818cf8', '#34d399'];
                return <Cell key={entry.level} fill={colors[entry.level - 1]} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
