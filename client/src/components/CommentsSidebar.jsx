import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

export default function CommentsSidebar({ comments = [], activeCommentId, onCommentClick, onCommentHover, onDeleteComment }) {
  const [search, setSearch] = useState('');

  const filtered = comments.filter(c =>
    !search || c.text.toLowerCase().includes(search.toLowerCase()) ||
    (c.selectedText || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <img src="comment.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text)',
          }}>
            Comments
          </span>
          <span style={{
            marginLeft: 'auto',
            background: 'var(--surface2)',
            color: 'var(--muted)',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 100,
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
          }}>
            {comments.length}
          </span>
        </div>
        <input
          type="text"
          placeholder="Search comments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ fontSize: 12, padding: '7px 12px' }}
        />
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            {comments.length === 0
              ? 'Highlight text in your entry and click the comment button to add comments.'
              : 'No comments match your search.'}
          </div>
        )}
        {filtered.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            isActive={activeCommentId === comment.id}
            onClick={() => onCommentClick?.(comment.id)}
            onMouseEnter={() => onCommentHover?.(comment.id)}
            onMouseLeave={() => onCommentHover?.(null)}
            onDelete={() => onDeleteComment?.(comment.id)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: 10,
        color: 'var(--muted)',
        opacity: 0.5,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        Highlight text → toolbar → 💬 to comment
      </div>
    </div>
  );
}

function CommentCard({ comment, isActive, onClick, onMouseEnter, onMouseLeave, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);

  const dt = comment.createdAt
    ? format(typeof comment.createdAt === 'string' ? parseISO(comment.createdAt) : new Date(comment.createdAt), 'MMM d, h:mm a')
    : '';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { setShowDelete(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setShowDelete(false); onMouseLeave?.(); }}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        borderLeft: `3px solid ${isActive ? '#FFD166' : 'transparent'}`,
        background: isActive ? 'rgba(255,209,102,0.06)' : 'transparent',
        transition: 'all 0.15s',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        position: 'relative',
      }}
    >
      {/* Quoted text */}
      {comment.selectedText && (
        <div style={{
          fontSize: 11,
          color: '#FFD166',
          fontStyle: 'italic',
          opacity: 0.75,
          marginBottom: 6,
          background: 'rgba(255,209,102,0.08)',
          padding: '3px 8px',
          borderRadius: 4,
          borderLeft: '2px solid rgba(255,209,102,0.4)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          "{comment.selectedText.slice(0, 70)}{comment.selectedText.length > 70 ? '…' : ''}"
        </div>
      )}

      {/* Comment body */}
      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 6 }}>
        {comment.text}
      </p>

      {/* Timestamp + delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>{dt}</span>
        {showDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--error)',
              cursor: 'pointer',
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              opacity: 0.7,
            }}
            title="Delete comment"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
