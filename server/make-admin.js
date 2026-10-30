/**
 * Promote an ArcJournal user to admin.
 * Usage: node make-admin.js you@example.com
 *
 * The user must have signed in to ArcJournal at least once with their Arcnode
 * account (or still have an unlinked 1.x account with that email).
 * Reads MONGODB_URI from the .env file in the repository root.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node make-admin.js <email>');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await mongoose.connection
    .collection('users')
    .updateMany({ email: email.toLowerCase() }, { $set: { role: 'admin' } });
  console.log(result.matchedCount ? `${email} is now an admin` : `No user found with email ${email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
