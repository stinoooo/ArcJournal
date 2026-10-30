const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Entry = require('../models/Entry');
const Warning = require('../models/Warning');
const Appeal = require('../models/Appeal');
const auth = require('../middleware/auth');
const { requireActive } = require('../middleware/auth');
const { escapeRegex } = require('../lib/validate');
const { mergeInto, linkToArcnode, LinkConflict } = require('../lib/legacy');
const LegacyBackup = require('../models/LegacyBackup');

router.use(auth);

const GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say', ''];

function profileUpdate(body) {
  const update = {};
  if (typeof body.displayName === 'string') update.displayName = body.displayName.trim().slice(0, 60);
  if (typeof body.dateOfBirth === 'string' && (body.dateOfBirth === '' || /^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth))) {
    update.dateOfBirth = body.dateOfBirth;
  }
  if (GENDERS.includes(body.gender)) update.gender = body.gender;
  if (Array.isArray(body.journalingGoals)) {
    update.journalingGoals = body.journalingGoals
      .filter((g) => typeof g === 'string')
      .slice(0, 10)
      .map((g) => g.slice(0, 60));
  }
  return update;
}

// PUT /user/onboarding
router.put('/onboarding', requireActive, async (req, res) => {
  const update = profileUpdate(req.body);
  if (!update.displayName) return res.status(400).json({ error: 'Display name is required' });
  req.user.set({ ...update, onboardingComplete: true });
  await req.user.save();
  res.json({ user: req.user });
});

// GET /user/profile
router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});

// PUT /user/profile
router.put('/profile', requireActive, async (req, res) => {
  req.user.set(profileUpdate(req.body));
  await req.user.save();
  res.json({ user: req.user });
});

// DELETE /user/entries: delete every entry
router.delete('/entries', requireActive, async (req, res) => {
  await Promise.all([Entry.deleteMany({ userId: req.user._id }), LegacyBackup.deleteMany({ userId: req.user._id })]);
  res.json({ message: 'All entries deleted' });
});

// DELETE /user: delete the ArcJournal account and everything in it.
// The Arcnode account itself is managed at arcnode.dev.
router.delete('/', async (req, res) => {
  if (['suspended', 'terminated'].includes(req.user.status)) {
    return res.status(403).json({ error: 'Accounts under a moderation action cannot be deleted from the app. Contact support.' });
  }
  const userId = req.user._id;
  await Promise.all([
    Entry.deleteMany({ userId }), Appeal.deleteMany({ userId }), Warning.deleteMany({ userId }), LegacyBackup.deleteMany({ userId }),
  ]);
  await User.findByIdAndDelete(userId);
  res.json({ message: 'Account and all data deleted' });
});

// POST /user/link-legacy { identifier, password }
// Brings the journal from an ArcJournal 1.x account into this Arcnode account,
// then removes the old account. Moderation state and the admin role carry over.
const linkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

function linkError(err, res) {
  if (err instanceof LinkConflict) return res.status(409).json({ error: err.message, code: 'link_conflict' });
  throw err;
}

router.post('/link-legacy', linkLimiter, async (req, res) => {
  if (req.authKind !== 'arcnode') return res.status(400).json({ error: 'Sign in with Arcnode first' });
  const { identifier, password } = req.body;
  if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Enter the email or username and password of your old account' });
  }
  const id = identifier.trim().toLowerCase();
  const old = await User.findOne({
    arcnodeId: { $exists: false },
    password: { $exists: true },
    $or: [{ email: id }, { username: new RegExp(`^${escapeRegex(id)}$`, 'i') }],
  });
  if (!old || !(await old.comparePassword(password))) {
    return res.status(401).json({ error: 'That email or username and password do not match an old ArcJournal account' });
  }
  let user;
  try {
    user = await mergeInto(old, req.user);
  } catch (err) {
    return linkError(err, res);
  }
  const legacyEntries = await Entry.countDocuments({ userId: user._id, enc: { $exists: false } });
  res.json({ user, legacyEntries });
});

// POST /user/link-arcnode { accessToken }
// The other direction: signed in with a 1.x password, the user approves
// ArcJournal on arcnode.dev and the app sends that Arcnode access token here.
// From then on the account signs in with Arcnode only and the password is removed.
router.post('/link-arcnode', linkLimiter, async (req, res) => {
  if (req.authKind !== 'password') return res.status(400).json({ error: 'This account is already linked to Arcnode' });
  const { verifyToken, fetchProfile } = req.app.locals.auth;
  const token = req.body?.accessToken;
  const claims = typeof token === 'string' ? await verifyToken(token) : null;
  if (!claims) return res.status(400).json({ error: 'Arcnode sign-in did not finish. Try again.' });
  let user;
  try {
    user = await linkToArcnode(req.user, claims.sub, await fetchProfile(token).catch(() => null));
  } catch (err) {
    return linkError(err, res);
  }
  res.json({ user });
});

module.exports = router;
