import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_CONFIG = {
  active:     { color: '#3DFFB5', label: 'Good Standing',  icon: '✓', description: 'Your account is in good standing. Keep up the great work.' },
  suspended:  { color: '#f59e0b', label: 'Suspended',      icon: '⏸', description: 'Your account has been temporarily suspended.' },
  terminated: { color: '#FF5C7A', label: 'Terminated',     icon: '✕', description: 'Your account has been terminated.' },
  deleted:    { color: '#9AA6C2', label: 'Deleted',         icon: '🗑', description: 'This account has been deleted.' },
};

const SEVERITY_CONFIG = {
  notice:  { color: '#6AE4FF', label: 'Notice',         icon: 'ℹ' },
  warning: { color: '#f59e0b', label: 'Warning',        icon: '⚠' },
  severe:  { color: '#FF5C7A', label: 'Severe Warning', icon: '🚨' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function StandingBar({ warnings }) {
  const severe   = warnings.filter(w => w.severity === 'severe').length;
  const standard = warnings.filter(w => w.severity === 'warning').length;
  const notices  = warnings.filter(w => w.severity === 'notice').length;
  const score    = notices * 1 + standard * 3 + severe * 10;
  const pct      = Math.max(0, 100 - Math.min(100, score));
  const color    = pct >= 80 ? '#3DFFB5' : pct >= 50 ? '#f59e0b' : '#FF5C7A';
  const label    = pct >= 80 ? 'Good' : pct >= 50 ? 'Fair' : 'Poor';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', margin: 0 }}>
          Standing Score
        </label>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color }}>{label}</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
      {warnings.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {severe   > 0 && <span style={{ fontSize: 12, background: 'rgba(255,92,122,0.12)', color: '#FF5C7A', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,92,122,0.25)' }}>🚨 {severe} severe</span>}
          {standard > 0 && <span style={{ fontSize: 12, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.25)' }}>⚠ {standard} warning{standard !== 1 ? 's' : ''}</span>}
          {notices  > 0 && <span style={{ fontSize: 12, background: 'rgba(106,228,255,0.1)',  color: '#6AE4FF', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>ℹ {notices} notice{notices !== 1 ? 's' : ''}</span>}
        </div>
      )}
    </div>
  );
}

export default function AccountStanding() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState([]);
  const [appeal,   setAppeal  ] = useState(null);
  const [loading,  setLoading ] = useState(true);

  const statusKey = user?.status || 'active';
  const status    = STATUS_CONFIG[statusKey] || STATUS_CONFIG.active;

  useEffect(() => {
    Promise.all([
      api.get('/warnings'),
      api.get('/appeals/mine'),
    ])
      .then(([wRes, aRes]) => {
        setWarnings(wRes.data.warnings || []);
        setAppeal(aRes.data.appeal || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 600 }}>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
        Account Standing
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
        Your moderation history and account health.
      </p>

      {loading ? (
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          {/* Status */}
          <section className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: `${status.color}18`, border: `1.5px solid ${status.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, fontWeight: 700, color: status.color,
              }}>
                {status.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: status.color }}>
                  {status.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{status.description}</div>
              </div>
            </div>

            {user?.statusReason && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Reason
                </label>
                <p style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>{user.statusReason}</p>
                {user.statusExpiry && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Until {fmtDate(user.statusExpiry)}</p>
                )}
              </div>
            )}
          </section>

          {/* Standing meter */}
          <section className="card" style={{ marginBottom: 20 }}>
            <StandingBar warnings={warnings} />
          </section>

          {/* Appeal status — only if one exists */}
          {appeal && (
            <section className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Appeal</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: appeal.adminResponse ? 12 : 0 }}>
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                  background: appeal.status === 'pending'  ? 'rgba(245,158,11,0.12)'  : appeal.status === 'approved' ? 'rgba(61,255,181,0.1)' : 'rgba(255,92,122,0.12)',
                  color:      appeal.status === 'pending'  ? '#f59e0b'                : appeal.status === 'approved' ? '#3DFFB5'              : '#FF5C7A',
                  border:     `1px solid ${appeal.status === 'pending' ? 'rgba(245,158,11,0.25)' : appeal.status === 'approved' ? 'rgba(61,255,181,0.25)' : 'rgba(255,92,122,0.25)'}`,
                }}>
                  {appeal.status === 'pending' ? '⏳ Under Review' : appeal.status === 'approved' ? '✓ Approved' : '✕ Denied'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Submitted {fmtDate(appeal.createdAt)}</span>
              </div>
              {appeal.adminResponse && (
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--text)' }}>Admin response: </strong>{appeal.adminResponse}
                </div>
              )}
            </section>
          )}

          {/* Warning history */}
          <section className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              Warning History
              {warnings.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>
                  {warnings.length} total
                </span>
              )}
            </h2>

            {warnings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🏆</div>
                <p style={{ fontSize: 13, margin: 0 }}>No warnings on your account.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {warnings.map(w => {
                  const sc = SEVERITY_CONFIG[w.severity] || SEVERITY_CONFIG.warning;
                  return (
                    <div key={w._id} style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      opacity: w.acknowledged ? 0.65 : 1,
                    }}>
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{sc.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: sc.color, fontFamily: 'var(--font-display)' }}>
                            {sc.label}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{fmtDate(w.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{w.reason}</p>
                        {w.acknowledged && (
                          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, margin: '4px 0 0' }}>
                            Acknowledged {fmtDate(w.acknowledgedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Info footer */}
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, textAlign: 'center' }}>
            If you believe a moderation action was made in error, you can submit an appeal from the Account Status page.
          </p>
        </>
      )}
    </div>
  );
}