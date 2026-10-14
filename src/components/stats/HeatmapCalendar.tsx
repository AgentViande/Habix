import React, { useState, useMemo, useCallback } from 'react';
import type { Habit } from '../../models/habit';
import type { Completion } from '../../models/completion';
import type { FreezeDay } from '../../models/freeze-day';
import { subtractDays, addDays, getDayOfWeek, getWeekStart } from '../../lib/date-utils';

export interface HeatmapCalendarProps {
  habits: Habit[];
  completions: Completion[];
  freezeDays: FreezeDay[];
  today: string;
}

interface PrecomputedCell {
  date: string;
  dow: number;
  count: number;
  isCompleted: boolean;
  isFrozen: boolean;
  isRest: boolean;
  isFuture: boolean;
  colorClass: string;
  ariaLabel: string;
  formattedDate: string;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  habits,
  completions,
  freezeDays,
  today,
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    cell: PrecomputedCell;
    habitName?: string;
    x: number;
    y: number;
  } | null>(null);

  const selectedHabit = useMemo(
    () => habits.find((h) => h.id === selectedHabitId),
    [habits, selectedHabitId]
  );

  // Precompute 52 weeks of dates and month header markers
  const { precomputedWeeks, monthLabels } = useMemo(() => {
    // Current week's Monday (weekStartsOn = 1)
    const currentWeekStart = getWeekStart(today, 1);
    const startMonday = subtractDays(currentWeekStart, 51 * 7);

    // Fast O(1) lookups
    const cMap = new Map<string, number>();
    completions.forEach((c) => {
      if (selectedHabitId === 'all') {
        const val = cMap.get(c.date) || 0;
        cMap.set(c.date, val + (c.value >= 1 ? 1 : 0));
      } else if (c.habitId === selectedHabitId) {
        cMap.set(c.date, c.value >= 1 ? 1 : 0);
      }
    });

    const fMap = new Set<string>();
    freezeDays.forEach((f) => {
      if (selectedHabitId === 'all' || f.habitId === selectedHabitId) {
        fMap.add(f.date);
      }
    });

    const restDaySet = new Set(selectedHabit?.restDays ?? []);

    const monthNames = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sept',
      'Oct',
      'Nov',
      'Déc',
    ];

    const weeks: PrecomputedCell[][] = [];
    const months: Array<{ name: string; weekIndex: number }> = [];
    let lastMonth = -1;
    let curMonday = startMonday;

    const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    for (let w = 0; w < 52; w++) {
      const daysInWeek: PrecomputedCell[] = [];

      for (let d = 0; d < 7; d++) {
        const dateStr = addDays(curMonday, d);
        const dow = getDayOfWeek(dateStr);

        const isFuture = dateStr > today;
        const isFrozen = fMap.has(dateStr);
        const count = cMap.get(dateStr) || 0;
        const isRest = restDaySet.has(dow);
        const isCompleted = count > 0;

        // Resolve cell color
        let colorClass = 'bg-[var(--bg-tertiary)] hover:border-[var(--border-default)]';
        if (isFuture) {
          colorClass =
            'bg-[var(--bg-tertiary)]/20 border border-dashed border-[var(--border-subtle)]';
        } else if (isFrozen) {
          colorClass = 'bg-blue-500 shadow-sm shadow-blue-500/30';
        } else if (isRest) {
          colorClass = 'bg-[var(--bg-tertiary)]/60 text-[var(--text-muted)]';
        } else if (selectedHabitId === 'all') {
          if (count === 1) colorClass = 'bg-emerald-500/35';
          else if (count === 2) colorClass = 'bg-emerald-500/60';
          else if (count === 3) colorClass = 'bg-emerald-500/85';
          else if (count >= 4) colorClass = 'bg-emerald-400 shadow-sm shadow-emerald-500/30';
        } else if (isCompleted) {
          colorClass = 'bg-emerald-500 shadow-sm shadow-emerald-500/30';
        }

        // Accessible description
        const parsedUtc = new Date(dateStr + 'T12:00:00Z');
        const formattedDate = dateFormatter.format(parsedUtc);

        let statusText = 'Non fait';
        if (isFuture) statusText = 'Jour futur';
        else if (isFrozen) statusText = 'Jour de gel';
        else if (isRest) statusText = 'Jour de repos';
        else if (selectedHabitId === 'all') {
          statusText = count > 0 ? `${count} complétion${count > 1 ? 's' : ''}` : '0 complétion';
        } else if (isCompleted) {
          statusText = 'Complété';
        }

        const ariaLabel = `${formattedDate} : ${statusText}`;

        // Month detection on week start
        if (d === 0) {
          const m = parseInt(dateStr.substring(5, 7), 10) - 1;
          if (m !== lastMonth) {
            months.push({ name: monthNames[m], weekIndex: w });
            lastMonth = m;
          }
        }

        daysInWeek.push({
          date: dateStr,
          dow,
          count,
          isCompleted,
          isFrozen,
          isRest,
          isFuture,
          colorClass,
          ariaLabel,
          formattedDate,
        });
      }

      weeks.push(daysInWeek);
      curMonday = addDays(curMonday, 7);
    }

    return { precomputedWeeks: weeks, monthLabels: months };
  }, [today, completions, freezeDays, selectedHabitId, selectedHabit]);

  const handleCellInteraction = useCallback(
    (target: HTMLElement, cell: PrecomputedCell) => {
      const rect = target.getBoundingClientRect();
      setHoveredCell({
        cell,
        habitName: selectedHabit?.name,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [selectedHabit]
  );

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
      {/* Top Header & Habit Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            Activité & Heatmap annuelle
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Visualisation de votre régularité sur les 365 derniers jours.
          </p>
        </div>

        {/* Habit dropdown selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="heatmap-habit-filter" className="sr-only">
            Filtrer par habitude
          </label>
          <select
            id="heatmap-habit-filter"
            aria-label="Filtrer l'activité par habitude"
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
          >
            <option value="all">🌐 Vue globale (Toutes)</option>
            {habits
              .filter((h) => !h.isArchived)
              .map((h) => (
                <option key={h.id} value={h.id}>
                  {h.icon || '⚡'} {h.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div
        className="relative overflow-x-auto pb-2 scrollbar-thin"
        role="region"
        aria-label="Calendrier d'activité annuelle"
      >
        <div className="min-w-[780px]">
          {/* Month labels container (aligned with 15px week columns) */}
          <div className="relative h-4 mb-1 pl-7 text-[10px] text-[var(--text-muted)] font-medium">
            {monthLabels.map((m, idx) => (
              <span key={idx} className="absolute" style={{ left: `${m.weekIndex * 15 + 28}px` }}>
                {m.name}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Weekday labels (Lun, Mer, Ven, Dim) */}
            <div
              className="flex flex-col justify-between text-[9px] text-[var(--text-muted)] font-medium pr-1 py-0.5 select-none w-6"
              aria-hidden="true"
            >
              <span>Lun</span>
              <span>Mer</span>
              <span>Ven</span>
              <span>Dim</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[3px]" role="grid" aria-label="Jours de l'année">
              {precomputedWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]" role="row">
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      role="gridcell"
                      tabIndex={0}
                      aria-label={cell.ariaLabel}
                      onMouseEnter={(e) => handleCellInteraction(e.currentTarget, cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onFocus={(e) => handleCellInteraction(e.currentTarget, cell)}
                      onBlur={() => setHoveredCell(null)}
                      className={`w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] rounded-[3px] transition-transform duration-75 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:z-10 ${cell.colorClass}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)] gap-2">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Gelé
          </span>
          {selectedHabitId !== 'all' && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]" />{' '}
              Repos
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Moins</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--bg-tertiary)]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/35" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/85" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          <span>Plus</span>
        </div>
      </div>

      {/* Hover Floating Tooltip */}
      {hoveredCell && (
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-xl rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 8}px`,
          }}
        >
          <div className="font-bold text-[11px] text-[var(--text-secondary)] mb-0.5">
            {hoveredCell.cell.formattedDate}
          </div>
          {hoveredCell.cell.isFuture ? (
            <span className="text-[var(--text-muted)] italic">Jour futur</span>
          ) : hoveredCell.cell.isFrozen ? (
            <span className="text-blue-400 font-semibold">❄️ Jour de gel</span>
          ) : hoveredCell.cell.isRest ? (
            <span className="text-[var(--text-muted)]">😴 Jour de repos</span>
          ) : selectedHabitId === 'all' ? (
            <span className="font-semibold text-emerald-400">
              {hoveredCell.cell.count} {hoveredCell.cell.count > 1 ? 'complétions' : 'complétion'}
            </span>
          ) : hoveredCell.cell.isCompleted ? (
            <span className="text-emerald-400 font-semibold">✅ Complété</span>
          ) : (
            <span className="text-[var(--text-muted)]">Non fait</span>
          )}
        </div>
      )}
    </div>
  );
};

export default HeatmapCalendar;
