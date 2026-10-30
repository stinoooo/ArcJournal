const router = require('express').Router();
const auth = require('../middleware/auth');

// ArcJournal signs in with Arcnode only. A 1.x journal is brought into an
// Arcnode account with POST /user/link-legacy.
router.post('/signup', (_req, res) => res.status(410).json({
  error: 'New accounts are made at arcnode.dev. Sign in with your Arcnode account.',
  code: 'arcnode_only',
}));

// POST /auth/login: password sign-in is gone. 1.x apps are told to update;
// 2.0 apps that still offer it are told to sign in with Arcnode.
router.post('/login', (req, res) => {
  if (req.body?.client !== 'arcjournal-2') {
    return res.status(426).json({
      error: 'This version of ArcJournal is no longer supported. Download the latest version from arcnode.dev/downloads.',
      code: 'upgrade_required',
    });
  }
  res.status(410).json({
    error: 'Sign in with Arcnode. If you used ArcJournal 1.x, choose "Bring your old journal" after signing in.',
    code: 'arcnode_only',
  });
});

// GET /auth/me: also answers for suspended accounts, so they can see their status.
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
