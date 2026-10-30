import React, { useEffect, useState } from 'react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, sealedEntriesAPI } from '../api';
import Spinner from '../components/Spinner';
import CenteredCard, { ErrorNote } from '../components/CenteredCard';

export const MIN_PASSPHRASE = 10;

const heading = { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 };
const lead = { color: 'var(--muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 };
const form = { display: 'flex', flexDirection: 'column', gap: 16 };
const wide = { width: '100%', justifyContent: 'center' };
const linkButton = { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, padding: 0 };

function KeepUnlocked({ checked, onChange }) {
  const { canRemember } = useVault();
  if (!canRemember) return null;
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
      <input type="checkbox" aria-label="Keep my journal unlocked on this computer" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 'auto', marginTop: 2 }} />
      <span>
        Keep my journal unlocked on this computer
        <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
          The key is stored in your system keychain. Anyone using this account on this computer can read your journal.
        </span>
      </span>
    </label>
  );
}

export function PassphraseFields({ value, confirm, onValue, onConfirm, label = 'Passphrase' }) {
  return (
    <>
      <div>
        <label htmlFor="passphrase">{label}</label>
        <input id="passphrase" type="password" value={value} onChange={(e) => onValue(e.target.value)} autoComplete="new-password" autoFocus />
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          At least {MIN_PASSPHRASE} characters. A few unrelated words are easy to remember and hard to guess.
        </p>
      </div>
      <div>
        <label htmlFor="passphrase-confirm">Type it again</label>
        <input id="passphrase-confirm" type="password" value={confirm} onChange={(e) => onConfirm(e.target.value)} autoComplete="new-password" />
      </div>
    </>
  );
}

export function passphraseProblem(value, confirm) {
  if (value.length < MIN_PASSPHRASE) return `Use at least ${MIN_PASSPHRASE} characters`;
  if (value !== confirm) return 'The two passphrases do not match';
  return '';
}

export function RecoveryKeyCard({ recoveryKey }) {
  const toast = useToast();
  const copy = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    toast.success('Recovery key copied');
  };
  const save = () => {
    const text = `ArcJournal recovery key\n\n${recoveryKey}\n\nKeep this somewhere safe. It opens your journal if you forget your passphrase.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'ArcJournal recovery key.txt' });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <code style={{
        display: 'block', padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--bg)',
        border: '1px solid var(--accent-dim)', color: 'var(--accent)', fontSize: 15, lineHeight: 1.7,
        letterSpacing: '0.06em', wordSpacing: '0.2em', textAlign: 'center', userSelect: 'all',
      }}>
        {recoveryKey}
      </code>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={copy} style={{ flex: 1, justifyContent: 'center' }}>Copy</button>
        <button type="button" className="btn btn-ghost" onClick={save} style={{ flex: 1, justifyContent: 'center' }}>Save as file</button>
      </div>
    </div>
  );
}

function Setup() {
  const { setup } = useVault();
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [saved, setSaved] = useState(false);
  const [legacyCount, setLegacyCount] = useState(0);

  useEffect(() => {
    sealedEntriesAPI.list()
      .then((r) => setLegacyCount(r.data.entries.filter((e) => e.legacy).length))
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const problem = passphraseProblem(value, confirm);
    if (problem) { setError(problem); return; }
    setError(''); setBusy(true);
    try {
      setCreated(await setup(value, keep));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <CenteredCard subtitle="One last step" maxWidth={480}>
        <h2 style={heading}>Save your recovery key</h2>
        <p style={lead}>
          If you ever forget your passphrase, this key is the only way back into your journal.
          Write it down or store it in a password manager. You will not see it again.
        </p>
        <div style={form}>
          <RecoveryKeyCard recoveryKey={created.recoveryKey} />
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
            <input type="checkbox" aria-label="I saved my recovery key somewhere safe" checked={saved} onChange={(e) => setSaved(e.target.checked)} style={{ width: 'auto' }} />
            I saved my recovery key somewhere safe
          </label>
          <button className="btn btn-primary" disabled={!saved} onClick={created.finish} style={wide}>Open my journal</button>
        </div>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard subtitle="Private by design" maxWidth={460}>
      <h2 style={heading}>Lock your journal</h2>
      <p style={lead}>
        ArcJournal encrypts every entry on this computer before it is saved. Choose a passphrase to unlock it.
        Nobody else, not even Arcnode, can read your journal or reset this passphrase.
      </p>
      {legacyCount > 0 && (
        <p style={{ ...lead, marginTop: -12, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 14 }}>
          Your {legacyCount} existing {legacyCount === 1 ? 'entry is' : 'entries are'} encrypted right after this. First, a full
          unencrypted backup is saved to <strong style={{ color: 'var(--text)' }}>Documents/ArcJournal backups</strong> on this computer,
          and every entry is checked after encrypting before its old copy is replaced.
        </p>
      )}
      <form onSubmit={submit} style={form}>
        <PassphraseFields value={value} confirm={confirm} onValue={setValue} onConfirm={setConfirm} />
        <KeepUnlocked checked={keep} onChange={setKeep} />
        <ErrorNote>{error}</ErrorNote>
        <button type="submit" className="btn btn-primary" disabled={busy} style={wide}>
          {busy ? <Spinner size={16} color="#0B1020" /> : 'Encrypt my journal'}
        </button>
      </form>
    </CenteredCard>
  );
}

function Unlock() {
  const { unlock, recover, reset } = useVault();
  const { user, logout } = useAuth();
  const [mode, setMode] = useState('unlock'); // unlock | recover | reset
  const [passphrase, setPassphrase] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [typed, setTyped] = useState('');
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const switchTo = (next) => { setMode(next); setError(''); };

  if (mode === 'recover') {
    return (
      <CenteredCard subtitle="Recover your journal" maxWidth={460}>
        <h2 style={heading}>Use your recovery key</h2>
        <p style={lead}>Enter the recovery key you saved when you set up encryption, then choose a new passphrase.</p>
        <form style={form} onSubmit={(e) => {
          e.preventDefault();
          const problem = passphraseProblem(value, confirm);
          if (problem) { setError(problem); return; }
          run(() => recover(recoveryKey, value));
        }}>
          <div>
            <label htmlFor="recovery-key">Recovery key</label>
            <input id="recovery-key" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-…" autoComplete="off" spellCheck={false} autoFocus />
          </div>
          <PassphraseFields value={value} confirm={confirm} onValue={setValue} onConfirm={setConfirm} label="New passphrase" />
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" className="btn btn-primary" disabled={busy} style={wide}>
            {busy ? <Spinner size={16} color="#0B1020" /> : 'Unlock and set passphrase'}
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" style={linkButton} onClick={() => switchTo('unlock')}>Back</button>
            <button type="button" style={{ ...linkButton, color: 'var(--muted)' }} onClick={() => switchTo('reset')}>Lost the recovery key too?</button>
          </div>
        </form>
      </CenteredCard>
    );
  }

  if (mode === 'reset') {
    const phrase = 'DELETE MY JOURNAL';
    return (
      <CenteredCard subtitle="Start over" maxWidth={460}>
        <h2 style={{ ...heading, color: 'var(--error)' }}>Delete your journal and start over</h2>
        <p style={lead}>
          Without your passphrase or recovery key, nobody can decrypt your entries, including Arcnode.
          Starting over permanently deletes every entry so you can set up a new passphrase.
        </p>
        <form style={form} onSubmit={(e) => { e.preventDefault(); run(reset); }}>
          <div>
            <label htmlFor="reset-confirm">Type {phrase} to confirm</label>
            <input id="reset-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <button type="submit" className="btn btn-danger" disabled={busy || typed !== phrase} style={wide}>
            {busy ? <Spinner size={16} /> : 'Delete my journal'}
          </button>
          <button type="button" style={linkButton} onClick={() => switchTo('unlock')}>Cancel</button>
        </form>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard subtitle={user?.displayName ? `Welcome back, ${user.displayName}` : 'Welcome back'}>
      <h2 style={heading}>Unlock your journal</h2>
      <p style={lead}>Your entries are encrypted. Enter your passphrase to open them.</p>
      <form style={form} onSubmit={(e) => { e.preventDefault(); run(() => unlock(passphrase, keep)); }}>
        <div>
          <label htmlFor="unlock-passphrase">Passphrase</label>
          <input id="unlock-passphrase" type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="current-password" autoFocus />
        </div>
        <KeepUnlocked checked={keep} onChange={setKeep} />
        <ErrorNote>{error}</ErrorNote>
        <button type="submit" className="btn btn-primary" disabled={busy || !passphrase} style={wide}>
          {busy ? <Spinner size={16} color="#0B1020" /> : 'Unlock'}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" style={linkButton} onClick={() => switchTo('recover')}>Forgot your passphrase?</button>
          <button type="button" style={{ ...linkButton, color: 'var(--muted)' }} onClick={logout}>Sign out</button>
        </div>
      </form>
    </CenteredCard>
  );
}

export default function Vault() {
  const { state, retry } = useVault();
  if (state === 'setup') return <Setup />;
  if (state === 'locked') return <Unlock />;
  if (state === 'error') {
    return (
      <CenteredCard>
        <h2 style={heading}>Could not load your journal</h2>
        <p style={lead}>Check your connection and try again.</p>
        <button className="btn btn-primary" onClick={retry} style={wide}>Try again</button>
      </CenteredCard>
    );
  }
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={32} />
    </div>
  );
}
