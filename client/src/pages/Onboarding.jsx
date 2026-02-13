import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userAPI } from '../api';
import Spinner from '../components/Spinner';
import { logo } from '@/assets';
import { logo } from '@/assets';

const JOURNALING_GOALS = [
  { id: 'track-mood',       label: 'Track my mood',         icon: '📊' },
  { id: 'process-thoughts', label: 'Process my thoughts',   icon: '💭' },
  { id: 'gratitude',        label: 'Practice gratitude',    icon: '🙏' },
  { id: 'self-growth',      label: 'Personal growth',       icon: '🌱' },
  { id: 'creativity',       label: 'Boost creativity',      icon: '✦' },
  { id: 'stress-relief',    label: 'Manage stress',         icon: '🌊' },
  { id: 'memory',           label: 'Preserve memories',     icon: '📸' },
  { id: 'clarity',          label: 'Gain clarity',          icon: '⚡' },
];

const GENDERS = [
  { value: 'male',               label: 'Male' },
  { value: 'female',             label: 'Female' },
  { value: 'non-binary',         label: 'Non-binary' },
  { value: 'prefer-not-to-say',  label: 'Prefer not to say' },
];

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: user?.displayName || user?.username || '',
    dateOfBirth: '',
    gender: '',
    journalingGoals: [],
  });

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const toggleGoal = (id) => {
    setForm((f) => ({
      ...f,
      journalingGoals: f.journalingGoals.includes(id)
        ? f.journalingGoals.filter((g) => g !== id)
        : [...f.journalingGoals, id],
    }));
  };

  const handleFinish = async () => {
    if (!form.displayName.trim()) {
      toast.error('Please enter your name first');
      setStep(2);
      return;
    }
    setSaving(true);
    try {
      await userAPI.completeOnboarding(form);
      await refreshUser();
      toast.success(`Welcome to ArcJournal, ${form.displayName}! 🎉`);
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="grid-bg"
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '30%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(106,228,255,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 500 }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: i < step ? 'var(--accent)' : 'var(--border)',
                  transition: 'background 0.3s ease',
                  boxShadow: i < step ? '0 0 6px var(--accent-dim)' : 'none',
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
            STEP {step} OF {TOTAL_STEPS}
          </p>
        </div>

        <div className="card" style={{ padding: 40 }}>
          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <StepWelcome name={user?.username} onNext={next} />
          )}

          {/* ── STEP 2: Name ── */}
          {step === 2 && (
            <StepName
              value={form.displayName}
              onChange={(v) => setForm((f) => ({ ...f, displayName: v }))}
              onNext={() => {
                if (!form.displayName.trim()) { toast.error('Please enter your name'); return; }
                next();
              }}
              onBack={back}
            />
          )}

          {/* ── STEP 3: DOB + Gender ── */}
          {step === 3 && (
            <StepProfile
              form={form}
              onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
              onNext={next}
              onBack={back}
            />
          )}

          {/* ── STEP 4: Goals ── */}
          {step === 4 && (
            <StepGoals
              goals={form.journalingGoals}
              onToggle={toggleGoal}
              onFinish={handleFinish}
              onBack={back}
              saving={saving}
            />
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--muted)', opacity: 0.45, letterSpacing: '0.05em' }}>
          Part of the ArcNode Network
        </p>
      </div>
    </div>
  );
}

/* ── Step components ── */

function StepWelcome({ name, onNext }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <img src={logo} alt="ArcNode" style={{ height: 52, marginBottom: 20 }} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>
        Welcome to <span style={{ color: 'var(--accent)' }}>ArcJournal</span>
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
        Hey <strong style={{ color: 'var(--text)' }}>{name}</strong>! Before you start journaling,
        let's personalise your experience. It'll only take a moment.
      </p>
      <div style={{
        display: 'flex', gap: 24, justifyContent: 'center',
        marginBottom: 36, flexWrap: 'wrap',
      }}>
        {[
          { icon: '📖', text: 'Daily entries' },
          { icon: '✦', text: 'AI summaries' },
          { icon: '🎂', text: 'Birthday tracking' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{text}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={onNext} style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}>
        Let's get started →
      </button>
    </div>
  );
}

function StepName({ value, onChange, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
        What should we call you?
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
        This is how ArcJournal will greet you every day.
      </p>

      <div style={{ marginBottom: 32 }}>
        <label>Your name</label>
        <input
          type="text"
          placeholder="e.g. Alex"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onNext()}
          autoFocus
          style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600 }}
        />
        {value && (
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)' }}>
            ✓ Hi, {value}! That's a great name.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
        <button className="btn btn-primary" onClick={onNext} style={{ flex: 2, justifyContent: 'center' }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepProfile({ form, onChange, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
        A little about you
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
        We'll use this to celebrate your birthday and personalise your journal.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
        <div>
          <label>Date of birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            style={{ colorScheme: 'dark' }}
          />
          {form.dateOfBirth && (
            <p style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
              🎂 We'll wish you a happy birthday!
            </p>
          )}
        </div>

        <div>
          <label>Gender <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--muted)', letterSpacing: 0 }}>(optional)</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GENDERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange('gender', form.gender === value ? '' : value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${form.gender === value ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.gender === value ? 'var(--accent-glow)' : 'transparent',
                  color: form.gender === value ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
        <button className="btn btn-primary" onClick={onNext} style={{ flex: 2, justifyContent: 'center' }}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function StepGoals({ goals, onToggle, onFinish, onBack, saving }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
        Why do you want to journal?
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        Pick whatever resonates. This helps us tailor your ArcWrapped summaries.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 32 }}>
        {JOURNALING_GOALS.map(({ id, label, icon }) => {
          const selected = goals.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                background: selected ? 'var(--accent-glow)' : 'transparent',
                color: selected ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left',
                boxShadow: selected ? '0 0 10px var(--accent-glow)' : 'none',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={onFinish}
          disabled={saving}
          style={{ flex: 2, justifyContent: 'center' }}
        >
          {saving ? <Spinner size={16} color="#0B1020" /> : "Let's go! 🎉"}
        </button>
      </div>
    </div>
  );
}
