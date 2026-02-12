import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          className="fade-in"
          style={{
            pointerEvents: 'all',
            cursor: 'pointer',
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface2)',
            border: `1px solid ${
              t.type === 'success' ? 'rgba(61,255,181,0.3)'
              : t.type === 'error' ? 'rgba(255,92,122,0.3)'
              : 'var(--border)'
            }`,
            color: t.type === 'success' ? 'var(--success)'
              : t.type === 'error' ? 'var(--error)'
              : 'var(--text)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            maxWidth: 320,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
