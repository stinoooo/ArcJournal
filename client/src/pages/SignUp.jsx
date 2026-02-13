import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import { logo } from '@/assets';

export default function SignUp() {
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.username || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(form.email, form.username, form.password);
      toast.success('Account created! Welcome to ArcJournal.');
      navigate('/app');
    } catch (err) {
      const msg = err.response?.data?.error || 'Sign up failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-bg" style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(106,228,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src={logo} alt="ArcNode" style={{ height: 48, marginBottom: 12 }} />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}>
            Arc<span style={{ color: 'var(--accent)' }}>Journal</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Start your journaling journey</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            Create Account
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div>
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="yourname"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {form.password.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: form.password.length >= (i + 1) * 2
                        ? form.password.length >= 10 ? 'var(--success)'
                          : form.password.length >= 8 ? 'var(--accent)'
                          : 'var(--error)'
                        : 'var(--border)',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{
                background: 'var(--error-glow)',
                border: '1px solid rgba(255,92,122,0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: 'var(--error)',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? <Spinner size={16} color="#0B1020" /> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/signin" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--muted)', opacity: 0.5, letterSpacing: '0.04em' }}>
          Part of the ArcNode Network
        </p>
      </div>
    </div>
  );
}
