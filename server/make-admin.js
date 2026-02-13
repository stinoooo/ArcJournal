/**
 * make-admin.js — run once to promote a user to admin
 * Usage: node make-admin.js stijn@stinoo.dev
 *
 * Reads MONGODB_URI from your .env file automatically.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node make-admin.js <email>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌  MONGODB_URI not found in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const result = await mongoose.connection
    .collection('users')
    .updateOne({ email: email.toLowerCase() }, { $set: { role: 'admin' } });

  if (result.matchedCount === 0) {
    console.error(`❌  No user found with email: ${email}`);
  } else {
    console.log(`✅ ${email} is now an admin`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});