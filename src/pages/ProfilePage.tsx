import React, { useState, useEffect } from 'react';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useHabitStore } from '../stores/useHabitStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMoodStore } from '../stores/useMoodStore';
import { useChallengeStore } from '../stores/useChallengeStore';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { getTodayLocal } from '../lib/date-utils';
import { Sparkles, Trophy, Award, Lock, Check, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AVAILABLE_TITLES = [
  'Débutant motivé',
  'Apprenti persévérant',
  'Guerrier de la routine',
  'Maître des flammes',
  'Architecte de vie',
  'Légende vivante',
];

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'streaks', label: '🔥 Séries' },
  { id: 'completion', label: '✅ Complétion' },
  { id: 'regularity', label: '📊 Régularité' },
  { id: 'diversity', label: '🌈 Diversité' },
  { id: 'gamification', label: '🎮 Niveaux' },
  { id: 'freeze', label: '❄️ Jours de gel' },
  { id: 'mood', label: '😊 Humeur' },
];

export const ProfilePage: React.FC = () => {
  const { profile, unlockedBadges, selectTitle, loadGamification, checkBadges } =
    useGamificationStore();
  const { habits, completions, freezeDays } = useHabitStore();
  const { settings } = useSettingsStore();
  const { moods } = useMoodStore();
  const { challenges } = useChallengeStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const today = getTodayLocal(settings.timezone);
  const weekStartsOn = settings.weekStartDay === 'sunday' ? 0 : 1;

  useEffect(() => {
    loadGamification();
  }, [loadGamification]);

  useEffect(() => {
    if (habits.length > 0 || completions.length > 0) {
      checkBadges({
        habits,
        completions,
        freezeDays,
        moods,
        challenges,
        today,
        weekStartsOn,
      });
    }
  }, [habits, completions, freezeDays, moods, challenges, today, weekStartsOn, checkBadges]);

  const currentLevel = profile?.currentLevel || 1;
  const totalXP = profile?.totalXP || 0;
  const xpInCurrentLevel = totalXP % 100;
  const currentTitle = profile?.selectedTitle || AVAILABLE_TITLES[0];

  // Map unlocked badges for instant lookup, supporting legacy aliases
  const unlockedMap = new Map<string, (typeof unlockedBadges)[0]>();
  unlockedBadges.forEach((b) => {
    unlockedMap.set(b.badgeId, b);
    if (b.badgeId === 'first_step') {
      unlockedMap.set('comp_1', b);
    }
  });

  const isUnlocked = (badgeId: string) => {
    if (unlockedMap.has(badgeId)) return true;
    if (badgeId === 'comp_1' && unlockedMap.has('first_step')) return true;
    return false;
  };

  const totalBadgesCount = BADGE_DEFINITIONS.length;
  const unlockedCount = BADGE_DEFINITIONS.filter((b) => isUnlocked(b.id)).length;
  const lockedCount = totalBadgesCount - unlockedCount;
  const completionPercentage = Math.round((unlockedCount / totalBadgesCount) * 100);

  const filteredBadges = BADGE_DEFINITIONS.filter((badge) => {
    const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
    const unlocked = isUnlocked(badge.id);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unlocked' && unlocked) ||
      (statusFilter === 'locked' && !unlocked);

    return matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Profil & Succès
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Suivez votre progression de niveau et débloquez les trophées RPG.
        </p>
      </div>

      {/* Hero Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] relative overflow-hidden shadow-lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar / Level Crest */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-500/25 flex-shrink-0">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
            <span className="text-xs font-black uppercase tracking-wider">Niv. {currentLevel}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
              {profile?.displayName || 'Aventurier'}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold text-xs mt-1 mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>{currentTitle}</span>
            </div>

            {/* Level XP Progress */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-[var(--text-secondary)] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Progression du niveau
                </span>
                <span className="tabular-nums font-bold text-[var(--text-primary)]">
                  {xpInCurrentLevel} / 100 XP
                </span>
              </div>
              <div className="w-full bg-[var(--bg-tertiary)] h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[var(--xp-gradient-start)] to-[var(--xp-gradient-end)] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${xpInCurrentLevel}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1.5">
                <span>Total accumulé : {totalXP} XP</span>
                <span>
                  Encore {100 - xpInCurrentLevel} XP avant le Niv. {currentLevel + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select Title Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Titres disponibles
        </h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TITLES.map((title) => {
            const isSelected = currentTitle === title;
            return (
              <button
                key={title}
                onClick={() => selectTitle(title)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                <span>{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges & Succès Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Badges & Succès ({unlockedCount}/{totalBadgesCount})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {completionPercentage}% complété • {unlockedCount} trophée{unlockedCount > 1 ? 's' : ''} débloqué{unlockedCount > 1 ? 's' : ''}
            </p>
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-subtle)] self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl transition-all ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Tous ({totalBadgesCount})
            </button>
            <button
              onClick={() => setStatusFilter('unlocked')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                statusFilter === 'unlocked'
                  ? 'bg-amber-500 text-slate-900 font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-amber-400'
              }`}
            >
              ✨ Débloqués ({unlockedCount})
            </button>
            <button
              onClick={() => setStatusFilter('locked')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                statusFilter === 'locked'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              🔒 À débloquer ({lockedCount})
            </button>
          </div>
        </div>

        {/* Global Progression Bar */}
        <div className="w-full bg-[var(--bg-secondary)] p-3 rounded-2xl border border-[var(--border-subtle)] space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
            <span>Progression de la collection</span>
            <span className="text-[var(--text-primary)] font-bold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-[var(--bg-tertiary)] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 h-full transition-all duration-700 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredBadges.map((badge) => {
            const unlockedRecord = unlockedMap.get(badge.id) || (badge.id === 'comp_1' ? unlockedMap.get('first_step') : undefined);
            const unlocked = !!unlockedRecord;

            return (
              <motion.div
                key={badge.id}
                whileHover={{ y: -3 }}
                className={`flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                  unlocked
                    ? 'bg-[var(--bg-secondary)] border-amber-500/40 shadow-md shadow-amber-500/10'
                    : 'bg-[var(--bg-secondary)]/50 border-[var(--border-subtle)] opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm transition-all ${
                        unlocked
                          ? 'bg-amber-500/20 border border-amber-500/50 shadow-amber-500/20'
                          : 'bg-[var(--bg-tertiary)] grayscale opacity-40 border border-[var(--border-subtle)]'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        unlocked
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                      }`}
                    >
                      {badge.category}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-[var(--text-primary)] mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)]/60 mt-auto">
                  {unlocked ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Débloqué
                      </span>
                      {unlockedRecord?.unlockedAt && (
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          {new Date(unlockedRecord.unlockedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                        <Lock className="w-3.5 h-3.5" /> À débloquer
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] italic leading-tight">
                        {badge.condition}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
