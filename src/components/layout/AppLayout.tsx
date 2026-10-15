import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { ShortcutsModal } from '../ui/ShortcutsModal';
import { HabixLogo } from '../ui/HabixLogo';
import { getLevelInfo } from '../../services/xp';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  ListTodo,
  Trophy,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Sparkles,
  Target,
  CalendarCheck,
  Command,
} from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useGamificationStore();
  const { settings, updateSettings } = useSettingsStore();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const toggleTheme = React.useCallback(() => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: nextTheme });
    document.documentElement.setAttribute('data-theme', nextTheme);
  }, [settings.theme, updateSettings]);

  const navItems = [
    { path: '/', label: "Aujourd'hui", shortLabel: 'Auj.', icon: CheckCircle2, key: '1' },
    { path: '/habits', label: 'Habitudes', shortLabel: 'Habitudes', icon: ListTodo, key: '2' },
    { path: '/stats', label: 'Statistiques', shortLabel: 'Stats', icon: Calendar, key: '3' },
    { path: '/challenges', label: 'Défis', shortLabel: 'Défis', icon: Target, key: '4' },
    { path: '/review', label: 'Revue hebdo', shortLabel: 'Revue', icon: CalendarCheck, key: '5' },
    { path: '/profile', label: 'Profil & Badges', shortLabel: 'Profil', icon: Trophy, key: '6' },
    {
      path: '/settings',
      label: 'Paramètres',
      shortLabel: 'Réglages',
      icon: SettingsIcon,
      key: '7',
    },
  ];

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (location.pathname !== '/') {
          navigate('/');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('habix:open-create-habit'));
        }, 50);
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (location.pathname !== '/') {
          navigate('/');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('habix:open-mood'));
        }, 50);
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        navigate('/');
      } else if (e.key === '2') {
        e.preventDefault();
        navigate('/habits');
      } else if (e.key === '3') {
        e.preventDefault();
        navigate('/stats');
      } else if (e.key === '4') {
        e.preventDefault();
        navigate('/challenges');
      } else if (e.key === '5') {
        e.preventDefault();
        navigate('/review');
      } else if (e.key === '6') {
        e.preventDefault();
        navigate('/profile');
      } else if (e.key === '7') {
        e.preventDefault();
        navigate('/settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate, toggleTheme]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col lg:flex-row">
      {/* Desktop Sidebar (lg: 1024px+) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)] h-screen sticky top-0 p-5 flex-shrink-0 z-30 justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-7">
            <HabixLogo size={40} />
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Habix
              </span>
              <span className="block text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                Habit RPG
              </span>
            </div>
          </div>

          {/* Profile Mini Card */}
          {(() => {
            const levelInfo = getLevelInfo(profile?.totalXP || 0);
            return (
              <div className="p-3.5 mb-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[120px]">
                    {settings.userName?.trim() || profile?.displayName || 'Aventurier'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                    Niv. {levelInfo.level}
                  </span>
                </div>
                {/* XP progress bar */}
                <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className="bg-gradient-to-r from-[var(--xp-gradient-start)] to-[var(--xp-gradient-end)] h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelInfo.progressPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 font-medium">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" /> {levelInfo.currentLevelXP} /{' '}
                    {levelInfo.xpForNextLevel} XP
                  </span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {profile?.totalXP || 0} total
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-primary)]' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  <kbd className="opacity-0 group-hover:opacity-60 transition-opacity text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                    {item.key}
                  </kbd>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions: Shortcuts & Theme Toggle */}
        <div className="pt-4 border-t border-[var(--border-subtle)] space-y-1">
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Command className="w-4 h-4 text-indigo-400" />
              <span>Raccourcis clavier</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
              ?
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <span className="flex items-center gap-2">
              {settings.theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
              <span>Thème {settings.theme === 'light' ? 'Clair' : 'Sombre'}</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
              d
            </kbd>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (< lg) */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-[var(--bg-elevated)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <HabixLogo size={32} />
          <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Habix
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {(() => {
            const levelInfo = getLevelInfo(profile?.totalXP || 0);
            return (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-bold text-indigo-400">
                <span>Niv.{levelInfo.level}</span>
                <span className="text-[var(--text-muted)] font-normal">•</span>
                <span className="text-amber-400 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> {profile?.totalXP || 0} XP
                </span>
              </div>
            );
          })()}

          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Raccourcis"
          >
            <Command className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Changer de thème"
          >
            {settings.theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 pb-24 lg:pb-12 max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-6 lg:pt-8 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-elevated)]/95 backdrop-blur-lg border-t border-[var(--border-subtle)] flex items-center justify-around px-1 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 transition-all ${
                isActive
                  ? 'text-[var(--accent-primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] tracking-tight truncate max-w-[48px]">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};

export default AppLayout;
