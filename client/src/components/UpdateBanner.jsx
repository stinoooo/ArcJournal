import React, { useEffect, useState } from 'react';

// Updates download by themselves. Once one is ready, this offers to restart
// into it (or, for Linux packages, to install it). When an update cannot be
// applied automatically, the button opens the release page.
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

  let text = `ArcJournal ${update.version} is available.`;
  let button = 'Download';
  if (update.status === 'downloading') {
    text = `Downloading ArcJournal ${update.version}${update.percent ? ` (${update.percent}%)` : ''}…`;
    button = null;
  } else if (update.ready) {
    text = `ArcJournal ${update.version} is ready.`;
    button = update.action === 'install' ? 'Install update' : 'Restart to update';
  }

  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', fontSize: 13,
      background: 'var(--success-glow)', borderBottom: '1px solid var(--border)', color: 'var(--text)',
    }}>
      <span style={{ flex: 1 }}>{text}</span>
      {button && (
        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => updates.install()}>
          {button}
        </button>
      )}
      <button onClick={() => setDismissed(true)} aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  );
}
