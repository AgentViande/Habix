import React, { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';

const isElectron =
  typeof window !== 'undefined' &&
  (window.location.protocol === 'file:' ||
    Boolean((window as unknown as { process?: { type?: string } }).process?.type) ||
    navigator.userAgent.includes('Electron'));

const Router = isElectron ? HashRouter : BrowserRouter;
import { AppLayout } from './components/layout/AppLayout';
import { TodayPage } from './pages/TodayPage';
import { HabitsPage } from './pages/HabitsPage';
import { StatsPage } from './pages/StatsPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { ReviewPage } from './pages/ReviewPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { BadgeUnlockModal } from './components/gamification/BadgeUnlockModal';
import { LevelUpModal } from './components/gamification/LevelUpModal';
import { UpdateToast } from './components/ui/UpdateToast';
import { useHabitStore } from './stores/useHabitStore';
import { useGamificationStore } from './stores/useGamificationStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useMoodStore } from './stores/useMoodStore';
import { useChallengeStore } from './stores/useChallengeStore';
import { seedDefaultData } from './db/seed';

export const App: React.FC = () => {
  const { loadAll } = useHabitStore();
  const { loadGamification } = useGamificationStore();
  const { settings, loadSettings } = useSettingsStore();
  const { loadMoods } = useMoodStore();
  const { loadChallenges } = useChallengeStore();

  useEffect(() => {
    async function init() {
      await seedDefaultData();
      await Promise.all([
        loadAll(),
        loadGamification(),
        loadSettings(),
        loadMoods(),
        loadChallenges(),
      ]);
    }
    init();
  }, [loadAll, loadGamification, loadSettings, loadMoods, loadChallenges]);

  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, [settings.theme]);

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>

      {/* Global Gamification & Update Modals */}
      <BadgeUnlockModal />
      <LevelUpModal />
      <UpdateToast />
    </Router>
  );
};

export default App;
