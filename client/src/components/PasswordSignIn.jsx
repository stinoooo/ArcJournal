import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';
import Spinner from './Spinner';
import { ErrorNote } from './CenteredCard';

// ArcJournal 1.x accounts keep their password until they link an Arcnode account.
export default function PasswordSignIn() {
  const { signInWithPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await signInWithPassword(identifier, password);
    } catch (err) {
      setError(errorMessage(err, 'Sign-in failed. Try again.'));
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)} style={{ width: '100%', justifyContent: 'center' }}>
        Sign in with your ArcJournal 1.x password
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
        Accounts made before ArcJournal 2.0 still work with their password until you connect an Arcnode account.
      </p>
      <div>
        <label htmlFor="password-identifier">Email or username</label>
        <input id="password-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" autoFocus />
      </div>
      <div>
        <label htmlFor="password-password">Password</label>
        <input id="password-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy || !identifier || !password} style={{ flex: 1, justifyContent: 'center' }}>
          {busy ? <Spinner size={14} color="#0B1020" /> : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
