import { useState } from 'react';
import api from '../api';

const SEVERITY_CONFIG = {
  notice:  { color: '#3b82f6', bg: '#1a2a3a', border: '#3b82f6', icon: 'ℹ️', label: 'Notice',  title: 'A notice has been placed on your account' },
  warning: { color: '#f59e0b', bg: '#2a1f0e', border: '#f59e0b', icon: '⚠️', label: 'Warning', title: 'You have received a warning' },
  severe:  { color: '#ef4444', bg: '#2a0e0e', border: '#ef4444', icon: '🚨', label: 'Severe Warning', title: 'A severe warning has been issued to your account' },
};

export default function WarningModal({ warnings, onDismiss }) {
  const [index, setIndex]   = useState(0);
  const [loading, setLoading] = useState(false);

  if (!warnings?.length) return null;

  const warning = warnings[index];
  const sc      = SEVERITY_CONFIG[warning.severity] || SEVERITY_CONFIG.warning;
  const isLast  = index === warnings.length - 1;

  async function acknowledge() {
    setLoading(true);
    try {
      await api.post(`/warnings/${warning._id}/acknowledge`);
      if (isLast) {
        onDismiss();
      } else {
        setIndex(i => i + 1);
      }
    } catch {
      // even if it fails, let the user proceed
      if (isLast) onDismiss(); else setIndex(i => i + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 460, maxWidth: '95vw', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: `0 0 60px ${sc.color}30` }}>

        {/* Top accent bar */}
        <div style={{ height: 4, background: sc.color, opacity: 0.8 }} />

        <div style={{ padding: 28 }}>
          {/* Counter */}
          {warnings.length > 1 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, letterSpacing: '0.06em' }}>
              WARNING {index + 1} OF {warnings.length}
            </div>
          )}

          {/* Icon + Title */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${sc.color}22`, border: `1px solid ${sc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {sc.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: sc.color, letterSpacing: '0.1em', marginBottom: 4 }}>{sc.label.toUpperCase()}</div>
              <h2 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>{sc.title}</h2>
            </div>
          </div>

          {/* Reason */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>REASON</div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{warning.reason}</div>
          </div>

          {/* Footer note */}
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {warning.severity === 'severe'
              ? 'This is a serious violation. Further infractions may result in your account being suspended or terminated.'
              : warning.severity === 'warning'
              ? 'Please review our Community Guidelines to avoid further warnings. Repeated violations may lead to account restrictions.'
              : 'This is an informational notice. No immediate action is required.'}
          </p>

          {/* Date */}
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
            Issued on {new Date(warning.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* CTA */}
          <button onClick={acknowledge} disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${sc.color}`,
            background: `${sc.color}22`, color: sc.color, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-display)', opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
          }}>
            {loading ? 'Confirming…' : isLast ? 'I understand — Continue to ArcJournal' : `I understand — Next (${warnings.length - index - 1} more)`}
          </button>
        </div>
      </div>
    </div>
  );
}