/**
 * Development only: lets the UI run in a plain browser against server/dev-server.js.
 * Stands in for the Electron bridge, signing in as "dev:<name>". Never bundled
 * into a release: main.jsx only imports it when VITE_DEV_BRIDGE=1 in dev mode.
 */
const KEY = 'arcjournal-dev-user';

if (!window.electronAPI) {
  window.electronAPI = {
    platform: 'browser',
    auth: {
      async signIn() {
        const name = window.prompt('Sign in as (dev user name)', 'tester');
        if (!name) throw new Error('Sign-in cancelled.');
        sessionStorage.setItem(KEY, name);
      },
      cancel: async () => {},
      signOut: async () => { sessionStorage.removeItem(KEY); sessionStorage.removeItem('arcjournal-dev-password'); },
      isSignedIn: async () => !!sessionStorage.getItem(KEY) || !!sessionStorage.getItem('arcjournal-dev-password'),
      getAccessToken: async () => sessionStorage.getItem('arcjournal-dev-password')
        || (sessionStorage.getItem(KEY) ? `dev:${sessionStorage.getItem(KEY)}` : null),
      setPasswordSession: async (token) => sessionStorage.setItem('arcjournal-dev-password', token),
      async startLink() {
        const name = window.prompt('Link as (dev user name)', 'tester');
        if (!name) throw new Error('Sign-in cancelled.');
        window.__pendingLink = name;
        return `dev:${name}`;
      },
      async finishLink() {
        sessionStorage.removeItem('arcjournal-dev-password');
        sessionStorage.setItem(KEY, window.__pendingLink);
      },
      discardLink: async () => { window.__pendingLink = null; },
    },
    vault: {
      remember: async (id, v) => sessionStorage.setItem(`vault-${id}`, v),
      recall: async (id) => sessionStorage.getItem(`vault-${id}`),
      forget: async (id) => sessionStorage.removeItem(`vault-${id}`),
    },
    minimize: async () => {},
    maximize: async () => {},
    close: async () => {},
    getVersion: async () => 'dev',
    backups: {
      async write(name, json) {
        window.__lastBackup = json;
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        Object.assign(document.createElement('a'), { href: url, download: name }).click();
        URL.revokeObjectURL(url);
        return `Downloads/${name}`;
      },
      reveal: async () => {},
    },
    updates: null,
  };
}
