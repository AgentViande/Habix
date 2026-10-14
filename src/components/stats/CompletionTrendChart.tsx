import React, { useState, useMemo } from 'react';
import type { Habit } from '../../models/habit';
import type { Completion } from '../../models/completion';
import { subtractDays, addDays, getDayOfWeek } from '../../lib/date-utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface CompletionTrendChartProps {
  habits: Habit[];
  completions: Completion[];
  today: string;
}

type Timeframe = 7 | 30 | 90 | 365;

export const CompletionTrendChart: React.FC<CompletionTrendChartProps> = ({
  habits,
  completions,
  today,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>(30);

  // Filter active habits
  const activeHabits = useMemo(() => habits.filter((h) => !h.isArchived), [habits]);

  // Fast completion lookup: "habitId:date" -> value
  const compLookup = useMemo(() => {
    const map = new Map<string, number>();
    completions.forEach((c) => {
      map.set(`${c.habitId}:${c.date}`, c.value);
    });
    return map;
  }, [completions]);

  const trendData = useMemo(() => {
    const daysCount = timeframe;
    const startDate = subtractDays(today, daysCount - 1);
    const data: Array<{
      date: string;
      displayDate: string;
      rate: number;
      completed: number;
      total: number;
    }> = [];

    let cur = startDate;
    for (let i = 0; i < daysCount; i++) {
      const dow = getDayOfWeek(cur);

      // Find habits expected on this day
      const expectedOnDay = activeHabits.filter((h) => {
        if (h.frequencyType === 'weekly_fixed') {
          const days = (h.frequencyConfig as { days: number[] }).days || [];
          return days.includes(dow);
        }
        if (h.restDays && h.restDays.includes(dow)) {
          return false;
        }
        return true;
      });

      const totalExpected = expectedOnDay.length || 1;
      let completedCount = 0;

      expectedOnDay.forEach((h) => {
        const val = compLookup.get(`${h.id}:${cur}`) || 0;
        if (h.targetType === 'numeric' && h.targetValue !== null) {
          if (val >= h.targetValue) completedCount++;
        } else if (val >= 1) {
          completedCount++;
        }
      });

      const rawRate =
        expectedOnDay.length > 0 ? Math.round((completedCount / totalExpected) * 100) : 0;

      // Short display format for X Axis
      const displayDate =
        timeframe === 7
          ? new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(
              new Date(cur + 'T12:00:00Z')
            )
          : timeframe <= 30
            ? `${cur.substring(8, 10)}/${cur.substring(5, 7)}`
            : new Intl.DateTimeFormat('fr-FR', { month: 'short', day: 'numeric' }).format(
                new Date(cur + 'T12:00:00Z')
              );

      data.push({
        date: cur,
        displayDate,
        rate: Math.min(100, rawRate),
        completed: completedCount,
        total: expectedOnDay.length,
      });

      cur = addDays(cur, 1);
    }

    return data;
  }, [timeframe, today, activeHabits, compLookup]);

  // Overall average rate in current timeframe
  const averageRate = useMemo(() => {
    if (trendData.length === 0) return 0;
    const sum = trendData.reduce((acc, d) => acc + d.rate, 0);
    return Math.round(sum / trendData.length);
  }, [trendData]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
      {/* Header with Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Taux de réussite
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-400">
              Moyenne : {averageRate}%
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Évolution quotidienne du pourcentage d'habitudes complétées.
          </p>
        </div>

        {/* Timeframe buttons */}
        <div className="flex bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-1 rounded-xl self-start sm:self-auto">
          {[
            { label: '7 j', value: 7 },
            { label: '30 j', value: 30 },
            { label: '90 j', value: 90 },
            { label: '1 an', value: 365 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTimeframe(tab.value as Timeframe)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === tab.value
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              interval={timeframe === 365 ? 30 : timeframe === 90 ? 10 : timeframe === 30 ? 3 : 0}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              unit="%"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-[var(--text-primary)]">
                        {new Intl.DateTimeFormat('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        }).format(new Date(d.date + 'T12:00:00Z'))}
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--text-secondary)]">Taux :</span>
                        <span className="font-bold text-indigo-400 tabular-nums">{d.rate}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--text-muted)]">Habitudes :</span>
                        <span className="text-[var(--text-secondary)] tabular-nums">
                          {d.completed} / {d.total}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="var(--accent-primary)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#rateGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
