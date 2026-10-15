import React, { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
import { StartupSplash } from './components/ui/StartupSplash';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { useHabitStore } from './stores/useHabitStore';
import { useGamificationStore } from './stores/useGamificationStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useMoodStore } from './stores/useMoodStore';
import { useChallengeStore } from './stores/useChallengeStore';
import { seedDefaultData } from './db/seed';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const { settings } = useSettingsStore();

  const isReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animationsEnabled = (settings.animationsEnabled ?? true) && !isReducedMotion;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={animationsEnabled ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={animationsEnabled ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
        transition={{ duration: animationsEnabled ? 0.22 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
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
      setIsInitializing(false);
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

  const showOnboarding = !isInitializing && (!settings.userName || settings.userName.trim() === '');

  return (
    <Router>
      <AppLayout>
        <AnimatedRoutes />
      </AppLayout>

      {/* Global Gamification, Update Modals, Onboarding & Startup Splash */}
      <BadgeUnlockModal />
      <LevelUpModal />
      <UpdateToast />
      <OnboardingModal isOpen={showOnboarding} />
      <StartupSplash isLoading={isInitializing} />
    </Router>
  );
};

export default App;
