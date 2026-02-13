import React from 'react';
import { logo } from '@/assets';

export default function Modal({ isOpen, title, message, confirmLabel = 'Confirm', confirmDanger = false, onConfirm, onCancel, children }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(11, 16, 32, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        className="card fade-in"
        style={{ width: '100%', maxWidth: 420, boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          {title}
        </h3>
        {message && (
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>{message}</p>
        )}
        {children}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: children ? 16 : 0 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${confirmDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
