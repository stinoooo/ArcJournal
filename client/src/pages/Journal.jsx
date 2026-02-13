import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  parseISO, startOfWeek, endOfWeek, addMonths, subMonths,
} from 'date-fns';
import { entriesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { emotionImageSrc, emotionLabel, emotionColor } from '../components/EmojiPicker';
import Modal from '../components/Modal';
import RichEditor from '../components/RichEditor';
import CommentsSidebar from '../components/CommentsSidebar';
import Spinner from '../components/Spinner';
import { isDateBirthday } from '../utils/birthday';
import { logo } from '@/assets';

const today = format(new Date(), 'yyyy-MM-dd');
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;   // 2 MB
const MAX_FILE_BYTES  = 10 * 1024 * 1024;  // 10 MB

function gradeColor(g) {
  if (!g) return 'var(--muted)';
  if (g >= 8) return 'var(--success)';
  if (g >= 5) return 'var(--accent)';
  return 'var(--error)';
}
function fmtSize(b) {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return (b/1024).toFixed(1) + 'KB';
  return (b/1048576).toFixed(1) + 'MB';
}
function htmlToText(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

export default function Journal() {
  const { user } = useAuth();
  const toast = useToast();
  const editorRef = useRef();
  const fileInputRef = useRef();

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [allEntries, setAllEntries] = useState([]);
  const [dateEntries, setDateEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Entry state
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [isEditing, setIsEditing] = useState(false);  // false = read-only preview
  const [entryForm, setEntryForm] = useState({ title:'', content:'', grade:7, emoji:'happy', bgColor:'' });
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // UI
  const [saving, setSaving] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [search, setSearch] = useState('');

  // ── Load month entries (calendar dots) ──────────────────
  const loadMonth = useCallback(async (m) => {
    const from = format(startOfMonth(m), 'yyyy-MM-dd');
    const to   = format(endOfMonth(m),   'yyyy-MM-dd');
    try { const r = await entriesAPI.list({ from, to }); setAllEntries(r.data.entries || []); } catch {}
  }, []);

  // ── Load date entries (sidebar list) ────────────────────
  const loadDate = useCallback(async (d) => {
    setLoading(true);
    try { const r = await entriesAPI.list({ date: d }); setDateEntries(r.data.entries || []); }
    catch { setDateEntries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMonth(currentMonth); }, [currentMonth, loadMonth]);
  useEffect(() => {
    loadDate(selectedDate);
    setSelectedEntry(null); setIsNewEntry(false); setIsEditing(false); setShowComments(false);
  }, [selectedDate, loadDate]);

  // ── Calendar ─────────────────────────────────────────────
  const calStart = startOfWeek(startOfMonth(currentMonth));
  const calEnd   = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const entryDates = new Set(allEntries.map(e => e.date));

  const selectDate = (day) => {
    const ds = format(day, 'yyyy-MM-dd');
    if (ds > today) return;
    setSelectedDate(ds);
  };

  // ── Open entry (read-only by default) ───────────────────
  const openEntry = (entry) => {
    setSelectedEntry(entry);
    setIsNewEntry(false);
    setIsEditing(false); // start in read-only mode
    setEntryForm({
      title: entry.title||'',
      content: entry.content||'',
      grade: entry.grade||7,
      emoji: entry.emoji||'happy',
      bgColor: entry.bgColor||'',
    });
    setComments(entry.comments || []);
    setAttachments(entry.attachments || []);
    // Set editor content
    setTimeout(() => editorRef.current?.setContent(entry.content || ''), 50);
  };

  // ── Enter edit mode ──────────────────────────────────────
  const enterEditMode = () => {
    setIsEditing(true);
    setTimeout(() => editorRef.current?.focus(), 50);
  };

  // ── Start new entry ──────────────────────────────────────
  const startNew = () => {
    setSelectedEntry(null);
    setIsNewEntry(true);
    setIsEditing(true); // new entries start in edit mode
    setEntryForm({ title:'', content:'', grade:7, emoji:'happy', bgColor:'' });
    setComments([]); setAttachments([]);
    setTimeout(() => { editorRef.current?.setContent(''); editorRef.current?.focus(); }, 50);
  };

  // ── Save ─────────────────────────────────────────────────
  const saveEntry = async (silent = false) => {
    const content = editorRef.current?.getHTML() || entryForm.content;
    if (!content || content === '<p></p>') {
      if (!silent) toast.error('Write something first');
      return;
    }
    const payload = { ...entryForm, content, comments, attachments, date: selectedDate };
    if (!silent) setSaving(true); else setAutoSaveLabel('saving');
    try {
      let saved;
      if (isNewEntry || !selectedEntry) {
        const r = await entriesAPI.create(payload);
        saved = r.data.entry;
        setSelectedEntry(saved); setIsNewEntry(false);
        if (!silent) toast.success('Entry created');
      } else {
        const r = await entriesAPI.update(selectedEntry._id, payload);
        saved = r.data.entry;
        setSelectedEntry(saved);
        if (!silent) toast.success('Entry saved');
      }
      setIsEditing(false); // return to read-only after save
      await loadDate(selectedDate); await loadMonth(currentMonth);
      if (silent) { setAutoSaveLabel('saved'); setTimeout(() => setAutoSaveLabel(''), 3000); }
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const deleteEntry = async () => {
    if (!deleteModal) return;
    try {
      await entriesAPI.delete(deleteModal);
      toast.success('Entry deleted');
      setDeleteModal(null); setSelectedEntry(null); setIsNewEntry(false); setIsEditing(false);
      await loadDate(selectedDate); await loadMonth(currentMonth);
    } catch { toast.error('Failed to delete'); }
  };

  // ── Comments ─────────────────────────────────────────────
  const handleAddComment = (c) => { setComments(p => [...p, c]); setShowComments(true); };
  const handleDeleteComment = (id) => { setComments(p => p.filter(c => c.id !== id)); };
  const handleCommentHover = (id) => {
    document.querySelectorAll('.tiptap-editor [data-comment-id]').forEach(el =>
      el.classList.toggle('comment-active', id !== null && el.dataset.commentId === id));
  };

  // ── File attachments (with size limit) ──────────────────
  const handleFileAdd = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const results = [];
    for (const f of files) {
      const isImg = f.type.startsWith('image/');
      const limit = isImg ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
      if (f.size > limit) {
        toast.error(`"${f.name}" exceeds ${isImg ? '2MB' : '10MB'} limit (${fmtSize(f.size)})`);
        continue;
      }
      await new Promise(res => {
        const r = new FileReader();
        r.onload = () => {
          const att = {
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            name: f.name, mimeType: f.type, size: f.size, data: r.result,
          };
          results.push(att);
          if (isImg) editorRef.current?.insertImage(r.result);
          res();
        };
        r.readAsDataURL(f);
      });
    }
    if (results.length) setAttachments(p => [...p, ...results]);
    e.target.value = '';
  };

  // ── Sharing ──────────────────────────────────────────────
  const exportText = () => {
    const plain = htmlToText(editorRef.current?.getHTML() || entryForm.content);
    navigator.clipboard.writeText(`${entryForm.title||'Journal'}\n${selectedDate}\n${'─'.repeat(40)}\n\n${plain}`);
    toast.success('Copied to clipboard!'); setShowShareMenu(false);
  };
  const exportHTML = () => {
    const html = editorRef.current?.getHTML() || entryForm.content;
    const title = entryForm.title || `Journal — ${selectedDate}`;
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:680px;margin:60px auto;padding:0 24px;line-height:1.7;color:#1a1a1a}</style></head><body><h1>${title}</h1><p style="color:#888">${selectedDate}</p>${html}</body></html>`;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([full], {type:'text/html'})),
      download: `arcjournal_${selectedDate}.html`,
    });
    a.click(); toast.success('HTML exported'); setShowShareMenu(false);
  };

  const showEditor = selectedEntry || isNewEntry;
  const filtered = search
    ? dateEntries.filter(e =>
        (e.title||'').toLowerCase().includes(search.toLowerCase()) ||
        htmlToText(e.content||'').toLowerCase().includes(search.toLowerCase()))
    : dateEntries;

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* ─── LEFT SIDEBAR ─── */}
      <div style={{ width:268, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Calendar */}
        <div style={{ padding:'14px 12px 10px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
            <button className="btn btn-ghost" style={{ padding:'3px 8px', fontSize:13 }} onClick={()=>setCurrentMonth(m=>subMonths(m,1))}>‹</button>
            <span style={{ flex:1, textAlign:'center', fontFamily:'var(--font-display)', fontWeight:700, fontSize:12 }}>{format(currentMonth,'MMMM yyyy')}</span>
            <button className="btn btn-ghost" style={{ padding:'3px 8px', fontSize:13 }} onClick={()=>setCurrentMonth(m=>addMonths(m,1))}>›</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:2 }}>
            {DOW.map(d=><div key={d} style={{ textAlign:'center', fontSize:9, color:'var(--muted)', fontFamily:'var(--font-display)', fontWeight:600 }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {days.map(day=>{
              const ds = format(day,'yyyy-MM-dd');
              const inMonth = isSameMonth(day, currentMonth);
              const isSel = ds===selectedDate, isFuture = ds>today;
              const isBday = user?.dateOfBirth ? isDateBirthday(ds, user.dateOfBirth) : false;
              const hasEntry = entryDates.has(ds), isTD = ds===today;
              return (
                <button key={ds} onClick={()=>selectDate(day)} disabled={isFuture}
                  style={{ padding:'4px 1px', borderRadius:5,
                    border: isSel?'1.5px solid var(--accent)':'1px solid transparent',
                    background: isSel?'var(--accent-glow)':isBday?'rgba(255,209,102,0.06)':'transparent',
                    cursor:isFuture?'not-allowed':'pointer',
                    opacity:!inMonth?0.3:isFuture?0.2:1,
                    display:'flex',flexDirection:'column',alignItems:'center',gap:1,transition:'all 0.1s' }}>
                  <span style={{ fontSize:10, fontWeight:isSel||isTD?700:400,
                    color:isSel||isTD?'var(--accent)':isBday?'#FFD166':'var(--text)' }}>
                    {format(day,'d')}
                  </span>
                  {hasEntry && <div style={{ width:3,height:3,borderRadius:'50%',background:'var(--accent)',opacity:0.7 }} />}
                  {isBday && <img src="birthday.png" alt="" style={{width:7,height:7,objectFit:'contain'}} onError={e=>{e.currentTarget.style.display='none'}} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date header */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:11, color:'var(--muted)' }}>
              {format(parseISO(selectedDate),'MMM d, yyyy')}
            </span>
            <button className="btn btn-primary" onClick={startNew} style={{ padding:'4px 10px', fontSize:11 }}>+ New</button>
          </div>
          <input type="text" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ fontSize:12, padding:'5px 10px' }} />
        </div>

        {/* Entry list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && <div style={{ padding:20, display:'flex', justifyContent:'center' }}><Spinner size={18}/></div>}
          {!loading && isNewEntry && (
            <div style={{ margin:10, padding:'10px 12px', background:'var(--accent-glow)', border:'1.5px solid var(--accent)', borderRadius:'var(--radius-sm)' }}>
              <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, color:'var(--accent)' }}>+ New Entry</p>
              <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Unsaved</p>
            </div>
          )}
          {!loading && !isNewEntry && filtered.length===0 && (
            <p style={{ padding:'20px 14px', textAlign:'center', color:'var(--muted)', fontSize:12, lineHeight:1.7 }}>
              {search?'No matches.':'No entries for this day.\nPress + New to start.'}
            </p>
          )}
          {filtered.map((entry, idx) => {
            const isActive = selectedEntry?._id===entry._id;
            const preview = htmlToText(entry.content||'').slice(0,65);
            const t = entry.lastEditedAt
              ? format(new Date(entry.lastEditedAt),'h:mm a')
              : format(new Date(entry.createdAt),'h:mm a');
            return (
              <div key={entry._id} onClick={()=>openEntry(entry)}
                style={{ padding:'10px 12px', cursor:'pointer',
                  borderLeft:`3px solid ${isActive?'var(--accent)':'transparent'}`,
                  background:isActive?'var(--accent-glow)':'transparent',
                  borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'all 0.1s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ flex:1, fontFamily:'var(--font-display)', fontWeight:700, fontSize:12,
                    color:isActive?'var(--accent)':'var(--text)',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {entry.title||`Entry ${idx+1}`}
                  </span>
                  <img src={emotionImageSrc(entry.emoji)} alt="" style={{ width:13,height:13,objectFit:'contain',flexShrink:0 }} />
                  <span style={{ fontSize:10, color:gradeColor(entry.grade), fontFamily:'var(--font-display)', fontWeight:700, flexShrink:0 }}>{entry.grade}</span>
                </div>
                {preview && <p style={{ fontSize:11,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.4 }}>{preview}</p>}
                <div style={{ display:'flex', gap:6, marginTop:2 }}>
                  <span style={{ fontSize:10, color:'var(--muted)', opacity:0.5 }}>{entry.lastEditedAt?'Edited':'Created'} {t}</span>
                  {(entry.comments||[]).length>0 && <span style={{ fontSize:10, color:'#FFD166', opacity:0.7 }}>💬{entry.comments.length}</span>}
                  {(entry.attachments||[]).length>0 && <span style={{ fontSize:10, color:'var(--muted)', opacity:0.6 }}>📎{entry.attachments.length}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      {showEditor ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          {/* Header bar */}
          <div style={{ padding:'8px 16px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:10, background:'var(--bg)', flexShrink:0 }}>

            {/* Title — editable only in edit mode */}
            {isEditing ? (
              <input type="text" placeholder="Title…" value={entryForm.title}
                onChange={e=>setEntryForm(p=>({...p,title:e.target.value}))}
                style={{ flex:1, fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, background:'transparent', border:'none', padding:0, outline:'none' }} />
            ) : (
              <span style={{ flex:1, fontFamily:'var(--font-display)', fontWeight:700, fontSize:15,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {entryForm.title || (isNewEntry ? 'New Entry' : 'Untitled Entry')}
              </span>
            )}

            {/* Autosave label */}
            {autoSaveLabel==='saving' && <span className="autosave-pulse" style={{ fontSize:11, color:'var(--muted)', flexShrink:0 }}>Saving…</span>}
            {autoSaveLabel==='saved'  && <span style={{ fontSize:11, color:'var(--success)', flexShrink:0 }}>✓ Autosaved</span>}
            {selectedEntry?.lastEditedAt && !autoSaveLabel && (
              <span style={{ fontSize:10, color:'var(--muted)', opacity:0.5, flexShrink:0 }}>
                Edited {format(new Date(selectedEntry.lastEditedAt),'h:mm a')}
              </span>
            )}

            {/* Read-only badge */}
            {!isEditing && !isNewEntry && (
              <span style={{ fontSize:10, color:'var(--muted)', background:'var(--surface2)', padding:'2px 8px',
                borderRadius:100, border:'1px solid var(--border)', flexShrink:0 }}>
                👁 Preview
              </span>
            )}

            {/* Grade (edit mode only) */}
            {isEditing && (
              <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, color:gradeColor(entryForm.grade) }}>{entryForm.grade}</span>
                <span style={{ color:'var(--muted)', fontSize:12 }}>/10</span>
                <input type="range" min="1" max="10" value={entryForm.grade}
                  onChange={e=>setEntryForm(p=>({...p,grade:Number(e.target.value)}))}
                  style={{ width:60, accentColor:'var(--accent)', cursor:'pointer', background:'transparent' }} />
              </div>
            )}

            {/* Emotion indicator */}
            <img src={emotionImageSrc(entryForm.emoji)} alt={emotionLabel(entryForm.emoji)}
              style={{ width:24, height:24, objectFit:'contain', flexShrink:0,
                cursor: isEditing ? 'pointer' : 'default' }}
              title={`${emotionLabel(entryForm.emoji)} · Grade ${entryForm.grade}/10`} />

            {/* Actions */}
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              {/* Comments */}
              <button className="btn btn-ghost"
                style={{ padding:'5px 9px', fontSize:11,
                  borderColor:showComments?'var(--accent)':'var(--border)',
                  color:showComments?'var(--accent)':'var(--muted)' }}
                onClick={()=>setShowComments(v=>!v)} title="Comments">
                💬 {comments.length>0&&<span style={{marginLeft:2}}>{comments.length}</span>}
              </button>

              {/* Share */}
              <div style={{ position:'relative' }}>
                <button className="btn btn-ghost" style={{ padding:'5px 9px', fontSize:11 }} onClick={()=>setShowShareMenu(v=>!v)}>↑</button>
                {showShareMenu && (
                  <div style={{ position:'absolute', top:34, right:0, background:'var(--surface)', border:'1px solid var(--border)',
                    borderRadius:8, padding:6, zIndex:50, minWidth:155, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
                    {[['📋 Copy text', exportText],['⬇ Export HTML', exportHTML]].map(([lbl,fn])=>(
                      <button key={lbl} onClick={fn} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', background:'transparent', border:'none', color:'var(--text)', fontSize:12, cursor:'pointer', borderRadius:4 }}
                        onMouseEnter={e=>{e.currentTarget.style.background='var(--surface2)'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>{lbl}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              {selectedEntry && (
                <button className="btn btn-danger" style={{ padding:'5px 9px', fontSize:11 }}
                  onClick={()=>setDeleteModal(selectedEntry._id)}>✕</button>
              )}

              {/* Edit / Save / Cancel */}
              {!isEditing && !isNewEntry && (
                <button className="btn btn-primary" style={{ padding:'5px 14px', fontSize:12 }}
                  onClick={enterEditMode}>
                  ✎ Edit
                </button>
              )}
              {isEditing && (
                <>
                  {!isNewEntry && (
                    <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }}
                      onClick={() => { setIsEditing(false); openEntry(selectedEntry); }}>
                      Cancel
                    </button>
                  )}
                  <button className="btn btn-primary" style={{ padding:'5px 14px', fontSize:12 }}
                    disabled={saving} onClick={()=>saveEntry(false)}>
                    {saving ? <Spinner size={13} color="#0B1020" /> : isNewEntry ? 'Create' : 'Save'}
                  </button>
                </>
              )}

              {/* Attach (edit only) */}
              {isEditing && (
                <>
                  <button className="btn btn-ghost" style={{ padding:'5px 9px', fontSize:11 }}
                    onClick={()=>fileInputRef.current?.click()} title="Attach file">📎</button>
                  <input ref={fileInputRef} type="file" multiple style={{ display:'none' }} onChange={handleFileAdd} />
                </>
              )}
            </div>
          </div>

          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* Editor column */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Mood strip (edit mode only) */}
              {isEditing && (
                <div style={{ padding:'6px 14px', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', gap:4 }}>
                  {['happy','loved','confident','playful','embarrassed','sad','scared','angry'].map(name=>(
                    <button key={name} type="button" onClick={()=>setEntryForm(p=>({...p,emoji:name}))}
                      title={name}
                      style={{ padding:3, borderRadius:6,
                        border:`1.5px solid ${entryForm.emoji===name?emotionColor(name):'var(--border)'}`,
                        background:entryForm.emoji===name?`${emotionColor(name)}18`:'transparent',
                        cursor:'pointer', transition:'all 0.1s' }}>
                      <img src={emotionImageSrc(name)} alt={name} style={{ width:20,height:20,objectFit:'contain',
                        filter:entryForm.emoji===name?'none':'grayscale(40%) opacity(0.5)' }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Read-only info bar */}
              {!isEditing && !isNewEntry && selectedEntry && (
                <div style={{ padding:'6px 16px', borderBottom:'1px solid var(--border)', flexShrink:0,
                  display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.015)' }}>
                  <img src={emotionImageSrc(selectedEntry.emoji)} alt="" style={{ width:18,height:18,objectFit:'contain' }} />
                  <span style={{ fontSize:11, color:emotionColor(selectedEntry.emoji), fontFamily:'var(--font-display)', fontWeight:700 }}>
                    {emotionLabel(selectedEntry.emoji)}
                  </span>
                  <span style={{ fontSize:11, color:gradeColor(selectedEntry.grade), fontFamily:'var(--font-display)', fontWeight:700 }}>
                    {selectedEntry.grade}/10
                  </span>
                  <span style={{ flex:1 }} />
                  <span style={{ fontSize:11, color:'var(--muted)', opacity:0.5 }}>
                    {selectedEntry.lastEditedAt
                      ? `Last edited ${format(new Date(selectedEntry.lastEditedAt), 'MMM d, h:mm a')}`
                      : `Created ${format(new Date(selectedEntry.createdAt), 'MMM d, h:mm a')}`}
                  </span>
                </div>
              )}

              {/* Rich editor */}
              <div style={{ flex:1, overflow:'hidden', background:entryForm.bgColor||'transparent', position:'relative' }}>
                <RichEditor
                  ref={editorRef}
                  content=""
                  onChange={html=>setEntryForm(p=>({...p,content:html}))}
                  placeholder={`Write about ${selectedDate===today?'today':format(parseISO(selectedDate),'MMMM d')}…`}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onCommentClick={id=>{setActiveCommentId(id);setShowComments(true);}}
                  onCommentHover={handleCommentHover}
                  bgColor={entryForm.bgColor}
                  readOnly={!isEditing}
                  autosave={(html)=>{ setEntryForm(p=>({...p,content:html})); saveEntry(true); }}
                />
              </div>

              {/* Attachments strip */}
              {attachments.length>0 && (
                <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)',
                  display:'flex', flexWrap:'wrap', gap:8, maxHeight:120, overflowY:'auto', flexShrink:0 }}>
                  {attachments.map(att=>(
                    <AttachmentTile key={att.id} att={att}
                      onRemove={isEditing ? ()=>setAttachments(p=>p.filter(a=>a.id!==att.id)) : null} />
                  ))}
                </div>
              )}

              {/* BG colour bar (edit mode only) */}
              {isEditing && (
                <div style={{ padding:'5px 14px', borderTop:'1px solid var(--border)',
                  display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:10, color:'var(--muted)', fontFamily:'var(--font-display)', letterSpacing:'0.06em' }}>BG</span>
                  {['','#0B1020','#0d1a0d','#0d0d1a','#1a0d0d','#1a1a00','#0d1a1a','#160a20','#1a1000'].map(c=>(
                    <button key={c||'x'} onClick={()=>setEntryForm(p=>({...p,bgColor:c}))} title={c||'Default'}
                      style={{ width:16,height:16,borderRadius:3,
                        border:entryForm.bgColor===c?'2px solid var(--accent)':c?'1px solid rgba(255,255,255,0.1)':'1.5px dashed var(--muted)',
                        background:c||'transparent', cursor:'pointer', fontSize:9, color:'var(--muted)',
                        display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {!c&&'×'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comments sidebar */}
            {showComments && (
              <CommentsSidebar
                comments={comments}
                activeCommentId={activeCommentId}
                onCommentClick={id=>{setActiveCommentId(id);handleCommentHover(id);}}
                onCommentHover={handleCommentHover}
                onDeleteComment={isEditing ? handleDeleteComment : undefined}
              />
            )}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, color:'var(--muted)' }}>
          <div style={{ fontSize:44, opacity:0.15 }}>📖</div>
          <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>{format(parseISO(selectedDate),'MMMM d, yyyy')}</p>
          <p style={{ fontSize:12, opacity:0.6 }}>{dateEntries.length>0?'Select an entry to read it':'No entries yet — press + New'}</p>
          <button className="btn btn-primary" onClick={startNew}>+ New Entry</button>
        </div>
      )}

      <Modal isOpen={!!deleteModal} title="Delete Entry?"
        message="This entry will be permanently deleted. This cannot be undone."
        confirmLabel="Delete" confirmDanger onConfirm={deleteEntry} onCancel={()=>setDeleteModal(null)} />
    </div>
  );
}

function AttachmentTile({ att, onRemove }) {
  const isImg = att.mimeType?.startsWith('image/');
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      {isImg
        ? <img src={att.data} alt={att.name} style={{ width:76,height:76,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)',display:'block' }} />
        : <div style={{ width:76,height:76,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,gap:3,padding:4 }}>
            <span style={{ fontSize:22 }}>📄</span>
            <span style={{ fontSize:9,color:'var(--muted)',textAlign:'center',wordBreak:'break-all',lineHeight:1.2,overflow:'hidden',maxHeight:28 }}>{att.name}</span>
            <span style={{ fontSize:9,color:'var(--muted)',opacity:0.5 }}>{fmtSize(att.size)}</span>
          </div>}
      {onRemove && (
        <button onClick={onRemove} style={{ position:'absolute',top:-5,right:-5,width:16,height:16,borderRadius:'50%',background:'var(--error)',border:'none',color:'#fff',fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
      )}
    </div>
  );
}
