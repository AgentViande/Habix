import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Habit, FrequencyType, TargetType, Difficulty } from '../../models/habit';
import type { Category } from '../../models/category';
import { Trash2 } from 'lucide-react';

export interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit | null;
  categories: Category[];
  onSave: (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'sortOrder' | 'isArchived'>
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PRESET_EMOJIS = [
  '⚡',
  '💪',
  '🏃',
  '🚴',
  '💧',
  '🥗',
  '🧠',
  '🧘',
  '📖',
  '✍️',
  '🎨',
  '🎵',
  '💻',
  '🎯',
  '👥',
  '😴',
  '☕',
  '🌱',
  '🧹',
  '💰',
];

const PRESET_COLORS = [
  '#818CF8', // Indigo
  '#34D399', // Emerald
  '#A78BFA', // Purple
  '#60A5FA', // Blue
  '#FB923C', // Orange
  '#F472B6', // Pink
  '#FBBF24', // Amber
  '#F87171', // Coral Red
];

const WEEKDAYS = [
  { day: 1, label: 'L' },
  { day: 2, label: 'M' },
  { day: 3, label: 'M' },
  { day: 4, label: 'J' },
  { day: 5, label: 'V' },
  { day: 6, label: 'S' },
  { day: 0, label: 'D' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  habit,
  categories,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [color, setColor] = useState('#818CF8');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [fixedDays, setFixedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timesPerWeek, setTimesPerWeek] = useState<number>(3);
  const [everyNDays, setEveryNDays] = useState<number>(2);
  const [targetType, setTargetType] = useState<TargetType>('boolean');
  const [targetValue, setTargetValue] = useState<number | null>(10);
  const [targetUnit, setTargetUnit] = useState<string | null>('pages');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [restDays, setRestDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
      setIcon(habit.icon || '⚡');
      setColor(habit.color || '#818CF8');
      setCategoryId(habit.categoryId || null);
      setFrequencyType(habit.frequencyType);
      setTargetType(habit.targetType);
      setTargetValue(habit.targetValue);
      setTargetUnit(habit.targetUnit);
      setDifficulty(habit.difficulty);
      setReminderTime(habit.reminderTime);
      setRestDays(habit.restDays || []);

      if (habit.frequencyType === 'weekly_fixed') {
        setFixedDays((habit.frequencyConfig as { days: number[] }).days || [1, 2, 3, 4, 5]);
      } else if (habit.frequencyType === 'weekly_flex') {
        setTimesPerWeek((habit.frequencyConfig as { timesPerWeek: number }).timesPerWeek || 3);
      } else if (habit.frequencyType === 'interval') {
        setEveryNDays((habit.frequencyConfig as { everyNDays: number }).everyNDays || 2);
      }
    } else {
      setName('');
      setDescription('');
      setIcon('⚡');
      setColor('#818CF8');
      setCategoryId(categories[0]?.id || null);
      setFrequencyType('daily');
      setFixedDays([1, 2, 3, 4, 5]);
      setTimesPerWeek(3);
      setEveryNDays(2);
      setTargetType('boolean');
      setTargetValue(null);
      setTargetUnit(null);
      setDifficulty('medium');
      setReminderTime(null);
      setRestDays([]);
    }
  }, [habit, categories, isOpen]);

  const toggleFixedDay = (d: number) => {
    setFixedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const toggleRestDay = (d: number) => {
    setRestDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      let frequencyConfig;
      switch (frequencyType) {
        case 'weekly_fixed':
          frequencyConfig = {
            type: 'weekly_fixed' as const,
            days: fixedDays.length ? fixedDays : [1],
          };
          break;
        case 'weekly_flex':
          frequencyConfig = {
            type: 'weekly_flex' as const,
            timesPerWeek: Math.max(1, timesPerWeek),
          };
          break;
        case 'interval':
          frequencyConfig = { type: 'interval' as const, everyNDays: Math.max(1, everyNDays) };
          break;
        case 'daily':
        default:
          frequencyConfig = { type: 'daily' as const };
          break;
      }

      await onSave({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        categoryId,
        frequencyType,
        frequencyConfig,
        targetType,
        targetValue: targetType === 'numeric' ? Number(targetValue) || 1 : null,
        targetUnit: targetType === 'numeric' ? targetUnit || 'unités' : null,
        difficulty,
        reminderTime,
        restDays,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!habit || !onDelete) return;
    if (
      confirm('Voulez-vous vraiment supprimer définitivement cette habitude et son historique ?')
    ) {
      await onDelete(habit.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit ? "Modifier l'habitude" : 'Nouvelle habitude'}
      description="Personnalisez votre habitude pour l'adapter à votre rythme."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name & Icon Preview */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Nom de l'habitude *
          </label>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${color}25`, border: `1px solid ${color}60` }}
            >
              {icon}
            </div>
            <input
              type="text"
              required
              placeholder="Ex: Méditation matinale, 2L d'eau..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Emoji Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Icône
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--bg-tertiary)] rounded-2xl max-h-24 overflow-y-auto">
            {PRESET_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setIcon(em)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform ${
                  icon === em ? 'bg-[var(--accent-primary)]/30 scale-110' : 'hover:bg-white/10'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Couleur
          </label>
          <div className="flex items-center gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c
                    ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-elevated)]'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Catégorie
          </label>
          <select
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none"
          >
            <option value="">Aucune catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Fréquence
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { type: 'daily', label: 'Quotidienne' },
              { type: 'weekly_fixed', label: 'Jours fixes' },
              { type: 'weekly_flex', label: 'X / sem.' },
              { type: 'interval', label: 'Intervalle' },
            ].map((f) => (
              <button
                key={f.type}
                type="button"
                onClick={() => setFrequencyType(f.type as FrequencyType)}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                  frequencyType === f.type
                    ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                    : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Conditional Frequency Sub-options */}
          {frequencyType === 'weekly_fixed' && (
            <div className="flex gap-1.5 justify-between p-2 bg-[var(--bg-tertiary)] rounded-xl">
              {WEEKDAYS.map((w) => (
                <button
                  key={w.day}
                  type="button"
                  onClick={() => toggleFixedDay(w.day)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    fixedDays.includes(w.day)
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}

          {frequencyType === 'weekly_flex' && (
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl">
              <span className="text-xs text-[var(--text-secondary)]">Objectif :</span>
              <input
                type="number"
                min={1}
                max={7}
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                className="w-16 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-sm text-center text-[var(--text-primary)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">fois par semaine</span>
            </div>
          )}

          {frequencyType === 'interval' && (
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl">
              <span className="text-xs text-[var(--text-secondary)]">Tous les :</span>
              <input
                type="number"
                min={2}
                max={30}
                value={everyNDays}
                onChange={(e) => setEveryNDays(Number(e.target.value))}
                className="w-16 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-sm text-center text-[var(--text-primary)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">jours</span>
            </div>
          )}
        </div>

        {/* Target Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Type d'objectif
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => setTargetType('boolean')}
              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                targetType === 'boolean'
                  ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                  : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)]'
              }`}
            >
              Oui / Non (Binaire)
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('numeric');
                if (!targetValue) setTargetValue(10);
                if (!targetUnit) setTargetUnit('pages');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                targetType === 'numeric'
                  ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                  : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)]'
              }`}
            >
              Chiffré (Numérique)
            </button>
          </div>

          {targetType === 'numeric' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                  Valeur cible
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetValue || ''}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  placeholder="Ex: 2000"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Unité</label>
                <input
                  type="text"
                  value={targetUnit || ''}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  placeholder="Ex: ml, min, pages"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reminder Time */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Rappel quotidien (optionnel)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={reminderTime || ''}
              onChange={(e) => setReminderTime(e.target.value || null)}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
            />
            {reminderTime && (
              <button
                type="button"
                onClick={() => setReminderTime(null)}
                className="text-xs text-[var(--text-muted)] hover:text-red-400"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Rest Days (for daily habits) */}
        {frequencyType === 'daily' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Jours de repos (transparents pour le streak)
            </label>
            <div className="flex gap-1.5 justify-between p-2 bg-[var(--bg-tertiary)] rounded-xl">
              {WEEKDAYS.map((w) => (
                <button
                  key={w.day}
                  type="button"
                  onClick={() => toggleRestDay(w.day)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    restDays.includes(w.day)
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          {habit && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : habit ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
