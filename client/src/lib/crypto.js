/**
 * End-to-end encryption for ArcJournal, built on WebCrypto only.
 *
 * Every journal has one random 256-bit AES-GCM key (the journal key). Entries
 * are sealed with it on the device before they are sent. The server keeps the
 * journal key twice, never in the clear:
 *   - wrapped by a key derived from the passphrase (PBKDF2-SHA256), and
 *   - wrapped by the recovery key, 32 random bytes shown to the user once.
 * Losing both means nobody, including Arcnode, can read the journal again.
 */

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const KDF_ITERATIONS = 600_000;
const VAULT_VERSION = 1;
const AAD_PASSPHRASE = encoder.encode('arcjournal:vault:v1:passphrase');
const AAD_RECOVERY = encoder.encode('arcjournal:vault:v1:recovery');

export class WrongSecretError extends Error {
  constructor(message = 'That passphrase or recovery key is not right') {
    super(message);
    this.name = 'WrongSecretError';
  }
}

// ── Encoding ──────────────────────────────────────────────

export function toBase64(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < view.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, view.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function random(length) {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

// Crockford base32: no I, L, O or U, so a written-down key is hard to misread.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function formatRecoveryKey(bytes) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out.match(/.{1,4}/g).join('-');
}

export function parseRecoveryKey(text) {
  const clean = String(text)
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0');
  if (clean.length !== 52 || [...clean].some((c) => !ALPHABET.includes(c))) {
    throw new WrongSecretError('A recovery key has 52 letters and numbers');
  }
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    value = (value << 5) | ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes.slice(0, 32));
}

// ── Keys ──────────────────────────────────────────────────

async function passphraseKey(passphrase, salt, iterations) {
  const material = await subtle.importKey('raw', encoder.encode(passphrase.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

function recoveryWrappingKey(bytes) {
  return subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['wrapKey', 'unwrapKey']);
}

async function wrap(journalKey, wrappingKey, additionalData) {
  const iv = random(12);
  const ciphertext = await subtle.wrapKey('raw', journalKey, wrappingKey, { name: 'AES-GCM', iv, additionalData });
  return { iv: toBase64(iv), ciphertext: toBase64(ciphertext) };
}

async function unwrap(wrapped, wrappingKey, additionalData) {
  try {
    return await subtle.unwrapKey(
      'raw',
      fromBase64(wrapped.ciphertext),
      wrappingKey,
      { name: 'AES-GCM', iv: fromBase64(wrapped.iv), additionalData },
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  } catch {
    throw new WrongSecretError();
  }
}

/** A brand-new journal key and vault. Show `recoveryKey` to the user once. */
export async function createVault(passphrase) {
  const journalKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const salt = random(16);
  const recoveryBytes = random(32);
  const vault = {
    version: VAULT_VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: KDF_ITERATIONS, salt: toBase64(salt) },
    passphrase: await wrap(journalKey, await passphraseKey(passphrase, salt, KDF_ITERATIONS), AAD_PASSPHRASE),
    recovery: await wrap(journalKey, await recoveryWrappingKey(recoveryBytes), AAD_RECOVERY),
  };
  return { vault, journalKey, recoveryKey: formatRecoveryKey(recoveryBytes) };
}

export async function unlockWithPassphrase(vault, passphrase) {
  const key = await passphraseKey(passphrase, fromBase64(vault.kdf.salt), vault.kdf.iterations);
  return unwrap(vault.passphrase, key, AAD_PASSPHRASE);
}

export async function unlockWithRecoveryKey(vault, recoveryKey) {
  const key = await recoveryWrappingKey(parseRecoveryKey(recoveryKey));
  return unwrap(vault.recovery, key, AAD_RECOVERY);
}

/** Same journal key, new passphrase. Nothing has to be re-encrypted. */
export async function changePassphrase(vault, journalKey, passphrase) {
  const salt = random(16);
  return {
    ...vault,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: KDF_ITERATIONS, salt: toBase64(salt) },
    passphrase: await wrap(journalKey, await passphraseKey(passphrase, salt, KDF_ITERATIONS), AAD_PASSPHRASE),
  };
}

/** Replaces the recovery key. The old one stops working. */
export async function rotateRecoveryKey(vault, journalKey) {
  const recoveryBytes = random(32);
  return {
    vault: { ...vault, recovery: await wrap(journalKey, await recoveryWrappingKey(recoveryBytes), AAD_RECOVERY) },
    recoveryKey: formatRecoveryKey(recoveryBytes),
  };
}

export async function exportJournalKey(journalKey) {
  return toBase64(await subtle.exportKey('raw', journalKey));
}

export function importJournalKey(text) {
  return subtle.importKey('raw', fromBase64(text), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

// ── Sealing data ──────────────────────────────────────────

/** Encrypts any JSON value. `context` is bound to the ciphertext and must match on open. */
export async function seal(journalKey, value, context) {
  const iv = random(12);
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(context) },
    journalKey,
    encoder.encode(JSON.stringify(value)),
  );
  return { iv: toBase64(iv), ciphertext: toBase64(ciphertext) };
}

export async function open(journalKey, sealed, context) {
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(sealed.iv), additionalData: encoder.encode(context) },
    journalKey,
    fromBase64(sealed.ciphertext),
  );
  return JSON.parse(decoder.decode(plaintext));
}
