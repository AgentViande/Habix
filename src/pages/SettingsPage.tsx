import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { db } from '../db';
import { Button } from '../components/ui/Button';
import {
  Sun,
  Moon,
  Calendar,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Check,
  AlertTriangle,
  Bell,
  Sparkles,
  Volume2,
  VolumeX,
  User,
  Quote,
} from 'lucide-react';
import { requestNotificationPermission, sendLocalNotification } from '../services/notifications';
import { validateAndSanitizeBackup } from '../services/import-export';
import { sounds } from '../lib/sounds';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  // Auto-updater state
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.updater) {
      window.updater.version().then((v) => {
        if (v) setAppVersion(v);
      });

      const unsubNone = window.updater.onNone(() => {
        setIsCheckingUpdate(false);
        setUpdateStatus('Votre application est à jour !');
      });

      const unsubAvailable = window.updater.onAvailable((info) => {
        setIsCheckingUpdate(false);
        setUpdateStatus(
          `Nouvelle version v${info.version} disponible ! Téléchargement en cours...`
        );
      });

      const unsubError = window.updater.onError((err) => {
        setIsCheckingUpdate(false);
        const errMsg = String(err || '');
        if (errMsg.includes('504') || errMsg.includes('Gateway Time-out')) {
          setUpdateStatus(
            "Le serveur GitHub n'a pas répondu à temps (504 Timeout temporaire). Veuillez réessayer dans un instant."
          );
        } else if (
          errMsg.includes('net::ERR_INTERNET_DISCONNECTED') ||
          errMsg.includes('ENOTFOUND')
        ) {
          setUpdateStatus('Impossible de contacter GitHub. Vérifiez votre connexion Internet.');
        } else {
          const cleanMsg = errMsg
            .split('\n')[0]
            .replace(/<[^>]*>/g, '')
            .trim();
          setUpdateStatus(`Erreur de recherche : ${cleanMsg || 'Erreur temporaire'}`);
        }
      });

      return () => {
        unsubNone();
        unsubAvailable();
        unsubError();
      };
    }
  }, []);

  const handleCheckUpdate = async () => {
    if (!window.updater) return;
    setIsCheckingUpdate(true);
    setUpdateStatus('Recherche de mise à jour en cours...');
    try {
      const res = await window.updater.check();
      if (res.status === 'dev-mode') {
        setIsCheckingUpdate(false);
        setUpdateStatus('Mises à jour désactivées en mode développement.');
      }
    } catch (err: unknown) {
      setIsCheckingUpdate(false);
      const errMsg = (err as Error)?.message || String(err);
      if (errMsg.includes('504') || errMsg.includes('Gateway Time-out')) {
        setUpdateStatus(
          "Le serveur GitHub n'a pas répondu à temps (504 Timeout temporaire). Veuillez réessayer dans un instant."
        );
      } else {
        const cleanMsg = errMsg
          .split('\n')[0]
          .replace(/<[^>]*>/g, '')
          .trim();
        setUpdateStatus(`Erreur : ${cleanMsg}`);
      }
    }
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(
      typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    if (granted) {
      setNotifMessage('Notifications autorisées !');
      sendLocalNotification('Habix', 'Les notifications sont bien configurées !');
    } else {
      setNotifMessage('Autorisation non accordée ou bloquée par le navigateur.');
    }
    setTimeout(() => setNotifMessage(null), 4000);
  };

  const handleTestNotification = () => {
    const success = sendLocalNotification(
      'Habix — Rappel quotidien',
      "N'oubliez pas de valider vos habitudes pour garder votre série !"
    );
    if (!success) {
      setNotifMessage("Veuillez d'abord autoriser les notifications dans votre navigateur.");
      setTimeout(() => setNotifMessage(null), 3000);
    }
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: mode });
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
  };

  const handleExport = async () => {
    const data = {
      habits: await db.habits.toArray(),
      completions: await db.completions.toArray(),
      freezeDays: await db.freezeDays.toArray(),
      categories: await db.categories.toArray(),
      moods: await db.moods.toArray(),
      challenges: await db.challenges.toArray(),
      unlockedBadges: await db.unlockedBadges.toArray(),
      userProfile: await db.userProfile.toArray(),
      settings: await db.settings.toArray(),
      xpEvents: await db.xpEvents.toArray(),
      exportDate: new Date().toISOString(),
      version: 1,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habix-backup-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const resetInput = () => {
      e.target.value = '';
    };

    if (
      !window.confirm(
        '⚠️ Attention : cette importation va remplacer vos habitudes et votre progression actuelle par les données du fichier.\n\nSouhaitez-vous continuer ?'
      )
    ) {
      resetInput();
      return;
    }

    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error("Le fichier sélectionné n'est pas un fichier JSON valide.");
      }

      const sanitized = validateAndSanitizeBackup(raw);

      await db.transaction(
        'rw',
        [
          db.habits,
          db.completions,
          db.freezeDays,
          db.categories,
          db.userProfile,
          db.moods,
          db.challenges,
          db.unlockedBadges,
          db.settings,
          db.xpEvents,
        ],
        async () => {
          await db.habits.clear();
          await db.completions.clear();
          await db.freezeDays.clear();
          await db.categories.clear();
          await db.moods.clear();
          await db.challenges.clear();
          await db.unlockedBadges.clear();
          await db.xpEvents.clear();

          if (sanitized.habits.length) await db.habits.bulkAdd(sanitized.habits);
          if (sanitized.completions.length) await db.completions.bulkAdd(sanitized.completions);
          if (sanitized.freezeDays.length) await db.freezeDays.bulkAdd(sanitized.freezeDays);
          if (sanitized.categories.length) await db.categories.bulkAdd(sanitized.categories);
          if (sanitized.moods.length) await db.moods.bulkAdd(sanitized.moods);
          if (sanitized.challenges.length) await db.challenges.bulkAdd(sanitized.challenges);
          if (sanitized.unlockedBadges.length)
            await db.unlockedBadges.bulkAdd(sanitized.unlockedBadges);
          if (sanitized.userProfile?.length) await db.userProfile.bulkPut(sanitized.userProfile);
          if (sanitized.settings?.length) await db.settings.bulkPut(sanitized.settings);
          if (sanitized.xpEvents?.length) await db.xpEvents.bulkAdd(sanitized.xpEvents);
        }
      );

      resetInput();
      setImportStatus('✅ Données restaurées et validées avec succès ! Rechargement...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      resetInput();
      setImportStatus(`❌ Erreur d'import : ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Paramètres
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Personnalisez votre application, vos rappels et vos données locales.
        </p>
      </div>

      {/* Theme */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Apparence</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'dark', label: 'Sombre', icon: Moon },
            { id: 'light', label: 'Clair', icon: Sun },
            { id: 'system', label: 'Système', icon: RefreshCw },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = settings.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id as 'light' | 'dark' | 'system')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-[var(--bg-tertiary)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personnalisation */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Personnalisation</h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Ajustez votre prénom, l'ambiance sonore, les animations et les citations quotidiennes.
          </p>
        </div>

        {/* Prénom */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] block">
                Votre prénom
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Personnalise les salutations et les félicitations
              </span>
            </div>
          </div>
          <input
            type="text"
            maxLength={30}
            value={settings.userName || ''}
            onChange={(e) => updateSettings({ userName: e.target.value.slice(0, 30) })}
            placeholder="Ex : Alex, Sarah..."
            className="w-full sm:w-48 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] font-medium outline-none"
          />
        </div>

        {/* Effets sonores & Volume */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
              )}
              <div>
                <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] block">
                  Effets sonores
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Pops doux à la validation, jingles de niveau et de fin de journée
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {/* Volume slider & Test sound button */}
          {settings.soundEnabled && (
            <div className="flex items-center justify-between gap-4 pl-6 pt-1">
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                  <span>Volume</span>
                  <span className="font-semibold text-indigo-400">
                    {Math.round((settings.soundVolume ?? 0.2) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={settings.soundVolume ?? 0.2}
                  onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  sounds.playPop(settings.soundVolume ?? 0.2);
                }}
                className="text-xs h-8 px-2.5 flex-shrink-0"
              >
                Tester le son 🔊
              </Button>
            </div>
          )}
        </div>

        {/* Animations de l'interface */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] block">
                Animations de l'interface
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Effets ressort, coche animée et confettis (respecte aussi prefers-reduced-motion)
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.animationsEnabled}
              onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        {/* Citation / conseil du jour */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Quote className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] block">
                Citation & conseil du jour
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Affiche une inspiration quotidienne sous la salutation du jour
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showDailyQuote}
              onChange={(e) => updateSettings({ showDailyQuote: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>

      {/* Preferences */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Préférences temporelles</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] block">
                Début de semaine
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Utilisé pour le calcul des streaks hebdomadaires
              </span>
            </div>
          </div>
          <select
            value={settings.weekStartDay}
            onChange={(e) =>
              updateSettings({ weekStartDay: e.target.value as 'monday' | 'sunday' })
            }
            className="bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
          >
            <option value="monday">Lundi</option>
            <option value="sunday">Dimanche</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] block">
                Rappel du soir
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Heure de synthèse des habitudes de la journée
              </span>
            </div>
          </div>
          <input
            type="time"
            value={settings.eveningReminderTime}
            onChange={(e) => updateSettings({ eveningReminderTime: e.target.value })}
            className="bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[var(--text-primary)]">Fenêtre de rétroactivité</span>
            <span className="text-indigo-400 font-bold">{settings.retroactiveDays} jours</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={settings.retroactiveDays}
            onChange={(e) => updateSettings({ retroactiveDays: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Notifications du navigateur
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Rappels locaux pour maintenir vos habitudes et séries.
              </p>
            </div>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              notificationPermission === 'granted'
                ? 'bg-emerald-500/20 text-emerald-400'
                : notificationPermission === 'denied'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {notificationPermission === 'granted'
              ? 'Activées'
              : notificationPermission === 'denied'
                ? 'Bloquées'
                : 'Non configurées'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {notificationPermission !== 'granted' && (
            <Button size="sm" onClick={handleRequestNotification}>
              Autoriser les notifications
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleTestNotification}>
            Tester une notification
          </Button>
        </div>

        {notifMessage && <p className="text-xs font-semibold text-indigo-400">{notifMessage}</p>}
      </div>

      {/* Backup & Export */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Sauvegarde & Restauration (100% Local)
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Vos données sont stockées uniquement sur votre appareil via IndexedDB. Vous pouvez
          exporter un fichier JSON à tout moment.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 mr-1.5 text-emerald-400" /> Exporté !
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5" /> Exporter en JSON
              </>
            )}
          </Button>

          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <span className="inline-flex items-center justify-center font-semibold text-sm h-11 px-4 rounded-xl gap-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors">
              <Upload className="w-4 h-4" /> Importer un JSON
            </span>
          </label>
        </div>

        {importStatus && (
          <p className="text-xs font-semibold text-indigo-400 mt-2">{importStatus}</p>
        )}
      </div>

      {/* À propos & Mises à jour */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">À propos d'Habix</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Version {appVersion} {window.updater ? '(Application de Bureau)' : '(Web / PWA)'} •
              100% Local & Open Source
            </p>
          </div>

          {window.updater && (
            <Button
              variant="secondary"
              size="sm"
              disabled={isCheckingUpdate}
              onClick={handleCheckUpdate}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isCheckingUpdate ? 'animate-spin' : ''}`}
              />
              {isCheckingUpdate ? 'Recherche en cours...' : 'Rechercher une mise à jour'}
            </Button>
          )}
        </div>

        {updateStatus && (
          <p className="text-xs font-medium text-indigo-300 mt-2 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
            {updateStatus}
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-2xl bg-red-950/10 border border-red-500/20 space-y-3">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-bold">Zone de danger</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Effacer toutes les habitudes, complétions, humeurs et remettre le profil à zéro.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            if (
              confirm(
                'Attention : cette action effacera TOUTES vos données locales de manière irréversible ! Confirmer ?'
              )
            ) {
              await db.delete();
              window.location.reload();
            }
          }}
        >
          Réinitialiser toutes les données
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
