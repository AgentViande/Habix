import React from 'react';
import { useGamificationStore } from '../stores/useGamificationStore';
import { Sparkles, Trophy, Award, Lock, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const STATIC_BADGES = [
  { id: 'first_step', name: 'Premier pas', desc: 'Première habitude complétée', icon: '🌱' },
  { id: 'streak_3', name: 'Départ fulgurant', desc: 'Streak de 3 jours', icon: '⚡' },
  { id: 'streak_7', name: 'Semaine parfaite', desc: 'Streak de 7 jours consécutifs', icon: '🔥' },
  { id: 'streak_14', name: 'Habitude ancrée', desc: 'Streak de 14 jours', icon: '🏆' },
  { id: 'streak_30', name: 'Maître de la constance', desc: 'Streak de 30 jours', icon: '👑' },
  { id: 'level_5', name: 'Aventurier aguerri', desc: 'Atteindre le niveau 5', icon: '⭐' },
  { id: 'xp_500', name: 'Accumulateur d’énergie', desc: 'Gagner 500 XP au total', icon: '💎' },
  { id: 'freeze_master', name: 'Glaçon protecteur', desc: 'Utiliser un jour de gel', icon: '❄️' },
];

const AVAILABLE_TITLES = [
  'Débutant motivé',
  'Apprenti persévérant',
  'Guerrier de la routine',
  'Maître des flammes',
  'Architecte de vie',
  'Légende vivante',
];

export const ProfilePage: React.FC = () => {
  const { profile, unlockedBadges, selectTitle } = useGamificationStore();

  const unlockedSet = new Set(unlockedBadges.map((b) => b.badgeId));
  const currentLevel = profile?.currentLevel || 1;
  const totalXP = profile?.totalXP || 0;
  const xpInCurrentLevel = totalXP % 100;
  const currentTitle = profile?.selectedTitle || AVAILABLE_TITLES[0];

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

      {/* Badges Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Badges & Trophées ({unlockedBadges.length}/{STATIC_BADGES.length})
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {STATIC_BADGES.map((badge) => {
            const isUnlocked = unlockedSet.has(badge.id);

            return (
              <motion.div
                key={badge.id}
                whileHover={{ y: -2 }}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-[var(--bg-secondary)] border-amber-500/30 shadow-sm shadow-amber-500/5'
                    : 'bg-[var(--bg-secondary)]/50 border-[var(--border-subtle)] opacity-50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2.5 ${
                    isUnlocked ? 'bg-amber-500/15' : 'bg-[var(--bg-tertiary)] grayscale opacity-50'
                  }`}
                >
                  {badge.icon}
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] mb-1">
                  {badge.name}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                  {badge.desc}
                </p>

                <div className="mt-3">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      ✨ Débloqué
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
                      <Lock className="w-3 h-3" /> Verrouillé
                    </span>
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
