const { contextBridge, ipcRenderer } = require('electron');

// Only present when the system keychain can protect a remembered journal key.
const canRemember = ipcRenderer.sendSync('vault-can-remember');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  auth: {
    signIn: () => ipcRenderer.invoke('auth-sign-in'),
    cancel: () => ipcRenderer.invoke('auth-cancel'),
    signOut: () => ipcRenderer.invoke('auth-sign-out'),
    isSignedIn: () => ipcRenderer.invoke('auth-signed-in'),
    getAccessToken: () => ipcRenderer.invoke('auth-access-token'),
    // ArcJournal 1.x accounts: password sign-in until they link to Arcnode.
    setPasswordSession: (token) => ipcRenderer.invoke('auth-password-session', token),
    startLink: () => ipcRenderer.invoke('auth-link-start'),
    finishLink: () => ipcRenderer.invoke('auth-link-finish'),
    discardLink: () => ipcRenderer.invoke('auth-link-discard'),
  },

  vault: canRemember ? {
    remember: (userId, payload) => ipcRenderer.invoke('vault-remember', userId, payload),
    recall: (userId) => ipcRenderer.invoke('vault-recall', userId),
    forget: (userId) => ipcRenderer.invoke('vault-forget', userId),
  } : null,

  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  backups: {
    write: (name, json) => ipcRenderer.invoke('backup-write', name, json),
    reveal: (file) => ipcRenderer.invoke('backup-reveal', file),
  },

  getVersion: () => ipcRenderer.invoke('app-version'),
  updates: {
    check: () => ipcRenderer.invoke('update-check'),
    current: () => ipcRenderer.invoke('update-current'),
    install: () => ipcRenderer.invoke('update-install'),
    onAvailable: (cb) => {
      const listener = (_e, info) => cb(info);
      ipcRenderer.on('update-available', listener);
      return () => ipcRenderer.removeListener('update-available', listener);
    },
  },
});
