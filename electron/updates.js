/**
 * Automatic updates from GitHub Releases, on every platform.
 *
 * - Windows: Squirrel downloads updates in the background from
 *   update.electronjs.org; they apply on restart.
 * - macOS: the app is not signed, so Squirrel.Mac cannot be used. The app
 *   downloads the new universal zip itself, checks it against the release's
 *   SHA256SUMS, and swaps the .app bundle after it quits.
 * - Linux zip: the same, swapping the app's folder.
 * - Linux .deb / .rpm: the new package is downloaded and checked, then
 *   installed with pkexec, which asks for the user's password.
 *
 * Downloads start by themselves; the renderer shows progress and a button to
 * restart (or install) once the update is ready. When an update cannot be
 * applied automatically, the button opens the release page instead.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { app, autoUpdater, shell } = require('electron');
const { repository } = require('../package.json');
const { newer, installKind, pickAsset, parseSums } = require('./update-plan');

const REPO = repository.url.replace(/^.*github\.com\//, '').replace(/\.git$/, '');
const CHECK_EVERY = 6 * 60 * 60 * 1000;
const HEADERS = () => ({ Accept: 'application/vnd.github+json', 'User-Agent': `ArcJournal/${app.getVersion()}` });

let send = () => {};
let state = null; // { version, status: downloading|ready|manual, percent?, action?, url? }
let staged = null; // what install() applies
let busy = false;

function update(next) {
  state = next;
  send('update-available', state);
}

const install = { kind: 'manual' };

function writable(dir) {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function download(url, file, onProgress) {
  const res = await fetch(url, { headers: { 'User-Agent': HEADERS()['User-Agent'] }, redirect: 'follow' });
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  let received = 0;
  const hash = crypto.createHash('sha256');
  const body = Readable.fromWeb(res.body);
  body.on('data', (chunk) => {
    received += chunk.length;
    hash.update(chunk);
    if (total) onProgress(Math.round((received / total) * 100));
  });
  await pipeline(body, fs.createWriteStream(file));
  return hash.digest('hex');
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1024 * 1024 }, (err, stdout) => (err ? reject(err) : resolve(stdout)));
  });
}

async function checkGitHub() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: HEADERS(),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return;
  const release = await res.json();
  const version = String(release.tag_name || '').replace(/^v/, '');
  if (!version || !newer(version, app.getVersion())) return;
  if (state?.version === version && state.status !== 'manual') return;

  const manual = () => update({ version, status: 'manual', url: release.html_url });
  const asset = pickAsset(release.assets || [], install.kind, version);
  const sumsAsset = (release.assets || []).find((a) => a.name === 'SHA256SUMS');
  if (!asset || !sumsAsset) return manual();
  if ((install.kind === 'mac-app' || install.kind === 'portable') && !writable(path.dirname(install.target))) return manual();

  const sums = parseSums(await (await fetch(sumsAsset.browser_download_url, { headers: { 'User-Agent': HEADERS()['User-Agent'] } })).text());
  const expected = sums.get(asset.name);
  if (!expected) return manual();

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcjournal-update-'));
  const file = path.join(dir, asset.name);
  update({ version, status: 'downloading', percent: 0 });
  const actual = await download(asset.browser_download_url, file, (percent) => {
    if (percent !== state?.percent) update({ version, status: 'downloading', percent });
  });
  if (actual !== expected) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw new Error('The downloaded update did not match its checksum');
  }

  if (install.kind === 'mac-app' || install.kind === 'portable') {
    const unpacked = path.join(dir, 'unpacked');
    fs.mkdirSync(unpacked);
    // ditto keeps the symlinks and permissions inside the app bundle.
    if (install.kind === 'mac-app') await run('ditto', ['-x', '-k', file, unpacked]);
    else await run('unzip', ['-q', file, '-d', unpacked]);
    const entries = fs.readdirSync(unpacked);
    const name = install.kind === 'mac-app' ? entries.find((e) => e.endsWith('.app')) : entries[0];
    if (!name) throw new Error('The update package was empty');
    staged = { kind: install.kind, from: path.join(unpacked, name), dir };
  } else {
    staged = { kind: install.kind, from: file, dir };
  }
  update({ version, status: 'ready', ready: true, action: install.kind === 'deb' || install.kind === 'rpm' ? 'install' : 'restart' });
}

function check() {
  if (!app.isPackaged || busy) return;
  if (install.kind === 'squirrel') {
    autoUpdater.checkForUpdates();
    return;
  }
  busy = true;
  checkGitHub()
    .catch((err) => {
      console.warn('[updates]', err.message);
      if (state?.status === 'downloading') state = null;
    })
    .finally(() => { busy = false; });
}

function start(sendToRenderer) {
  send = sendToRenderer;
  if (!app.isPackaged) return;
  Object.assign(install, installKind({ platform: process.platform, execPath: process.execPath, exists: fs.existsSync }));
  if (install.kind === 'squirrel') {
    autoUpdater.setFeedURL({ url: `https://update.electronjs.org/${REPO}/${process.platform}-${process.arch}/${app.getVersion()}` });
    autoUpdater.on('update-downloaded', (_e, _notes, name) => {
      update({ version: String(name || '').replace(/^v/, ''), status: 'ready', ready: true, action: 'restart' });
    });
    autoUpdater.on('error', (err) => console.warn('[updates]', err.message));
  }
  setTimeout(check, 10_000);
  setInterval(check, CHECK_EVERY);
}

/** Replaces the app bundle or folder once this process has exited, then reopens it. */
function swapAfterExit(target, from, relaunch) {
  const script = path.join(staged.dir, 'swap.sh');
  fs.writeFileSync(script, `#!/bin/sh
while kill -0 "$1" 2>/dev/null; do sleep 0.3; done
rm -rf "$2.old"
if mv "$2" "$2.old" && mv "$3" "$2"; then
  rm -rf "$2.old"
else
  [ -d "$2.old" ] && [ ! -e "$2" ] && mv "$2.old" "$2"
fi
$4
`, { mode: 0o755 });
  spawn('/bin/sh', [script, String(process.pid), target, from, relaunch], { detached: true, stdio: 'ignore' }).unref();
  app.quit();
}

async function apply() {
  if (state?.status === 'manual' && state.url) return shell.openExternal(state.url);
  if (!state?.ready) return undefined;
  if (install.kind === 'squirrel') return autoUpdater.quitAndInstall();
  if (!staged) return undefined;

  if (staged.kind === 'mac-app') {
    return swapAfterExit(install.target, staged.from, `xattr -dr com.apple.quarantine "$2" 2>/dev/null; open "$2"`);
  }
  if (staged.kind === 'portable') {
    return swapAfterExit(install.target, staged.from, `"$2/${path.basename(process.execPath)}" >/dev/null 2>&1 &`);
  }
  // deb / rpm: the package manager installs it; pkexec asks for the password.
  const args = staged.kind === 'deb' ? ['apt-get', 'install', '-y', staged.from] : ['dnf', 'install', '-y', staged.from];
  try {
    await run('pkexec', args);
  } catch {
    try {
      await run('pkexec', staged.kind === 'deb' ? ['dpkg', '-i', staged.from] : ['rpm', '-U', staged.from]);
    } catch {
      // No polkit, or the user cancelled: let the system's software installer take over.
      return shell.openPath(staged.from);
    }
  }
  app.relaunch();
  return app.exit(0);
}

module.exports = { start, check, install: apply, current: () => state };
