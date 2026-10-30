/**
 * A throwaway API for trying the app without Backboard or a database:
 * in-memory MongoDB, and any Bearer token "dev:<name>" signs in as <name>.
 * Seeds one ArcJournal 1.x account (legacy@example.com / legacy-password)
 * with a few plaintext entries, to try "Bring your old journal" and the
 * encryption migration.
 *
 *   node dev-server.js            (port 8080)
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('./app');
const User = require('./models/User');
const Entry = require('./models/Entry');

async function seed() {
  const legacy = await User.create({
    email: 'legacy@example.com',
    username: 'legacy',
    password: await bcrypt.hash('legacy-password', 10),
    displayName: 'Legacy Me',
    onboardingComplete: true,
    createdAt: new Date('2025-03-01T00:00:00Z'),
  });
  const day = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
  await Entry.create([
    { userId: legacy._id, date: day(3), title: 'Rainy walk', content: '<p>Long walk in the rain. Felt good.</p>', grade: 8, emoji: 'happy', versions: [{ content: '<p>Long walk.</p>' }] },
    { userId: legacy._id, date: day(2), title: 'Busy day', content: '<p>Too many meetings today.</p>', grade: 5, emoji: 'sad' },
    { userId: legacy._id, date: day(1), title: '', content: '<p>Cooked pasta with friends!</p>', grade: 9, emoji: 'loved' },
  ]);
}

process.env.JWT_SECRET ||= 'dev-only-secret';

(async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seed();
  const app = createApp({
    auth: {
      verifyToken: async (token) => (token.startsWith('dev:') ? { sub: token.slice(4) } : null),
      fetchProfile: async (token) => ({ email: `${token.slice(4)}@example.com`, name: '' }),
    },
    corsOrigins: ['http://localhost:5173'],
  });
  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => console.log(`Dev API on http://localhost:${port} (sign in with any "dev:<name>" token)`));
})();
