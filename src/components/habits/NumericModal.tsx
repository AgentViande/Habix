import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Habit } from '../../models/habit';
import { Minus, Plus, Check } from 'lucide-react';

export interface NumericModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
  currentValue: number;
  onSave: (value: number) => void;
}

export const NumericModal: React.FC<NumericModalProps> = ({
  isOpen,
  onClose,
  habit,
  currentValue,
  onSave,
}) => {
  const [val, setVal] = useState<number>(currentValue);

  useEffect(() => {
    setVal(currentValue || habit?.targetValue || 1);
  }, [currentValue, habit]);

  if (!habit) return null;

  const target = habit.targetValue ?? 1;
  const unit = habit.targetUnit ?? '';
  const isTargetMet = val >= target;

  const handleSave = () => {
    onSave(val);
    onClose();
  };

  const step = target >= 100 ? 50 : target >= 10 ? 5 : 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit.name}
      description={`Objectif : ${target} ${unit}`}
    >
      <div className="flex flex-col items-center py-4">
        <div className="flex items-center gap-4 my-6">
          <Button
            variant="secondary"
            iconOnly
            onClick={() => setVal((v) => Math.max(0, v - step))}
            aria-label="Diminuer"
          >
            <Minus className="w-5 h-5" />
          </Button>

          <div className="flex flex-col items-center min-w-[140px]">
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(Math.max(0, Number(e.target.value)))}
              className="w-28 text-center text-4xl font-extrabold bg-transparent text-[var(--text-primary)] border-b-2 border-[var(--border-default)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
            <span className="text-sm font-medium text-[var(--text-secondary)] mt-1">
              {unit || 'unités'}
            </span>
          </div>

          <Button
            variant="secondary"
            iconOnly
            onClick={() => setVal((v) => v + step)}
            aria-label="Augmenter"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress bar towards target */}
        <div className="w-full bg-[var(--bg-tertiary)] h-3 rounded-full overflow-hidden mb-6 relative">
          <div
            className={`h-full transition-all duration-300 ${
              isTargetMet ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, Math.round((val / target) * 100))}%` }}
          />
        </div>

        <div className="w-full flex items-center justify-between text-xs text-[var(--text-muted)] mb-6 px-1">
          <span>0 {unit}</span>
          <span className={isTargetMet ? 'text-emerald-400 font-bold' : ''}>
            {Math.round((val / target) * 100)}% de l'objectif
          </span>
          <span>
            {target} {unit}
          </span>
        </div>

        <div className="w-full flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Check className="w-4 h-4 mr-1.5" /> Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
