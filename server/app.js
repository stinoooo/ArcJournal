const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { version } = require('./package.json');

/**
 * Builds the API. `auth` supplies verifyToken(token) and fetchProfile(token),
 * which index.js wires to Backboard and tests replace with fakes.
 */
function createApp({ auth, corsOrigins = [] }) {
  const app = express();
  app.locals.auth = auth;

  // Railway terminates TLS in front of the service.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  // The desktop app is served from app://arcjournal. Browsers in development
  // use the Vite server. ArcJournal 1.x loads from file://, so its requests
  // carry Origin "file://" or "null": /auth answers those too, so a 1.x app
  // gets the "download 2.0" message instead of a failed preflight. Every
  // route needs a Bearer token and no route uses cookies.
  app.use('/auth', cors({ origin: ['app://arcjournal', 'file://', 'null', ...corsOrigins] }));
  app.use(cors({ origin: ['app://arcjournal', ...corsOrigins] }));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use(express.json({ limit: '16mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', version }));
  app.get('/', (_req, res) => res.json({ name: 'ArcJournal API', version, status: 'running' }));

  app.use('/auth', require('./routes/auth'));
  app.use('/vault', require('./routes/vault'));
  app.use('/entries', require('./routes/entries'));
  app.use('/user', require('./routes/user'));
  app.use('/admin', require('./routes/admin'));
  app.use('/appeals', require('./routes/appeals'));
  app.use('/announcements', require('./routes/announcements'));
  app.use('/warnings', require('./routes/warnings'));

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof mongoose.Error.CastError) return res.status(404).json({ error: 'Not found' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That entry is too large. Try smaller attachments.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  });

  return app;
}

module.exports = { createApp };
