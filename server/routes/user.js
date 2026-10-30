const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Entry = require('../models/Entry');
const Warning = require('../models/Warning');
const Appeal = require('../models/Appeal');
const auth = require('../middleware/auth');
const { requireActive } = require('../middleware/auth');
const { escapeRegex } = require('../lib/validate');

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
  await Entry.deleteMany({ userId: req.user._id });
  res.json({ message: 'All entries deleted' });
});

// DELETE /user: delete the ArcJournal account and everything in it.
// The Arcnode account itself is managed at arcnode.dev.
router.delete('/', async (req, res) => {
  if (['suspended', 'terminated'].includes(req.user.status)) {
    return res.status(403).json({ error: 'Accounts under a moderation action cannot be deleted from the app. Contact support.' });
  }
  const userId = req.user._id;
  await Promise.all([Entry.deleteMany({ userId }), Appeal.deleteMany({ userId }), Warning.deleteMany({ userId })]);
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

router.post('/link-legacy', linkLimiter, async (req, res) => {
  const { identifier, password } = req.body;
  if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Enter the email or username and password of your old account' });
  }
  const id = identifier.trim().toLowerCase();
  const legacy = await User.findOne({
    arcnodeId: { $exists: false },
    password: { $exists: true },
    $or: [{ email: id }, { username: new RegExp(`^${escapeRegex(id)}$`, 'i') }],
  });
  if (!legacy || !(await legacy.comparePassword(password))) {
    return res.status(401).json({ error: 'That email or username and password do not match an old ArcJournal account' });
  }

  const me = req.user;
  await Promise.all([
    Entry.updateMany({ userId: legacy._id }, { $set: { userId: me._id } }),
    Warning.updateMany({ userId: legacy._id }, { $set: { userId: me._id } }),
    Appeal.updateMany({ userId: legacy._id }, { $set: { userId: me._id } }),
  ]);

  if (legacy.role === 'admin') me.role = 'admin';
  if (legacy.status !== 'active') {
    me.status = legacy.status;
    me.statusReason = legacy.statusReason;
    me.statusNote = legacy.statusNote;
    me.statusExpiry = legacy.statusExpiry;
  }
  me.statusHistory = [...legacy.statusHistory, ...me.statusHistory];
  for (const key of ['displayName', 'dateOfBirth', 'gender']) {
    if (!me[key] && legacy[key]) me[key] = legacy[key];
  }
  if (!me.journalingGoals?.length && legacy.journalingGoals?.length) me.journalingGoals = legacy.journalingGoals;
  if (legacy.onboardingComplete) me.onboardingComplete = true;
  if (!me.email && legacy.email) me.email = legacy.email;
  await User.findByIdAndDelete(legacy._id);
  await me.save();
  // Keep "member since" from the first account. createdAt is immutable in
  // Mongoose, so this goes straight to the collection.
  if (legacy.createdAt < me.createdAt) {
    await User.collection.updateOne({ _id: me._id }, { $set: { createdAt: legacy.createdAt } });
  }
  const [user, legacyEntries] = await Promise.all([
    User.findById(me._id),
    Entry.countDocuments({ userId: me._id, enc: { $exists: false } }),
  ]);
  res.json({ user, legacyEntries });
});

module.exports = router;
