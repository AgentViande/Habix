import React, { useState, useMemo } from 'react';
import { useHabitStore } from '../stores/useHabitStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { HabitModal } from '../components/habits/HabitModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { calculateStreak } from '../lib/streaks';
import { getTodayLocal, weekDayToNumber } from '../lib/date-utils';
import type { Habit } from '../models/habit';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Flame,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HabitsPage: React.FC = () => {
  const {
    habits,
    categories,
    completions,
    freezeDays,
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
  } = useHabitStore();

  const { settings } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'streak' | 'date'>('order');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = getTodayLocal(settings.timezone);
  const weekStartsOn = weekDayToNumber(settings.weekStartDay);

  // Precompute streaks map for performance and sorting
  const streakMap = useMemo(() => {
    const map = new Map<string, { current: number; best: number }>();
    habits.forEach((h) => {
      const habitComps = completions.filter((c) => c.habitId === h.id);
      const habitFreezes = freezeDays.filter((f) => f.habitId === h.id);
      map.set(h.id, calculateStreak(h, habitComps, habitFreezes, { today, weekStartsOn }));
    });
    return map;
  }, [habits, completions, freezeDays, today, weekStartsOn]);

  const filteredAndSortedHabits = useMemo(() => {
    return habits
      .filter((h) => {
        // Status filter
        if (statusFilter === 'active' && h.isArchived) return false;
        if (statusFilter === 'archived' && !h.isArchived) return false;

        // Category filter
        if (selectedCategory && h.categoryId !== selectedCategory) return false;

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesName = h.name.toLowerCase().includes(q);
          const matchesDesc = (h.description || '').toLowerCase().includes(q);
          return matchesName || matchesDesc;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'streak') {
          const streakA = streakMap.get(a.id)?.current || 0;
          const streakB = streakMap.get(b.id)?.current || 0;
          return streakB - streakA;
        }
        if (sortBy === 'date') {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        }
        return a.sortOrder - b.sortOrder;
      });
  }, [habits, statusFilter, selectedCategory, search, sortBy, streakMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Gestion des habitudes
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Organisez, filtrez et personnalisez toutes vos habitudes.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Nouvelle habitude
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-1 rounded-2xl w-fit">
          {[
            { id: 'active', label: 'Actives' },
            { id: 'archived', label: 'Archivées' },
            { id: 'all', label: 'Toutes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none transition-colors"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-xl text-xs text-[var(--text-secondary)]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none text-xs font-medium cursor-pointer"
            >
              <option value="order">Ordre défini</option>
              <option value="streak">Streak (décroissant)</option>
              <option value="name">Nom (A-Z)</option>
              <option value="date">Plus récentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'border-transparent text-white'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
                style={{
                  backgroundColor: isSelected ? cat.color : undefined,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Habits List */}
      {filteredAndSortedHabits.length === 0 ? (
        <EmptyState
          emoji={search ? '🔍' : statusFilter === 'archived' ? '📦' : '🌱'}
          title={
            search
              ? 'Aucun résultat trouvé'
              : statusFilter === 'archived'
                ? 'Aucune habitude archivée'
                : 'Aucune habitude active'
          }
          description={
            search
              ? `Aucune habitude ne correspond à "${search}".`
              : statusFilter === 'archived'
                ? 'Les habitudes que vous archivez apparaîtront ici.'
                : 'Créez votre première habitude pour démarrer votre suivi.'
          }
          actionLabel={statusFilter === 'active' && !search ? 'Créer une habitude' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filteredAndSortedHabits.map((habit) => {
              const streak = streakMap.get(habit.id) || { current: 0, best: 0 };
              const category = categories.find((c) => c.id === habit.categoryId);
              const habitColor = habit.color || '#818cf8';

              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all gap-4 ${
                    habit.isArchived ? 'opacity-60 bg-[var(--bg-primary)]/50' : ''
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        backgroundColor: `${habitColor}22`,
                        border: `1px solid ${habitColor}44`,
                      }}
                    >
                      {habit.icon || '⚡'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                          {habit.name}
                        </h3>
                        {habit.isArchived && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                            Archivée
                          </span>
                        )}
                        {category && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color,
                            }}
                          >
                            {category.name}
                          </span>
                        )}
                      </div>

                      {habit.description && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                          {habit.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1 font-semibold text-orange-400 tabular-nums">
                          <Flame className="w-3.5 h-3.5 fill-orange-400" />
                          {streak.current} j
                        </span>
                        <span>•</span>
                        <span>Record : {streak.best} j</span>
                        <span>•</span>
                        <span className="capitalize">{habit.frequencyType.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-1.5 transition-colors border border-[var(--border-subtle)]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Modifier
                    </button>

                    {habit.isArchived ? (
                      <button
                        onClick={() => restoreHabit(habit.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 transition-colors border border-emerald-500/30"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                      </button>
                    ) : (
                      <button
                        onClick={() => archiveHabit(habit.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5 transition-colors border border-amber-500/30"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archiver
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Supprimer définitivement "${habit.name}" ?`)) {
                          deleteHabit(habit.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <HabitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories}
        onSave={async (data) => {
          await createHabit(data);
        }}
      />

      <HabitModal
        isOpen={editingHabit !== null}
        onClose={() => setEditingHabit(null)}
        habit={editingHabit}
        categories={categories}
        onSave={async (data) => {
          if (editingHabit) {
            await updateHabit(editingHabit.id, data);
          }
        }}
        onDelete={async (id) => {
          await deleteHabit(id);
        }}
      />
    </div>
  );
};

export default HabitsPage;
