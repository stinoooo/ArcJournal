import React from 'react';
import { logo } from '@/assets';

// The centered, logo-topped card used by sign-in and the journal lock screens.
export default function CenteredCard({ subtitle = 'Your daily reflection space', maxWidth = 440, children }) {
  return (
    <div className="grid-bg" style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      overflowY: 'auto',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(106,228,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth, margin: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logo} alt="" style={{ height: 48, marginBottom: 12 }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Arc<span style={{ color: 'var(--accent)' }}>Journal</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{subtitle}</p>
        </div>

        <div className="card" style={{ padding: 36 }}>{children}</div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)', opacity: 0.8, letterSpacing: '0.04em' }}>
          Part of Arcnode
        </p>
      </div>
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div role="alert" style={{
      background: 'var(--error-glow)',
      border: '1px solid rgba(255,92,122,0.3)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 14px',
      color: 'var(--error)',
      fontSize: 14,
    }}>
      {children}
    </div>
  );
}
