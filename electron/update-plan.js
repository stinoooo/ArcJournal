/**
 * The decisions behind updating, kept free of Electron so they can be tested:
 * which version is newer, how this copy of ArcJournal was installed, which
 * release file replaces it, and the checksum that file must have.
 */
const path = require('path');

function newer(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
}

/**
 * How this copy was installed, which decides how it updates:
 * - squirrel: the Windows installer; Squirrel updates it in the background.
 * - mac-app: an ArcJournal.app bundle; replaced with the new bundle.
 * - deb / rpm: a Linux package; the new package is installed with pkexec.
 * - portable: the Linux zip; its folder is replaced.
 */
function installKind({ platform, execPath, exists }) {
  if (platform === 'win32') return { kind: 'squirrel' };
  if (platform === 'darwin') {
    const at = execPath.indexOf('.app/Contents/MacOS/');
    return at === -1 ? { kind: 'manual' } : { kind: 'mac-app', target: execPath.slice(0, at + 4) };
  }
  if (platform === 'linux') {
    if (exists('/var/lib/dpkg/info/arcjournal.list')) return { kind: 'deb' };
    if (execPath.startsWith('/usr/lib/arcjournal/') && exists('/var/lib/rpm')) return { kind: 'rpm' };
    return { kind: 'portable', target: path.posix.dirname(execPath) };
  }
  return { kind: 'manual' };
}

const PATTERNS = {
  'mac-app': (v) => new RegExp(`^ArcJournal-darwin-(universal|arm64|x64)-${v.replace(/\./g, '\\.')}\\.zip$`),
  portable: (v) => new RegExp(`^ArcJournal-linux-x64-${v.replace(/\./g, '\\.')}\\.zip$`),
  deb: (v) => new RegExp(`^arcjournal_${v.replace(/\./g, '\\.')}_amd64\\.deb$`),
  rpm: (v) => new RegExp(`^arcjournal-${v.replace(/\./g, '\\.')}-\\d+\\.x86_64\\.rpm$`),
};

/** The release file for this kind of install, preferring the universal macOS build. */
function pickAsset(assets, kind, version) {
  const pattern = PATTERNS[kind]?.(version);
  if (!pattern) return null;
  const matches = assets.filter((a) => pattern.test(a.name));
  return matches.find((a) => a.name.includes('universal')) || matches[0] || null;
}

/** Parses a `sha256sum` file: "<64 hex>  <name>" per line. */
function parseSums(text) {
  const sums = new Map();
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (m) sums.set(m[2].trim(), m[1].toLowerCase());
  }
  return sums;
}

module.exports = { newer, installKind, pickAsset, parseSums };
