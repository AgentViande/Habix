import React, { useState, useMemo } from 'react';
import type { Habit } from '../../models/habit';
import type { Completion } from '../../models/completion';
import type { FreezeDay } from '../../models/freeze-day';
import type { Category } from '../../models/category';
import { calculateStreak } from '../../lib/streaks';
import { subtractDays } from '../../lib/date-utils';
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

export interface HabitComparisonChartProps {
  habits: Habit[];
  completions: Completion[];
  freezeDays: FreezeDay[];
  categories: Category[];
  today: string;
  weekStartsOn: 0 | 1;
}

type MetricType = 'total' | 'streak' | 'rate';

export const HabitComparisonChart: React.FC<HabitComparisonChartProps> = ({
  habits,
  completions,
  freezeDays,
  categories,
  today,
  weekStartsOn,
}) => {
  const [metric, setMetric] = useState<MetricType>('total');

  const activeHabits = useMemo(() => habits.filter((h) => !h.isArchived), [habits]);

  // Pre-index collections for O(1) lookups
  const { completionsByHabit, freezeDaysByHabit, categoriesMap } = useMemo(() => {
    const cMap = new Map<string, Completion[]>();
    for (const c of completions) {
      const list = cMap.get(c.habitId);
      if (list) list.push(c);
      else cMap.set(c.habitId, [c]);
    }
    const fMap = new Map<string, FreezeDay[]>();
    for (const f of freezeDays) {
      const list = fMap.get(f.habitId);
      if (list) list.push(f);
      else fMap.set(f.habitId, [f]);
    }
    const catMap = new Map<string, Category>();
    for (const cat of categories) {
      catMap.set(cat.id, cat);
    }
    return { completionsByHabit: cMap, freezeDaysByHabit: fMap, categoriesMap: catMap };
  }, [completions, freezeDays, categories]);

  // Compute habit metrics (independent of metric sort)
  const baseMetrics = useMemo(() => {
    const last30Start = subtractDays(today, 30);

    return activeHabits.map((habit) => {
      const habitComps = completionsByHabit.get(habit.id) || [];
      const habitFreezes = freezeDaysByHabit.get(habit.id) || [];
      const streak = calculateStreak(habit, habitComps, habitFreezes, { today, weekStartsOn });
      const category = habit.categoryId ? categoriesMap.get(habit.categoryId) : undefined;

      const compsLast30 = habitComps.filter((c) => c.date >= last30Start).length;
      const rate30 = Math.min(100, Math.round((compsLast30 / 30) * 100));

      return {
        id: habit.id,
        name: `${habit.icon || '⚡'} ${habit.name}`,
        rawName: habit.name,
        icon: habit.icon || '⚡',
        color: habit.color || '#818cf8',
        categoryName: category?.name || 'Général',
        total: habitComps.length,
        streak: streak.current,
        bestStreak: streak.best,
        rate: rate30,
      };
    });
  }, [activeHabits, completionsByHabit, freezeDaysByHabit, categoriesMap, today, weekStartsOn]);

  // Fast sorting based on selected metric
  const chartData = useMemo(() => {
    return [...baseMetrics].sort((a, b) => {
      if (metric === 'streak') return b.streak - a.streak;
      if (metric === 'rate') return b.rate - a.rate;
      return b.total - a.total;
    });
  }, [baseMetrics, metric]);

  const getMetricLabel = () => {
    if (metric === 'streak') return 'Streak actuel (jours)';
    if (metric === 'rate') return 'Taux sur 30 jours (%)';
    return 'Total des complétions';
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
      {/* Header and Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Comparaison entre habitudes
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Indicateur affiché :{' '}
            <span className="font-semibold text-indigo-400">{getMetricLabel()}</span>.
          </p>
        </div>

        {/* Metric buttons */}
        <div className="flex bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: 'total', label: 'Total' },
            { id: 'streak', label: 'Streak' },
            { id: 'rate', label: 'Taux (30j)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMetric(tab.id as MetricType)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                metric === tab.id
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--text-muted)]">
          Aucune habitude active à comparer.
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-subtle)"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                unit={metric === 'rate' ? '%' : ''}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span>{d.icon}</span>
                          <span>{d.rawName}</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">{d.categoryName}</p>
                        <div className="pt-1 space-y-0.5 border-t border-[var(--border-subtle)]">
                          <div className="flex justify-between gap-4">
                            <span className="text-[var(--text-secondary)]">Total :</span>
                            <span className="font-bold text-[var(--text-primary)]">{d.total}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-[var(--text-secondary)]">Streak :</span>
                            <span className="font-bold text-orange-400">
                              {d.streak} j (rec. {d.bestStreak})
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-[var(--text-secondary)]">Taux 30j :</span>
                            <span className="font-bold text-emerald-400">{d.rate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={metric}
                radius={[0, 6, 6, 0]}
                isAnimationActive={true}
                animationDuration={850}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
