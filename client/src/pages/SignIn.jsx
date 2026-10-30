import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';
import Spinner from '../components/Spinner';
import CenteredCard, { ErrorNote } from '../components/CenteredCard';

export default function SignIn() {
  const { signIn, offline, refreshUser } = useAuth();
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    setWaiting(true);
    try {
      await signIn();
    } catch (err) {
      setError(errorMessage(err, 'Sign-in did not finish. Try again.'));
    } finally {
      setWaiting(false);
    }
  };

  if (offline) {
    return (
      <CenteredCard>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>You're offline</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
          ArcJournal needs a connection to open your journal. You're still signed in.
        </p>
        <button className="btn btn-primary" onClick={refreshUser} style={{ width: '100%', justifyContent: 'center' }}>
          Try again
        </button>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        Use your Arcnode account. Your browser opens to sign in, then you come right back here.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ErrorNote>{error}</ErrorNote>
        <button className="btn btn-primary" onClick={handleSignIn} disabled={waiting} style={{ width: '100%', justifyContent: 'center' }}>
          {waiting ? <><Spinner size={16} color="#0B1020" /> Waiting for your browser…</> : 'Sign in with Arcnode'}
        </button>
        {waiting && (
          <button className="btn btn-ghost" onClick={() => window.electronAPI.auth.cancel()} style={{ width: '100%', justifyContent: 'center' }}>
            Cancel
          </button>
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
        No account?{' '}
        <a href="https://backboard.arcnode.dev/signup" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Create an Arcnode account
        </a>
      </p>
    </CenteredCard>
  );
}
