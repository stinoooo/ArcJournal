import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userAPI, errorMessage } from '../api';
import Spinner from './Spinner';
import { ErrorNote } from './CenteredCard';

/**
 * ArcJournal 1.x had its own accounts. This brings an old journal into the
 * Arcnode account once; the app encrypts the old entries the next time the
 * journal is unlocked.
 */
export default function LegacyLinkCard({ onLinked }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { data } = await userAPI.linkLegacy(identifier, password);
      setUser(data.user);
      toast.success(data.legacyEntries
        ? `Brought over ${data.legacyEntries} ${data.legacyEntries === 1 ? 'entry' : 'entries'}. They are encrypted when you unlock your journal.`
        : 'Your old account is linked.');
      setOpen(false); setPassword('');
      onLinked?.(data.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)} style={{ width: '100%', justifyContent: 'center' }}>
        Used ArcJournal before? Bring your old journal
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
        Sign in with your old ArcJournal email or username and password, once. Your entries, settings and
        standing move into this Arcnode account and the old account is closed.
      </p>
      <div>
        <label htmlFor="legacy-identifier">Old email or username</label>
        <input id="legacy-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" />
      </div>
      <div>
        <label htmlFor="legacy-password">Old password</label>
        <input id="legacy-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy || !identifier || !password} style={{ flex: 1, justifyContent: 'center' }}>
          {busy ? <Spinner size={14} color="#0B1020" /> : 'Bring my journal over'}
        </button>
      </div>
    </form>
  );
}
