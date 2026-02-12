import React, {
  useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle,
} from 'react';
import { useEditor, EditorContent, Mark, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import ImageExt from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import { format } from 'date-fns';

// ─── Inline SVG comment icon (replaces comment.png dependency) ──────────────
const CommentIconSVG = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 1H2C1.45 1 1 1.45 1 2v9c0 .55.45 1 1 1h3l2.5 2.5 2.5-2.5H14c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1z"
      fill={color} opacity="0.9"/>
    <circle cx="5" cy="6.5" r="1" fill="white"/>
    <circle cx="8" cy="6.5" r="1" fill="white"/>
    <circle cx="11" cy="6.5" r="1" fill="white"/>
  </svg>
);

// ─── Comment Mark Extension ──────────────────────────────────────────────────
const CommentMark = Mark.create({
  name: 'comment',
  addAttributes() {
    return { commentId: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'span[data-comment-id]', getAttrs: el => ({ commentId: el.getAttribute('data-comment-id') }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({
      'data-comment-id': HTMLAttributes.commentId,
      class: 'comment-mark',
    }), 0];
  },
  addCommands() {
    return {
      setComment: (commentId) => ({ commands }) => commands.setMark(this.name, { commentId }),
      unsetComment: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
});

// ─── Toolbar button ──────────────────────────────────────────────────────────
function TBtn({ title, active, onMouseDown, children, style }) {
  return (
    <button
      type="button"
      title={title}
      className={`toolbar-btn${active ? ' active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown?.(); }}
      style={style}
    >
      {children}
    </button>
  );
}

const Sep = () => <div className="toolbar-sep" />;

const TEXT_COLORS = [
  { label: 'Auto',    value: null },
  { label: 'Red',     value: '#FF5C7A' },
  { label: 'Orange',  value: '#FF9F7A' },
  { label: 'Yellow',  value: '#FFD166' },
  { label: 'Green',   value: '#3DFFB5' },
  { label: 'Cyan',    value: '#6AE4FF' },
  { label: 'Purple',  value: '#B07AFF' },
  { label: 'Pink',    value: '#FF6B9D' },
  { label: 'White',   value: '#E8ECF5' },
];

const HIGHLIGHTS = [
  { label: 'None',    value: null },
  { label: 'Yellow',  value: 'rgba(255,209,102,0.35)' },
  { label: 'Green',   value: 'rgba(61,255,181,0.3)' },
  { label: 'Cyan',    value: 'rgba(106,228,255,0.3)' },
  { label: 'Red',     value: 'rgba(255,92,122,0.3)' },
  { label: 'Purple',  value: 'rgba(176,122,255,0.3)' },
];

// ─── Colour swatch popup ─────────────────────────────────────────────────────
function ColorPopup({ items, onPick, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
    <div ref={ref} style={{
      position: 'absolute', top: 32, left: 0, zIndex: 300,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: 8, display: 'flex', flexWrap: 'wrap',
      gap: 4, width: 130, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      {items.map(({ label, value }) => (
        <button key={label} type="button" title={label}
          onMouseDown={(e) => { e.preventDefault(); onPick(value); }}
          style={{
            width: 22, height: 22, borderRadius: 5, cursor: 'pointer',
            border: value ? '1px solid rgba(255,255,255,0.15)' : '1.5px dashed var(--muted)',
            background: value || 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: 'var(--muted)',
          }}
        >
          {!value && '×'}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const RichEditor = forwardRef(function RichEditor(
  { content, onChange, placeholder, comments = [], onAddComment, onCommentClick, onCommentHover, bgColor, autosave, readOnly },
  ref
) {
  const [showTextColors,  setShowTextColors]  = useState(false);
  const [showHighlights,  setShowHighlights]  = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentDraft,    setCommentDraft]    = useState('');
  const [selectedText,    setSelectedText]    = useState('');
  const [savedSel,        setSavedSel]        = useState(null);
  const [activeColor,     setActiveColor]     = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: { depth: 100 } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      ImageExt.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CommentMark,
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (!readOnly) onChange?.(editor.getHTML());
      // Track active color/highlight from selection
      const ts = editor.getAttributes('textStyle');
      setActiveColor(ts?.color || null);
      const hl = editor.getAttributes('highlight');
      setActiveHighlight(hl?.color || null);
    },
    onSelectionUpdate: ({ editor }) => {
      const ts = editor.getAttributes('textStyle');
      setActiveColor(ts?.color || null);
      const hl = editor.getAttributes('highlight');
      setActiveHighlight(hl?.color || null);
    },
  });

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() || '',
    setContent: (html) => editor?.commands.setContent(html, false),
    insertImage: (src) => editor?.chain().focus().setImage({ src }).run(),
    focus: () => editor?.commands.focus(),
  }));

  // Update editable when readOnly changes
  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Autosave
  useEffect(() => {
    if (!autosave || readOnly) return;
    const t = setInterval(() => {
      if (editor && !editor.isEmpty) autosave(editor.getHTML());
    }, 90000);
    return () => clearInterval(t);
  }, [editor, autosave, readOnly]);

  // Comment click handler on ProseMirror DOM
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onClick = (e) => {
      const span = e.target.closest('[data-comment-id]');
      if (span) onCommentClick?.(span.dataset.commentId);
    };
    dom.addEventListener('click', onClick);
    return () => dom.removeEventListener('click', onClick);
  }, [editor, onCommentClick]);

  // Comment add
  const handleAddComment = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, ' ');
    setSelectedText(text);
    setSavedSel({ from, to });
    setCommentDraft('');
    setShowCommentInput(true);
    setShowTextColors(false);
    setShowHighlights(false);
  };

  const submitComment = () => {
    if (!commentDraft.trim() || !savedSel || !editor) return;
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    editor.chain().focus().setTextSelection(savedSel).setComment(id).run();
    onAddComment?.({ id, text: commentDraft.trim(), selectedText, createdAt: new Date().toISOString() });
    setShowCommentInput(false);
    setCommentDraft('');
    setSavedSel(null);
  };

  // Apply text color
  const applyColor = (value) => {
    if (!editor) return;
    if (value) {
      editor.chain().focus().setColor(value).run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
    setActiveColor(value);
    setShowTextColors(false);
  };

  // Apply highlight
  const applyHighlight = (value) => {
    if (!editor) return;
    if (value) {
      editor.chain().focus().setHighlight({ color: value }).run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
    setActiveHighlight(value);
    setShowHighlights(false);
  };

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bgColor || 'transparent' }}>
      {/* ── Toolbar (hidden in read-only) ── */}
      {!readOnly && (
        <div className="editor-toolbar">
          {/* Undo / Redo */}
          <TBtn title="Undo (Ctrl+Z)" onMouseDown={() => editor.chain().focus().undo().run()}>↩</TBtn>
          <TBtn title="Redo (Ctrl+Y)" onMouseDown={() => editor.chain().focus().redo().run()}>↪</TBtn>
          <Sep />

          {/* Headings */}
          <TBtn title="H1" active={editor.isActive('heading', { level: 1 })}
            onMouseDown={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:11 }}>H1</TBtn>
          <TBtn title="H2" active={editor.isActive('heading', { level: 2 })}
            onMouseDown={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:11 }}>H2</TBtn>
          <Sep />

          {/* Inline */}
          <TBtn title="Bold" active={editor.isActive('bold')}
            onMouseDown={() => editor.chain().focus().toggleBold().run()}
            style={{ fontWeight: 700 }}>B</TBtn>
          <TBtn title="Italic" active={editor.isActive('italic')}
            onMouseDown={() => editor.chain().focus().toggleItalic().run()}
            style={{ fontStyle: 'italic' }}>I</TBtn>
          <TBtn title="Underline" active={editor.isActive('underline')}
            onMouseDown={() => editor.chain().focus().toggleUnderline().run()}
            style={{ textDecoration: 'underline' }}>U</TBtn>
          <TBtn title="Strikethrough" active={editor.isActive('strike')}
            onMouseDown={() => editor.chain().focus().toggleStrike().run()}
            style={{ textDecoration: 'line-through' }}>S</TBtn>
          <TBtn title="Code" active={editor.isActive('code')}
            onMouseDown={() => editor.chain().focus().toggleCode().run()}
            style={{ fontFamily: 'monospace', fontSize: 11 }}>{'<>'}</TBtn>
          <Sep />

          {/* Align */}
          <TBtn title="Left"   active={editor.isActive({ textAlign: 'left'   })} onMouseDown={() => editor.chain().focus().setTextAlign('left').run()}>⬤</TBtn>
          <TBtn title="Center" active={editor.isActive({ textAlign: 'center' })} onMouseDown={() => editor.chain().focus().setTextAlign('center').run()}>⬤</TBtn>
          <TBtn title="Right"  active={editor.isActive({ textAlign: 'right'  })} onMouseDown={() => editor.chain().focus().setTextAlign('right').run()}>⬤</TBtn>
          <Sep />

          {/* Lists */}
          <TBtn title="Bullet list" active={editor.isActive('bulletList')}
            onMouseDown={() => editor.chain().focus().toggleBulletList().run()}>•</TBtn>
          <TBtn title="Numbered list" active={editor.isActive('orderedList')}
            onMouseDown={() => editor.chain().focus().toggleOrderedList().run()}>1.</TBtn>
          <TBtn title="Task list" active={editor.isActive('taskList')}
            onMouseDown={() => editor.chain().focus().toggleTaskList().run()}>☑</TBtn>
          <TBtn title="Quote" active={editor.isActive('blockquote')}
            onMouseDown={() => editor.chain().focus().toggleBlockquote().run()}>"</TBtn>
          <Sep />

          {/* Text colour */}
          <div style={{ position: 'relative' }}>
            <TBtn title="Text colour" active={showTextColors}
              onMouseDown={() => { setShowTextColors(v => !v); setShowHighlights(false); }}>
              <span style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                <span style={{ fontWeight:700, fontSize:12 }}>A</span>
                <span style={{ width:12, height:2, borderRadius:1, background: activeColor || 'var(--text)', display:'block' }} />
              </span>
            </TBtn>
            {showTextColors && (
              <ColorPopup items={TEXT_COLORS} onPick={applyColor} onClose={() => setShowTextColors(false)} />
            )}
          </div>

          {/* Highlight */}
          <div style={{ position: 'relative' }}>
            <TBtn title="Highlight" active={showHighlights || editor.isActive('highlight')}
              onMouseDown={() => { setShowHighlights(v => !v); setShowTextColors(false); }}>
              <span style={{ background: activeHighlight || 'transparent', padding:'0 3px', borderRadius:2,
                border: activeHighlight ? 'none' : '1px solid var(--muted)', fontSize:11 }}>ab</span>
            </TBtn>
            {showHighlights && (
              <ColorPopup items={HIGHLIGHTS} onPick={applyHighlight} onClose={() => setShowHighlights(false)} />
            )}
          </div>

          <Sep />

          {/* Add comment */}
          <TBtn title="Add comment to selection" active={showCommentInput}
            onMouseDown={handleAddComment}
            style={{ color: showCommentInput ? '#FFD166' : 'var(--muted)' }}>
            <CommentIconSVG size={14} color={showCommentInput ? '#FFD166' : 'currentColor'} />
          </TBtn>

          <TBtn title="Horizontal rule" onMouseDown={() => editor.chain().focus().setHorizontalRule().run()}>—</TBtn>
        </div>
      )}

      {/* ── Comment input bar ── */}
      {showCommentInput && (
        <div style={{
          padding: '8px 14px',
          background: 'rgba(255,209,102,0.07)',
          borderBottom: '1px solid rgba(255,209,102,0.2)',
          display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0,
        }}>
          {selectedText && (
            <p style={{ fontSize: 11, color: '#FFD166', fontStyle: 'italic', opacity: 0.75 }}>
              "…{selectedText.slice(0, 60)}{selectedText.length > 60 ? '…' : ''}"
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="Write a comment…" value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitComment(); if (e.key === 'Escape') setShowCommentInput(false); }}
              autoFocus
              style={{ flex: 1, padding: '7px 12px', fontSize: 13, background: 'var(--surface2)' }} />
            <button className="btn btn-primary" onMouseDown={e => { e.preventDefault(); submitComment(); }}
              style={{ padding: '7px 14px', fontSize: 12 }}>Add</button>
            <button className="btn btn-ghost" onMouseDown={e => { e.preventDefault(); setShowCommentInput(false); }}
              style={{ padding: '7px 10px', fontSize: 12 }}>✕</button>
          </div>
        </div>
      )}

      {/* ── Editor ── */}
      <div
        className="tiptap-editor"
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        onClick={() => !readOnly && editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default RichEditor;
