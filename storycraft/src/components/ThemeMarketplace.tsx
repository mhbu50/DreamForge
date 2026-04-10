import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { Theme, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Heart, Download, Plus, X, Search, Sparkles, Code, Layout, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function ThemeMarketplace() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  // Upload Form State
  const [newTheme, setNewTheme] = useState({
    name: '',
    description: '',
    css: '',
    isPublic: true
  });

  useEffect(() => {
    const q = query(collection(db, 'themes'), where('isPublic', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setThemes(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Theme)));
      setLoading(false);
    });

    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(docSnap => {
        if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfile);
      });
    }

    return () => unsubscribe();
  }, []);

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'themes', id), {
        likes: increment(1)
      });
      toast.success('Liked!');
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleApply = async (theme: Theme) => {
    if (!auth.currentUser) return toast.error("Please login to apply themes");
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        activeThemeId: theme.id
      });
      
      // Inject CSS
      let styleTag = document.getElementById('dreamforge-custom-theme');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dreamforge-custom-theme';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = theme.css;
      
      toast.success(`Applied theme: ${theme.name}`);
    } catch (error) {
      toast.error('Failed to apply theme');
    }
  };

  const handleUpload = async () => {
    if (!auth.currentUser) return;
    if (!newTheme.name || !newTheme.css) return toast.error("Name and CSS are required");

    try {
      await addDoc(collection(db, 'themes'), {
        userId: auth.currentUser.uid,
        authorName: userProfile?.displayName || 'Anonymous',
        name: newTheme.name,
        description: newTheme.description,
        css: newTheme.css,
        isPublic: newTheme.isPublic,
        likes: 0,
        downloads: 0,
        createdAt: Date.now(),
        config: {}
      });
      toast.success("Theme shared successfully!");
      setIsUploading(false);
      setNewTheme({ name: '', description: '', css: '', isPublic: true });
    } catch (error) {
      toast.error("Failed to share theme");
    }
  };

  const filteredThemes = themes.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center luxury-bg">
        <div className="atmosphere" />
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-night animate-float">
            <Palette className="animate-pulse" size={32} />
          </div>
          <p className="small-caps text-gold animate-pulse">Loading Styles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 pb-32">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl font-serif font-light mb-4">Theme <span className="italic text-gold">Marketplace</span></h1>
          <p className="text-black/40 small-caps tracking-[0.3em] text-xs">Customize your forge with community-crafted styles</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input 
              type="text"
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-gold/20 transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => setIsUploading(true)}
            className="px-6 py-3 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all flex items-center gap-2 shadow-xl"
          >
            <Plus size={18} />
            <span>Share Theme</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredThemes.map((theme) => (
          <motion.div 
            key={theme.id}
            whileHover={{ y: -5 }}
            className="group bg-white border border-black/5 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all"
          >
            <div className="aspect-video bg-black/5 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-10 pattern-dots" />
              <Palette size={48} className="text-gold/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => handleLike(theme.id, e)}
                  className="p-3 bg-white/80 backdrop-blur-md rounded-xl hover:bg-gold hover:text-night transition-all shadow-lg"
                >
                  <Heart size={16} className={theme.likes ? "fill-current" : ""} />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-serif font-bold">{theme.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/20">By {theme.authorName}</span>
              </div>
              <p className="text-sm text-black/40 mb-8 line-clamp-2 leading-relaxed">{theme.description || 'A beautiful custom theme for StoryCraft.'}</p>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-bold text-black/20">
                  <span className="flex items-center gap-1"><Heart size={12} /> {theme.likes || 0}</span>
                  <span className="flex items-center gap-1"><Download size={12} /> {theme.downloads || 0}</span>
                </div>
                <button 
                  onClick={() => handleApply(theme)}
                  className="px-6 py-3 bg-black/5 hover:bg-gold hover:text-night rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Apply Theme
                </button>
                <button 
                  onClick={() => setPreviewTheme(theme)}
                  className="p-3 bg-black/5 hover:bg-black hover:text-white rounded-xl transition-all"
                  title="Preview Theme"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTheme && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreviewTheme(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]"
            >
              {/* Preview Side */}
              <div className="flex-1 bg-gray-50 relative overflow-hidden flex flex-col">
                <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gold/10 text-gold rounded-lg flex items-center justify-center">
                      <Eye size={18} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Live Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                </div>
                
                <div className="flex-1 p-8 overflow-hidden">
                  <iframe 
                    title="Theme Preview"
                    className="w-full h-full rounded-2xl border border-black/5 shadow-inner bg-white"
                    srcDoc={`
                      <html>
                        <head>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>
                            ${previewTheme.css}
                            body { margin: 0; padding: 2rem; font-family: sans-serif; transition: all 0.5s ease; }
                            .sample-card { 
                              max-width: 400px; 
                              margin: 0 auto; 
                              padding: 2rem; 
                              border-radius: 2rem; 
                              box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                              background: white;
                              border: 1px solid rgba(0,0,0,0.05);
                            }
                          </style>
                        </head>
                        <body class="luxury-bg">
                          <div class="atmosphere"></div>
                          <div class="sample-card">
                            <h1 class="text-3xl font-serif font-bold mb-4" style="color: var(--color-gold, #d4af37)">The Eternal Forge</h1>
                            <p class="text-sm opacity-60 mb-8 leading-relaxed">This is a preview of how your forge will look with the <strong>${previewTheme.name}</strong> theme applied.</p>
                            
                            <div class="space-y-4">
                              <div class="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                                <div class="h-full bg-gold w-2/3" style="background-color: var(--color-gold, #d4af37)"></div>
                              </div>
                              <div class="flex justify-between items-center">
                                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Forge Progress</span>
                                <span class="text-[10px] font-bold text-gold" style="color: var(--color-gold, #d4af37)">67%</span>
                              </div>
                            </div>
                            
                            <button class="w-full mt-8 py-4 bg-black text-white rounded-xl font-bold text-sm hover:opacity-80 transition-all" style="background-color: var(--color-night, #0a0a0a); color: var(--color-gold, #d4af37)">
                              Continue Creation
                            </button>
                          </div>
                        </body>
                      </html>
                    `}
                  />
                </div>
              </div>

              {/* Info Side */}
              <div className="w-full md:w-80 p-10 flex flex-col justify-between bg-white border-l border-black/5">
                <div>
                  <button 
                    onClick={() => setPreviewTheme(null)}
                    className="mb-8 p-2 hover:bg-black/5 rounded-xl transition-all text-black/40"
                  >
                    <X size={24} />
                  </button>
                  
                  <h3 className="text-3xl font-serif font-bold mb-2">{previewTheme.name}</h3>
                  <p className="text-xs text-black/40 uppercase tracking-widest font-bold mb-6">By {previewTheme.authorName}</p>
                  
                  <div className="space-y-6 mb-8">
                    <p className="text-sm text-black/60 leading-relaxed">{previewTheme.description || 'A beautiful custom theme for StoryCraft.'}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/5 rounded-2xl text-center">
                        <div className="text-lg font-bold">{previewTheme.likes || 0}</div>
                        <div className="text-[8px] uppercase tracking-widest text-black/40 font-bold">Likes</div>
                      </div>
                      <div className="p-4 bg-black/5 rounded-2xl text-center">
                        <div className="text-lg font-bold">{previewTheme.downloads || 0}</div>
                        <div className="text-[8px] uppercase tracking-widest text-black/40 font-bold">Downloads</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      handleApply(previewTheme);
                      setPreviewTheme(null);
                    }}
                    className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} />
                    <span>Apply Theme</span>
                  </button>
                  <button 
                    onClick={() => setPreviewTheme(null)}
                    className="w-full py-4 text-black/40 text-xs font-bold uppercase tracking-widest hover:text-black transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploading && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsUploading(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
                    <Code size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold">Share Custom Theme</h3>
                    <p className="text-xs text-black/40 uppercase tracking-widest font-bold">Inject your own CSS into the forge</p>
                  </div>
                </div>
                <button onClick={() => setIsUploading(false)} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Theme Name</label>
                  <input 
                    type="text"
                    value={newTheme.name}
                    onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                    placeholder="e.g., Midnight Velvet"
                    className="w-full bg-black/5 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-gold/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Description</label>
                  <textarea 
                    value={newTheme.description}
                    onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                    placeholder="Describe the aesthetic..."
                    className="w-full h-24 bg-black/5 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-gold/20 transition-all font-medium resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Custom CSS</label>
                    <span className="text-[10px] text-gold font-bold">Supports Tailwind & Standard CSS</span>
                  </div>
                  <textarea 
                    value={newTheme.css}
                    onChange={(e) => setNewTheme({ ...newTheme, css: e.target.value })}
                    placeholder=":root { --color-gold: #ff0000; } .luxury-bg { background: black; }"
                    className="w-full h-64 bg-black/5 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-gold/20 transition-all font-mono text-sm resize-none"
                  />
                  <p className="text-[10px] text-black/40 italic">Tip: Use CSS variables like --color-gold, --color-night, --font-sans to override system defaults.</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-black/5 rounded-xl">
                  <input 
                    type="checkbox"
                    checked={newTheme.isPublic}
                    onChange={(e) => setNewTheme({ ...newTheme, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded border-black/10 text-gold focus:ring-gold/20"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Make Public in Marketplace</span>
                </label>
              </div>

              <button 
                onClick={handleUpload}
                className="w-full mt-8 py-5 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                <span>Publish Theme</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
