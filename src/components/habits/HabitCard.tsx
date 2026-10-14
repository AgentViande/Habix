import React from 'react';
import { motion } from 'framer-motion';
import type { Habit } from '../../models/habit';
import type { Category } from '../../models/category';
import { Flame, Check, Snowflake, MoreVertical, Edit2, Archive, RotateCcw } from 'lucide-react';
import { triggerCompletionConfetti } from '../../utils/confetti';

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
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
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
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      triggerCompletionConfetti(x, y);
    }
    onToggle();
  };

  const habitColor = habit.color || '#818cf8';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border transition-all duration-200 ${
        showMenu ? 'z-40' : 'z-auto'
      } ${
        isCompleted
          ? 'border-emerald-500/30 bg-gradient-to-r from-[var(--bg-secondary)] to-emerald-950/10'
          : isFrozen
            ? 'border-blue-500/30 bg-blue-950/10'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
      }`}
    >
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
            <span
              className="inline-flex items-center gap-1 font-semibold tabular-nums text-orange-400"
              title={`Meilleur streak: ${bestStreak}`}
            >
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              {currentStreak}
            </span>
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

        {/* Completion check button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleCheckClick}
          aria-label={
            isCompleted ? `Marquer non fait : ${habit.name}` : `Compléter : ${habit.name}`
          }
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            isCompleted
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] border border-transparent'
          }`}
        >
          <Check
            className={`w-5 h-5 transition-transform ${isCompleted ? 'scale-110 stroke-[3]' : 'scale-90'}`}
          />
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
