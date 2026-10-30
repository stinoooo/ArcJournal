/**
 * Small values kept encrypted by the operating system: the Arcnode refresh
 * token, and the journal key when the user chose to keep it unlocked.
 */
const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');

const dir = () => path.join(app.getPath('userData'), 'secrets');
const file = (name) => path.join(dir(), `${name.replace(/[^a-z0-9-]/gi, '_')}.bin`);

/**
 * True when secrets are protected by a real keychain. On Linux without one,
 * Electron falls back to a fixed key (basic_text), which protects nothing.
 */
function isStrong() {
  if (!safeStorage.isEncryptionAvailable()) return false;
  if (process.platform === 'linux') return safeStorage.getSelectedStorageBackend() !== 'basic_text';
  return true;
}

// Without OS encryption, secrets live only in memory: signing in lasts until
// the app closes instead of being written to disk in plaintext.
const memory = new Map();

function write(name, value) {
  if (!safeStorage.isEncryptionAvailable()) {
    memory.set(name, value);
    return;
  }
  fs.mkdirSync(dir(), { recursive: true });
  fs.writeFileSync(file(name), safeStorage.encryptString(value), { mode: 0o600 });
}

function read(name) {
  if (memory.has(name)) return memory.get(name);
  if (!safeStorage.isEncryptionAvailable()) return null;
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
