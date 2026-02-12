const router = require('express').Router();
const Entry = require('../models/Entry');
const auth = require('../middleware/auth');

router.use(auth);

// POST /entries — create a NEW entry (multiple per day allowed)
router.post('/', async (req, res) => {
  const { date, title, content, grade, emoji, bgColor } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  // Reject future dates
  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: 'Cannot create entries for future dates' });

  try {
    const entry = await Entry.create({
      userId: req.user._id,
      date,
      title: title || '',
      content: content || '',
      grade: grade ?? 7,
      emoji: emoji || 'happy',
      bgColor: bgColor || '',
    });
    res.status(201).json({ entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// GET /entries?from=YYYY-MM-DD&to=YYYY-MM-DD&search=
router.get('/', async (req, res) => {
  const { from, to, search, date } = req.query;
  const query = { userId: req.user._id };

  if (date) {
    query.date = date;
  } else if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const entries = await Entry.find(query).sort({ date: -1, createdAt: -1 });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// GET /entries/by-date/:date — get all entries for a specific date
router.get('/by-date/:date', async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user._id, date: req.params.date }).sort({ createdAt: 1 });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// GET /entries/:id — get single entry by _id
router.get('/:id', async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// PUT /entries/:id — full update
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'content', 'grade', 'emoji', 'bgColor', 'comments', 'attachments'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.lastEditedAt = new Date();

    // Save version snapshot if content changed
    const existing = await Entry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    if (update.content && update.content !== existing.content) {
      const versions = existing.versions || [];
      // Keep last 10 versions
      if (versions.length >= 10) versions.shift();
      versions.push({ content: existing.content, savedAt: new Date() });
      update.versions = versions;
    }

    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    );
    res.json({ entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE /entries/:id
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;
