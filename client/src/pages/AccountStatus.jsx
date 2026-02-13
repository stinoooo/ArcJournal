import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { logo } from '@/assets';

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AccountStatus() {
  const { user, logout } = useAuth();
  const [appeal, setAppeal]     = useState(null);
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState('');

  const isSuspended  = user?.status === 'suspended';
  const isTerminated = user?.status === 'terminated' || user?.status === 'deleted';
  const canAppeal    = isSuspended || (user?.status === 'terminated');

  useEffect(() => {
    api.get('/appeals/mine').then(({ data }) => {
      if (data.appeal) setAppeal(data.appeal);
    }).catch(() => {});
  }, []);

  async function submitAppeal() {
    setError('');
    if (message.trim().length < 10) { setError('Please write a more detailed message.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/appeals', { message });
      setAppeal(data.appeal);
      setSubmitted(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit appeal. Please try again.');
    } finally { setLoading(false); }
  }

  const config = isSuspended ? {
    icon: '⏸',
    color: '#f59e0b',
    title: 'Your account has been suspended',
    subtitle: user?.statusExpiry
      ? `This suspension is in effect until ${formatDate(user.statusExpiry)}.`
      : 'This suspension is permanent until reviewed.',
  } : {
    icon: '🚫',
    color: '#ef4444',
    title: 'Your account has been terminated',
    subtitle: user?.statusExpiry
      ? `This termination is in effect until ${formatDate(user.statusExpiry)}.`
      : 'This action is permanent.',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logo} alt="ArcNode" style={{ height: 32, marginBottom: 8 }} />
        </div>

        {/* Status card */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${config.color}44`, borderRadius: 14, padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${config.color}22`, border: `1px solid ${config.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {config.icon}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: config.color }}>{config.title}</h2>
            </div>
          </div>

          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
            {config.subtitle}
          </p>

          {user?.statusReason && (
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>REASON</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{user.statusReason}</div>
            </div>
          )}

          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            If you believe this action was made in error, you can submit an appeal below.
          </div>
        </div>

        {/* Appeal section */}
        {canAppeal && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontFamily: 'var(--font-display)' }}>Appeal this decision</h3>

            {appeal ? (
              <div>
                {appeal.status === 'pending' && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Appeal submitted</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Your appeal is being reviewed. You'll be notified of any changes.</div>
                  </div>
                )}
                {appeal.status === 'approved' && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>Appeal approved</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                      {appeal.adminResponse || 'Your account has been restored.'}
                    </div>
                    <button onClick={() => window.location.reload()} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                      Continue to ArcJournal
                    </button>
                  </div>
                )}
                {appeal.status === 'denied' && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>❌</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Appeal denied</div>
                    {appeal.adminResponse && (
                      <div style={{ fontSize: 13, color: 'var(--muted)', background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                        {appeal.adminResponse}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Appeal submitted successfully</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>We'll review your case as soon as possible.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Explain why you believe this moderation action was applied incorrectly. Be specific and honest — this helps us review your case faster.
                </p>
                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  rows={5} placeholder="Describe your situation and why you believe this was a mistake…"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, resize: 'vertical', lineHeight: 1.6 }}
                />
                {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
                <button onClick={submitAppeal} disabled={loading} style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1,
                }}>
                  {loading ? 'Submitting…' : 'Submit Appeal'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}