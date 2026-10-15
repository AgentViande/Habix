import React, { useMemo } from 'react';
import type { Completion } from '../../models/completion';
import { getDayOfWeek } from '../../lib/date-utils';
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
import { Sparkles } from 'lucide-react';

export interface DayOfWeekChartProps {
  completions: Completion[];
}

export const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({ completions }) => {
  const { data, bestDay } = useMemo(() => {
    // 0=Sun, 1=Mon, ..., 6=Sat
    const counts = [0, 0, 0, 0, 0, 0, 0];

    completions.forEach((c) => {
      if (c.value >= 1) {
        const dow = getDayOfWeek(c.date);
        counts[dow] += 1;
      }
    });

    const days = [
      { name: 'Lundi', short: 'Lun', count: counts[1], dayIndex: 1 },
      { name: 'Mardi', short: 'Mar', count: counts[2], dayIndex: 2 },
      { name: 'Mercredi', short: 'Mer', count: counts[3], dayIndex: 3 },
      { name: 'Jeudi', short: 'Jeu', count: counts[4], dayIndex: 4 },
      { name: 'Vendredi', short: 'Ven', count: counts[5], dayIndex: 5 },
      { name: 'Samedi', short: 'Sam', count: counts[6], dayIndex: 6 },
      { name: 'Dimanche', short: 'Dim', count: counts[0], dayIndex: 0 },
    ];

    let maxDay = days[0];
    days.forEach((d) => {
      if (d.count > maxDay.count) maxDay = d;
    });

    return { data: days, bestDay: maxDay };
  }, [completions]);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Réussite par jour de la semaine
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Découvrez vos pics de discipline hebdomadaire.
          </p>
        </div>

        {bestDay.count > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Meilleur jour : {bestDay.name} ({bestDay.count})
            </span>
          </div>
        )}
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="short" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const isBest = d.name === bestDay.name && d.count > 0;
                  return (
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-[var(--text-primary)] flex items-center justify-between gap-3">
                        <span>{d.name}</span>
                        {isBest && <span className="text-amber-400">⭐ Top</span>}
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--text-secondary)]">Complétions :</span>
                        <span className="font-bold text-indigo-400 tabular-nums">{d.count}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
              animationDuration={850}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === bestDay.name && entry.count > 0
                      ? 'var(--streak-fire)'
                      : 'var(--accent-primary)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
