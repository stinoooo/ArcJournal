require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { createApp } = require('./app');
const { createVerifier, remoteKeys, fetchProfile } = require('./lib/arcnode');
const User = require('./models/User');
const Entry = require('./models/Entry');

const PORT = process.env.PORT || 8080;

async function migrate() {
  // Indexes changed in 2.0: email is no longer unique (Arcnode owns identity)
  // and username only exists on legacy accounts.
  await User.syncIndexes();
  await Entry.syncIndexes();

  // 1.x stored weekly wraps with entry titles and grades in plaintext. Wraps
  // are now computed on the device, so the old collection goes.
  const wraps = await mongoose.connection.db.listCollections({ name: 'wraps' }).toArray();
  if (wraps.length) {
    await mongoose.connection.db.dropCollection('wraps');
    console.log('Removed the legacy wraps collection');
  }
}

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (!process.env.ARCJOURNAL_CLIENT_ID) console.warn('ARCJOURNAL_CLIENT_ID is not set: every Arcnode sign-in will be refused');
  if (!process.env.JWT_SECRET) console.warn('JWT_SECRET is not set: 1.x accounts cannot sign in with their password');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  await migrate();

  const keys = await remoteKeys();
  const app = createApp({
    auth: {
      verifyToken: createVerifier({ audience: process.env.ARCJOURNAL_CLIENT_ID, keys }),
      fetchProfile: (token) => fetchProfile(token),
    },
    corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
  });

  const server = app.listen(PORT, () => console.log(`ArcJournal API running on port ${PORT}`));
  const shutdown = () => server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
