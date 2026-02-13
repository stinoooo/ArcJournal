import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isTodayBirthday, getUserDisplayName } from '../utils/birthday';
import { logo } from '@/assets';

const NAV_ITEMS = [
  { to: '/app',          label: 'Today',    icon: '✦'  },
  { to: '/app/journal',  label: 'Journal',  icon: '📖' },
  { to: '/app/stats',    label: 'Stats',    icon: '◎'  },
  { to: '/app/settings', label: 'Settings', icon: '⚙'  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isBirthday = isTodayBirthday(user?.dateOfBirth);
  const displayName = getUserDisplayName(user);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out');
    navigate('/signin');
  };

  return (
    <nav style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      gap: 4,
    }}>
      {/* Logo */}
      <div style={{ paddingLeft: 8, paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        <img src={logo} alt="ArcNode" style={{ height: 28, display: 'block', marginBottom: 6 }} />
        <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>
          ARCJOURNAL
        </span>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: 14,
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              transition: 'all var(--transition)',
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--accent-dim)' : 'transparent'}`,
            })}
          >
            <span style={{ fontSize: 16, minWidth: 20, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>

      {/* User info + Logout */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {user && (
          <div style={{ padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                {displayName}
              </div>
              {isBirthday && (
                <img src="birthday.png" alt="🎂"
                  style={{ width: 16, height: 16, objectFit: 'contain' }}
                  title="Happy Birthday!"
                  onError={(e) => { e.currentTarget.replaceWith(document.createTextNode('🎂')); }}
                />
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{user.email}</div>
            {isBirthday && (
              <div style={{ fontSize: 11, color: '#FFD166', marginTop: 3, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                Happy Birthday! 🎂
              </div>
            )}
          </div>
        )}
        <button
          className="btn btn-ghost"
          onClick={handleLogout}
          style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
        >
          Sign Out
        </button>
        <p style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 12, letterSpacing: '0.04em', opacity: 0.6 }}>
          Part of the ArcNode Network
        </p>
      </div>
    </nav>
  );
}
