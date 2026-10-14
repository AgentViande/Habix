/// <reference types="vite/client" />

export interface UpdateInfo {
  version: string;
  notes?: string | Array<{ version: string; note: string }>;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface UpdaterAPI {
  version: () => Promise<string>;
  check: () => Promise<{ status: string; message?: string; updateInfo?: unknown }>;
  install: () => Promise<void>;
  onAvailable: (callback: (data: UpdateInfo) => void) => () => void;
  onProgress: (callback: (progress: UpdateProgress) => void) => () => void;
  onReady: (callback: (data: UpdateInfo) => void) => () => void;
  onNone: (callback: (data: { version?: string }) => void) => () => void;
  onError: (callback: (err: string) => void) => () => void;
}

declare global {
  interface Window {
    updater?: UpdaterAPI;
  }
}
