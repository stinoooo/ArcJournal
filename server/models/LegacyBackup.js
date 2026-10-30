const mongoose = require('mongoose');

/**
 * A copy of a 1.x plaintext entry, taken right before the app replaces it with
 * its encrypted version. It exists so a failed migration can be undone with
 * scripts/restore-legacy-backup.js, and expires on its own after 90 days, when
 * the journal is deleted, or when the account is deleted.
 */
const legacyBackupSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  entryId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  entry:   { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
});

module.exports = mongoose.model('LegacyBackup', legacyBackupSchema);
