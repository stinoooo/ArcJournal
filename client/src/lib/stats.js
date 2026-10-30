/**
 * Journal statistics, computed on the device from decrypted entries. The
 * server cannot compute them anymore: it only holds sealed entries.
 */

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function countSentences(text) {
  return text ? (text.match(/[.!?]+/g) || []).length : 0;
}

const DAY = 86400000;
const toDay = (date) => new Date(`${date}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);

export function computeStats(entries, { memberSince = null, today = new Date() } = {}) {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const totalEntries = sorted.length;
  const uniqueDates = [...new Set(sorted.map((e) => e.date))].sort();
  const dateSet = new Set(uniqueDates);
  const daysJournaled = uniqueDates.length;

  let totalWords = 0;
  let totalSentences = 0;
  let totalChars = 0;
  const heatmapMap = {};
  const entriesPerDay = {};
  for (const e of sorted) {
    const text = stripHtml(e.content);
    const words = countWords(text);
    totalWords += words;
    totalSentences += countSentences(text);
    totalChars += text.length;
    heatmapMap[e.date] = (heatmapMap[e.date] || 0) + words;
    entriesPerDay[e.date] = (entriesPerDay[e.date] || 0) + 1;
  }

  const grades = sorted.map((e) => e.grade).filter(Boolean);
  const avgGrade = grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10 : null;
  const gradeDistribution = Array.from({ length: 10 }, (_, i) => ({
    grade: i + 1,
    count: grades.filter((g) => g === i + 1).length,
  }));

  const moodFreq = {};
  for (const e of sorted) if (e.emoji) moodFreq[e.emoji] = (moodFreq[e.emoji] || 0) + 1;
  const topMood = Object.entries(moodFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    if ((toDay(uniqueDates[i]) - toDay(uniqueDates[i - 1])) / DAY === 1) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else run = 1;
  }
  // The current streak may end today or yesterday: today's entry might not be written yet.
  let currentStreak = 0;
  const cursor = toDay(iso(today));
  if (!dateSet.has(iso(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (dateSet.has(iso(cursor))) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dowCount = Array(7).fill(0);
  for (const date of uniqueDates) dowCount[toDay(date).getUTCDay()]++;
  const dowBreakdown = DOW.map((name, i) => ({ name, short: name.slice(0, 3), count: dowCount[i] }));
  const peakDay = DOW[dowCount.indexOf(Math.max(...dowCount))];

  const monthMap = {};
  for (const date of uniqueDates) monthMap[date.slice(0, 7)] = (monthMap[date.slice(0, 7)] || 0) + 1;
  const monthlyActivity = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
  const peakMonth = monthlyActivity.reduce((best, m) => (m.count > best.count ? m : best), { month: '', count: 0 }).month;

  return {
    totalEntries,
    daysJournaled,
    totalWords,
    totalSentences,
    totalChars,
    avgWordsPerEntry: Math.round(totalWords / totalEntries),
    avgSentencesPerEntry: Math.round(totalSentences / totalEntries),
    totalComments: sorted.reduce((s, e) => s + (e.comments?.length || 0), 0),
    totalAttachments: sorted.reduce((s, e) => s + (e.attachments?.length || 0), 0),
    avgGrade,
    bestGrade: grades.length ? Math.max(...grades) : null,
    worstGrade: grades.length ? Math.min(...grades) : null,
    gradeDistribution,
    moodFreq,
    topMood,
    currentStreak,
    longestStreak,
    peakDay,
    dowBreakdown,
    monthlyActivity,
    peakMonth,
    firstEntryDate: uniqueDates[0],
    lastEntryDate: uniqueDates[uniqueDates.length - 1],
    memberSince,
    heatmapMap,
    maxEntriesInDay: Math.max(...Object.values(entriesPerDay)),
    avgEntriesPerActiveDay: Math.round((totalEntries / daysJournaled) * 10) / 10,
    totalVersions: sorted.reduce((s, e) => s + (e.versionCount || 0), 0),
  };
}
