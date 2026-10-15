const { app, BrowserWindow, shell, protocol, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Set Application User Model ID for Windows toast notifications
app.setAppUserModelId('com.habix.app');

// Allow Service Workers and fetch API on file:// scheme for local PWA & IndexedDB functionality
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'file',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

function sendToWindow(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    // Auto-update configuration for packaged application
    if (app.isPackaged) {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;

      autoUpdater.on('update-available', (info) => {
        sendToWindow('updater:available', {
          version: info?.version,
          notes: info?.releaseNotes,
        });
      });

      autoUpdater.on('download-progress', (progressObj) => {
        sendToWindow('updater:progress', {
          percent: progressObj?.percent ?? 0,
          bytesPerSecond: progressObj?.bytesPerSecond ?? 0,
          transferred: progressObj?.transferred ?? 0,
          total: progressObj?.total ?? 0,
        });
      });

      autoUpdater.on('update-downloaded', (info) => {
        sendToWindow('updater:ready', {
          version: info?.version,
          notes: info?.releaseNotes,
        });
      });

      autoUpdater.on('update-not-available', (info) => {
        sendToWindow('updater:none', {
          version: info?.version,
        });
      });

      autoUpdater.on('error', (err) => {
        sendToWindow('updater:error', err?.message || String(err));
      });

      // Initial check after window is ready
      const initialTimer = setTimeout(() => {
        autoUpdater.checkForUpdates().catch((err) => {
          console.warn('[AutoUpdater] Initial check error:', err?.message || err);
        });
      }, 3500);

      // Periodic check every 4 hours
      let updaterInterval = setInterval(() => {
        autoUpdater.checkForUpdates().catch((err) => {
          console.warn('[AutoUpdater] Periodic check error:', err?.message || err);
        });
      }, 4 * 60 * 60 * 1000);

      app.on('before-quit', () => {
        clearTimeout(initialTimer);
        if (updaterInterval) clearInterval(updaterInterval);
      });
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

// IPC Handlers for updater & app metadata
ipcMain.handle('app:version', () => {
  return app.getVersion();
});

ipcMain.handle('update:check', async () => {
  if (!app.isPackaged) {
    return {
      status: 'dev-mode',
      message: 'Recherche de mise à jour désactivée en mode développement.',
    };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      status: 'success',
      updateInfo: result?.updateInfo,
    };
  } catch (err) {
    return {
      status: 'error',
      message: err?.message || String(err),
    };
  }
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall();
});

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    icon: iconPath,
    backgroundColor: '#0b0f1a',
    title: "Habix — Suivi d'habitudes",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow local dev server navigation or file scheme
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl && url.startsWith(devServerUrl)) {
      return;
    }
    if (url.startsWith('file://')) {
      return;
    }
    event.preventDefault();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
  });

  // Load the built app or local dev server
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
