/**
 * Small values kept encrypted by the operating system: the Arcnode refresh
 * token, and the journal key when the user chose to keep it unlocked.
 */
const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');

const dir = () => path.join(app.getPath('userData'), 'secrets');
const file = (name) => path.join(dir(), `${name.replace(/[^a-z0-9-]/gi, '_')}.bin`);

const isBasicText = () =>
  process.platform === 'linux' && safeStorage.isEncryptionAvailable() && safeStorage.getSelectedStorageBackend() === 'basic_text';

/**
 * True when secrets are protected by a real keychain. On Linux without one,
 * Electron falls back to a fixed key (basic_text), which protects nothing.
 */
function isStrong() {
  if (!safeStorage.isEncryptionAvailable()) return false;
  if (isBasicText()) return false;
  return true;
}

// Without a real keychain, secrets live only in memory: signing in lasts
// until the app closes instead of being written to disk in plaintext, or under
// Linux basic_text, with a key that is the same on every computer.
const memory = new Map();

function write(name, value) {
  if (!isStrong()) {
    memory.set(name, value);
    return;
  }
  fs.mkdirSync(dir(), { recursive: true });
  fs.writeFileSync(file(name), safeStorage.encryptString(value), { mode: 0o600 });
}

function read(name) {
  if (memory.has(name)) return memory.get(name);
  if (!isStrong()) {
    // 2.1.0 and earlier wrote secrets with the fixed basic_text key. Remove
    // them, but only when that is really the backend: a keychain that is just
    // not available yet must not cost anyone their sign-in.
    if (isBasicText()) fs.rmSync(file(name), { force: true });
    return null;
  }
  try {
    return safeStorage.decryptString(fs.readFileSync(file(name)));
  } catch {
    return null;
  }
}

function remove(name) {
  memory.delete(name);
  fs.rmSync(file(name), { force: true });
}

module.exports = { isStrong, write, read, remove };
