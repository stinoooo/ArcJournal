const { app, BrowserWindow, ipcMain, Menu, protocol, net, session, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const auth = require('./auth');
const secrets = require('./secrets');
const updates = require('./updates');

// Squirrel runs the app once while installing to create shortcuts; quit then.
if (require('electron-squirrel-startup')) app.quit();

const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
const DIST = path.join(__dirname, '..', 'client', 'dist');
const ORIGIN = 'app://arcjournal';
const isMac = process.platform === 'darwin';

// The packaged UI is served from app://arcjournal rather than file://, so it has
// a real origin: the CSP's 'self' works and the page cannot read local files.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();

let mainWindow = null;

// ── Window state ─────────────────────────────────────────────
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadBounds() {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    const visible = screen.getAllDisplays().some(({ workArea: a }) =>
      saved.x < a.x + a.width && saved.x + saved.width > a.x && saved.y < a.y + a.height && saved.y + saved.height > a.y);
    return visible ? saved : { width: saved.width, height: saved.height, maximized: saved.maximized };
  } catch {
    return { width: 1200, height: 800 };
  }
}

function saveBounds(win) {
  try {
    fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() }));
  } catch { /* not worth failing a close over */ }
}

// ── Window ───────────────────────────────────────────────────
function createWindow() {
  const bounds = loadBounds();
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 550,
    minHeight: 600,
    show: false,
    backgroundColor: '#0B1020',
    title: 'ArcJournal',
    // macOS keeps its own traffic lights; Windows and Linux use the app's title bar.
    ...(isMac ? { titleBarStyle: 'hiddenInset' } : { frame: false }),
    ...(process.platform === 'linux' ? { icon: path.join(__dirname, '..', 'assets', 'icons', '512x512.png') } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true,
    },
  });

  if (bounds.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', () => saveBounds(mainWindow));
  mainWindow.on('closed', () => { mainWindow = null; });

  // Links open in the browser; the app window never navigates away.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(isDev ? 'http://localhost:5173' : ORIGIN)) event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadURL(`${ORIGIN}/index.html`);
  }
}

function serveApp() {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!file.startsWith(DIST + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function lockDownSession() {
  // The journal needs no camera, location or notifications. Copying a
  // recovery key needs the clipboard.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'clipboard-sanitized-write');
  });
}

function buildMenu() {
  if (!isMac) { Menu.setApplicationMenu(null); return; }
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'ArcJournal on arcnode.dev', click: () => shell.openExternal('https://arcnode.dev/projects/arcjournal') },
        { label: 'Report a problem', click: () => shell.openExternal('https://github.com/stinoooo/ArcJournal/issues') },
      ],
    },
  ]));
}

// ── IPC ──────────────────────────────────────────────────────
const fromApp = (event) => {
  const url = event.senderFrame?.url || '';
  return url.startsWith(ORIGIN) || (isDev && url.startsWith('http://localhost:5173'));
};

function handle(channel, fn) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!fromApp(event)) throw new Error('Blocked');
    return fn(event, ...args);
  });
}

handle('auth-sign-in', () => auth.signIn());
handle('auth-cancel', () => auth.cancel());
handle('auth-sign-out', () => auth.signOut());
handle('auth-signed-in', () => auth.isSignedIn());
handle('auth-access-token', () => auth.getAccessToken());

const vaultSecret = (userId) => `journal-key-${String(userId).replace(/[^a-f0-9]/gi, '')}`;
ipcMain.on('vault-can-remember', (event) => { event.returnValue = fromApp(event) && secrets.isStrong(); });
handle('vault-remember', (_e, userId, payload) => { if (secrets.isStrong()) secrets.write(vaultSecret(userId), String(payload)); });
handle('vault-recall', (_e, userId) => secrets.read(vaultSecret(userId)));
handle('vault-forget', (_e, userId) => secrets.remove(vaultSecret(userId)));

handle('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
handle('window-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
});
handle('window-close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

handle('app-version', () => app.getVersion());
handle('update-check', () => updates.check());
handle('update-current', () => updates.current());
handle('update-install', () => updates.install());

// ── Lifecycle ────────────────────────────────────────────────
app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  // 1.x kept its password session here.
  fs.rmSync(path.join(app.getPath('userData'), 'session.bin'), { force: true });
  serveApp();
  lockDownSession();
  buildMenu();
  createWindow();
  updates.start((channel, payload) => mainWindow?.webContents.send(channel, payload));
});

app.on('window-all-closed', () => { if (!isMac) app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
