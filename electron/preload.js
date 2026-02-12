const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Token storage
  storeToken: (token) => ipcRenderer.invoke('store-token', token),
  getToken:   ()      => ipcRenderer.invoke('get-token'),
  clearToken: ()      => ipcRenderer.invoke('clear-token'),

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close:    () => ipcRenderer.invoke('window-close'),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Auto-updater
  checkForUpdate:  () => ipcRenderer.invoke('update-check'),
  downloadUpdate:  () => ipcRenderer.invoke('update-download'),
  installUpdate:   () => ipcRenderer.invoke('update-install'),

  // Update event listeners (renderer subscribes to these)
  onUpdateAvailable:    (cb) => ipcRenderer.on('update-available',    (_e, info)   => cb(info)),
  onUpdateNotAvailable: (cb) => ipcRenderer.on('update-not-available', ()          => cb()),
  onUpdateProgress:     (cb) => ipcRenderer.on('update-progress',     (_e, prog)   => cb(prog)),
  onUpdateDownloaded:   (cb) => ipcRenderer.on('update-downloaded',    ()          => cb()),
  onUpdateError:        (cb) => ipcRenderer.on('update-error',         (_e, msg)   => cb(msg)),
});
