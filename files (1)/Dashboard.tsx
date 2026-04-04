import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { UserProfile, Book } from '../types';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';
import {
  Sparkles, Plus, LogOut, BookOpen, Trash2, Loader2,
  X, Wand2, FileText, ShieldCheck
} from 'lucide-react';

interface Props { user: any; profile: UserProfile | null; appName: string; logoUrl: string; }

const GEMINI_KEY = process.env.GEMINI_API_KEY as string || '';
const genai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

async function generateWithGemini(prompt: string, sys: string): Promise<string> {
  if (!genai) throw new Error('Gemini API key not set. Add GEMINI_API_KEY to .env.local');
  const r = await genai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt, config: { systemInstruction: sys } });
  return r.text || '';
}

export default function Dashboard({ user, profile, appName, logoUrl }: Props) {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'story' | 'comic' | 'anime'>('story');
  const [creating, setCreating] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [genStyle, setGenStyle] = useState('watercolor');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState('');

  const isHeadAdmin = profile?.role === 'headadmin' || user?.email === 'alaa.abukhamseen@gmail.com';
  const displayName = profile?.displayName || user?.displayName || 'Storyteller';

  const Logo = () => logoUrl
    ? <img src={logoUrl} alt={appName} className="w-7 h-7 rounded-lg object-cover" />
    : <Sparkles size={20} className="text-gold" />;

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(collection(db, 'books'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setBooks(list);
      } catch (e) { console.error('Failed to load books:', e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const createBook = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const data = { userId: user.uid, title: newTitle.trim(), type: newType, status: 'draft' as const, createdAt: Date.now(), updatedAt: Date.now() };
      const ref = await addDoc(collection(db, 'books'), data);
      setBooks(prev => [{ id: ref.id, ...data } as Book, ...prev]);
      setNewTitle(''); setShowNew(false);
      toast.success('Book created!');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    try { await deleteDoc(doc(db, 'books', id)); setBooks(prev => prev.filter(b => b.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const generateStory = async () => {
    if (!genPrompt.trim()) return;
    setGenerating(true); setGenResult('');
    try {
      const text = await generateWithGemini(genPrompt,
        `You are DreamForgeAI, a master children's book storyteller. Write a vivid story in the "${genStyle}" visual style. Structure it with clear pages (Page 1:, Page 2:). Each page: 2-3 paragraphs. Warm, age-appropriate, imaginative.`);
      setGenResult(text); toast.success('Story generated!');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-night text-white">
      <header className="border-b border-white/6 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><Logo /><span className="font-bold text-lg">{appName}</span></div>
          <div className="flex items-center gap-2">
            {isHeadAdmin && <button onClick={() => navigate('/admin')} className="p-2 rounded-lg hover:bg-white/5 text-gold/60 hover:text-gold" title="Admin Panel"><ShieldCheck size={18} /></button>}
            <span className="text-white/40 text-sm hidden sm:block ml-2">{displayName}</span>
            <button onClick={() => signOut(auth)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/60"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Welcome, {displayName}</h1>
          <p className="text-white/40 text-sm">{profile ? `Level ${profile.level} · ${profile.xp} XP · ${profile.subscriptionTier} plan` : 'Ready to create'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <button onClick={() => setShowNew(true)} className="glass-card p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-3"><Plus size={20} className="text-gold" /></div>
            <p className="font-bold text-sm mb-1">New Book</p><p className="text-white/35 text-xs">Start a new story, comic, or anime</p>
          </button>
          <button onClick={() => setShowGen(true)} className="glass-card p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3"><Wand2 size={20} className="text-purple-400" /></div>
            <p className="font-bold text-sm mb-1">Generate Story</p><p className="text-white/35 text-xs">Use Gemini AI to write a story</p>
          </button>
        </div>

        <h2 className="font-bold text-xl mb-4">Your Books</h2>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={24} /></div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm mb-4">No books yet</p>
            <button onClick={() => setShowNew(true)} className="btn-gold !py-3 !px-6 !text-xs">Create First Book</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(b => (
              <div key={b.id} className="glass-card p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center"><BookOpen size={18} className="text-gold" /></div>
                  <button onClick={() => deleteBook(b.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                </div>
                <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                <p className="text-white/30 text-xs capitalize">{b.type} · {b.status}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Book Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative rounded-2xl p-8 w-full max-w-sm" style={{ background: '#13121a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="font-bold text-xl mb-6">New Book</h2>
            <input type="text" placeholder="Book title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-dark mb-4" autoFocus />
            <div className="flex gap-2 mb-6">
              {(['story', 'comic', 'anime'] as const).map(t => (
                <button key={t} onClick={() => setNewType(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${newType === t ? 'bg-gold/15 border-gold/30 text-gold' : 'border-white/8 text-white/40'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={createBook} disabled={creating || !newTitle.trim()} className="btn-gold flex-1 flex items-center justify-center">{creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Story Generator Modal */}
      {showGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowGen(false); setGenResult(''); }} />
          <div className="relative rounded-2xl p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: '#13121a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl">Generate Story</h2>
              <button onClick={() => { setShowGen(false); setGenResult(''); }} className="p-1 text-white/30 hover:text-white/60"><X size={18} /></button>
            </div>
            {!genResult ? (
              <>
                <textarea placeholder="Describe your story..." value={genPrompt} onChange={e => setGenPrompt(e.target.value)} rows={4} className="input-dark mb-4 resize-none" />
                <div className="mb-6">
                  <label className="text-white/40 text-xs uppercase tracking-wider mb-2 block">Art Style</label>
                  <select value={genStyle} onChange={e => setGenStyle(e.target.value)} className="input-dark" style={{ colorScheme: 'dark' }}>
                    <option value="watercolor">Watercolor</option><option value="cartoon">Whimsical Cartoon</option>
                    <option value="anime">Anime / Ghibli</option><option value="sketch">Pencil Sketch</option>
                    <option value="comic">Comic Book</option><option value="midnight-tales">Midnight Tales</option>
                    <option value="neon-noir">Neon Noir</option>
                  </select>
                </div>
                <button onClick={generateStory} disabled={generating || !genPrompt.trim()} className="btn-gold w-full flex items-center justify-center gap-2">
                  {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Wand2 size={16} /> Generate Story</>}
                </button>
              </>
            ) : (
              <>
                <div className="rounded-xl p-6 text-white/70 text-sm leading-relaxed whitespace-pre-wrap mb-6" style={{ background: 'rgba(255,255,255,0.03)' }}>{genResult}</div>
                <div className="flex gap-3">
                  <button onClick={() => setGenResult('')} className="btn-outline flex-1">Try Again</button>
                  <button onClick={() => { navigator.clipboard.writeText(genResult); toast.success('Copied!'); }} className="btn-gold flex-1 flex items-center justify-center gap-2"><FileText size={16} /> Copy</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
