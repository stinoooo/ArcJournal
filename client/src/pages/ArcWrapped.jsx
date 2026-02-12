import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { statsAPI } from '../api';
import { emotionImageSrc, emotionLabel, emotionColor } from '../components/EmojiPicker';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

function gradeColor(g) {
  if (!g) return 'var(--muted)';
  if (g >= 8) return 'var(--success)';
  if (g >= 5) return 'var(--accent)';
  return 'var(--error)';
}

const FILTER_OPTIONS = [
  { label: 'Last 7 days',    days: 7  },
  { label: 'Last 30 days',   days: 30 },
  { label: 'Last 90 days',   days: 90 },
  { label: 'Last 6 months',  days: 180 },
  { label: 'Last year',      days: 365 },
  { label: 'All time',       days: null },
];

// ── StatCard ─────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, big, style }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {icon && (
        <div style={{ position:'absolute', top:14, right:14, fontSize: big?28:20, opacity:0.12, lineHeight:1 }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--muted)',
        letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</p>
      <p style={{ fontFamily:'var(--font-display)', fontWeight:800,
        fontSize: big ? 36 : 24, color: color || 'var(--text)', lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--muted)', marginTop:5 }}>{sub}</p>}
    </div>
  );
}

// ── GradeBar chart ───────────────────────────────────────
function GradeBarChart({ gradeDistribution }) {
  const max = Math.max(...gradeDistribution.map(d => d.count), 1);
  return (
    <div className="card">
      <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, marginBottom:16 }}>Grade Distribution</p>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80 }}>
        {gradeDistribution.map(({ grade, count }) => (
          <div key={grade} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            {count > 0 && (
              <span style={{ fontSize:9, color:gradeColor(grade), fontFamily:'var(--font-display)', fontWeight:700 }}>{count}</span>
            )}
            <div style={{
              width:'100%', borderRadius:'3px 3px 0 0',
              background: count>0 ? gradeColor(grade) : 'var(--border)',
              height: count>0 ? `${Math.max((count/max)*62,4)}px` : '3px',
              opacity: count>0 ? 1 : 0.3, transition:'height 0.4s ease',
            }} />
            <span style={{ fontSize:9, color:'var(--muted)', fontFamily:'var(--font-display)' }}>{grade}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Day-of-week chart ────────────────────────────────────
function DowChart({ dowBreakdown, peakDay }) {
  const max = Math.max(...dowBreakdown.map(d => d.count), 1);
  return (
    <div className="card">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13 }}>Day of Week</p>
        {peakDay && (
          <span style={{ fontSize:11, color:'var(--accent)', background:'var(--accent-glow)', padding:'2px 10px', borderRadius:100, border:'1px solid var(--border)' }}>
            Peak: {peakDay}
          </span>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:72 }}>
        {dowBreakdown.map(({ short, count, name }) => {
          const isPeak = name === peakDay;
          return (
            <div key={short} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{
                width:'100%', borderRadius:'3px 3px 0 0',
                background: isPeak ? 'var(--accent)' : count>0 ? 'var(--accent-dim)' : 'var(--border)',
                height: count>0 ? `${Math.max((count/max)*56,4)}px` : '3px',
                transition:'height 0.4s ease', boxShadow: isPeak?'0 0 8px var(--accent-glow)':undefined,
              }} />
              <span style={{ fontSize:9, color: isPeak?'var(--accent)':'var(--muted)', fontFamily:'var(--font-display)', fontWeight: isPeak?700:400 }}>{short}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Monthly activity sparkline ───────────────────────────
function MonthlyChart({ monthlyActivity }) {
  if (!monthlyActivity?.length) return null;
  const max = Math.max(...monthlyActivity.map(m => m.count), 1);
  return (
    <div className="card">
      <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, marginBottom:16 }}>Monthly Activity</p>
      <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:64, overflowX:'auto' }}>
        {monthlyActivity.map(({ month, count }) => {
          const [y, m] = month.split('-');
          const label = format(new Date(Number(y), Number(m)-1, 1), 'MMM yy');
          return (
            <div key={month} style={{ flex:'0 0 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{
                width:'100%', borderRadius:'3px 3px 0 0',
                background: 'var(--accent)', opacity: 0.3 + (count/max)*0.7,
                height: count>0 ? `${Math.max((count/max)*48,4)}px` : '3px',
                transition:'height 0.4s ease',
              }} title={`${label}: ${count} days`} />
              <span style={{ fontSize:8, color:'var(--muted)', fontFamily:'var(--font-display)', textAlign:'center', lineHeight:1.2 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mood breakdown ───────────────────────────────────────
function MoodGrid({ moodFreq, totalEntries }) {
  const sorted = Object.entries(moodFreq).sort((a,b) => b[1]-a[1]);
  if (!sorted.length) return null;
  return (
    <div className="card">
      <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, marginBottom:16 }}>Mood Breakdown</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        {sorted.map(([name, count]) => {
          const pct = totalEntries ? Math.round((count/totalEntries)*100) : 0;
          return (
            <div key={name} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:76,
              background:`${emotionColor(name)}12`, border:`1px solid ${emotionColor(name)}30`,
              borderRadius:10, padding:'12px 10px',
            }}>
              <img src={emotionImageSrc(name)} alt={name} style={{ width:32, height:32, objectFit:'contain' }} />
              <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:10, color:emotionColor(name) }}>
                {emotionLabel(name)}
              </span>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, color:'var(--text)' }}>
                {count}×
              </span>
              <div style={{ width:'100%', height:3, borderRadius:2, background:'var(--border)', overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:emotionColor(name), borderRadius:2 }} />
              </div>
              <span style={{ fontSize:10, color:'var(--muted)' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Writing heatmap (last 91 days = 13 weeks) ────────────
function Heatmap({ heatmapMap }) {
  const cells = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 90; i >= 0; i--) {
      const d = subDays(today, i);
      const ds = format(d, 'yyyy-MM-dd');
      days.push({ ds, words: heatmapMap[ds] || 0, dayOfWeek: d.getDay() });
    }
    return days;
  }, [heatmapMap]);

  const maxWords = Math.max(...cells.map(c => c.words), 1);

  // Build 13-week grid (7 rows × 13 cols)
  const weeks = [];
  let week = [];
  for (const cell of cells) {
    week.push(cell);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push(week);

  return (
    <div className="card">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13 }}>Writing Activity (last 90 days)</p>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10, color:'var(--muted)' }}>Less</span>
          {[0.15, 0.35, 0.55, 0.75, 1].map(o => (
            <div key={o} style={{ width:10, height:10, borderRadius:2, background:'var(--accent)', opacity:o }} />
          ))}
          <span style={{ fontSize:10, color:'var(--muted)' }}>More</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {week.map(({ ds, words }) => {
              const intensity = words > 0 ? Math.max(0.2, words / maxWords) : 0;
              return (
                <div key={ds} title={`${ds}: ${words} words`}
                  style={{
                    width:11, height:11, borderRadius:2, cursor:'default',
                    background: words > 0 ? 'var(--accent)' : 'var(--border)',
                    opacity: words > 0 ? intensity : 0.3,
                  }} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────
export default function ArcStats() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState(FILTER_OPTIONS[2]); // last 90 days
  const [error,   setError]   = useState(null);

  const fetchStats = async (f) => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (f.days) {
        params.from = format(subDays(new Date(), f.days), 'yyyy-MM-dd');
        params.to   = format(new Date(), 'yyyy-MM-dd');
      }
      const r = await statsAPI.get(params);
      setStats(r.data.stats);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(filter); }, [filter]);

  const memberDays = user?.createdAt
    ? differenceInDays(new Date(), new Date(user.createdAt)) + 1
    : null;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'20px 28px 14px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--bg)' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, letterSpacing:'-0.02em' }}>
              Your Stats
            </h1>
            <p style={{ color:'var(--muted)', fontSize:12, marginTop:2 }}>
              {user?.createdAt && `Member since ${format(new Date(user.createdAt), 'MMMM d, yyyy')}`}
              {memberDays && ` · ${memberDays} day${memberDays!==1?'s':''} with ArcJournal`}
            </p>
          </div>
          {/* Filter pills */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {FILTER_OPTIONS.map(f => (
              <button key={f.label}
                onClick={() => setFilter(f)}
                className={filter.label===f.label ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ padding:'5px 12px', fontSize:11, fontFamily:'var(--font-display)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 28px', gap:16, display:'flex', flexDirection:'column' }}>
        {loading && (
          <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}><Spinner size={32} /></div>
        )}
        {error && (
          <div style={{ textAlign:'center', color:'var(--error)', padding:32 }}>{error}</div>
        )}
        {!loading && !error && !stats && (
          <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>
            <div style={{ fontSize:48, opacity:0.15, marginBottom:16 }}>◎</div>
            <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16 }}>No entries in this period</p>
            <p style={{ fontSize:13, marginTop:8 }}>Start journaling to see your stats here.</p>
          </div>
        )}
        {!loading && !error && stats && (
          <>
            {/* Row 1: Top metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              <StatCard label="Total Entries"   value={stats.totalEntries} icon="📖" big color="var(--accent)" />
              <StatCard label="Days Journaled"  value={stats.daysJournaled} icon="📅" big color="var(--accent)"
                sub={stats.totalEntries !== stats.daysJournaled ? `${stats.avgEntriesPerActiveDay}×/day avg` : undefined} />
              <StatCard label="Words Written"   value={stats.totalWords.toLocaleString()} icon="✍"  big color="var(--success)" />
              <StatCard label="Current Streak"  value={`${stats.currentStreak}d`} icon="🔥" big
                color={stats.currentStreak>=7?'var(--success)':stats.currentStreak>=3?'var(--accent)':'var(--muted)'}
                sub={`Best: ${stats.longestStreak} days`} />
            </div>

            {/* Row 2: Writing detail */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              <StatCard label="Total Sentences"  value={stats.totalSentences.toLocaleString()} icon="✦" />
              <StatCard label="Avg Words / Entry" value={stats.avgWordsPerEntry} icon="⊘" />
              <StatCard label="Comments Added"    value={stats.totalComments}    icon="💬" />
              <StatCard label="Attachments"       value={stats.totalAttachments} icon="📎" />
            </div>

            {/* Row 3: Grades */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              <StatCard label="Avg Grade" value={stats.avgGrade ? `${stats.avgGrade}/10` : '—'}
                icon="⭐" color={gradeColor(stats.avgGrade)} />
              <StatCard label="Best Grade"  value={stats.bestGrade  ? `${stats.bestGrade}/10`  : '—'} icon="🏆" color="var(--success)" />
              <StatCard label="Hardest Day" value={stats.worstGrade ? `${stats.worstGrade}/10` : '—'} icon="⚡" color="var(--error)" />
            </div>

            {/* Heatmap */}
            {filter.days && filter.days >= 30 && <Heatmap heatmapMap={stats.heatmapMap} />}

            {/* Row 4: charts */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <GradeBarChart gradeDistribution={stats.gradeDistribution} />
              <DowChart dowBreakdown={stats.dowBreakdown} peakDay={stats.peakDay} />
            </div>

            {/* Monthly + Moods */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <MonthlyChart monthlyActivity={stats.monthlyActivity} />
              <MoodGrid moodFreq={stats.moodFreq} totalEntries={stats.totalEntries} />
            </div>

            {/* Date range summary */}
            <div className="card" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              <div>
                <p style={{ fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--muted)', letterSpacing:'0.07em', marginBottom:6 }}>FIRST ENTRY</p>
                <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>
                  {stats.firstEntryDate ? format(parseISO(stats.firstEntryDate), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p style={{ fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--muted)', letterSpacing:'0.07em', marginBottom:6 }}>LAST ENTRY</p>
                <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>
                  {stats.lastEntryDate ? format(parseISO(stats.lastEntryDate), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p style={{ fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--muted)', letterSpacing:'0.07em', marginBottom:6 }}>CHARACTERS WRITTEN</p>
                <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>
                  {stats.totalChars.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Longest streak + peak month highlight */}
            {(stats.longestStreak > 1 || stats.peakMonth) && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {stats.longestStreak > 1 && (
                  <div className="card" style={{ borderColor:'rgba(61,255,181,0.2)', background:'rgba(61,255,181,0.04)' }}>
                    <p style={{ fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--success)', letterSpacing:'0.07em', marginBottom:6 }}>🔥 LONGEST STREAK</p>
                    <p style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:28, color:'var(--success)' }}>{stats.longestStreak} <span style={{ fontSize:14, fontWeight:400 }}>days</span></p>
                    <p style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Consecutive journaling days</p>
                  </div>
                )}
                {stats.peakMonth && (
                  <div className="card" style={{ borderColor:'rgba(106,228,255,0.2)', background:'rgba(106,228,255,0.04)' }}>
                    <p style={{ fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--accent)', letterSpacing:'0.07em', marginBottom:6 }}>📅 MOST ACTIVE MONTH</p>
                    <p style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, color:'var(--accent)' }}>
                      {(() => { const [y,m]=stats.peakMonth.split('-'); return format(new Date(Number(y),Number(m)-1,1),'MMMM yyyy'); })()}
                    </p>
                    <p style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
                      {stats.monthlyActivity.find(m=>m.month===stats.peakMonth)?.count || 0} days journaled
                    </p>
                  </div>
                )}
              </div>
            )}

            <p style={{ fontSize:10, color:'var(--muted)', opacity:0.3, textAlign:'center', letterSpacing:'0.08em', paddingBottom:8 }}>
              ARCJOURNAL — PART OF THE ARCNODE NETWORK
            </p>
          </>
        )}
      </div>
    </div>
  );
}
