import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userAPI } from '../api';
import { clearToken } from '../api';
import { getUserAge } from '../utils/birthday';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { logo } from '@/assets';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState({
    username: user?.username || '',
    displayName: user?.displayName || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
  });

  const age = profile.dateOfBirth ? getUserAge(profile.dateOfBirth) : null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userAPI.updateProfile(profile);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteEntries = async () => {
    setLoading(true);
    try {
      await userAPI.deleteAllEntries();
      setModal(null);
      toast.success('All entries deleted');
    } catch {
      toast.error('Failed to delete entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await userAPI.deleteAccount();
      await clearToken();
      setModal(null);
      navigate('/signin');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 600 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Settings</h1>

      {/* Profile */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Profile</h2>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Email cannot be changed</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Display Name</label>
              <input type="text" value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Your name" />
            </div>
            <div>
              <label>Username</label>
              <input type="text" value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                placeholder="username" />
            </div>
          </div>

          <div>
            <label>Date of Birth</label>
            <input type="date" value={profile.dateOfBirth}
              onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'dark' }} />
            {age !== null && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>🎂 Age: {age}</p>
            )}
          </div>

          <div>
            <label>Gender <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--muted)' }}>(optional)</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {GENDERS.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => setProfile((p) => ({ ...p, gender: p.gender === value ? '' : value }))}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${profile.gender === value ? 'var(--accent)' : 'var(--border)'}`,
                    background: profile.gender === value ? 'var(--accent-glow)' : 'transparent',
                    color: profile.gender === value ? 'var(--accent)' : 'var(--muted)',
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>
            {savingProfile ? <Spinner size={14} color="#0B1020" /> : 'Save Profile'}
          </button>
        </form>
      </section>

      {/* About */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>About ArcJournal</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src={logo} alt="ArcNode" style={{ height: 32 }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>ArcJournal v{__APP_VERSION__}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Part of the ArcNode Network</p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section style={{
        background: 'rgba(255,92,122,0.04)',
        border: '1px solid rgba(255,92,122,0.2)',
        borderRadius: 'var(--radius)',
        padding: 24,
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--error)', marginBottom: 20 }}>
          Danger Zone
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Delete all entries</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Permanently remove all journal entries. Cannot be undone.</p>
            </div>
            <button className="btn btn-danger" style={{ flexShrink: 0 }} onClick={() => setModal('deleteEntries')}>
              Delete Entries
            </button>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Delete account</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Permanently delete your account and all data. Cannot be undone.</p>
            </div>
            <button className="btn btn-danger" style={{ flexShrink: 0 }} onClick={() => setModal('deleteAccount')}>
              Delete Account
            </button>
          </div>
        </div>
      </section>

      <Modal isOpen={modal === 'deleteEntries'} title="Delete All Entries?"
        message="This will permanently delete all your journal entries. Your account and ArcWrapped summaries remain."
        confirmLabel="Yes, Delete All Entries" confirmDanger
        onConfirm={handleDeleteEntries} onCancel={() => setModal(null)} />

      <Modal isOpen={modal === 'deleteAccount'} title="Delete Your Account?"
        message="This will permanently delete your account AND all associated entries and ArcWrapped summaries. There is no going back."
        confirmLabel="Yes, Delete My Account" confirmDanger
        onConfirm={handleDeleteAccount} onCancel={() => setModal(null)} />
    </div>
  );
}
