import React, { useEffect, useState } from 'react';

// A new version is out. On Windows it already downloaded and applies on restart;
// elsewhere the button opens the release page.
export default function UpdateBanner() {
  const updates = window.electronAPI?.updates;
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!updates) return undefined;
    updates.current().then((u) => u && setUpdate(u));
    return updates.onAvailable(setUpdate);
  }, [updates]);

  if (!update || dismissed) return null;
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', fontSize: 13,
      background: 'var(--success-glow)', borderBottom: '1px solid var(--border)', color: 'var(--text)',
    }}>
      <span style={{ flex: 1 }}>
        ArcJournal {update.version} is {update.ready ? 'ready to install' : 'available'}.
      </span>
      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => updates.install()}>
        {update.ready ? 'Restart to update' : 'Download'}
      </button>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  );
}
