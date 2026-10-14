import React from 'react';
import { Modal } from './Modal';
import { Command } from 'lucide-react';

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: '?', desc: 'Ouvrir les raccourcis clavier' },
  { key: 'n', desc: 'Créer une nouvelle habitude' },
  { key: 'm', desc: 'Enregistrer mon humeur du jour' },
  { key: 'd', desc: 'Basculer le thème clair / sombre' },
  { key: '1', desc: 'Aller à "Aujourd’hui"' },
  { key: '2', desc: 'Aller à "Habitudes"' },
  { key: '3', desc: 'Aller à "Statistiques"' },
  { key: '4', desc: 'Aller à "Défis"' },
  { key: '5', desc: 'Aller à "Revue hebdo"' },
  { key: '6', desc: 'Aller à "Profil & Badges"' },
  { key: '7', desc: 'Aller à "Paramètres"' },
  { key: 'Esc', desc: 'Fermer la modal active' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raccourcis clavier"
      description="Naviguez et gérez vos habitudes sans quitter le clavier."
    >
      <div className="space-y-2 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]"
            >
              <span className="text-xs text-[var(--text-secondary)]">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--accent-primary)] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-[var(--text-muted)] text-center pt-3 flex items-center justify-center gap-1.5">
          <Command className="w-3.5 h-3.5 text-indigo-400" />
          <span>Appuyez sur n'importe quel raccourci pour l'activer directement.</span>
        </div>
      </div>
    </Modal>
  );
};
