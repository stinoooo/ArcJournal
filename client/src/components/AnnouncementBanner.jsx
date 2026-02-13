import { useState, useEffect } from 'react';
import api from '../api';

const TYPE_STYLES = {
  info:        { bg: '#1a2a3a', border: '#3b82f6', icon: 'ℹ️', label: 'Info' },
  warning:     { bg: '#2a1f0e', border: '#f59e0b', icon: '⚠️', label: 'Notice' },
  maintenance: { bg: '#1a1626', border: '#8b5cf6', icon: '🔧', label: 'Maintenance' },
  feature:     { bg: '#0f2219', border: '#10b981', icon: '✨', label: "What's New" },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements]   = useState([]);
  const [dismissed, setDismissed]           = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    api.get('/announcements')
      .then(({ data }) => setAnnouncements(data.announcements))
      .catch(() => {});
  }, []);

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    try { sessionStorage.setItem('dismissed_announcements', JSON.stringify(next)); } catch {}
  }

  const visible = announcements.filter(a => !dismissed.includes(a._id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {visible.map(a => {
        const s = TYPE_STYLES[a.type] || TYPE_STYLES.info;
        return (
          <div key={a._id} style={{ background: s.bg, borderBottom: `1px solid ${s.border}44`, padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 10, minHeight: 38 }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.border, letterSpacing: '0.08em', fontFamily: 'var(--font-display)', minWidth: 'max-content' }}>{s.label.toUpperCase()}</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
              <strong>{a.title}</strong>
              {a.message && a.message !== a.title && ` — ${a.message}`}
            </span>
            {a.dismissible && (
              <button onClick={() => dismiss(a._id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px', opacity: 0.6 }}
                onMouseEnter={e => e.target.style.opacity = 1}
                onMouseLeave={e => e.target.style.opacity = 0.6}
              >✕</button>
            )}
          </div>
        );
      })}
    </div>
  );
}