const router = require('express').Router();
const Entry = require('../models/Entry');
const Wrap = require('../models/Wrap');
const auth = require('../middleware/auth');

router.use(auth);

// POST /wraps/generate?weekStart=YYYY-MM-DD
// Generates a stats-based weekly wrap — no AI required
router.post('/generate', async (req, res) => {
  const weekStart = req.query.weekStart;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({ error: 'weekStart query param required (YYYY-MM-DD)' });
  }

  const start = new Date(weekStart + 'T00:00:00Z');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const weekEnd = end.toISOString().split('T')[0];

  try {
    const entries = await Entry.find({
      userId: req.user._id,
      date: { $gte: weekStart, $lte: weekEnd },
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return res.status(400).json({ error: 'No entries found for this week' });
    }

    // Compute stats
    const grades = entries.map((e) => e.grade).filter(Boolean);
    const averageGrade = grades.length
      ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10
      : null;

    // Trend: compare first half vs second half grades
    let trend = 'stable';
    if (grades.length >= 2) {
      const mid = Math.floor(grades.length / 2);
      const firstHalfAvg = grades.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const secondHalfAvg = grades.slice(mid).reduce((a, b) => a + b, 0) / (grades.length - mid);
      if (secondHalfAvg - firstHalfAvg > 0.5) trend = 'improving';
      else if (firstHalfAvg - secondHalfAvg > 0.5) trend = 'declining';
    }

    // Mood frequency
    const moodFreq = {};
    for (const e of entries) {
      if (e.emoji) moodFreq[e.emoji] = (moodFreq[e.emoji] || 0) + 1;
    }
    const topEmojis = Object.entries(moodFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // Grade distribution (1-10 buckets)
    const gradeDistribution = Array.from({ length: 10 }, (_, i) => ({
      grade: i + 1,
      count: grades.filter((g) => g === i + 1).length,
    }));

    // Best and worst days
    const bestDay = entries.reduce((best, e) => (!best || (e.grade || 0) > (best.grade || 0) ? e : best), null);
    const worstDay = entries.reduce((worst, e) => (!worst || (e.grade || 0) < (worst.grade || 0) ? e : worst), null);

    // Days journaled vs total days in week
    const uniqueDays = new Set(entries.map((e) => e.date)).size;
    const streak = uniqueDays;

    const summary = {
      weekStart,
      weekEnd,
      averageGrade,
      trend,
      topEmojis,
      gradeDistribution,
      bestDay: bestDay ? { date: bestDay.date, title: bestDay.title, grade: bestDay.grade } : null,
      worstDay: worstDay ? { date: worstDay.date, title: worstDay.title, grade: worstDay.grade } : null,
      moodFreq,
      daysJournaled: uniqueDays,
      totalEntries: entries.length,
    };

    const wrap = await Wrap.findOneAndUpdate(
      { userId: req.user._id, weekStart },
      { ...summary, userId: req.user._id, weekStart, weekEnd, entriesCount: entries.length },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ wrap });
  } catch (err) {
    console.error('ArcWrapped error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate wrap' });
  }
});

// GET /wraps
router.get('/', async (req, res) => {
  try {
    const wraps = await Wrap.find({ userId: req.user._id }).sort({ weekStart: -1 });
    res.json({ wraps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wraps' });
  }
});

// GET /wraps/:id
router.get('/:id', async (req, res) => {
  try {
    const wrap = await Wrap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!wrap) return res.status(404).json({ error: 'Wrap not found' });
    res.json({ wrap });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wrap' });
  }
});

module.exports = router;
