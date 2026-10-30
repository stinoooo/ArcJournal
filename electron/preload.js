const { contextBridge, ipcRenderer } = require('electron');

// ipcRenderer.invoke rejects with "Error invoking remote method 'x': Error: <message>".
// The interface only needs <message>.
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args).catch((err) => {
  const message = String(err?.message || err).replace(/^Error invoking remote method '[^']*': (?:[A-Za-z]*Error: )?/, '');
  throw new Error(message);
});

// Only present when the system keychain can protect a remembered journal key.
const canRemember = ipcRenderer.sendSync('vault-can-remember');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  auth: {
    signIn: () => invoke('auth-sign-in'),
    cancel: () => invoke('auth-cancel'),
    signOut: () => invoke('auth-sign-out'),
    isSignedIn: () => invoke('auth-signed-in'),
    getAccessToken: () => invoke('auth-access-token'),
  },

  vault: canRemember ? {
    remember: (userId, payload) => invoke('vault-remember', userId, payload),
    recall: (userId) => invoke('vault-recall', userId),
    forget: (userId) => invoke('vault-forget', userId),
  } : null,

  backups: {
    write: (name, json) => invoke('backup-write', name, json),
    reveal: (file) => invoke('backup-reveal', file),
  },

  getVersion: () => invoke('app-version'),
  updates: {
    check: () => invoke('update-check'),
    current: () => invoke('update-current'),
    install: () => invoke('update-install'),
    onAvailable: (cb) => {
      const listener = (_e, info) => cb(info);
      ipcRenderer.on('update-available', listener);
      return () => ipcRenderer.removeListener('update-available', listener);
    },
  },
});
