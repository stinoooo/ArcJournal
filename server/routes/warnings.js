const router  = require('express').Router();
const Warning = require('../models/Warning');
const auth    = require('../middleware/auth');

router.use(auth);

// GET /warnings — get all warnings for the current user
router.get('/', async (req, res) => {
  try {
    const warnings = await Warning.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ warnings });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch warnings' }); }
});

// GET /warnings/unacknowledged — only unread warnings (used on app startup)
router.get('/unacknowledged', async (req, res) => {
  try {
    const warnings = await Warning.find({ userId: req.user._id, acknowledged: false }).sort({ createdAt: -1 });
    res.json({ warnings });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch warnings' }); }
});

// POST /warnings/:id/acknowledge
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const warning = await Warning.findOne({ _id: req.params.id, userId: req.user._id });
    if (!warning) return res.status(404).json({ error: 'Warning not found' });
    warning.acknowledged  = true;
    warning.acknowledgedAt = new Date();
    await warning.save();
    res.json({ warning });
  } catch (err) { res.status(500).json({ error: 'Failed to acknowledge warning' }); }
});

// POST /warnings/acknowledge-all
router.post('/acknowledge-all', async (req, res) => {
  try {
    await Warning.updateMany(
      { userId: req.user._id, acknowledged: false },
      { $set: { acknowledged: true, acknowledgedAt: new Date() } }
    );
    res.json({ message: 'All warnings acknowledged' });
  } catch (err) { res.status(500).json({ error: 'Failed to acknowledge warnings' }); }
});

module.exports = router;