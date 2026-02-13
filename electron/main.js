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
  const iconPath = path.join(app.getAppPath(), 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width:     1200,
    height:    800,
    minWidth:  550,
    minHeight: 600,
    backgroundColor: '#0B1020',
    titleBarStyle: 'hiddenInset',
    frame:     false,
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
    // app.getAppPath() always resolves to the correct app root
    // whether running from source or from a packaged .asar
    const indexPath = path.join(app.getAppPath(), 'client', 'dist', 'index.html');
    console.log('Loading:', indexPath, '| exists:', fs.existsSync(indexPath));

    mainWindow.loadFile(indexPath).catch(err => {
      console.error('loadFile failed:', err.message);
    });

    // Temporarily open devtools in production so you can see errors
    // Remove this line once everything is working
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    // Check for updates 5s after load
    if (autoUpdater) {
      mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => autoUpdater.checkForUpdates(), 5000);
      });

      autoUpdater.on('update-available',    (info) => mainWindow?.webContents.send('update-available',    { version: info.version, releaseNotes: info.releaseNotes }));
      autoUpdater.on('update-not-available', ()    => mainWindow?.webContents.send('update-not-available'));
      autoUpdater.on('download-progress',   (prog) => mainWindow?.webContents.send('update-progress',    { percent: Math.round(prog.percent) }));
      autoUpdater.on('update-downloaded',   ()     => mainWindow?.webContents.send('update-downloaded'));
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