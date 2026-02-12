import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { entriesAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import EmojiPicker, { emotionImageSrc, emotionLabel } from '../components/EmojiPicker';
import Spinner from '../components/Spinner';
import { isTodayBirthday, getTimeGreeting, getUserDisplayName, getUserAge } from '../utils/birthday';
import { useNavigate } from 'react-router-dom';

const today = format(new Date(), 'yyyy-MM-dd');
const displayDate = format(new Date(), 'EEEE, MMMM d, yyyy');

const BIRTHDAY_PROMPTS = [
  'What is one thing you hope this new year of life brings you?',
  'Who are the people that matter most to you right now?',
  'What is something you have learned about yourself this past year?',
  'What is one goal you want to set for yourself going forward?',
];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isBirthday = isTodayBirthday(user?.dateOfBirth);
  const age = isBirthday ? getUserAge(user?.dateOfBirth) : null;
  const displayName = getUserDisplayName(user);
  const greeting = getTimeGreeting();

  const [todayEntries, setTodayEntries] = useState([]);
  const [entry, setEntry] = useState({ title: '', content: '', grade: 7, emoji: 'happy' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [birthdayAnswer, setBirthdayAnswer] = useState('');

  useEffect(() => {
    entriesAPI.list({ date: today })
      .then(r => setTodayEntries(r.data.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!entry.content?.trim()) { toast.error('Write something first'); return; }
    setSaving(true);
    let finalContent = entry.content;
    if (isBirthday && birthdayAnswer.trim()) {
      finalContent = finalContent
        ? `${finalContent}\n\n🎂 Birthday Reflection:\n${birthdayAnswer}`
        : `🎂 Birthday Reflection:\n${birthdayAnswer}`;
    }
    try {
      const r = await entriesAPI.create({ date: today, ...entry, content: finalContent });
      setTodayEntries(prev => [...prev, r.data.entry]);
      setEntry({ title: '', content: '', grade: 7, emoji: 'happy' });
      setBirthdayAnswer('');
      setSaved(true);
      toast.success('Entry saved!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={32} /></div>;

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 36px' }}>

      {/* Birthday banner */}
      {isBirthday && (
        <div style={{
          background:'linear-gradient(135deg,rgba(255,209,102,0.1),rgba(255,107,157,0.1))',
          border:'1px solid rgba(255,209,102,0.35)', borderRadius:'var(--radius)', padding:'14px 18px',
          marginBottom:22, display:'flex', alignItems:'center', gap:14,
        }}>
          <img src="birthday.png" alt="🎂" style={{ width:44, height:44, objectFit:'contain', flexShrink:0 }} onError={e=>{e.currentTarget.style.display='none'}} />
          <div>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, color:'#FFD166', marginBottom:2 }}>
              🎂 Happy Birthday, {displayName}!{age && <span style={{ fontWeight:400, fontSize:12, color:'rgba(255,209,102,0.6)', marginLeft:8 }}>Year {age} 🎉</span>}
            </h3>
            <p style={{ fontSize:12, color:'rgba(255,209,102,0.6)' }}>Special birthday reflection prompts are waiting below!</p>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <img src={emotionImageSrc(entry.emoji)} alt="" style={{ width:44, height:44, objectFit:'contain' }} />
          <div>
            <p style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.08em', fontFamily:'var(--font-display)', textTransform:'uppercase' }}>{isBirthday?'🎂 Your Birthday':'Today'}</p>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 }}>{displayDate}</h1>
          </div>
        </div>
        <p style={{ color:'var(--muted)', fontSize:14 }}>
          {isBirthday ? `${greeting}, ${displayName}! What a special day — write all about it 🎉` : `${greeting}, ${displayName}. How was your day?`}
        </p>
      </div>

      {/* Today's entries count */}
      {todayEntries.length > 0 && (
        <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'var(--muted)' }}>📖 {todayEntries.length} {todayEntries.length===1?'entry':'entries'} written today</span>
          <button className="btn btn-ghost" style={{ padding:'4px 12px', fontSize:11 }} onClick={() => navigate('/app/journal')}>
            View in Journal →
          </button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:20, maxWidth:900 }}>
        {/* Main editor */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label>Title <span style={{ textTransform:'none', fontWeight:400, color:'var(--muted)', letterSpacing:0 }}>(optional)</span></label>
            <input type="text"
              placeholder={isBirthday ? `My ${age?age+getOrd(age)+' ':''}Birthday 🎂` : 'Give your day a title…'}
              value={entry.title} onChange={e=>setEntry(p=>({...p,title:e.target.value}))}
              style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:15 }} />
          </div>
          <div>
            <label>Write about your day</label>
            <textarea placeholder="Write about your day, your thoughts, your feelings…" value={entry.content}
              onChange={e=>setEntry(p=>({...p,content:e.target.value}))}
              style={{ minHeight: isBirthday?150:200, lineHeight:1.8 }} />
          </div>

          {/* Birthday prompts */}
          {isBirthday && (
            <div style={{ background:'linear-gradient(135deg,rgba(255,209,102,0.06),rgba(255,107,157,0.06))', border:'1px solid rgba(255,209,102,0.2)', borderRadius:'var(--radius)', padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <img src="birthday.png" alt="" style={{ width:20, height:20, objectFit:'contain' }} onError={e=>{e.currentTarget.style.display='none'}} />
                <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, color:'#FFD166', letterSpacing:'0.05em', textTransform:'uppercase' }}>Birthday Reflections</span>
              </div>
              {BIRTHDAY_PROMPTS.map((p,i) => (
                <div key={i} style={{ padding:'8px 12px', background:'rgba(255,209,102,0.05)', border:'1px solid rgba(255,209,102,0.1)', borderRadius:'var(--radius-sm)', fontSize:12, color:'rgba(255,209,102,0.75)', fontStyle:'italic', marginBottom:8 }}>
                  {i+1}. {p}
                </div>
              ))}
              <textarea placeholder="Your birthday reflections…" value={birthdayAnswer}
                onChange={e=>setBirthdayAnswer(e.target.value)}
                style={{ minHeight:80, lineHeight:1.7, borderColor:'rgba(255,209,102,0.2)', marginTop:4 }} />
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card-sm">
            <label>Day Grade</label>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6 }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:800, color:gradeColor(entry.grade), lineHeight:1 }}>{entry.grade}</span>
              <span style={{ color:'var(--muted)', fontSize:16 }}>/10</span>
            </div>
            <input type="range" min="1" max="10" value={entry.grade} onChange={e=>setEntry(p=>({...p,grade:Number(e.target.value)}))}
              style={{ width:'100%', marginTop:10, accentColor:'var(--accent)', cursor:'pointer', background:'transparent' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--muted)', marginTop:2 }}>
              <span>Rough</span><span>Amazing</span>
            </div>
          </div>

          <div className="card-sm">
            <EmojiPicker value={entry.emoji} onChange={e=>setEntry(p=>({...p,emoji:e}))} />
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width:'100%', justifyContent:'center' }}>
            {saving ? <Spinner size={15} color="#0B1020" /> : saved ? '✓ Saved!' : '+ Save Entry'}
          </button>

          {todayEntries.length > 0 && (
            <p style={{ fontSize:11, color:'var(--muted)', textAlign:'center' }}>This will create a new entry for today.</p>
          )}

          {isBirthday && (
            <div style={{ background:'rgba(255,209,102,0.06)', border:'1px solid rgba(255,209,102,0.2)', borderRadius:'var(--radius-sm)', padding:12, textAlign:'center' }}>
              <img src="birthday.png" alt="🎂" style={{ width:32, height:32, objectFit:'contain', marginBottom:4 }} onError={e=>{e.currentTarget.style.display='none'}} />
              <p style={{ fontSize:12, color:'#FFD166', fontFamily:'var(--font-display)', fontWeight:700 }}>🎂 Happy Birthday!</p>
              {age && <p style={{ fontSize:11, color:'rgba(255,209,102,0.5)', marginTop:2 }}>Year {age}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function gradeColor(g) {
  if (g>=8) return 'var(--success)';
  if (g>=5) return 'var(--accent)';
  return 'var(--error)';
}
function getOrd(n) {
  const s=['th','st','nd','rd'];
  const v=n%100;
  return s[(v-20)%10]||s[v]||s[0];
}
