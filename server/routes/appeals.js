const router = require('express').Router();
const Appeal = require('../models/Appeal');
const auth   = require('../middleware/auth');
router.use(auth);
router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim().length < 10) return res.status(400).json({ error: 'Please provide a detailed message (min 10 characters)' });
  try {
    const user = req.user;
    if (!['suspended', 'terminated'].includes(user.status)) return res.status(400).json({ error: 'No active moderation action to appeal' });
    const existing = await Appeal.findOne({ userId: user._id, status: 'pending' });
    if (existing) return res.status(409).json({ error: 'You already have a pending appeal.' });
    const appeal = await Appeal.create({ userId: user._id, type: user.status === 'suspended' ? 'suspension' : 'termination', message: message.trim() });
    res.status(201).json({ appeal });
  } catch (err) { res.status(500).json({ error: 'Failed to submit appeal' }); }
});
router.get('/mine', async (req, res) => {
  try { const appeal = await Appeal.findOne({ userId: req.user._id }).sort({ createdAt: -1 }); res.json({ appeal }); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch appeal' }); }
});
module.exports = router;