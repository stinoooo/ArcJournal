import React, { useState } from 'react';
import { logo } from '@/assets';

export default function TitleBar() {
  const isElectron = !!window.electronAPI;
  const [hovered, setHovered] = useState(null);

  const controls = [
    { id: 'close',    color: '#FF5C7A', icon: '×', action: () => window.electronAPI?.close()    },
    { id: 'minimize', color: '#FFC46B', icon: '–', action: () => window.electronAPI?.minimize() },
    { id: 'maximize', color: '#3DFFB5', icon: '⤢', action: () => window.electronAPI?.maximize() },
  ];

  if (!isElectron) return (
    <div style={{
      height: 36,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 16,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em' }}>
        ARCJOURNAL
      </span>
    </div>
  );

  return (
    <div
      style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 16,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        WebkitAppRegion: 'drag',
        flexShrink: 0,
        zIndex: 200,
        gap: 0,
      }}
    >
      {/* macOS-style traffic light buttons */}
      <div
        style={{ display: 'flex', gap: 6, WebkitAppRegion: 'no-drag', marginRight: 14 }}
        onMouseEnter={() => setHovered('group')}
        onMouseLeave={() => setHovered(null)}
      >
        {controls.map(({ id, color, icon, action }) => (
          <button
            key={id}
            onClick={action}
            title={id.charAt(0).toUpperCase() + id.slice(1)}
            style={{
              width: 13,
              height: 13,
              borderRadius: '50%',
              border: 'none',
              background: color,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: hovered === 'group' ? 'rgba(0,0,0,0.6)' : 'transparent',
              transition: 'color 0.15s, opacity 0.15s',
              lineHeight: 1,
              padding: 0,
              flexShrink: 0,
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Title */}
      <span style={{
        fontSize: 12,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        color: 'var(--muted)',
        letterSpacing: '0.1em',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }}>
        ARCJOURNAL
      </span>
    </div>
  );
}
