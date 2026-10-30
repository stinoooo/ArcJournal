const router = require('express').Router();
const auth = require('../middleware/auth');

const UPGRADE = {
  error: 'This version of ArcJournal is no longer supported. Download the latest version from arcnode.dev/downloads.',
  code: 'upgrade_required',
};

// ArcJournal 1.x signed in with a password. Accounts now come from Arcnode.
router.post('/signup', (_req, res) => res.status(426).json(UPGRADE));
router.post('/login', (_req, res) => res.status(426).json(UPGRADE));

// GET /auth/me: also answers for suspended accounts, so they can see their status.
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
