const router       = require('express').Router();
const Announcement = require('../models/Announcement');
const auth         = require('../middleware/auth');

router.use(auth);

// GET /announcements — get all currently active, non-expired announcements
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

module.exports = router;