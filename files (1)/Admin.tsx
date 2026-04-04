import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, Book } from '../types';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, Settings, Key, MessageSquare, BookOpen, FileText,
  Crown, Loader2, Trash2, CheckCircle, Clock, Power, Image,
  Palette, Eye, RefreshCw, Copy, Plus, X, DollarSign, BarChart3,
  Type, Sparkles, Globe, Hash
} from 'lucide-react';

interface Props { user: any; profile: UserProfile | null; }

function genCode(): string {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

// Toggle switch component
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-gold' : 'bg-white/10'}`}>
      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${value ? 'left-5.5' : 'left-0.5'}`} />
    </button>
  );
}

export default function Admin({ user, profile }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState<(UserProfile & { uid: string })[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [books, setBooks] = useState<(Book & { ownerEmail?: string })[]>([]);
  const [codes, setCodes] = useState<any[]>([]);

  // Settings
  const [maintenance, setMaintenance] = useState(false);
  const [appName, setAppName] = useState('DreamForge');
  const [appTagline, setAppTagline] = useState('AI-Powered Story Studio');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#c9a227');
  const [showParticles, setShowParticles] = useState(false);
  const [showGrain, setShowGrain] = useState(false);
  const [showVignette, setShowVignette] = useState(false);
  const [terms, setTerms] = useState('');

  // Subscription pricing (editable)
  const [pricing, setPricing] = useState({
    standard: { monthly: 7, yearly: 67.20 },
    premium: { monthly: 19.99, yearly: 191.90 },
    ultimate: { monthly: 40, yearly: 400 },
  });

  // Subscription limits (editable)
  const [limits, setLimits] = useState({
    free: { maxStories: 1, maxPages: 5, maxAiEnhancements: 1 },
    standard: { maxStories: 3, maxPages: 15, maxAiEnhancements: 5 },
    premium: { maxStories: 999, maxPages: 50, maxAiEnhancements: 999 },
    ultimate: { maxStories: 999, maxPages: 100, maxAiEnhancements: 999 },
  });

  const [newCodeTier, setNewCodeTier] = useState<'standard' | 'premium' | 'ultimate'>('standard');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      const allUsers = uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as any));
      setUsers(allUsers);

      const fSnap = await getDocs(collection(db, 'feedback'));
      setFeedback(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const bSnap = await getDocs(collection(db, 'books'));
      const userMap: Record<string, string> = {};
      allUsers.forEach((u: any) => { userMap[u.uid] = u.email; });
      const allBooks = bSnap.docs.map(d => ({ id: d.id, ...d.data(), ownerEmail: userMap[(d.data() as any).userId] || '?' } as any));
      setBooks(allBooks);

      const cSnap = await getDocs(collection(db, 'subscription_codes'));
      setCodes(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const sSnap = await getDoc(doc(db, 'settings', 'global'));
      if (sSnap.exists()) {
        const s = sSnap.data();
        setMaintenance(s.maintenanceMode || false);
        setTerms(s.termsAndConditions || '');
        if (s.uiSettings) {
          setAppName(s.uiSettings.appName || 'DreamForge');
          setAppTagline(s.uiSettings.appTagline || 'AI-Powered Story Studio');
          setLogoUrl(s.uiSettings.logoUrl || '');
          setPrimaryColor(s.uiSettings.primaryColor || '#c9a227');
          setShowParticles(s.uiSettings.showParticles || false);
          setShowGrain(s.uiSettings.showGrain || false);
          setShowVignette(s.uiSettings.showVignette || false);
        }
        if (s.subscriptionPricing) setPricing(s.subscriptionPricing);
        if (s.subscriptionLimits) setLimits(s.subscriptionLimits);
      }
    } catch (e) { console.error('Load error:', e); toast.error('Failed to load some data'); }
    finally { setLoading(false); }
  }

  // ── Save all settings ─────────────────────────────
  async function saveAllSettings() {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        maintenanceMode: maintenance,
        termsAndConditions: terms,
        uiSettings: { appName, appTagline, logoUrl, primaryColor, showParticles, showGrain, showVignette },
        subscriptionPricing: pricing,
        subscriptionLimits: limits,
        updatedAt: Date.now(),
      }, { merge: true });
      toast.success('All settings saved!');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  }

  // ── User actions ──────────────────────────────────
  async function changeRole(uid: string, role: string) {
    try { await updateDoc(doc(db, 'users', uid), { role }); setUsers(p => p.map(u => u.uid === uid ? { ...u, role: role as any } : u)); toast.success('Role updated'); }
    catch { toast.error('Failed'); }
  }
  async function changeTier(uid: string, tier: string) {
    try { await updateDoc(doc(db, 'users', uid), { subscriptionTier: tier }); setUsers(p => p.map(u => u.uid === uid ? { ...u, subscriptionTier: tier as any } : u)); toast.success('Tier updated'); }
    catch { toast.error('Failed'); }
  }
  async function deleteUser(uid: string) {
    if (!confirm('Delete this user permanently?')) return;
    try { await deleteDoc(doc(db, 'users', uid)); setUsers(p => p.filter(u => u.uid !== uid)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  }

  // ── Code actions ──────────────────────────────────
  async function createCode() {
    try {
      const code = genCode();
      const data = { code, tier: newCodeTier, isUsed: false, createdAt: Date.now(), createdBy: user.uid };
      const ref = await addDoc(collection(db, 'subscription_codes'), data);
      setCodes(p => [...p, { id: ref.id, ...data }]);
      toast.success(`Code: ${code}`);
    } catch { toast.error('Failed'); }
  }
  async function deleteCode(id: string) {
    try { await deleteDoc(doc(db, 'subscription_codes', id)); setCodes(p => p.filter(c => c.id !== id)); }
    catch { toast.error('Failed'); }
  }

  // ── Feedback actions ──────────────────────────────
  async function updateFb(id: string, status: string) {
    try { await updateDoc(doc(db, 'feedback', id), { status }); setFeedback(p => p.map(f => f.id === id ? { ...f, status } : f)); }
    catch { toast.error('Failed'); }
  }
  async function deleteFb(id: string) {
    try { await deleteDoc(doc(db, 'feedback', id)); setFeedback(p => p.filter(f => f.id !== id)); }
    catch { toast.error('Failed'); }
  }

  // ── Book actions ──────────────────────────────────
  async function deleteBookAdmin(id: string) {
    if (!confirm('Delete this book?')) return;
    try { await deleteDoc(doc(db, 'books', id)); setBooks(p => p.filter(b => b.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  }

  // Helper to update pricing
  function updatePrice(tier: 'standard' | 'premium' | 'ultimate', field: 'monthly' | 'yearly', val: string) {
    setPricing(p => ({ ...p, [tier]: { ...p[tier], [field]: parseFloat(val) || 0 } }));
  }

  // Helper to update limits
  function updateLimit(tier: 'free' | 'standard' | 'premium' | 'ultimate', field: string, val: string) {
    setLimits((p: any) => ({ ...p, [tier]: { ...p[tier], [field]: parseInt(val) || 0 } }));
  }

  const tabs = [
    { id: 'stats', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'codes', label: 'Codes', icon: Key, count: codes.filter(c => !c.isUsed).length },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, count: feedback.filter(f => f.status === 'pending').length },
    { id: 'books', label: 'All Books', icon: BookOpen, count: books.length },
    { id: 'terms', label: 'Terms', icon: FileText },
  ];

  const tierColors: Record<string, string> = { free: 'text-white/40', standard: 'text-blue-400', premium: 'text-purple-400', ultimate: 'text-gold' };

  return (
    <div className="min-h-screen bg-night text-white">
      <header className="border-b border-white/6 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/5 text-white/40"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2"><h1 className="font-bold text-lg">Head Admin</h1><Crown size={16} className="text-gold" /></div>
            <p className="text-white/30 text-xs">{user?.email}</p>
          </div>
          <button onClick={loadAll} className="p-2 rounded-lg hover:bg-white/5 text-white/30" title="Refresh"><RefreshCw size={16} /></button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tabs — scrollable */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 -mx-1 px-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-gold/10 text-gold border border-gold/20' : 'text-white/40 hover:text-white/60 hover:bg-white/3 border border-transparent'}`}>
              <t.icon size={13} />{t.label}
              {t.count !== undefined && t.count > 0 && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={24} /></div> : <>

          {/* ═══ STATS ═══ */}
          {tab === 'stats' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: users.length, icon: Users },
                { label: 'Total Books', value: books.length, icon: BookOpen },
                { label: 'Head Admins', value: users.filter(u => u.role === 'headadmin').length, icon: Crown },
                { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Crown },
                { label: 'Pending Feedback', value: feedback.filter(f => f.status === 'pending').length, icon: MessageSquare },
                { label: 'Unused Codes', value: codes.filter(c => !c.isUsed).length, icon: Key },
                { label: 'Free Users', value: users.filter(u => u.subscriptionTier === 'free').length, icon: Users },
                { label: 'Paid Users', value: users.filter(u => u.subscriptionTier !== 'free').length, icon: DollarSign },
              ].map(s => (
                <div key={s.label} className="glass-card rounded-xl p-5">
                  <s.icon size={16} className="text-gold/50 mb-2" />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-white/30 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ═══ USERS ═══ */}
          {tab === 'users' && (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.uid} className="glass-card rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{u.displayName || 'No name'}</p>
                      {u.role === 'headadmin' && <Crown size={12} className="text-gold" />}
                    </div>
                    <p className="text-white/30 text-xs truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <select value={u.role} onChange={e => changeRole(u.uid, e.target.value)} className="input-dark !py-1.5 !px-2 !text-xs !rounded-lg !w-auto" style={{ colorScheme: 'dark' }}>
                      <option value="user">User</option><option value="admin">Admin</option><option value="headadmin">Head Admin</option>
                    </select>
                    <select value={u.subscriptionTier} onChange={e => changeTier(u.uid, e.target.value)} className="input-dark !py-1.5 !px-2 !text-xs !rounded-lg !w-auto" style={{ colorScheme: 'dark' }}>
                      <option value="free">Free</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="ultimate">Ultimate</option>
                    </select>
                    {u.uid !== user?.uid && <button onClick={() => deleteUser(u.uid)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400"><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ APPEARANCE ═══ */}
          {tab === 'appearance' && (
            <div className="max-w-lg space-y-6">
              {/* App Name */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3"><Type size={16} className="text-gold" /><span className="font-semibold text-sm">App Name</span></div>
                <input type="text" value={appName} onChange={e => setAppName(e.target.value)} className="input-dark" placeholder="DreamForge" />
              </div>

              {/* Tagline */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3"><Globe size={16} className="text-gold" /><span className="font-semibold text-sm">Tagline</span></div>
                <input type="text" value={appTagline} onChange={e => setAppTagline(e.target.value)} className="input-dark" placeholder="AI-Powered Story Studio" />
              </div>

              {/* Logo */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3"><Image size={16} className="text-gold" /><span className="font-semibold text-sm">Logo URL</span></div>
                <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="input-dark mb-3" placeholder="https://example.com/logo.png" />
                {logoUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-white/40 text-xs">Preview</span>
                  </div>
                )}
                <p className="text-white/20 text-xs mt-2">Paste any image URL. Use a square image for best results.</p>
              </div>

              {/* Primary Color */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3"><Palette size={16} className="text-gold" /><span className="font-semibold text-sm">Primary Color</span></div>
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                  <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="input-dark !w-32 !text-xs font-mono" />
                </div>
              </div>

              {/* Effects */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1"><Eye size={16} className="text-gold" /><span className="font-semibold text-sm">Visual Effects</span></div>
                {[
                  { label: 'Floating Particles', val: showParticles, set: setShowParticles },
                  { label: 'Film Grain Overlay', val: showGrain, set: setShowGrain },
                  { label: 'Vignette Effect', val: showVignette, set: setShowVignette },
                ].map(i => (
                  <div key={i.label} className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">{i.label}</span>
                    <Toggle value={i.val} onChange={i.set} />
                  </div>
                ))}
              </div>

              <button onClick={saveAllSettings} className="btn-gold w-full">Save Appearance</button>
            </div>
          )}

          {/* ═══ SUBSCRIPTIONS ═══ */}
          {tab === 'subscriptions' && (
            <div className="space-y-8">
              {/* Pricing */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign size={18} className="text-gold" /> Pricing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['standard', 'premium', 'ultimate'] as const).map(tier => (
                    <div key={tier} className="glass-card rounded-xl p-6">
                      <h4 className={`font-bold text-sm capitalize mb-4 ${tierColors[tier]}`}>{tier}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-white/30 text-xs block mb-1">Monthly ($)</label>
                          <input type="number" step="0.01" value={pricing[tier].monthly} onChange={e => updatePrice(tier, 'monthly', e.target.value)} className="input-dark !py-2 !text-sm" />
                        </div>
                        <div>
                          <label className="text-white/30 text-xs block mb-1">Yearly ($)</label>
                          <input type="number" step="0.01" value={pricing[tier].yearly} onChange={e => updatePrice(tier, 'yearly', e.target.value)} className="input-dark !py-2 !text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limits */}
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Hash size={18} className="text-gold" /> Tier Limits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['free', 'standard', 'premium', 'ultimate'] as const).map(tier => (
                    <div key={tier} className="glass-card rounded-xl p-6">
                      <h4 className={`font-bold text-sm capitalize mb-4 ${tierColors[tier]}`}>{tier}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-white/30 text-xs block mb-1">Max Stories</label>
                          <input type="number" value={limits[tier].maxStories} onChange={e => updateLimit(tier, 'maxStories', e.target.value)} className="input-dark !py-2 !text-sm" />
                        </div>
                        <div>
                          <label className="text-white/30 text-xs block mb-1">Max Pages/Story</label>
                          <input type="number" value={limits[tier].maxPages} onChange={e => updateLimit(tier, 'maxPages', e.target.value)} className="input-dark !py-2 !text-sm" />
                        </div>
                        <div>
                          <label className="text-white/30 text-xs block mb-1">AI Enhancements</label>
                          <input type="number" value={limits[tier].maxAiEnhancements} onChange={e => updateLimit(tier, 'maxAiEnhancements', e.target.value)} className="input-dark !py-2 !text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-white/20 text-xs mt-3">Use 999 for unlimited.</p>
              </div>

              <button onClick={saveAllSettings} className="btn-gold">Save Subscriptions</button>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {tab === 'settings' && (
            <div className="max-w-lg space-y-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Power size={16} className="text-gold" /><span className="font-semibold text-sm">Maintenance Mode</span></div>
                  <Toggle value={maintenance} onChange={setMaintenance} />
                </div>
                <p className="text-white/30 text-xs">Only head admins can access the app when enabled.</p>
              </div>
              <button onClick={saveAllSettings} className="btn-gold w-full">Save Settings</button>
            </div>
          )}

          {/* ═══ CODES ═══ */}
          {tab === 'codes' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <select value={newCodeTier} onChange={e => setNewCodeTier(e.target.value as any)} className="input-dark !w-auto !py-2 !px-3 !text-sm" style={{ colorScheme: 'dark' }}>
                  <option value="standard">Standard</option><option value="premium">Premium</option><option value="ultimate">Ultimate</option>
                </select>
                <button onClick={createCode} className="btn-gold !py-2.5 !px-5 !text-xs flex items-center gap-2"><Plus size={14} /> Generate Code</button>
              </div>
              <div className="space-y-2">
                {codes.length === 0 && <p className="text-white/20 text-sm py-10 text-center">No codes</p>}
                {codes.map(c => (
                  <div key={c.id} className="glass-card rounded-xl px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className="text-gold font-mono text-sm tracking-wider">{c.code}</code>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.tier === 'ultimate' ? 'bg-gold/10 text-gold' : c.tier === 'premium' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>{c.tier}</span>
                      {c.isUsed && <span className="text-[10px] text-emerald-400">USED</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!'); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20"><Copy size={14} /></button>
                      <button onClick={() => deleteCode(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ FEEDBACK ═══ */}
          {tab === 'feedback' && (
            <div className="space-y-3">
              {feedback.length === 0 && <p className="text-white/20 text-sm py-10 text-center">No feedback</p>}
              {feedback.map(f => (
                <div key={f.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${f.type === 'bug' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{f.type}</span>
                      <span className="text-white/25 text-xs">{f.userEmail}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${f.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : f.status === 'reviewed' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-white/5 text-white/30'}`}>{f.status}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {f.status === 'pending' && <button onClick={() => updateFb(f.id, 'reviewed')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20" title="Review"><Clock size={14} /></button>}
                      {f.status !== 'resolved' && <button onClick={() => updateFb(f.id, 'resolved')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20" title="Resolve"><CheckCircle size={14} /></button>}
                      <button onClick={() => deleteFb(f.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm">{f.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* ═══ ALL BOOKS ═══ */}
          {tab === 'books' && (
            <div className="space-y-2">
              {books.length === 0 && <p className="text-white/20 text-sm py-10 text-center">No books</p>}
              {books.map(b => (
                <div key={b.id} className="glass-card rounded-xl px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{b.title}</p>
                    <p className="text-white/30 text-xs truncate">{b.ownerEmail} · <span className="capitalize">{b.type}</span> · <span className="capitalize">{b.status}</span></p>
                  </div>
                  <button onClick={() => deleteBookAdmin(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {/* ═══ TERMS ═══ */}
          {tab === 'terms' && (
            <div className="max-w-2xl">
              <h3 className="font-bold text-lg mb-4">Terms & Conditions</h3>
              <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={15} className="input-dark resize-none mb-4 font-mono text-xs leading-relaxed" placeholder="Write your terms and conditions..." />
              <button onClick={saveAllSettings} className="btn-gold">Save Terms</button>
            </div>
          )}

        </>}
      </div>
    </div>
  );
}
