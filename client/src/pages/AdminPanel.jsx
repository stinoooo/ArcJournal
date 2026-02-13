import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

// ── Constants ─────────────────────────────────────────────────
const PRESET_REASONS = [
  'Inappropriate content in journal entries',
  'Harassment or abusive behaviour toward other users',
  'Spam or promotional activity',
  'Impersonation of another person or entity',
  'Multiple account abuse',
  'Suspicious or compromised account activity',
  'Violation of Terms of Service',
  'Custom reason…',
];

const WARN_REASONS = [
  'Language or tone in shared content',
  'Repeated minor policy violations',
  'Suspicious activity on account',
  'Spam or repeated duplicate entries',
  'Inappropriate username or display name',
  'Custom reason…',
];

const STATUS_CONFIG = {
  active:     { color: '#10b981', bg: '#10b98120', label: 'Active',     icon: '●' },
  suspended:  { color: '#f59e0b', bg: '#f59e0b20', label: 'Suspended',  icon: '⏸' },
  terminated: { color: '#ef4444', bg: '#ef444420', label: 'Terminated', icon: '🚫' },
  deleted:    { color: '#6b7280', bg: '#6b728020', label: 'Deleted',    icon: '🗑' },
};

const SEVERITY_CONFIG = {
  notice:  { color: '#3b82f6', bg: '#3b82f620', label: 'Notice',  icon: 'ℹ' },
  warning: { color: '#f59e0b', bg: '#f59e0b20', label: 'Warning', icon: '⚠' },
  severe:  { color: '#ef4444', bg: '#ef444420', label: 'Severe',  icon: '🔴' },
};

const TYPE_COLORS = {
  info:        { bg: '#1a2a3a', border: '#3b82f6', icon: 'ℹ️' },
  warning:     { bg: '#2a1f0e', border: '#f59e0b', icon: '⚠️' },
  maintenance: { bg: '#1a1626', border: '#8b5cf6', icon: '🔧' },
  feature:     { bg: '#0f2219', border: '#10b981', icon: '✨' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtNum(n) {
  if (n == null) return '—';
  return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'var(--accent)', icon }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
        {icon && <span style={{ fontSize: 16, opacity: 0.5 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{fmtNum(value)}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────
function MiniBar({ data, color = 'var(--accent)' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {data.map((d, i) => (
        <div key={i} title={`${d._id}: ${d.count}`} style={{
          flex: 1, background: color, borderRadius: 2, opacity: 0.8,
          height: `${Math.max(4, (d.count / max) * 100)}%`,
          transition: 'height 0.3s',
        }} />
      ))}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────
function OverviewTab() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--muted)', padding: '40px 0', textAlign: 'center' }}>Loading…</div>;
  if (!data)   return <div style={{ color: '#ef4444' }}>Failed to load overview.</div>;

  const { users, content, moderation, charts } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Users section */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>USERS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          <StatCard label="Total" value={users.totalUsers} icon="👤" color="var(--text)" />
          <StatCard label="Active" value={users.activeUsers} icon="●" color="#10b981" sub={`${Math.round(users.activeUsers/users.totalUsers*100)}% of total`} />
          <StatCard label="Suspended" value={users.suspendedUsers} icon="⏸" color="#f59e0b" />
          <StatCard label="Terminated" value={users.terminatedUsers} icon="🚫" color="#ef4444" />
          <StatCard label="New today" value={users.newToday} icon="↑" color="var(--accent)" />
          <StatCard label="New this week" value={users.newThisWeek} icon="📈" color="var(--accent)" />
          <StatCard label="New this month" value={users.newThisMonth} icon="🗓" color="var(--accent)" />
          <StatCard label="Admins" value={users.adminUsers} icon="🛡" color="#7c3aed" />
        </div>
      </div>

      {/* Signup chart */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 12 }}>SIGNUPS — LAST 14 DAYS</div>
        <MiniBar data={charts.signups} color="var(--accent)" />
        {charts.signups.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>No signups in this period.</div>}
      </div>

      {/* Content & moderation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>CONTENT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatCard label="Total entries" value={content.totalEntries} icon="📖" color="var(--text)" />
            <StatCard label="Entries this week" value={content.entriesThisWeek} icon="✍" color="var(--accent)" />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>MODERATION</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatCard label="Pending appeals" value={moderation.pendingAppeals} icon="⚖️" color={moderation.pendingAppeals > 0 ? '#f59e0b' : 'var(--muted)'} />
            <StatCard label="Warnings issued" value={moderation.totalWarnings} icon="⚠️" color="var(--text)" sub={`${moderation.unackWarnings} unacknowledged`} />
          </div>
        </div>
      </div>

      {/* Entry chart */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 12 }}>ENTRIES — LAST 14 DAYS</div>
        <MiniBar data={charts.entries} color="#10b981" />
        {charts.entries.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>No entries in this period.</div>}
      </div>
    </div>
  );
}

// ── User detail drawer ────────────────────────────────────────
function UserDrawer({ userId, onClose, onAction }) {
  const [data, setData]       = useState(null);
  const [statsData, setStats] = useState(null);
  const [tab, setTab]         = useState('overview');
  const [loading, setLoading] = useState(true);
  const [action, setAction]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState('');

  // Action form state
  const [reasonIdx, setReasonIdx]   = useState(0);
  const [customReason, setCReason]  = useState('');
  const [note, setNote]             = useState('');
  const [duration, setDuration]     = useState('permanent');
  const [expiry, setExpiry]         = useState('');
  // Warning form
  const [warnSev, setWarnSev]       = useState('warning');
  const [warnRIdx, setWarnRIdx]     = useState(0);
  const [warnCustom, setWarnCustom] = useState('');
  const [warnNote, setWarnNote]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, statsRes] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get(`/admin/users/${userId}/stats`),
      ]);
      setData(userRes.data);
      setStats(statsRes.data);
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const user = data?.user;
  const status = user ? STATUS_CONFIG[user.status] : null;

  async function doAction() {
    setActionError('');
    const isCustomR = PRESET_REASONS[reasonIdx] === 'Custom reason…';
    const reason    = isCustomR ? customReason : PRESET_REASONS[reasonIdx];
    const isCustomW = WARN_REASONS[warnRIdx] === 'Custom reason…';
    const wReason   = isCustomW ? warnCustom : WARN_REASONS[warnRIdx];

    if (action !== 'restore' && action !== 'warn' && !reason.trim()) { setActionError('Reason required'); return; }
    if (action === 'warn' && !wReason.trim()) { setActionError('Reason required'); return; }
    if (duration === 'temporary' && !expiry && ['suspend','terminate'].includes(action)) { setActionError('Pick an expiry date'); return; }
    if (['delete','purge'].includes(action) && !window.confirm(`Are you sure? This cannot be undone.`)) return;

    setActionLoading(true);
    try {
      const exp = duration === 'temporary' ? expiry : null;
      if (action === 'suspend')   await api.post(`/admin/users/${userId}/suspend`,   { reason, note, expiry: exp });
      if (action === 'terminate') await api.post(`/admin/users/${userId}/terminate`, { reason, note, expiry: exp });
      if (action === 'restore')   await api.post(`/admin/users/${userId}/restore`,   { note });
      if (action === 'delete')    await api.delete(`/admin/users/${userId}`,          { data: { reason, note } });
      if (action === 'purge')     await api.delete(`/admin/users/${userId}/purge`);
      if (action === 'warn')      await api.post(`/admin/users/${userId}/warn`,       { severity: warnSev, reason: wReason, note: warnNote });
      setAction(null); load(); onAction?.();
    } catch (e) { setActionError(e.response?.data?.error || 'Action failed'); }
    finally { setActionLoading(false); }
  }

  async function rescindWarning(wid) {
    if (!window.confirm('Rescind this warning?')) return;
    try { await api.delete(`/admin/users/${userId}/warnings/${wid}`); load(); }
    catch { alert('Failed'); }
  }

  const ACTIONS = [
    { key: 'warn',      label: 'Warn',        color: '#3b82f6', icon: '⚠' },
    { key: 'suspend',   label: 'Suspend',      color: '#f59e0b', icon: '⏸' },
    { key: 'terminate', label: 'Terminate',    color: '#ef4444', icon: '🚫' },
    { key: 'restore',   label: 'Restore',      color: '#10b981', icon: '✓'  },
    { key: 'delete',    label: 'Delete Data',  color: '#6b7280', icon: '🗑' },
    { key: 'purge',     label: 'Purge All',    color: '#dc2626', icon: '💀' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
      {/* Drawer */}
      <div onClick={e => e.stopPropagation()} style={{ width: 560, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-display)' }}>User Detail</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
        ) : !user ? (
          <div style={{ padding: 24, color: '#ef4444' }}>User not found.</div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* User header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-glow)', border: `2px solid ${status?.color || 'var(--accent)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {(user.displayName || user.username)[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{user.displayName || user.username}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>@{user.username} · {user.email}</div>
                </div>
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: status?.bg, color: status?.color, fontWeight: 600 }}>
                  {status?.icon} {status?.label}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 12 }}>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Joined</div>
                  <div style={{ fontWeight: 600 }}>{fmtDate(user.createdAt)}</div>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Entries</div>
                  <div style={{ fontWeight: 600 }}>{data.entryCount}</div>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Warnings</div>
                  <div style={{ fontWeight: 600, color: data.warningCount > 0 ? '#f59e0b' : 'var(--text)' }}>{data.warningCount}</div>
                </div>
              </div>
              {user.statusReason && (
                <div style={{ marginTop: 10, background: `${status?.color}15`, border: `1px solid ${status?.color}40`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text)' }}>
                  <strong>Reason:</strong> {user.statusReason}
                  {user.statusExpiry && <span style={{ marginLeft: 8, color: 'var(--muted)' }}>Until {fmtDate(user.statusExpiry)}</span>}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0 }}>
              {['overview','warnings','history','actions'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 13, color: tab === t ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                  marginBottom: -1, textTransform: 'capitalize', fontFamily: 'var(--font-display)',
                }}>{t}</button>
              ))}
            </div>

            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {statsData?.stats ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <StatCard label="Total entries" value={statsData.stats.totalEntries} icon="📖" />
                        <StatCard label="Days journaled" value={statsData.stats.daysJournaled} icon="🗓" />
                        <StatCard label="Total words" value={statsData.stats.totalWords} icon="✍" />
                        <StatCard label="Avg grade" value={statsData.stats.avgGrade} icon="⭐" color="#f59e0b" />
                        <StatCard label="Current streak" value={`${statsData.stats.currentStreak}d`} icon="🔥" color="#f59e0b" />
                        <StatCard label="Longest streak" value={`${statsData.stats.longestStreak}d`} icon="🏆" color="#f59e0b" />
                      </div>
                      <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
                        <div style={{ color: 'var(--muted)', marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>ACTIVITY</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span>First entry: <strong>{fmtDate(statsData.stats.firstEntryDate)}</strong></span>
                          <span>Last entry: <strong>{fmtDate(statsData.stats.lastEntryDate)}</strong></span>
                          {statsData.stats.topMood && <span>Top mood: <strong>{statsData.stats.topMood}</strong></span>}
                        </div>
                      </div>
                      {statsData.stats.monthlyActivity?.length > 0 && (
                        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>MONTHLY ACTIVITY</div>
                          <MiniBar data={statsData.stats.monthlyActivity.map(m => ({ _id: m.month, count: m.count }))} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '30px 0' }}>No journal activity yet.</div>
                  )}
                </div>
              )}

              {/* WARNINGS */}
              {tab === 'warnings' && (
                <div>
                  {!statsData?.warnings?.length ? (
                    <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '30px 0' }}>No warnings issued.</div>
                  ) : statsData.warnings.map(w => {
                    const sc = SEVERITY_CONFIG[w.severity];
                    return (
                      <div key={w._id} style={{ background: 'var(--bg)', border: `1px solid ${sc.color}40`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 700 }}>{sc.icon} {sc.label}</span>
                            {w.acknowledged
                              ? <span style={{ fontSize: 11, color: 'var(--muted)' }}>✓ Acknowledged</span>
                              : <span style={{ fontSize: 11, color: '#f59e0b' }}>⏳ Pending</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(w.createdAt)}</span>
                            <button onClick={() => rescindWarning(w._id)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: 'none', background: '#ef444422', color: '#ef4444', cursor: 'pointer' }}>Rescind</button>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text)' }}>{w.reason}</div>
                        {w.note && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Note: {w.note}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* HISTORY */}
              {tab === 'history' && (
                <div>
                  {!user.statusHistory?.length ? (
                    <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '30px 0' }}>No moderation history.</div>
                  ) : [...user.statusHistory].reverse().map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ textTransform: 'capitalize' }}>{h.action}</strong>
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(h.at)}</span>
                        </div>
                        {h.reason && <div style={{ color: 'var(--text)' }}>{h.reason}</div>}
                        {h.expiry && <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>Until: {fmtDate(h.expiry)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTIONS */}
              {tab === 'actions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ACTIONS.map(a => (
                      <button key={a.key} onClick={() => { setAction(action === a.key ? null : a.key); setActionError(''); }} style={{
                        padding: '8px 14px', borderRadius: 8, border: `1px solid ${action === a.key ? a.color : 'var(--border)'}`,
                        background: action === a.key ? `${a.color}22` : 'transparent', color: a.color,
                        cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span>{a.icon}</span> {a.label}
                      </button>
                    ))}
                  </div>

                  {action && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Warning-specific form */}
                      {action === 'warn' && (
                        <>
                          <div>
                            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Severity</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {['notice','warning','severe'].map(s => (
                                <button key={s} onClick={() => setWarnSev(s)} style={{
                                  padding: '6px 14px', borderRadius: 8, border: `1px solid ${warnSev===s ? SEVERITY_CONFIG[s].color : 'var(--border)'}`,
                                  background: warnSev===s ? SEVERITY_CONFIG[s].bg : 'transparent',
                                  color: warnSev===s ? SEVERITY_CONFIG[s].color : 'var(--muted)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
                                }}>{SEVERITY_CONFIG[s].icon} {s}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Reason</label>
                            <select value={warnRIdx} onChange={e => setWarnRIdx(Number(e.target.value))} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}>
                              {WARN_REASONS.map((r,i) => <option key={i} value={i}>{r}</option>)}
                            </select>
                            {WARN_REASONS[warnRIdx] === 'Custom reason…' && (
                              <input type="text" value={warnCustom} onChange={e => setWarnCustom(e.target.value)} placeholder="Enter reason…"
                                style={{ marginTop: 8, width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
                              />
                            )}
                          </div>
                          <div>
                            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Internal note</label>
                            <input type="text" value={warnNote} onChange={e => setWarnNote(e.target.value)} placeholder="Optional…"
                              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
                            />
                          </div>
                        </>
                      )}

                      {/* Standard action form (suspend/terminate/delete) */}
                      {['suspend','terminate','delete'].includes(action) && (
                        <>
                          <div>
                            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Reason (shown to user)</label>
                            <select value={reasonIdx} onChange={e => setReasonIdx(Number(e.target.value))} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}>
                              {PRESET_REASONS.map((r,i) => <option key={i} value={i}>{r}</option>)}
                            </select>
                            {PRESET_REASONS[reasonIdx] === 'Custom reason…' && (
                              <input type="text" value={customReason} onChange={e => setCReason(e.target.value)} placeholder="Enter reason…"
                                style={{ marginTop: 8, width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
                              />
                            )}
                          </div>
                          {['suspend','terminate'].includes(action) && (
                            <div>
                              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Duration</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {['permanent','temporary'].map(t => (
                                  <button key={t} onClick={() => setDuration(t)} style={{
                                    padding: '6px 14px', borderRadius: 8, border: `1px solid ${duration===t ? 'var(--accent)' : 'var(--border)'}`,
                                    background: duration===t ? 'var(--accent-glow)' : 'transparent',
                                    color: duration===t ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
                                  }}>{t}</button>
                                ))}
                              </div>
                              {duration === 'temporary' && (
                                <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} min={new Date().toISOString().split('T')[0]}
                                  style={{ marginTop: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {!['warn','suspend','terminate','delete'].includes(action) && action !== 'restore' && null}

                      {/* Internal note for everything */}
                      {action !== 'warn' && (
                        <div>
                          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Internal note</label>
                          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Optional…"
                            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        </div>
                      )}

                      {actionError && <div style={{ color: '#ef4444', fontSize: 13 }}>{actionError}</div>}

                      <button onClick={doAction} disabled={actionLoading} style={{
                        padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: ACTIONS.find(a=>a.key===action)?.color, color: '#fff',
                        fontWeight: 600, fontSize: 14, opacity: actionLoading ? 0.6 : 1,
                      }}>
                        {actionLoading ? 'Processing…' : `Confirm — ${ACTIONS.find(a=>a.key===action)?.label}`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, limit: 50 });
      if (statusF) q.set('status', statusF);
      const { data } = await api.get(`/admin/users?${q}`);
      setUsers(data.users);
    } finally { setLoading(false); }
  }, [search, statusF]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search username, email, display name…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 14 }}
        />
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: statusF ? 'var(--text)' : 'var(--muted)', fontSize: 13 }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {users.map(u => {
            const sc = STATUS_CONFIG[u.status];
            return (
              <div key={u._id} onClick={() => setSelected(u._id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-glow)', border: `1px solid ${sc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {(u.displayName || u.username)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.displayName || u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>@{u.username} · {u.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {u.role === 'admin' && <span style={{ fontSize: 11, background: '#7c3aed22', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, border: '1px solid #7c3aed' }}>Admin</span>}
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(u.createdAt)}</span>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No users found.</div>}
        </div>
      )}

      {selected && <UserDrawer userId={selected} onClose={() => setSelected(null)} onAction={load} />}
    </div>
  );
}

// ── Appeals tab ───────────────────────────────────────────────
function AppealsTab() {
  const [appeals, setAppeals] = useState([]);
  const [filter, setFilter]   = useState('pending');
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [response, setResponse]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get(`/admin/appeals?status=${filter}`); setAppeals(data.appeals); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function respond(id, decision) {
    try { await api.post(`/admin/appeals/${id}/respond`, { decision, adminResponse: response }); setResponding(null); setResponse(''); load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending','approved','denied'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 16px', borderRadius: 8, border: `1px solid ${filter===s ? 'var(--accent)' : 'var(--border)'}`,
            background: filter===s ? 'var(--accent-glow)' : 'transparent', color: filter===s ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>
      {loading ? <div style={{ color: 'var(--muted)' }}>Loading…</div> : appeals.length === 0
        ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No {filter} appeals.</div>
        : appeals.map(a => (
          <div key={a._id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontWeight: 600 }}>@{a.userId?.username || 'deleted'}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{a.type}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.createdAt)}</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6 }}>{a.message}</p>
            {a.adminResponse && <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}><strong>Response:</strong> {a.adminResponse}</div>}
            {a.status === 'pending' && (responding === a._id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea value={response} onChange={e => setResponse(e.target.value)} rows={2} placeholder="Response…"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => respond(a._id, 'approved')} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Approve & Restore</button>
                  <button onClick={() => respond(a._id, 'denied')}   style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Deny</button>
                  <button onClick={() => setResponding(null)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setResponding(a._id); setResponse(''); }} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-glow)', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Respond</button>
            ))}
          </div>
        ))}
    </div>
  );
}

// ── Announcements tab ─────────────────────────────────────────
function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', dismissible: true, expiresAt: '' });

  const load = async () => { setLoading(true); try { const { data } = await api.get('/admin/announcements'); setAnnouncements(data.announcements); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.title || !form.message) return;
    try { await api.post('/admin/announcements', { ...form, expiresAt: form.expiresAt || null }); setForm({ title: '', message: '', type: 'info', dismissible: true, expiresAt: '' }); setCreating(false); load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
  }

  async function toggle(a) { try { await api.put(`/admin/announcements/${a._id}`, { ...a, active: !a.active }); load(); } catch { alert('Failed'); } }
  async function del(id)    { if (!window.confirm('Delete?')) return; try { await api.delete(`/admin/announcements/${id}`); load(); } catch { alert('Failed'); } }

  return (
    <div>
      <button onClick={() => setCreating(c => !c)} style={{ marginBottom: 20, padding: '8px 18px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-glow)', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
        {creating ? '✕ Cancel' : '+ New Announcement'}
      </button>
      {creating && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }} />
          <textarea rows={3} placeholder="Message…" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 13 }}>
              {['info','warning','maintenance','feature'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text)', fontSize: 13 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.dismissible} onChange={e => setForm(f => ({ ...f, dismissible: e.target.checked }))} /> Dismissible
            </label>
          </div>
          <button onClick={create} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, alignSelf: 'flex-start' }}>Publish</button>
        </div>
      )}
      {loading ? <div style={{ color: 'var(--muted)' }}>Loading…</div> : announcements.length === 0
        ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>No announcements yet.</div>
        : announcements.map(a => {
          const tc = TYPE_COLORS[a.type] || TYPE_COLORS.info;
          return (
            <div key={a._id} style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 10, padding: 16, marginBottom: 10, opacity: a.active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{tc.icon}</span>
                  <strong style={{ fontSize: 14 }}>{a.title}</strong>
                  <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface)', padding: '2px 8px', borderRadius: 20 }}>{a.type}</span>
                  {!a.active && <span style={{ fontSize: 11, color: '#ef4444' }}>Inactive</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggle(a)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>{a.active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => del(a._id)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ef444433', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>{a.message}</p>
              {a.expiresAt && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>Expires {fmtDate(a.expiresAt)}</div>}
            </div>
          );
        })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState('overview');

  const TABS = [
    { key: 'overview',       label: 'Overview',       icon: '◎' },
    { key: 'users',          label: 'Users',           icon: '👤' },
    { key: 'appeals',        label: 'Appeals',         icon: '⚖️' },
    { key: 'announcements',  label: 'Announcements',   icon: '📢' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Panel header */}
      <div style={{ padding: '28px 40px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, background: '#7c3aed22', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, border: '1px solid #7c3aed', fontWeight: 700, letterSpacing: '0.06em' }}>ADMIN</span>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-display)' }}>Control Panel</h1>
        </div>
        <p style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: 14 }}>Manage users, moderation, and platform settings.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13,
              color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
              borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1, fontFamily: 'var(--font-display)', fontWeight: tab === t.key ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px', maxWidth: 960 }}>
        {tab === 'overview'      && <OverviewTab />}
        {tab === 'users'         && <UsersTab />}
        {tab === 'appeals'       && <AppealsTab />}
        {tab === 'announcements' && <AnnouncementsTab />}
      </div>
    </div>
  );
}