/**
 * Puts a user's 1.x entries back exactly as they were before the app encrypted
 * them, from the server-side snapshots in the legacybackups collection. For
 * support only: use it when a migration went wrong. The next time the user
 * unlocks their journal, the app encrypts the restored entries again.
 *
 * Usage: node scripts/restore-legacy-backup.js <email or user id> [--dry-run]
 * Reads MONGODB_URI from the .env file in the repository root.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const LegacyBackup = require('../models/LegacyBackup');

const [who, flag] = process.argv.slice(2);
if (!who) {
  console.error('Usage: node scripts/restore-legacy-backup.js <email or user id> [--dry-run]');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = mongoose.isValidObjectId(who) ? await User.findById(who) : await User.findOne({ email: who.toLowerCase() });
  if (!user) throw new Error(`No user found for ${who}`);
  const backups = await LegacyBackup.find({ userId: user._id }).lean();
  console.log(`${backups.length} backed-up entries for ${user.email || user._id}`);
  if (flag === '--dry-run') return;
  const entries = mongoose.connection.collection('entries');
  for (const { entry } of backups) {
    await entries.replaceOne({ _id: entry._id }, { ...entry, userId: user._id }, { upsert: true });
  }
  console.log('Restored. They are encrypted again the next time the journal is unlocked.');
}

run()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
