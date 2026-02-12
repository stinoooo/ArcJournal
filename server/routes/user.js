const router = require('express').Router();
const User = require('../models/User');
const Entry = require('../models/Entry');
const Wrap = require('../models/Wrap');
const auth = require('../middleware/auth');

router.use(auth);

// PUT /user/onboarding — save profile info and mark onboarding complete
router.put('/onboarding', async (req, res) => {
  const { displayName, dateOfBirth, gender, journalingGoals } = req.body;
  try {
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ error: 'Display name is required' });
    }
    req.user.displayName = displayName.trim();
    if (dateOfBirth) req.user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) req.user.gender = gender;
    if (Array.isArray(journalingGoals)) req.user.journalingGoals = journalingGoals;
    req.user.onboardingComplete = true;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// DELETE /user — delete account + all data cascade
router.delete('/', async (req, res) => {
  const userId = req.user._id;
  try {
    await Promise.all([
      Entry.deleteMany({ userId }),
      Wrap.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);
    res.json({ message: 'Account and all data deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// DELETE /user/entries — delete all entries
router.delete('/entries', async (req, res) => {
  try {
    await Entry.deleteMany({ userId: req.user._id });
    res.json({ message: 'All entries deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entries' });
  }
});

// GET /user/profile
router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});

// PUT /user/profile
router.put('/profile', async (req, res) => {
  const { username, displayName, dateOfBirth, gender } = req.body;
  try {
    if (username) {
      const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ error: 'Username already taken' });
      req.user.username = username.toLowerCase();
    }
    if (displayName !== undefined) req.user.displayName = displayName.trim();
    if (dateOfBirth !== undefined) req.user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) req.user.gender = gender;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
