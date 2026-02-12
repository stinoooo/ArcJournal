import React from 'react';

// Local PNG emotion assets from assets/emotions/
// Place these files in: assets/emotions/{name}.png
// AND copy them to: client/public/emotions/{name}.png
export const EMOTIONS = [
  { name: 'happy',       label: 'Happy',       color: '#FFD166' },
  { name: 'loved',       label: 'Loved',       color: '#FF6B9D' },
  { name: 'confident',   label: 'Confident',   color: '#3DFFB5' },
  { name: 'playful',     label: 'Playful',     color: '#6AE4FF' },
  { name: 'embarrassed', label: 'Embarrassed', color: '#FF9F7A' },
  { name: 'sad',         label: 'Sad',         color: '#7A9CFF' },
  { name: 'scared',      label: 'Scared',      color: '#B07AFF' },
  { name: 'angry',       label: 'Angry',       color: '#FF5C7A' },
];

export function emotionImageSrc(name) {
  return `emotions/${name}.png`;
}

export function emotionLabel(name) {
  return EMOTIONS.find((e) => e.name === name)?.label ?? name;
}

export function emotionColor(name) {
  return EMOTIONS.find((e) => e.name === name)?.color ?? 'var(--accent)';
}

export default function EmojiPicker({ value, onChange }) {
  return (
    <div>
      <label>How Are You Feeling?</label>
      {/* Outer container — defines the boundary, no overflow */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 10,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            width: '100%',
          }}
        >
          {EMOTIONS.map(({ name, label, color }) => {
            const isSelected = value === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                title={label}
                style={{
                  /* Critical: stay inside grid cell */
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 4,
                  padding: '8px 4px 6px',
                  width: '100%',
                  minWidth: 0,           /* prevent flex/grid blowout */
                  overflow: 'hidden',    /* clip anything that escapes */
                  boxSizing: 'border-box',
                  background: isSelected ? `${color}18` : 'transparent',
                  border: `1.5px solid ${isSelected ? color : 'var(--border)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? `0 0 10px ${color}28` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }
                }}
              >
                {/* Image wrapper — fully contained */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <img
                    src={emotionImageSrc(name)}
                    alt={label}
                    style={{
                      width: '72%',
                      height: '72%',
                      objectFit: 'contain',
                      display: 'block',
                      filter: isSelected ? 'none' : 'grayscale(20%) opacity(0.7)',
                      transition: 'filter 0.15s, transform 0.15s',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.parentNode.querySelector('.emotion-fallback');
                      if (fb) fb.style.display = 'block';
                    }}
                  />
                  <span
                    className="emotion-fallback"
                    style={{ display: 'none', fontSize: 22, lineHeight: 1 }}
                  >
                    {fallbackEmoji(name)}
                  </span>
                </div>

                {/* Label — clipped, never overflows */}
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    color: isSelected ? color : 'var(--muted)',
                    transition: 'color 0.15s',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function fallbackEmoji(name) {
  const map = {
    happy: '😊', loved: '🥰', confident: '💪', playful: '😄',
    embarrassed: '😳', sad: '😢', scared: '😨', angry: '😠',
  };
  return map[name] ?? '😊';
}

