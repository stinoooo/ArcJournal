/**
 * Updates from GitHub Releases.
 *
 * Windows installs through Squirrel, so updates download in the background
 * from update.electronjs.org and apply on restart. macOS builds are unsigned
 * and Linux packages belong to the package manager, so there the app only
 * says a new version is out and opens the release page.
 */
const { app, autoUpdater, shell } = require('electron');
const { repository } = require('../package.json');

const REPO = repository.url.replace(/^.*github\.com\//, '').replace(/\.git$/, '');
const CHECK_EVERY = 6 * 60 * 60 * 1000;

let send = () => {};
let latest = null;

function newer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
}

async function checkGitHub() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': `ArcJournal/${app.getVersion()}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return;
  const release = await res.json();
  const version = String(release.tag_name || '').replace(/^v/, '');
  if (version && newer(version, app.getVersion())) {
    latest = { version, url: release.html_url, ready: false };
    send('update-available', latest);
  }
}

function check() {
  if (!app.isPackaged) return;
  if (process.platform === 'win32') autoUpdater.checkForUpdates();
  else checkGitHub().catch(() => {});
}

function start(sendToRenderer) {
  send = sendToRenderer;
  if (!app.isPackaged) return;
  if (process.platform === 'win32') {
    autoUpdater.setFeedURL({ url: `https://update.electronjs.org/${REPO}/${process.platform}-${process.arch}/${app.getVersion()}` });
    autoUpdater.on('update-downloaded', (_e, _notes, name) => {
      latest = { version: String(name || '').replace(/^v/, ''), ready: true };
      send('update-available', latest);
    });
    autoUpdater.on('error', (err) => console.warn('[updates]', err.message));
  }
  setTimeout(check, 10_000);
  setInterval(check, CHECK_EVERY);
}

function install() {
  if (latest?.ready) autoUpdater.quitAndInstall();
  else if (latest?.url) shell.openExternal(latest.url);
}

module.exports = { start, check, install, current: () => latest };
