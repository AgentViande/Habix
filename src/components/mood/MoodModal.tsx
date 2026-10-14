import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useMoodStore } from '../../stores/useMoodStore';
import { Check, Plus } from 'lucide-react';

export interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

const MOOD_LEVELS: Array<{ level: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }> = [
  { level: 1, emoji: '😢', label: 'Difficile' },
  { level: 2, emoji: '😔', label: 'Bof' },
  { level: 3, emoji: '😐', label: 'Neutre' },
  { level: 4, emoji: '😊', label: 'Bien' },
  { level: 5, emoji: '😄', label: 'Au top' },
];

const PRESET_TAGS = [
  'stressé',
  'motivé',
  'fatigué',
  'heureux',
  'anxieux',
  'calme',
  'productif',
  'créatif',
  'social',
  'solitaire',
];

export const MoodModal: React.FC<MoodModalProps> = ({ isOpen, onClose, date }) => {
  const { moods, saveMood } = useMoodStore();

  const existingEntry = moods.find((m) => m.date === date);

  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (existingEntry) {
      setLevel(existingEntry.level);
      setSelectedTags(existingEntry.tags || []);
      setNote(existingEntry.note || '');
    } else {
      setLevel(4);
      setSelectedTags(['motivé']);
      setNote('');
    }
  }, [existingEntry, isOpen]);

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTag('');
    }
  };

  const handleSave = async () => {
    await saveMood({
      date,
      level,
      tags: selectedTags,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Humeur du jour"
      description="Comment vous sentez-vous aujourd'hui ?"
    >
      <div className="space-y-6 py-2">
        {/* 5 Emojis Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3 text-center">
            Niveau d'énergie & bien-être
          </label>
          <div className="flex justify-between items-center gap-2 px-2">
            {MOOD_LEVELS.map((m) => (
              <button
                key={m.level}
                type="button"
                onClick={() => setLevel(m.level)}
                className={`flex flex-col items-center p-2.5 sm:p-3 rounded-2xl transition-all ${
                  level === m.level
                    ? 'bg-indigo-500/20 border-2 border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20'
                    : 'hover:bg-[var(--bg-tertiary)] opacity-70 hover:opacity-100 border border-transparent'
                }`}
              >
                <span className="text-3xl sm:text-4xl mb-1">{m.emoji}</span>
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Mots-clés / Ressenti
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {PRESET_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-sm'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          {/* Add custom tag */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter un tag personnalisé..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCustomTag}
              disabled={!customTag.trim()}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Note personnelle (optionnel)
          </label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="Un événement marquant ? Une pensée à retenir ?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none"
          />
          <div className="text-right text-[10px] text-[var(--text-muted)]">{note.length} / 500</div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Check className="w-4 h-4 mr-1.5" /> Enregistrer mon humeur
          </Button>
        </div>
      </div>
    </Modal>
  );
};
