import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../api';
import Spinner from './Spinner';
import CenteredCard, { ErrorNote } from './CenteredCard';

const SKIPPED = 'arcjournal-link-later';

export function useLinkPrompt() {
  const { session } = useAuth();
  const [skipped, setSkipped] = useState(() => sessionStorage.getItem(SKIPPED) === '1');
  const skip = () => { sessionStorage.setItem(SKIPPED, '1'); setSkipped(true); };
  return { show: session === 'password' && !skipped, skip };
}

export function LinkArcnodeButton({ label = 'Connect Arcnode account', onLinked, style }) {
  const { linkArcnode } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const link = async () => {
    setError(''); setBusy(true);
    try {
      await linkArcnode();
      toast.success('Your Arcnode account is connected. Sign in with Arcnode from now on.');
      onLinked?.();
    } catch (err) {
      setError(errorMessage(err, 'Connecting did not finish. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ErrorNote>{error}</ErrorNote>
      <button className="btn btn-primary" onClick={link} disabled={busy} style={{ justifyContent: 'center', ...style }}>
        {busy ? <><Spinner size={16} color="#0B1020" /> Waiting for your browser…</> : label}
      </button>
    </div>
  );
}

/** Shown after a 1.x password sign-in until the account is linked or the user picks "Not now". */
export default function LinkArcnodePrompt({ onSkip }) {
  const { user } = useAuth();
  return (
    <CenteredCard subtitle={user?.displayName ? `Welcome back, ${user.displayName}` : 'Welcome back'} maxWidth={460}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Connect your Arcnode account
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
        ArcJournal now signs in with an Arcnode account, with passkeys and two-factor authentication.
        Connect one to this journal: your browser opens to sign in or create an account.
      </p>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
        Your entries stay exactly as they are. After connecting, you sign in with Arcnode and your old
        ArcJournal password stops working. Until then, it keeps working.
      </p>
      <LinkArcnodeButton style={{ width: '100%' }} />
      <button type="button" onClick={onSkip}
        style={{ marginTop: 16, width: '100%', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>
        Not now
      </button>
    </CenteredCard>
  );
}
