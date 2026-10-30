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
      signOut: async () => sessionStorage.removeItem(KEY),
      isSignedIn: async () => !!sessionStorage.getItem(KEY),
      getAccessToken: async () => (sessionStorage.getItem(KEY) ? `dev:${sessionStorage.getItem(KEY)}` : null),
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
    updates: null,
  };
}
