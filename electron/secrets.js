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

function write(name, value) {
  fs.mkdirSync(dir(), { recursive: true });
  const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(value) : Buffer.from(value, 'utf8');
  fs.writeFileSync(file(name), data, { mode: 0o600 });
}

function read(name) {
  try {
    const data = fs.readFileSync(file(name));
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(data) : data.toString('utf8');
  } catch {
    return null;
  }
}

function remove(name) {
  fs.rmSync(file(name), { force: true });
}

module.exports = { isStrong, write, read, remove };
