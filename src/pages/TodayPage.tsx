import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore } from '../stores/useHabitStore';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMoodStore } from '../stores/useMoodStore';
import { useChallengeStore } from '../stores/useChallengeStore';
import { HabitCard } from '../components/habits/HabitCard';
import { HabitModal } from '../components/habits/HabitModal';
import { NumericModal } from '../components/habits/NumericModal';
import { MoodModal } from '../components/mood/MoodModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { calculateStreak } from '../lib/streaks';
import { getTodayLocal, weekDayToNumber, getDayOfWeek, getLocalTime } from '../lib/date-utils';
import { calculateXPGain } from '../services/xp';
import type { Habit } from '../models/habit';
import {
  Plus,
  Sparkles,
  CheckCircle,
  CalendarDays,
  Snowflake,
  Smile,
  CalendarCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DailyQuote } from '../components/habits/DailyQuote';
import { DailyXPRecap } from '../components/gamification/DailyXPRecap';
import { getTimeOfDayGreeting, getAllDoneMessage } from '../utils/greeting';
import { sounds } from '../lib/sounds';
import { triggerLevelUpConfetti } from '../utils/confetti';

export const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    habits,
    categories,
    completions,
    freezeDays,
    isLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    toggleCompletion,
    setNumericValue,
    freezeDay,
  } = useHabitStore();

  const { profile, addXP, consumeFreezeDay, checkBadges } = useGamificationStore();

  const { settings } = useSettingsStore();
  const { moods, saveMood } = useMoodStore();
  const { challenges, updateChallengeProgress } = useChallengeStore();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [numericModalHabit, setNumericModalHabit] = useState<Habit | null>(null);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenMood = () => setIsMoodModalOpen(true);
    const handleOpenCreate = () => {
      setEditingHabit(null);
      setIsCreateModalOpen(true);
    };

    window.addEventListener('habix:open-mood', handleOpenMood);
    window.addEventListener('habix:open-create-habit', handleOpenCreate);

    return () => {
      window.removeEventListener('habix:open-mood', handleOpenMood);
      window.removeEventListener('habix:open-create-habit', handleOpenCreate);
    };
  }, []);

  const today = getTodayLocal(settings.timezone);
  const weekStartsOn = weekDayToNumber(settings.weekStartDay);
  const todayDow = getDayOfWeek(today);

  // Active habits
  const activeHabits = habits.filter((h) => !h.isArchived);

  // Filter habits expected for today
  const habitsForToday = activeHabits.filter((habit) => {
    if (selectedCategory && habit.categoryId !== selectedCategory) {
      return false;
    }

    if (habit.frequencyType === 'weekly_fixed') {
      const days = (habit.frequencyConfig as { days: number[] }).days || [];
      return days.includes(todayDow);
    }

    return true;
  });

  // Calculate day completion progress
  const totalExpected = habitsForToday.length;
  const completedTodayCount = habitsForToday.filter((h) => {
    const comp = completions.find((c) => c.habitId === h.id && c.date === today);
    if (!comp) return false;
    if (h.targetType === 'numeric' && h.targetValue !== null) {
      return comp.value >= h.targetValue;
    }
    return comp.value >= 1;
  }).length;

  const isAllDone = totalExpected > 0 && completedTodayCount === totalExpected;
  const progressPercent =
    totalExpected > 0 ? Math.round((completedTodayCount / totalExpected) * 100) : 0;

  // Today's mood entry
  const todayMood = moods.find((m) => m.date === today);

  // Check badges whenever completions change
  useEffect(() => {
    checkBadges({
      habits,
      completions,
      freezeDays,
      moods,
      challenges,
      today,
      weekStartsOn,
    });
  }, [completions, habits, freezeDays, moods, challenges, today, weekStartsOn, checkBadges]);

  const handleToggle = async (habit: Habit) => {
    const isCompleted = completions.some((c) => c.habitId === habit.id && c.date === today);
    const nowTime = getLocalTime(settings.timezone);

    await toggleCompletion(habit.id, today);

    if (!isCompleted) {
      // Calculate habit streak
      const habitComps = completions.filter((c) => c.habitId === habit.id);
      const habitFreezes = freezeDays.filter((f) => f.habitId === habit.id);
      const streak = calculateStreak(habit, habitComps, habitFreezes, { today, weekStartsOn });

      // XP calculation with streak multiplier & early bird
      const willBeAllDone = completedTodayCount + 1 === totalExpected;
      const gain = calculateXPGain({
        difficulty: habit.difficulty,
        currentStreak: streak.current,
        completedAtTime: nowTime,
        isPerfectDay: willBeAllDone,
      });

      await addXP(gain.totalXP, {
        date: today,
        habitId: habit.id,
        habitName: habit.name,
        reason: willBeAllDone ? 'perfect_day' : 'habit_completion',
      });
      await updateChallengeProgress(habit.id, today, true, false);

      if (willBeAllDone) {
        sounds.playAllDone();
        triggerLevelUpConfetti();
      }
    }
  };

  const handleFreeze = async (habit: Habit) => {
    const isAlreadyFrozen = freezeDays.some((f) => f.habitId === habit.id && f.date === today);
    if (isAlreadyFrozen) return;

    const available = profile?.availableFreezeDays ?? 0;
    if (available <= 0) {
      alert(
        "Vous n'avez plus de jours de gel disponibles dans votre réserve ❄️.\n\nAtteignez des paliers de streak ou passez au niveau supérieur pour en débloquer d'autres !"
      );
      return;
    }

    const consumed = await consumeFreezeDay();
    if (consumed) {
      await freezeDay(habit.id, today);
      await updateChallengeProgress(habit.id, today, false, true);
    }
  };

  const handleNumericSave = async (value: number) => {
    if (!numericModalHabit) return;
    const previous = completions.find(
      (c) => c.habitId === numericModalHabit.id && c.date === today
    );
    const wasMet =
      previous && numericModalHabit.targetValue && previous.value >= numericModalHabit.targetValue;
    await setNumericValue(numericModalHabit.id, today, value);

    if (!wasMet && numericModalHabit.targetValue && value >= numericModalHabit.targetValue) {
      const nowTime = getLocalTime(settings.timezone);
      const willBeAllDone = completedTodayCount + 1 === totalExpected;
      const gain = calculateXPGain({
        difficulty: numericModalHabit.difficulty,
        currentStreak: 0,
        completedAtTime: nowTime,
        isPerfectDay: willBeAllDone,
      });
      await addXP(gain.totalXP, {
        date: today,
        habitId: numericModalHabit.id,
        habitName: numericModalHabit.name,
        reason: willBeAllDone ? 'perfect_day' : 'habit_completion',
      });
      await updateChallengeProgress(numericModalHabit.id, today, true, false);

      if (willBeAllDone) {
        sounds.playAllDone();
        triggerLevelUpConfetti();
      }
    }
  };

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const isSundayOrMonday = todayDow === 0 || todayDow === 1;
  const greeting = getTimeOfDayGreeting(settings.userName);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {greeting} 👋
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Freeze tokens badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs font-bold text-blue-400"
            title="Jours de gel disponibles pour préserver vos streaks"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>{profile?.availableFreezeDays ?? 3} gel(s)</span>
          </div>

          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Nouvelle habitude
          </Button>
        </div>
      </div>

      {/* Daily Quote / Advice of the Day */}
      <DailyQuote today={today} />

      {/* Weekly Review Banner (on review day) */}
      {isSundayOrMonday && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/review')}
          className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 flex items-center justify-between cursor-pointer hover:border-indigo-500/60 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                Votre revue hebdomadaire est prête !
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Découvrez vos top habitudes et vos points d'amélioration de la semaine.
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-400 hover:underline">Voir le bilan →</span>
        </motion.div>
      )}

      {/* Daily Mood Quick Picker */}
      <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Smile className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="text-xs font-bold text-[var(--text-primary)] block">
              {todayMood ? 'Humeur du jour enregistrée' : "Comment vous sentez-vous aujourd'hui ?"}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {todayMood
                ? `Niveau ${todayMood.level}/5 ${todayMood.tags.length ? `• #${todayMood.tags.join(' #')}` : ''}`
                : "Notez votre énergie pour voir l'impact sur vos habitudes"}
            </span>
          </div>
        </div>

        {/* Emoji Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {[
            { lvl: 1 as const, em: '😢' },
            { lvl: 2 as const, em: '😔' },
            { lvl: 3 as const, em: '😐' },
            { lvl: 4 as const, em: '😊' },
            { lvl: 5 as const, em: '😄' },
          ].map((m) => (
            <button
              key={m.lvl}
              type="button"
              onClick={async () => {
                await saveMood({
                  date: today,
                  level: m.lvl,
                  tags: todayMood?.tags || [],
                  note: todayMood?.note || '',
                });
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
                todayMood?.level === m.lvl
                  ? 'bg-indigo-500/25 border-2 border-indigo-500 scale-110 shadow-sm shadow-indigo-500/20'
                  : 'hover:bg-[var(--bg-tertiary)] opacity-70 hover:opacity-100'
              }`}
            >
              {m.em}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMoodModalOpen(true)}
            className="text-xs text-indigo-400 ml-1"
          >
            Détails
          </Button>
        </div>
      </div>

      {/* Progress Bar of the Day */}
      {totalExpected > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Progression du jour
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tabular-nums">
                  {progressPercent}%
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  ({completedTodayCount} sur {totalExpected} faites)
                </span>
              </div>
            </div>

            <div className="text-right">
              {progressPercent === 100 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" /> {getAllDoneMessage(settings.userName)}
                </span>
              ) : progressPercent >= 50 ? (
                <span className="text-xs font-medium text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Plus de la moitié !
                </span>
              ) : (
                <span className="text-xs text-[var(--text-secondary)]">
                  Plus que {totalExpected - completedTodayCount} habitudes !
                </span>
              )}
            </div>
          </div>

          <div className="w-full bg-[var(--bg-tertiary)] h-3 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full transition-colors ${
                progressPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
            />
          </div>
        </motion.div>
      )}

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
            }`}
          >
            Toutes ({activeHabits.length})
          </button>
          {categories.map((cat) => {
            const count = activeHabits.filter((h) => h.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'border-transparent text-white shadow-sm'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={{
                  backgroundColor: isSelected ? cat.color : undefined,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Habits List */}
      {isLoading ? (
        <div className="flex justify-center py-16 text-[var(--text-secondary)] text-sm">
          Chargement de vos habitudes...
        </div>
      ) : habitsForToday.length === 0 ? (
        <EmptyState
          emoji={selectedCategory ? '🔍' : '🌱'}
          title={
            selectedCategory
              ? 'Aucune habitude dans cette catégorie'
              : 'Aucune habitude prévue pour aujourd’hui'
          }
          description={
            selectedCategory
              ? 'Essayez de sélectionner une autre catégorie ou ajoutez une habitude ici.'
              : 'Commencez dès maintenant par créer votre première habitude pour construire vos streaks.'
          }
          actionLabel="Créer une habitude"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {habitsForToday.map((habit) => {
            const habitCompletions = completions.filter((c) => c.habitId === habit.id);
            const habitFreezes = freezeDays.filter((f) => f.habitId === habit.id);
            const streak = calculateStreak(habit, habitCompletions, habitFreezes, {
              today,
              weekStartsOn,
            });

            const todayComp = habitCompletions.find((c) => c.date === today);
            const isCompleted =
              habit.targetType === 'numeric' && habit.targetValue !== null
                ? (todayComp?.value ?? 0) >= habit.targetValue
                : (todayComp?.value ?? 0) >= 1;

            const isFrozen = habitFreezes.some((f) => f.date === today);
            const category = categories.find((c) => c.id === habit.categoryId);

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                category={category}
                currentStreak={streak.current}
                bestStreak={streak.best}
                isCompleted={isCompleted}
                isFrozen={isFrozen}
                currentValue={todayComp?.value ?? 0}
                onToggle={() => handleToggle(habit)}
                onFreeze={() => handleFreeze(habit)}
                onOpenNumeric={() => setNumericModalHabit(habit)}
                onEdit={() => setEditingHabit(habit)}
                onArchive={() => archiveHabit(habit.id)}
              />
            );
          })}
        </div>
      )}

      {/* Daily XP & Progress Recap */}
      <DailyXPRecap
        today={today}
        habits={activeHabits}
        completions={completions}
        freezeDays={freezeDays}
        isAllDone={isAllDone}
      />

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

      <NumericModal
        isOpen={numericModalHabit !== null}
        onClose={() => setNumericModalHabit(null)}
        habit={numericModalHabit}
        currentValue={
          numericModalHabit
            ? completions.find((c) => c.habitId === numericModalHabit.id && c.date === today)
                ?.value || 0
            : 0
        }
        onSave={handleNumericSave}
      />

      <MoodModal isOpen={isMoodModalOpen} onClose={() => setIsMoodModalOpen(false)} date={today} />
    </div>
  );
};

export default TodayPage;
