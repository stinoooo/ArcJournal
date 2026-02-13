import React from 'react';
import { logo } from '@/assets';

export default function Spinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid var(--border)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}
