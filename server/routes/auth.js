const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/auth');
const legacy = require('../lib/legacy');
const { escapeRegex } = require('../lib/validate');

// New accounts come from Arcnode. Accounts made in 1.x keep their password
// until they are linked (POST /user/link-arcnode).
router.post('/signup', (_req, res) => res.status(410).json({
  error: 'New accounts are made at arcnode.dev. Sign in with your Arcnode account.',
  code: 'arcnode_only',
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

// POST /auth/login { identifier, password, client }: password sign-in for 1.x
// accounts that are not linked to Arcnode yet. Only 2.0 apps get a session.
router.post('/login', loginLimiter, async (req, res) => {
  if (req.body?.client !== 'arcjournal-2') {
    return res.status(426).json({
      error: 'This version of ArcJournal is no longer supported. Download the latest version from arcnode.dev/downloads.',
      code: 'upgrade_required',
    });
  }
  const { identifier, password } = req.body;
  if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Enter your email or username and password' });
  }
  const id = identifier.trim().toLowerCase();
  const user = await User.findOne({
    password: { $exists: true },
    $or: [{ email: id }, { username: new RegExp(`^${escapeRegex(id)}$`, 'i') }],
  });
  if (!user) {
    // Same work as a real check, so the response time does not reveal
    // whether an account exists.
    await legacy.dummyCompare(password);
    return res.status(401).json({ error: 'That email or username and password do not match. If you connected an Arcnode account, sign in with Arcnode instead.' });
  }
  if (!(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'That email or username and password do not match. If you connected an Arcnode account, sign in with Arcnode instead.' });
  }
  if (user.arcnodeId) {
    return res.status(409).json({ error: 'This account is linked to Arcnode. Sign in with Arcnode instead.', code: 'linked' });
  }
  res.json({ token: await legacy.issueSession(user._id), user });
});

// GET /auth/me: also answers for suspended accounts, so they can see their status.
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user, session: req.authKind });
});

module.exports = router;
