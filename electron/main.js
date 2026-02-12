const { app, BrowserWindow, ipcMain, Menu, safeStorage } = require('electron');
const path = require('path');
const fs   = require('fs');

const isDev     = process.env.NODE_ENV === 'development';
const TOKEN_FILE = path.join(app.getPath('userData'), 'session.bin');

// ── Auto-updater (only active in production builds) ───────
let autoUpdater;
if (!isDev) {
  try {
    autoUpdater = require('electron-updater').autoUpdater;
    autoUpdater.autoDownload    = false; // ask user first
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = require('electron').app;  // silence to main log
  } catch (e) {
    console.warn('electron-updater not available:', e.message);
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:    1200,
    height:   800,
    minWidth: 550,
    minHeight:600,
    backgroundColor: '#0B1020',
    titleBarStyle: 'hiddenInset',
    frame:    false,
    icon:     path.join(__dirname, '../assets/bluelogo.png'),
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
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));

    // ── Check for updates 5s after window loads (production only) ──
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

      autoUpdater.on('download-progress', (progress) => {
        mainWindow?.webContents.send('update-progress', {
          percent: Math.round(progress.percent),
          speed:   Math.round(progress.bytesPerSecond / 1024),
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

// ── Update IPC handlers ───────────────────────────────────
ipcMain.handle('update-download', () => {
  if (autoUpdater) autoUpdater.downloadUpdate();
});
ipcMain.handle('update-install', () => {
  if (autoUpdater) autoUpdater.quitAndInstall();
});
ipcMain.handle('update-check', () => {
  if (autoUpdater) autoUpdater.checkForUpdates();
});
ipcMain.handle('get-version', () => app.getVersion());

// ── Secure token storage ──────────────────────────────────
ipcMain.handle('store-token', async (_event, token) => {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      fs.writeFileSync(TOKEN_FILE, safeStorage.encryptString(token));
    } else {
      fs.writeFileSync(TOKEN_FILE, Buffer.from(token, 'utf8'));
    }
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

// ── Window controls ───────────────────────────────────────
ipcMain.handle('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.handle('window-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
});
ipcMain.handle('window-close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

// ── App lifecycle ─────────────────────────────────────────
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
