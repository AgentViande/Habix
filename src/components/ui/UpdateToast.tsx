import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, X, Sparkles, ExternalLink } from 'lucide-react';
import type { UpdateInfo, UpdateProgress } from '../../vite-env';

export const UpdateToast: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.updater) {
      return;
    }

    const unsubAvailable = window.updater.onAvailable((info) => {
      setUpdateInfo(info);
      setIsDismissed(false);
    });

    const unsubProgress = window.updater.onProgress((p) => {
      setProgress(p);
    });

    const unsubReady = window.updater.onReady((info) => {
      setUpdateInfo(info);
      setIsReady(true);
      setIsDismissed(false);
    });

    const unsubError = window.updater.onError((_err) => {
      // Don't crash or display intrusive errors, simply reset progress
      setProgress(null);
    });

    return () => {
      unsubAvailable();
      unsubProgress();
      unsubReady();
      unsubError();
    };
  }, []);

  // Format and sanitize release notes
  const sanitizedNotesHtml = useMemo(() => {
    if (!updateInfo?.notes) return '';

    let raw = '';
    if (Array.isArray(updateInfo.notes)) {
      raw = updateInfo.notes.map((n) => n.note).join('\n\n');
    } else {
      raw = String(updateInfo.notes);
    }

    // Basic sanitization: strip script, iframe, object, embed, event handlers
    const clean = raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '');

    return clean;
  }, [updateInfo?.notes]);

  if (!updateInfo || isDismissed) {
    return null;
  }

  const handleInstall = () => {
    window.updater?.install();
  };

  return (
    <>
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-indigo-500/40 shadow-2xl backdrop-blur-xl space-y-3"
          role="alert"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/25">
                {isReady ? <RefreshCw className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">
                  {isReady
                    ? `Mise à jour v${updateInfo.version} prête !`
                    : `Mise à jour v${updateInfo.version} disponible`}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isReady
                    ? 'Prête à être installée au redémarrage.'
                    : progress
                    ? `Téléchargement : ${Math.round(progress.percent)}%`
                    : 'Téléchargement automatique en cours...'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Fermer la notification de mise à jour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          {!isReady && progress && progress.percent > 0 && (
            <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, progress.percent)}%` }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-subtle)] text-xs">
            {sanitizedNotesHtml ? (
              <button
                onClick={() => setShowNotesModal(true)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Nouveautés
              </button>
            ) : (
              <span />
            )}

            {isReady ? (
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Redémarrer pour installer
              </button>
            ) : (
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                Installation automatique à la fermeture
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Release Notes Modal */}
      <AnimatePresence>
        {showNotesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotesModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-6 z-10 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Notes de version — Habix v{updateInfo.version}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="p-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                  aria-label="Fermer les notes de version"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notes content */}
              <div
                className="overflow-y-auto space-y-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pr-2 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedNotesHtml }}
              />

              <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <a
                  href={`https://github.com/AgentViande/Habix/releases/tag/v${updateInfo.version}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Voir sur GitHub Releases <ExternalLink className="w-3 h-3" />
                </a>

                {isReady && (
                  <button
                    onClick={handleInstall}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Installer maintenant
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
