import React, { useState } from 'react';
import { useChallengeStore } from '../stores/useChallengeStore';
import { useHabitStore } from '../stores/useHabitStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ChallengeModal } from '../components/challenges/ChallengeModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { getTodayLocal } from '../lib/date-utils';
import { Target, Trophy, Plus, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChallengesPage: React.FC = () => {
  const { challenges, startChallenge, abandonChallenge } = useChallengeStore();
  const { habits } = useHabitStore();
  const { settings } = useSettingsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const today = getTodayLocal(settings.timezone);

  const activeChallenges = challenges.filter((c) => c.status === 'active');
  const pastChallenges = challenges.filter((c) => c.status !== 'active');

  const getHabit = (id: string) => habits.find((h) => h.id === id);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Défis 21 & 30 jours
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Relevez le défi d'une constance sans faille pour ancrer durablement vos routines.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Nouveau défi
        </Button>
      </div>

      {/* Active Challenges Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          <Target className="w-4 h-4 text-indigo-400" />
          <span>Défis en cours ({activeChallenges.length})</span>
        </div>

        {activeChallenges.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="Aucun défi en cours"
            description="Lancez un programme intensif de 21 ou 30 jours pour booster votre autodiscipline."
            actionLabel="Lancer un défi"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeChallenges.map((challenge) => {
              const habit = getHabit(challenge.habitId);
              const progressPercent = Math.min(
                100,
                Math.round((challenge.currentDay / challenge.duration) * 100)
              );

              return (
                <motion.div
                  key={challenge.id}
                  whileHover={{ y: -2 }}
                  className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-indigo-500/30 shadow-lg shadow-indigo-500/5 relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{
                            backgroundColor: `${habit?.color || '#818cf8'}25`,
                            border: `1px solid ${habit?.color || '#818cf8'}50`,
                          }}
                        >
                          {habit?.icon || '⚡'}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-[var(--text-primary)]">
                            {habit?.name || 'Habitude'}
                          </h3>
                          <span className="text-xs text-[var(--text-secondary)] font-medium">
                            Défi {challenge.duration} jours
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 tabular-nums">
                        Jour {challenge.currentDay}/{challenge.duration}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 my-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[var(--text-secondary)]">Progression</span>
                        <span className="text-indigo-400 tabular-nums font-bold">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-tertiary)] h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                        <span>Début : {challenge.startDate}</span>
                        <span>Encore {challenge.duration - challenge.currentDay} jours</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => {
                        if (confirm('Voulez-vous vraiment abandonner ce défi ?')) {
                          abandonChallenge(challenge.id);
                        }
                      }}
                      className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      Abandonner le défi
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Challenges Section */}
      {pastChallenges.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Historique des défis ({pastChallenges.length})</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pastChallenges.map((challenge) => {
              const habit = getHabit(challenge.habitId);
              const isCompleted = challenge.status === 'completed';

              return (
                <div
                  key={challenge.id}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit?.icon || '⚡'}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {habit?.name || 'Habitude'}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        Défi {challenge.duration}j • {challenge.startDate}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> Réussi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />{' '}
                        {challenge.status === 'abandoned' ? 'Abandonné' : 'Échoué'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge creation modal */}
      <ChallengeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        habits={habits}
        onStartChallenge={async (habitId, duration) => {
          await startChallenge(habitId, duration, today);
        }}
      />
    </div>
  );
};

export default ChallengesPage;
