const router = require('express').Router();
const Entry = require('../models/Entry');
const LegacyBackup = require('../models/LegacyBackup');
const auth = require('../middleware/auth');
const { requireActive } = require('../middleware/auth');

router.use(auth, requireActive);

const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

function isWrapped(w) {
  return !!w && typeof w.iv === 'string' && B64.test(w.iv) && typeof w.ciphertext === 'string' &&
    B64.test(w.ciphertext) && w.ciphertext.length <= 512;
}

function isVault(v) {
  return (
    !!v && v.version === 1 &&
    v.kdf?.name === 'PBKDF2' && v.kdf?.hash === 'SHA-256' &&
    Number.isInteger(v.kdf?.iterations) && v.kdf.iterations >= 310000 && v.kdf.iterations <= 10000000 &&
    typeof v.kdf?.salt === 'string' && B64.test(v.kdf.salt) &&
    isWrapped(v.passphrase) && isWrapped(v.recovery)
  );
}

function clean(v) {
  return {
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: v.kdf.iterations, salt: v.kdf.salt },
    passphrase: { iv: v.passphrase.iv, ciphertext: v.passphrase.ciphertext },
    recovery: { iv: v.recovery.iv, ciphertext: v.recovery.ciphertext },
    updatedAt: new Date(),
  };
}

// GET /vault: the wrapped journal key, or null before encryption is set up
router.get('/', (req, res) => {
  res.json({ vault: req.user.vault || null });
});

// PUT /vault { vault, replace? }
// Creating needs no flag. Replacing (new passphrase or recovery key) needs
// replace: true, so a stale device can never overwrite a newer vault by accident.
router.put('/', async (req, res) => {
  const { vault, replace } = req.body;
  if (!isVault(vault)) return res.status(400).json({ error: 'Invalid vault' });
  if (req.user.vault && replace !== true) return res.status(409).json({ error: 'Encryption is already set up' });
  req.user.vault = clean(vault);
  await req.user.save();
  res.json({ vault: req.user.vault });
});

// POST /vault/reset: forgot both the passphrase and the recovery key.
// Nobody can decrypt the journal anymore, so it is deleted with the vault.
router.post('/reset', async (req, res) => {
  if (req.body?.confirm !== 'DELETE MY JOURNAL') return res.status(400).json({ error: 'Confirmation required' });
  await Promise.all([Entry.deleteMany({ userId: req.user._id }), LegacyBackup.deleteMany({ userId: req.user._id })]);
  req.user.vault = null;
  await req.user.save();
  res.json({ message: 'Journal deleted. Set up a new passphrase to start again.' });
});

module.exports = router;
