const { app, BrowserWindow, ipcMain, Menu, safeStorage } = require('electron');
const path = require('path');
const fs   = require('fs');

const isDev      = process.env.NODE_ENV === 'development';
const TOKEN_FILE = path.join(app.getPath('userData'), 'session.bin');

// ── Auto-updater (production only) ───────────────────────────
let autoUpdater;
if (!isDev) {
  try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload         = false;
    autoUpdater.autoInstallOnAppQuit = true;
    // Must be an object with info/warn/error/debug — NOT app
    autoUpdater.logger = {
      info:  (...a) => console.log('[updater]',       ...a),
      warn:  (...a) => console.warn('[updater:warn]', ...a),
      error: (...a) => console.error('[updater:err]', ...a),
      debug: (...a) => {},
    };
  } catch (e) {
    console.warn('electron-updater not available:', e.message);
  }
}

let mainWindow = null;

function createWindow() {
  // ── Icon: works in both dev and packaged builds ───────────
  // In dev:        __dirname = electron/
  // In production: __dirname = resources/app/electron/
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width:     1200,
    height:    800,
    minWidth:  550,
    minHeight: 600,
    backgroundColor: '#0B1020',
    titleBarStyle: 'hiddenInset',
    frame:     false,
    // Only set icon if the file exists — avoids crash if missing
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));

    // Check for updates 5s after load
    if (autoUpdater) {
      mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => autoUpdater.checkForUpdates(), 5000);
      });

      autoUpdater.on('update-available', (info) => {
        mainWindow?.webContents.send('update-available', {
          version:      info.version,
          releaseNotes: info.releaseNotes,
        });
      });
      autoUpdater.on('update-not-available', () => {
        mainWindow?.webContents.send('update-not-available');
      });
      autoUpdater.on('download-progress', (prog) => {
        mainWindow?.webContents.send('update-progress', {
          percent: Math.round(prog.percent),
          speed:   Math.round(prog.bytesPerSecond / 1024),
        });
      });
      autoUpdater.on('update-downloaded', () => {
        mainWindow?.webContents.send('update-downloaded');
      });
      autoUpdater.on('error', (err) => {
        console.error('Update error:', err);
        mainWindow?.webContents.send('update-error', err.message);
      });
    }
  }
}

// ── Update IPC ────────────────────────────────────────────────
ipcMain.handle('update-download', () => autoUpdater?.downloadUpdate());
ipcMain.handle('update-install',  () => autoUpdater?.quitAndInstall());
ipcMain.handle('update-check',    () => autoUpdater?.checkForUpdates());
ipcMain.handle('get-version',     () => app.getVersion());

// ── Token storage ─────────────────────────────────────────────
ipcMain.handle('store-token', async (_e, token) => {
  try {
    const data = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(token)
      : Buffer.from(token, 'utf8');
    fs.writeFileSync(TOKEN_FILE, data);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('get-token', async () => {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    const data = fs.readFileSync(TOKEN_FILE);
    return safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(data)
      : data.toString('utf8');
  } catch { return null; }
});

ipcMain.handle('clear-token', async () => {
  try {
    if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Window controls ───────────────────────────────────────────
ipcMain.handle('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.handle('window-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
});
ipcMain.handle('window-close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

// ── Lifecycle ─────────────────────────────────────────────────
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });