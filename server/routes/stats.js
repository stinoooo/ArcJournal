const router  = require('express').Router();
const Entry   = require('../models/Entry');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

router.use(auth);

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function countWords(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}
function countSentences(text) {
  return text ? (text.match(/[.!?]+/g) || []).length : 0;
}

// GET /stats?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.user._id;

    const dateFilter = {};
    if (from) dateFilter.$gte = from;
    if (to)   dateFilter.$lte = to;
    const query = { userId, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) };

    const entries = await Entry.find(query).sort({ date: 1 }).lean();

    if (entries.length === 0) {
      return res.json({ stats: null });
    }

    // ── Basics ────────────────────────────────────────────
    const totalEntries  = entries.length;
    const uniqueDates   = [...new Set(entries.map(e => e.date))];
    const daysJournaled = uniqueDates.length;

    // ── Word / sentence counts ────────────────────────────
    let totalWords = 0, totalSentences = 0, totalChars = 0;
    for (const e of entries) {
      const text = stripHtml(e.content);
      totalWords     += countWords(text);
      totalSentences += countSentences(text);
      totalChars     += text.length;
    }
    const avgWordsPerEntry    = totalEntries ? Math.round(totalWords / totalEntries) : 0;
    const avgSentencesPerEntry = totalEntries ? Math.round(totalSentences / totalEntries) : 0;

    // ── Comments & attachments ────────────────────────────
    const totalComments    = entries.reduce((s, e) => s + (e.comments?.length || 0), 0);
    const totalAttachments = entries.reduce((s, e) => s + (e.attachments?.length || 0), 0);

    // ── Grades ────────────────────────────────────────────
    const grades = entries.map(e => e.grade).filter(Boolean);
    const avgGrade = grades.length ? Math.round((grades.reduce((a,b) => a+b,0)/grades.length)*10)/10 : null;
    const bestGrade  = grades.length ? Math.max(...grades) : null;
    const worstGrade = grades.length ? Math.min(...grades) : null;
    const gradeDistribution = Array.from({length:10},(_,i)=>({
      grade: i+1, count: grades.filter(g=>g===i+1).length,
    }));

    // ── Mood frequency ────────────────────────────────────
    const moodFreq = {};
    for (const e of entries) {
      if (e.emoji) moodFreq[e.emoji] = (moodFreq[e.emoji]||0) + 1;
    }
    const topMood = Object.entries(moodFreq).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

    // ── Streaks ───────────────────────────────────────────
    const sortedDates = [...uniqueDates].sort();
    let currentStreak = 1, longestStreak = 1, temp = 1;
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i-1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr - prev) / 86400000;
      if (diff === 1) { temp++; longestStreak = Math.max(longestStreak, temp); }
      else temp = 1;
    }
    // Current streak: count backwards from today
    let cs = 0;
    const d = new Date(todayStr);
    while (true) {
      const ds = d.toISOString().split('T')[0];
      if (uniqueDates.includes(ds)) { cs++; d.setDate(d.getDate()-1); }
      else break;
    }
    currentStreak = cs;

    // ── Day of week breakdown ─────────────────────────────
    const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dowCount = Array(7).fill(0);
    for (const date of uniqueDates) {
      dowCount[new Date(date).getDay()]++;
    }
    const dowBreakdown = DOW.map((name,i)=>({ name, short: name.slice(0,3), count: dowCount[i] }));
    const peakDay = DOW[dowCount.indexOf(Math.max(...dowCount))];

    // ── Monthly activity ──────────────────────────────────
    const monthMap = {};
    for (const date of uniqueDates) {
      const key = date.slice(0, 7); // YYYY-MM
      monthMap[key] = (monthMap[key]||0) + 1;
    }
    const monthlyActivity = Object.entries(monthMap)
      .sort(([a],[b])=>a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
    const peakMonth = monthlyActivity.reduce((best,m)=> m.count>best.count?m:best, {month:'',count:0}).month;

    // ── Date range context ────────────────────────────────
    const firstEntry = entries[0];
    const lastEntry  = entries[entries.length-1];

    // ── Member since ──────────────────────────────────────
    const user = await User.findById(userId).lean();
    const memberSince = user.createdAt;

    // ── Daily word heatmap (last 90 days) ─────────────────
    const heatmapMap = {};
    for (const e of entries) {
      const text  = stripHtml(e.content);
      const words = countWords(text);
      heatmapMap[e.date] = (heatmapMap[e.date]||0) + words;
    }

    // ── Entries per day stats ─────────────────────────────
    const entriesPerDay = {};
    for (const e of entries) {
      entriesPerDay[e.date] = (entriesPerDay[e.date]||0) + 1;
    }
    const maxEntriesInDay = Math.max(...Object.values(entriesPerDay));
    const avgEntriesPerActiveDay = daysJournaled
      ? Math.round((totalEntries / daysJournaled) * 10) / 10 : 0;

    res.json({
      stats: {
        totalEntries, daysJournaled,
        totalWords, totalSentences, totalChars,
        avgWordsPerEntry, avgSentencesPerEntry,
        totalComments, totalAttachments,
        avgGrade, bestGrade, worstGrade, gradeDistribution,
        moodFreq, topMood,
        currentStreak, longestStreak,
        peakDay, dowBreakdown,
        monthlyActivity, peakMonth,
        firstEntryDate: firstEntry?.date || null,
        lastEntryDate:  lastEntry?.date  || null,
        memberSince,
        heatmapMap,
        maxEntriesInDay, avgEntriesPerActiveDay,
        totalVersions: entries.reduce((s,e)=>s+(e.versions?.length||0),0),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

module.exports = router;
