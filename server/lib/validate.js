const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

// 12-byte AES-GCM nonce, base64
const IV_LENGTH = 16;
// Sealed blobs are capped well below MongoDB's 16 MB document limit.
const MAX_BODY = 2 * 1024 * 1024;
const MAX_FILES = 10 * 1024 * 1024;

function isDate(value) {
  return typeof value === 'string' && DATE_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** No entries for days that have not started anywhere on Earth yet. */
function isFutureDate(value) {
  const latest = new Date(Date.now() + 14 * 3600 * 1000).toISOString().slice(0, 10);
  return value > latest;
}

function isSealed(value, max) {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof value.iv === 'string' && value.iv.length === IV_LENGTH && B64_RE.test(value.iv) &&
    typeof value.ciphertext === 'string' && value.ciphertext.length > 0 &&
    value.ciphertext.length <= max && B64_RE.test(value.ciphertext)
  );
}

function sealed(value) {
  return { iv: value.iv, ciphertext: value.ciphertext };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { isDate, isFutureDate, isSealed, sealed, escapeRegex, MAX_BODY, MAX_FILES };
