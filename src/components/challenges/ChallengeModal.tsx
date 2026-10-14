import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Habit } from '../../models/habit';
import { Target, Trophy, Flame } from 'lucide-react';

export interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onStartChallenge: (habitId: string, duration: 21 | 30) => Promise<void>;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  habits,
  onStartChallenge,
}) => {
  const activeHabits = habits.filter((h) => !h.isArchived);
  const [selectedHabitId, setSelectedHabitId] = useState(activeHabits[0]?.id || '');
  const [duration, setDuration] = useState<21 | 30>(21);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabitId) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onStartChallenge(selectedHabitId, duration);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Défi"
      description="Engagez-vous sur une routine intensive pour transformer une habitude."
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Habit selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Habitude ciblée
          </label>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none"
          >
            {activeHabits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.icon || '⚡'} {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Duration selector: 21 vs 30 */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Durée du programme
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDuration(21)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                duration === 21
                  ? 'bg-indigo-500/15 border-indigo-500 shadow-sm shadow-indigo-500/15'
                  : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-base text-[var(--text-primary)]">21 Jours</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                L’ancrage neuronal pour amorcer l'automatisme.
              </p>
              <span className="inline-block mt-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                +100 XP bonus
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDuration(30)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                duration === 30
                  ? 'bg-purple-500/15 border-purple-500 shadow-sm shadow-purple-500/15'
                  : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-base text-[var(--text-primary)]">30 Jours</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                L’intégration totale pour une habitude à vie.
              </p>
              <span className="inline-block mt-2 text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                +200 XP bonus
              </span>
            </button>
          </div>
        </div>

        {/* Info notice */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
          <Flame className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <span>
            Chaque jour de gel protège votre défi sans avancer le compteur. Un jour manqué sans gel
            échoue le défi.
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !selectedHabitId}>
            {isSubmitting ? 'Création...' : 'Lancer le défi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
