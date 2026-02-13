require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes    = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const wrapsRoutes   = require('./routes/wraps');
const userRoutes    = require('./routes/user');
const statsRoutes   = require('./routes/stats');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'file://'] }));
// 20 MB limit to accommodate base64 images/attachments
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// ── Routes ────────────────────────────────────────────────
app.use('/auth',    authRoutes);
app.use('/entries', entriesRoutes);
app.use('/wraps',   wrapsRoutes);
app.use('/user',    userRoutes);
app.use('/stats',   statsRoutes);
app.get('/health',  (_req, res) => res.json({ status: 'ok', version: '1.0.7' }));

app.get('/', (_req, res) => res.json({ name: 'ArcJournal API', version: '1.0.7', status: 'running' }));

// ── DB + Server ───────────────────────────────────────────
async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  // Drop the old unique index that prevents multiple entries per day.
  // Safe to run even if the index already doesn't exist.
  try {
    const col = mongoose.connection.collection('entries');
    const indexes = await col.indexes();
    const oldUnique = indexes.find(
      (i) => i.key && i.key.userId === 1 && i.key.date === 1 && i.unique === true
    );
    if (oldUnique) {
      await col.dropIndex(oldUnique.name);
      console.log('🔧 Dropped old unique index on entries(userId, date)');
    }
  } catch (e) {
    console.warn('Index migration note:', e.message);
  }

  const server = app.listen(PORT, () =>
    console.log(`🚀 ArcJournal API running on port ${PORT}`)
  );

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error(`   Kill the existing process or change PORT in .env, then restart.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

start().catch((err) => {
  console.error('❌ Startup error:', err.message);
  process.exit(1);
});
