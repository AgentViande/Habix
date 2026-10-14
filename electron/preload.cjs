const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('updater', {
  version: () => ipcRenderer.invoke('app:version'),
  check: () => ipcRenderer.invoke('update:check'),
  install: () => ipcRenderer.invoke('update:install'),

  onAvailable: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('updater:available', listener);
    return () => ipcRenderer.removeListener('updater:available', listener);
  },

  onProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('updater:progress', listener);
    return () => ipcRenderer.removeListener('updater:progress', listener);
  },

  onReady: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('updater:ready', listener);
    return () => ipcRenderer.removeListener('updater:ready', listener);
  },

  onNone: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('updater:none', listener);
    return () => ipcRenderer.removeListener('updater:none', listener);
  },

  onError: (callback) => {
    const listener = (_event, err) => callback(err);
    ipcRenderer.on('updater:error', listener);
    return () => ipcRenderer.removeListener('updater:error', listener);
  },
});
