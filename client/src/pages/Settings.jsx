import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userAPI, errorMessage } from '../api';
import { useVault } from '../context/VaultContext';
import LegacyLinkCard from '../components/LegacyLinkCard';
import { PassphraseFields, passphraseProblem, RecoveryKeyCard } from './Vault';
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

  const vault = useVault();
  const [security, setSecurity] = useState({ current: '', value: '', confirm: '', error: '', busy: false });
  const [newKey, setNewKey] = useState('');

  const [profile, setProfile] = useState({
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
      toast.error(errorMessage(err, 'Failed to update profile'));
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
      setModal(null);
      await logout();
      navigate('/signin');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const runSecurity = async (fn) => {
    setSecurity((s) => ({ ...s, error: '', busy: true }));
    try {
      await fn();
      setSecurity({ current: '', value: '', confirm: '', error: '', busy: false });
    } catch (err) {
      setSecurity((s) => ({ ...s, error: errorMessage(err), busy: false }));
    }
  };

  const handleChangePassphrase = (e) => {
    e?.preventDefault();
    const problem = passphraseProblem(security.value, security.confirm);
    if (problem) { setSecurity((s) => ({ ...s, error: problem })); return; }
    runSecurity(async () => {
      await vault.changePassphrase(security.current, security.value);
      setModal(null);
      toast.success('Passphrase changed');
    });
  };

  const handleNewRecoveryKey = (e) => {
    e?.preventDefault();
    runSecurity(async () => setNewKey(await vault.newRecoveryKey(security.current)));
  };

  const closeSecurity = () => {
    setModal(null); setNewKey('');
    setSecurity({ current: '', value: '', confirm: '', error: '', busy: false });
  };

  return (
    <div className="page">
      <div className="page-inner" style={{ '--page-max': '1120px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Settings</h1>

      <div className="columns">

      {/* Profile */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Profile</h2>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Display Name</label>
            <input type="text" value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Your name" maxLength={60} />
          </div>

          <div>
            <label>Date of Birth</label>
            <input type="date" value={profile.dateOfBirth}
              onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'dark' }} />
            {age !== null && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>🎂 Age: {age}</p>
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
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
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

      {/* Encryption */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Encryption</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
          Your entries are encrypted on this computer before they are saved. Only your passphrase or recovery key can open them.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setModal('passphrase')}>Change passphrase</button>
          <button className="btn btn-ghost" onClick={() => setModal('recovery')}>New recovery key</button>
          <button className="btn btn-ghost" onClick={vault.lock}>Lock now</button>
        </div>
      </section>

      {/* Account */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Arcnode account</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Signed in{user?.email ? <> as <strong style={{ color: 'var(--text)' }}>{user.email}</strong></> : ''}.
          Your email, password and two-factor settings live at{' '}
          <a href="https://backboard.arcnode.dev/account" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>backboard.arcnode.dev</a>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <LegacyLinkCard onLinked={() => vault.retry()} />
          <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={async () => { await logout(); navigate('/signin'); }}>
            Sign out
          </button>
        </div>
      </section>

      {/* About */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>About ArcJournal</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src={logo} alt="Arcnode" style={{ height: 32 }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>ArcJournal v{__APP_VERSION__}</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Part of Arcnode</p>
            {window.electronAPI?.updates && (
              <button className="btn btn-ghost" style={{ marginTop: 10, padding: '4px 12px', fontSize: 13 }}
                onClick={async () => {
                  await window.electronAPI.updates.check();
                  toast.info('Checking for updates. A banner appears when one is out.');
                }}>
                Check for updates
              </button>
            )}
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
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Permanently remove all journal entries. Cannot be undone.</p>
            </div>
            <button className="btn btn-danger" style={{ flexShrink: 0 }} onClick={() => setModal('deleteEntries')}>
              Delete Entries
            </button>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Delete account</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Permanently delete your account and all data. Cannot be undone.</p>
            </div>
            <button className="btn btn-danger" style={{ flexShrink: 0 }} onClick={() => setModal('deleteAccount')}>
              Delete Account
            </button>
          </div>
        </div>
      </section>
      </div>
      </div>

      <Modal isOpen={modal === 'deleteEntries'} title="Delete All Entries?"
        message="This permanently deletes all your journal entries. Your account stays."
        confirmLabel="Yes, Delete All Entries" confirmDanger
        onConfirm={handleDeleteEntries} onCancel={() => setModal(null)} />

      <Modal isOpen={modal === 'deleteAccount'} title="Delete Your Account?"
        message="This permanently deletes your ArcJournal account and every entry. Your Arcnode account stays. There is no going back."
        confirmLabel="Yes, Delete My Account" confirmDanger
        onConfirm={handleDeleteAccount} onCancel={() => setModal(null)} />

      {modal === 'passphrase' && (
        <Modal isOpen title="Change passphrase" confirmLabel={security.busy ? 'Saving…' : 'Change passphrase'}
          onConfirm={handleChangePassphrase} onCancel={closeSecurity}>
          <form onSubmit={handleChangePassphrase} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="current-passphrase">Current passphrase</label>
              <input id="current-passphrase" type="password" value={security.current} autoComplete="current-password"
                onChange={(e) => setSecurity((s) => ({ ...s, current: e.target.value }))} />
            </div>
            <PassphraseFields value={security.value} confirm={security.confirm} label="New passphrase"
              onValue={(v) => setSecurity((s) => ({ ...s, value: v }))}
              onConfirm={(v) => setSecurity((s) => ({ ...s, confirm: v }))} />
            {security.error && <p style={{ color: 'var(--error)', fontSize: 14 }}>{security.error}</p>}
            <button type="submit" hidden />
          </form>
        </Modal>
      )}

      {modal === 'recovery' && (
        <Modal isOpen title={newKey ? 'Your new recovery key' : 'New recovery key'}
          message={newKey ? 'Save it now. Your old recovery key no longer works.' : 'Your current recovery key stops working. Enter your passphrase to continue.'}
          confirmLabel={newKey ? 'I saved it' : security.busy ? 'Creating…' : 'Create new key'}
          onConfirm={newKey ? closeSecurity : handleNewRecoveryKey} onCancel={closeSecurity}>
          {newKey ? <RecoveryKeyCard recoveryKey={newKey} /> : (
            <form onSubmit={handleNewRecoveryKey}>
              <label htmlFor="recovery-passphrase">Passphrase</label>
              <input id="recovery-passphrase" type="password" value={security.current} autoComplete="current-password"
                onChange={(e) => setSecurity((s) => ({ ...s, current: e.target.value }))} />
              {security.error && <p style={{ color: 'var(--error)', fontSize: 14, marginTop: 8 }}>{security.error}</p>}
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
