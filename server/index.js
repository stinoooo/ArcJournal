require('dotenv').config({ path: '../.env' });
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const authRoutes          = require('./routes/auth');
const entriesRoutes       = require('./routes/entries');
const wrapsRoutes         = require('./routes/wraps');
const userRoutes          = require('./routes/user');
const statsRoutes         = require('./routes/stats');
const adminRoutes         = require('./routes/admin');
const appealsRoutes       = require('./routes/appeals');
const announcementsRoutes = require('./routes/announcements');
const warningsRoutes      = require('./routes/warnings');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({ origin: [...allowedOrigins, 'file://'] }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// ── Routes ────────────────────────────────────────────────
app.use('/auth',          authRoutes);
app.use('/entries',       entriesRoutes);
app.use('/wraps',         wrapsRoutes);
app.use('/user',          userRoutes);
app.use('/stats',         statsRoutes);
app.use('/admin',         adminRoutes);
app.use('/appeals',       appealsRoutes);
app.use('/announcements', announcementsRoutes);
app.use('/warnings',      warningsRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.1.1' }));
app.get('/',       (_req, res) => res.json({ name: 'ArcJournal API', version: '1.1.1', status: 'running' }));

// ── DB + Server ───────────────────────────────────────────
async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  try {
    const col     = mongoose.connection.collection('entries');
    const indexes = await col.indexes();
    const old     = indexes.find(i => i.key?.userId === 1 && i.key?.date === 1 && i.unique === true);
    if (old) { await col.dropIndex(old.name); console.log('🔧 Dropped old unique index on entries(userId, date)'); }
  } catch (e) { console.warn('Index migration note:', e.message); }

  const server = app.listen(PORT, () => console.log(`🚀 ArcJournal API running on port ${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') { console.error(`❌ Port ${PORT} in use.`); process.exit(1); }
    else throw err;
  });
}

start().catch(err => { console.error('❌ Startup error:', err.message); process.exit(1); });