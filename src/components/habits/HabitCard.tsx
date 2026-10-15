import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Habit } from '../../models/habit';
import type { Category } from '../../models/category';
import {
  Flame,
  Check,
  Snowflake,
  MoreVertical,
  Edit2,
  Archive,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { triggerCompletionConfetti } from '../../utils/confetti';
import { sounds } from '../../lib/sounds';
import { BASE_XP_MAP } from '../../services/xp';

export interface HabitCardProps {
  habit: Habit;
  category?: Category;
  currentStreak: number;
  bestStreak: number;
  isCompleted: boolean;
  isFrozen: boolean;
  currentValue?: number;
  onToggle: () => void;
  onFreeze?: () => void;
  onOpenNumeric?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  category,
  currentStreak,
  bestStreak,
  isCompleted,
  isFrozen,
  currentValue = 0,
  onToggle,
  onFreeze,
  onOpenNumeric,
  onEdit,
  onArchive,
  onRestore,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [floatingXP, setFloatingXP] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  const getFrequencyLabel = () => {
    switch (habit.frequencyType) {
      case 'daily':
        return 'Quotidienne';
      case 'weekly_fixed': {
        const daysMap = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const days = (habit.frequencyConfig as { days: number[] }).days ?? [];
        return days.map((d) => daysMap[d]).join(', ');
      }
      case 'weekly_flex': {
        const times = (habit.frequencyConfig as { timesPerWeek: number }).timesPerWeek ?? 1;
        return `${times}× / semaine`;
      }
      case 'interval': {
        const every = (habit.frequencyConfig as { everyNDays: number }).everyNDays ?? 1;
        return `Tous les ${every}j`;
      }
      default:
        return 'Quotidienne';
    }
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    if (habit.targetType === 'numeric' && onOpenNumeric) {
      onOpenNumeric();
      return;
    }

    if (!isCompleted) {
      // 1. Play pop sound
      sounds.playPop();

      // 2. Confetti mini explosion
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      triggerCompletionConfetti(x, y);

      // 3. Card pulse
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 350);

      // 4. Milestone sound if streak will hit a milestone (7, 30, 100)
      const nextStreak = currentStreak + 1;
      if (nextStreak === 7 || nextStreak === 30 || nextStreak === 100) {
        setTimeout(() => sounds.playMilestone(), 120);
      }

      // 5. Floating XP banner (+10, +20, +35 XP)
      const baseXP = BASE_XP_MAP[habit.difficulty] || 20;
      const multiplier = nextStreak >= 100 ? 3 : nextStreak >= 30 ? 2 : nextStreak >= 7 ? 1.5 : 1;
      const earnedXP = Math.round(baseXP * multiplier);
      setFloatingXP(earnedXP);
      setTimeout(() => setFloatingXP(null), 1000);
    } else {
      // Unticking sound
      sounds.playUntick();
    }

    onToggle();
  };

  const habitColor = habit.color || '#818cf8';
  const isMilestone = currentStreak === 7 || currentStreak === 30 || currentStreak === 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isPulsing ? [1, 1.018, 1] : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border transition-colors duration-250 ${
        showMenu ? 'z-40' : 'z-auto'
      } ${
        isCompleted
          ? 'border-emerald-500/40 bg-gradient-to-r from-[var(--bg-secondary)] via-emerald-950/5 to-emerald-950/15 shadow-sm'
          : isFrozen
            ? 'border-blue-500/30 bg-blue-950/10'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
      }`}
    >
      {/* Floating +XP Pill */}
      <AnimatePresence>
        {floatingXP !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], y: -36, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute -top-3 right-14 pointer-events-none z-30 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-lg shadow-orange-500/30 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>+{floatingXP} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left: Icon + Info */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${habitColor}22`,
            border: `1px solid ${habitColor}44`,
          }}
        >
          {habit.icon || '⚡'}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`font-semibold text-sm sm:text-base truncate transition-colors ${
                isCompleted ? 'text-emerald-300' : 'text-[var(--text-primary)]'
              }`}
            >
              {habit.name}
            </h4>
            {category && (
              <span
                className="hidden sm:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            )}
            {isMilestone && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3 h-3" /> Palier {currentStreak}j !
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-secondary)]">
            <span>{getFrequencyLabel()}</span>

            {habit.targetType === 'numeric' && (
              <>
                <span>•</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {currentValue} / {habit.targetValue} {habit.targetUnit}
                </span>
              </>
            )}

            <span>•</span>
            <motion.span
              animate={isCompleted ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1 font-semibold tabular-nums text-orange-400"
              title={`Meilleur streak: ${bestStreak}`}
            >
              <Flame
                className={`w-3.5 h-3.5 fill-orange-400 ${
                  currentStreak > 0 ? 'drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]' : ''
                }`}
              />
              {currentStreak}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Freeze button */}
        {onFreeze && !isCompleted && (
          <button
            onClick={onFreeze}
            title={isFrozen ? 'Jour gelé' : 'Geler pour préserver le streak'}
            aria-label={
              isFrozen
                ? 'Jour de gel actif pour cette habitude'
                : 'Geler cette habitude pour protéger la série'
            }
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isFrozen
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-[var(--text-muted)] hover:text-blue-400 hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <Snowflake className="w-4 h-4" />
          </button>
        )}

        {/* Spring Checkbox button with drawing checkmark SVG */}
        <motion.button
          whileTap={{ scale: 0.82 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          onClick={handleCheckClick}
          aria-label={
            isCompleted ? `Marquer non fait : ${habit.name}` : `Compléter : ${habit.name}`
          }
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            isCompleted
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/35 border border-emerald-400/40'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] border border-transparent'
          }`}
        >
          {isCompleted ? (
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 stroke-white fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            </svg>
          ) : (
            <Check className="w-5 h-5 text-[var(--text-muted)] opacity-50 group-hover:opacity-100 transition-opacity" />
          )}
        </motion.button>

        {/* More Menu */}
        {(onEdit || onArchive || onRestore) && (
          <div className="relative">
            <button
              ref={menuButtonRef}
              onClick={() => setShowMenu(!showMenu)}
              aria-label={`Options pour ${habit.name}`}
              aria-expanded={showMenu}
              aria-haspopup="true"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 top-11 z-50 w-44 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl py-1.5 text-xs backdrop-blur-md"
              >
                {onEdit && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Modifier
                  </button>
                )}
                {onArchive && !habit.isArchived && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false);
                      onArchive();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[var(--bg-tertiary)] text-amber-400 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archiver
                  </button>
                )}
                {onRestore && habit.isArchived && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false);
                      onRestore();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[var(--bg-tertiary)] text-emerald-400 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
