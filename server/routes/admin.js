const router       = require('express').Router();
const User         = require('../models/User');
const Entry        = require('../models/Entry');
const Wrap         = require('../models/Wrap');
const Appeal       = require('../models/Appeal');
const Announcement = require('../models/Announcement');
const Warning      = require('../models/Warning');
const auth         = require('../middleware/auth');
const adminAuth    = require('../middleware/adminAuth');

router.use(auth, adminAuth);

// ── Overview / Global Stats ───────────────────────────────────

// GET /admin/overview
router.get('/overview', async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today); week.setDate(today.getDate() - 7);
    const month = new Date(today); month.setDate(today.getDate() - 30);

    const [
      totalUsers, activeUsers, suspendedUsers, terminatedUsers, deletedUsers, adminUsers,
      newToday, newThisWeek, newThisMonth,
      totalEntries, entriesThisWeek,
      pendingAppeals,
      activeAnnouncements,
      totalWarnings, unackWarnings,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'terminated' }),
      User.countDocuments({ status: 'deleted' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: week } }),
      User.countDocuments({ createdAt: { $gte: month } }),
      Entry.countDocuments({}),
      Entry.countDocuments({ createdAt: { $gte: week } }),
      Appeal.countDocuments({ status: 'pending' }),
      Announcement.countDocuments({ active: true }),
      Warning.countDocuments({}),
      Warning.countDocuments({ acknowledged: false }),
    ]);

    // Signups per day for last 14 days (sparkline data)
    const signupsRaw = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Entries per day for last 14 days
    const entriesRaw = await Entry.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      users: { totalUsers, activeUsers, suspendedUsers, terminatedUsers, deletedUsers, adminUsers, newToday, newThisWeek, newThisMonth },
      content: { totalEntries, entriesThisWeek },
      moderation: { pendingAppeals, totalWarnings, unackWarnings },
      announcements: { activeAnnouncements },
      charts: { signups: signupsRaw, entries: entriesRaw },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// ── Users ─────────────────────────────────────────────────────

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20, status, role } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { username:    { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (role)   query.role   = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [entryCount, warningCount, appealCount] = await Promise.all([
      Entry.countDocuments({ userId: user._id }),
      Warning.countDocuments({ userId: user._id }),
      Appeal.countDocuments({ userId: user._id }),
    ]);
    res.json({ user, entryCount, warningCount, appealCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /admin/users/:id/stats — fetch full journal stats for a user
router.get('/users/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await Entry.find({ userId: user._id }).sort({ date: 1 }).lean();
    if (entries.length === 0) return res.json({ stats: null });

    function stripHtml(html = '') { return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
    function countWords(text) { return text ? text.split(/\s+/).filter(Boolean).length : 0; }

    const totalEntries  = entries.length;
    const uniqueDates   = [...new Set(entries.map(e => e.date))];
    const daysJournaled = uniqueDates.length;

    let totalWords = 0;
    for (const e of entries) totalWords += countWords(stripHtml(e.content));

    const grades = entries.map(e => e.grade).filter(Boolean);
    const avgGrade = grades.length ? Math.round((grades.reduce((a,b)=>a+b,0)/grades.length)*10)/10 : null;

    const moodFreq = {};
    for (const e of entries) if (e.emoji) moodFreq[e.emoji] = (moodFreq[e.emoji]||0)+1;
    const topMood = Object.entries(moodFreq).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

    const sortedDates = [...uniqueDates].sort();
    let longestStreak = 1, temp = 1, currentStreak = 0;
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i-1])) / 86400000;
      if (diff === 1) { temp++; longestStreak = Math.max(longestStreak, temp); } else temp = 1;
    }
    const d = new Date(new Date().toISOString().split('T')[0]);
    while (true) {
      const ds = d.toISOString().split('T')[0];
      if (uniqueDates.includes(ds)) { currentStreak++; d.setDate(d.getDate()-1); } else break;
    }

    const monthMap = {};
    for (const date of uniqueDates) { const k = date.slice(0,7); monthMap[k] = (monthMap[k]||0)+1; }
    const monthlyActivity = Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).map(([month,count])=>({month,count}));

    const warnings = await Warning.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      stats: {
        totalEntries, daysJournaled, totalWords,
        avgGrade, topMood, moodFreq,
        currentStreak, longestStreak,
        firstEntryDate: entries[0]?.date || null,
        lastEntryDate: entries[entries.length-1]?.date || null,
        monthlyActivity,
        memberSince: user.createdAt,
      },
      warnings,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute user stats' });
  }
});

// POST /admin/users/:id/suspend
router.post('/users/:id/suspend', async (req, res) => {
  const { reason, note, expiry } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot moderate an admin account' });
    user.statusHistory.push({ action: 'suspended', reason, note, expiry: expiry||null, by: req.user._id });
    user.status       = 'suspended';
    user.statusReason = reason || '';
    user.statusNote   = note   || '';
    user.statusExpiry = expiry ? new Date(expiry) : null;
    await user.save();
    res.json({ user });
  } catch (err) { res.status(500).json({ error: 'Failed to suspend user' }); }
});

// POST /admin/users/:id/terminate
router.post('/users/:id/terminate', async (req, res) => {
  const { reason, note, expiry } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot moderate an admin account' });
    user.statusHistory.push({ action: 'terminated', reason, note, expiry: expiry||null, by: req.user._id });
    user.status       = 'terminated';
    user.statusReason = reason || '';
    user.statusNote   = note   || '';
    user.statusExpiry = expiry ? new Date(expiry) : null;
    await user.save();
    res.json({ user });
  } catch (err) { res.status(500).json({ error: 'Failed to terminate user' }); }
});

// POST /admin/users/:id/restore
router.post('/users/:id/restore', async (req, res) => {
  const { note } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.statusHistory.push({ action: 'restored', note: note||'', by: req.user._id });
    user.status = 'active'; user.statusReason = ''; user.statusNote = ''; user.statusExpiry = null;
    await user.save();
    res.json({ user });
  } catch (err) { res.status(500).json({ error: 'Failed to restore user' }); }
});

// POST /admin/users/:id/warn
router.post('/users/:id/warn', async (req, res) => {
  const { severity = 'warning', reason, note } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required' });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot warn an admin account' });
    const warning = await Warning.create({ userId: user._id, severity, reason, note: note||'', issuedBy: req.user._id });
    res.status(201).json({ warning });
  } catch (err) { res.status(500).json({ error: 'Failed to issue warning' }); }
});

// GET /admin/users/:id/warnings
router.get('/users/:id/warnings', async (req, res) => {
  try {
    const warnings = await Warning.find({ userId: req.params.id }).sort({ createdAt: -1 });
    res.json({ warnings });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch warnings' }); }
});

// DELETE /admin/users/:id/warnings/:wid — rescind a warning
router.delete('/users/:id/warnings/:wid', async (req, res) => {
  try {
    await Warning.findByIdAndDelete(req.params.wid);
    res.json({ message: 'Warning rescinded' });
  } catch (err) { res.status(500).json({ error: 'Failed to rescind warning' }); }
});

// DELETE /admin/users/:id  — soft delete
router.delete('/users/:id', async (req, res) => {
  const { reason, note } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete an admin account' });
    await Promise.all([ Entry.deleteMany({ userId: user._id }), Wrap.deleteMany({ userId: user._id }) ]);
    user.statusHistory.push({ action: 'deleted', reason, note, by: req.user._id });
    user.status = 'deleted'; user.statusReason = reason||''; user.statusNote = note||''; user.statusExpiry = null;
    user.displayName = 'Deleted User'; user.dateOfBirth = ''; user.journalingGoals = [];
    await user.save();
    res.json({ message: 'User data deleted, account shell retained' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete user data' }); }
});

// DELETE /admin/users/:id/purge — hard delete
router.delete('/users/:id/purge', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot purge an admin account' });
    await Promise.all([
      Entry.deleteMany({ userId: user._id }),
      Wrap.deleteMany({ userId: user._id }),
      Appeal.deleteMany({ userId: user._id }),
      Warning.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id),
    ]);
    res.json({ message: 'User permanently deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to purge user' }); }
});

// ── Appeals ───────────────────────────────────────────────────

router.get('/appeals', async (req, res) => {
  try {
    const { status } = req.query;
    const appeals = await Appeal.find(status ? { status } : {})
      .populate('userId', 'username displayName email status')
      .sort({ createdAt: -1 });
    res.json({ appeals });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch appeals' }); }
});

router.post('/appeals/:id/respond', async (req, res) => {
  const { decision, adminResponse } = req.body;
  if (!['approved', 'denied'].includes(decision)) return res.status(400).json({ error: 'Decision must be approved or denied' });
  try {
    const appeal = await Appeal.findById(req.params.id).populate('userId');
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });
    appeal.status = decision; appeal.adminResponse = adminResponse||''; appeal.reviewedBy = req.user._id; appeal.reviewedAt = new Date();
    await appeal.save();
    if (decision === 'approved' && appeal.userId) {
      const user = appeal.userId;
      user.statusHistory.push({ action: 'restored', note: `Appeal approved: ${adminResponse||''}`, by: req.user._id });
      user.status = 'active'; user.statusReason = ''; user.statusNote = ''; user.statusExpiry = null;
      await user.save();
    }
    res.json({ appeal });
  } catch (err) { res.status(500).json({ error: 'Failed to respond to appeal' }); }
});

// ── Announcements ─────────────────────────────────────────────

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch announcements' }); }
});

router.post('/announcements', async (req, res) => {
  const { title, message, type, dismissible, expiresAt } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });
  try {
    const announcement = await Announcement.create({
      title, message, type: type||'info', dismissible: dismissible!==false,
      expiresAt: expiresAt ? new Date(expiresAt) : null, createdBy: req.user._id,
    });
    res.status(201).json({ announcement });
  } catch (err) { res.status(500).json({ error: 'Failed to create announcement' }); }
});

router.put('/announcements/:id', async (req, res) => {
  const { title, message, type, active, dismissible, expiresAt } = req.body;
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, message, type, active, dismissible, expiresAt: expiresAt ? new Date(expiresAt) : null },
      { new: true }
    );
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ announcement });
  } catch (err) { res.status(500).json({ error: 'Failed to update announcement' }); }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete announcement' }); }
});

module.exports = router;