import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isTodayBirthday, getUserDisplayName } from '../utils/birthday';
import { logo } from '@/assets';

const NAV_ITEMS = [
  { to: '/app',          label: 'Today',    icon: '✦', end: true },
  { to: '/app/journal',  label: 'Journal',  icon: '📖' },
  { to: '/app/stats',    label: 'Stats',    icon: '◎'  },
  { to: '/app/settings', label: 'Settings', icon: '⚙'  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const toast            = useToast();
  const navigate         = useNavigate();

  const isBirthday  = isTodayBirthday(user?.dateOfBirth);
  const displayName = getUserDisplayName(user);
  const isAdmin     = user?.role === 'admin';

  const handleLogout = async () => { await logout(); toast.info('Logged out'); navigate('/signin'); };

  const linkStyle = (isActive, color = 'var(--accent)') => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: 14,
    fontFamily: 'var(--font-display)', fontWeight: 500, transition: 'all var(--transition)',
    color: isActive ? color : 'var(--muted)',
    background: isActive ? (color === 'var(--accent)' ? 'var(--accent-glow)' : `${color}22`) : 'transparent',
    border: `1px solid ${isActive ? color : 'transparent'}`,
  });

  return (
    <nav style={{ width: 220, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 4 }}>
      {/* Logo */}
      <div style={{ paddingLeft: 8, paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        <img src={logo} alt="ArcNode" style={{ height: 28, display: 'block', marginBottom: 6 }} />
        <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>ARCJOURNAL</span>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => linkStyle(isActive)}>
            <span style={{ width: 16, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* Account Standing — always visible */}
        <NavLink to="/app/account-standing" style={({ isActive }) => ({ ...linkStyle(isActive), marginTop: 4 })}>
          <span style={{ width: 16, textAlign: 'center' }}>🛡</span>
          Standing
        </NavLink>

        {/* Admin — only for admins */}
        {isAdmin && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            <NavLink to="/app/admin" style={({ isActive }) => linkStyle(isActive, '#7c3aed')}>
              <span style={{ width: 16, textAlign: 'center' }}>⚙</span>
              Admin Panel
            </NavLink>
          </>
        )}
      </div>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
            {displayName[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isBirthday ? `🎂 ${displayName}` : displayName}
            </div>
            {isAdmin && <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.06em' }}>ADMIN</div>}
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-display)', textAlign: 'left', transition: 'all var(--transition)' }}
          onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'var(--text)'; }}
          onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border)'; }}
        >Sign out</button>
      </div>
    </nav>
  );
}