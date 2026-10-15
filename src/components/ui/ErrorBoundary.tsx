import { Component, type ErrorInfo, type ReactNode } from 'react';
import { db } from '../../db';
import { RefreshCw, Download, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isExporting: boolean;
  exportSuccess: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isExporting: false,
      exportSuccess: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      isExporting: false,
      exportSuccess: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Habix ErrorBoundary] Unhandled error caught:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleEmergencyExport = async (): Promise<void> => {
    this.setState({ isExporting: true });
    try {
      const [
        habits,
        completions,
        freezeDays,
        categories,
        userProfile,
        moods,
        challenges,
        unlockedBadges,
        settings,
        xpEvents,
      ] = await Promise.all([
        db.habits.toArray(),
        db.completions.toArray(),
        db.freezeDays.toArray(),
        db.categories.toArray(),
        db.userProfile.toArray(),
        db.moods.toArray(),
        db.challenges.toArray(),
        db.unlockedBadges.toArray(),
        db.settings.toArray(),
        db.xpEvents.toArray(),
      ]);

      const backupData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        isEmergencyBackup: true,
        habits,
        completions,
        freezeDays,
        categories,
        userProfile,
        moods,
        challenges,
        unlockedBadges,
        settings,
        xpEvents,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habix-backup-secours-${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.setState({ isExporting: false, exportSuccess: true });
    } catch (exportErr) {
      console.error('[Habix ErrorBoundary] Failed emergency export:', exportErr);
      alert('Impossible d’exporter automatiquement les données locales : ' + String(exportErr));
      this.setState({ isExporting: false });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f1a] text-slate-100 flex flex-col items-center justify-center p-6 select-none">
          <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Une erreur inattendue est survenue
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Vos données locales sont conservées en sécurité dans votre base IndexedDB. Vous
                pouvez tenter de recharger l’application ou télécharger immédiatement une sauvegarde
                de vos habitudes.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left overflow-x-auto text-xs font-mono text-red-300 max-h-36">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
              >
                <RefreshCw className="w-4 h-4" /> Recharger
              </button>

              <button
                type="button"
                onClick={this.handleEmergencyExport}
                disabled={this.state.isExporting}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4" />
                {this.state.isExporting
                  ? 'Exportation...'
                  : this.state.exportSuccess
                    ? '✅ Sauvegarde téléchargée !'
                    : 'Exporter mes données'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
