import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { Story, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Heart, Search, BookOpen, ChevronRight, Star, DollarSign, Filter, X, ChevronLeft, Volume2, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Marketplace() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [selectedStyle, setSelectedStyle] = useState<string>('all');

  useEffect(() => {
    const q = query(collection(db, 'stories'), where('isPublished', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStories(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Story)));
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
      await updateDoc(doc(db, 'stories', id), {
        likes: increment(1)
      });
      toast.success('Liked!');
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleBuy = (story: Story) => {
    if (!auth.currentUser) return toast.error("Please login to purchase");
    
    const isUltimate = userProfile?.subscriptionTier === 'ultimate';

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, isUltimate ? 500 : 2000)),
      {
        loading: isUltimate ? 'Unlocking for free...' : 'Processing secure payment...',
        success: () => {
          return isUltimate 
            ? `"${story.title}" unlocked for free with Ultimate!` 
            : `Successfully purchased "${story.title}"!`;
        },
        error: 'Operation failed'
      }
    );
  };

  const filteredStories = stories.filter(s => 
    (s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.authorName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedStyle === 'all' || s.style === selectedStyle)
  );

  const featuredStories = stories.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="atmosphere" />
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-night animate-float">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <p className="small-caps text-gold animate-pulse">Entering the Archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-gold selection:text-night">
      <div className="atmosphere" />
      
      {/* Navigation */}
      <nav className="px-8 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 bg-black/50 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-night group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          <span className="font-serif text-2xl tracking-tight">StoryCraft <span className="text-gold italic">Market</span></span>
        </Link>
        
        <div className="flex-1 max-w-xl mx-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text"
            placeholder="Search masterpieces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-gold/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Studio</Link>
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold">
            {userProfile?.displayName?.[0] || 'U'}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-7xl relative z-10">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2 className="text-7xl font-serif font-light mb-4 tracking-tight">The <span className="italic text-gold">Collection</span></h2>
            <p className="text-white/40 small-caps tracking-[0.4em] text-xs">Curated crafted ebooks from around the world</p>
          </div>
          
          <div className="flex items-center gap-4 p-2 bg-white/5 rounded-2xl border border-white/10">
            <Filter className="ml-4 text-white/20" size={18} />
            <select 
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold uppercase tracking-widest p-3 pr-8 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#0a0a0a]">All Styles</option>
              <option value="watercolor" className="bg-[#0a0a0a]">Watercolor</option>
              <option value="cartoon" className="bg-[#0a0a0a]">Whimsical</option>
              <option value="anime" className="bg-[#0a0a0a]">Ghibli Magic</option>
              <option value="oil-painting" className="bg-[#0a0a0a]">Oil Painting</option>
              <option value="cinematic" className="bg-[#0a0a0a]">Cinematic</option>
              <option value="cyberpunk" className="bg-[#0a0a0a]">Cyberpunk</option>
            </select>
          </div>
        </header>

        {/* Featured Section */}
        {featuredStories.length > 0 && searchTerm === '' && selectedStyle === 'all' && (
          <section className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <span className="w-12 h-[1px] bg-gold/20" />
              <h3 className="text-xs font-bold uppercase tracking-[0.5em] text-gold">Featured Masterpieces</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {featuredStories.map((story) => (
                <motion.div 
                  key={`featured-${story.id}`}
                  whileHover={{ scale: 1.02 }}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
                    <img 
                      src={story.pages[0].imageUrl} 
                      alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-gold text-night px-3 py-1 rounded-full">Featured</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">{story.style}</span>
                      </div>
                      <h4 className="text-3xl font-serif font-bold group-hover:text-gold transition-colors">{story.title}</h4>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center gap-4 mb-12">
          <span className="w-12 h-[1px] bg-white/10" />
          <h3 className="text-xs font-bold uppercase tracking-[0.5em] text-white/20">All Stories</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredStories.map((story) => (
            <motion.div 
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              className="group relative"
              onClick={() => setSelectedStory(story)}
            >
              <div className="aspect-[3/4] rounded-[2rem] overflow-hidden relative mb-6 border border-white/10 shadow-2xl">
                <img 
                  src={story.pages[0].imageUrl} 
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button 
                    onClick={(e) => handleLike(story.id, e)}
                    className="p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-gold hover:text-night transition-all"
                  >
                    <Heart size={18} className={story.likes ? "fill-current" : ""} />
                  </button>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-gold text-night px-3 py-1 rounded-full">
                      {story.style}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                      {story.pages.length} Pages
                    </span>
                  </div>
                  <h3 className="text-3xl font-serif font-bold mb-2 group-hover:text-gold transition-colors">{story.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <User size={12} />
                      <span>{story.authorName}</span>
                    </div>
                    <div className="text-gold font-bold text-xl">
                      {userProfile?.subscriptionTier === 'ultimate' ? (
                        <span className="flex items-center gap-1">
                          <span className="line-through text-white/20 text-sm">${story.price?.toFixed(2)}</span>
                          <span>FREE</span>
                        </span>
                      ) : (
                        `$${story.price?.toFixed(2)}`
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <section className="mt-32 py-24 border-t border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
              <span className="text-5xl font-serif font-bold text-gold">1.2k+</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Masterpieces Crafted</p>
            </div>
            <div className="space-y-2">
              <span className="text-5xl font-serif font-bold text-gold">850</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Active Dreamers</p>
            </div>
            <div className="space-y-2">
              <span className="text-5xl font-serif font-bold text-gold">$12k</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Creator Earnings</p>
            </div>
            <div className="space-y-2">
              <span className="text-5xl font-serif font-bold text-gold">4.9</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Average Rating</p>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="mt-24 bg-gold rounded-[4rem] p-20 text-night relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-6xl font-serif font-bold mb-6 leading-tight">Join the <br /> <span className="italic">Inner Circle</span></h3>
            <p className="text-night/60 mb-10 text-lg">Get early access to new artistic styles and featured collections every week.</p>
            <div className="flex gap-4">
              <input 
                type="email" 
                placeholder="Enter your email..." 
                className="flex-1 bg-white/20 border border-night/10 rounded-2xl px-8 py-5 outline-none placeholder:text-night/40 font-medium"
              />
              <button className="px-10 py-5 bg-night text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-2xl shadow-night/20">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] w-full max-w-5xl rounded-[3rem] overflow-hidden border border-white/10 flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="w-full md:w-1/2 relative bg-black flex items-center justify-center p-8 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <img src={selectedStory.pages[isPreviewing ? previewPage : 0].imageUrl} className="w-full h-full object-cover blur-3xl" alt="" />
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={isPreviewing ? previewPage : 'cover'}
                    initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                    className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl relative z-10"
                  >
                    <img 
                      src={selectedStory.pages[isPreviewing ? previewPage : 0].imageUrl} 
                      alt={selectedStory.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </motion.div>
                </AnimatePresence>
                
                {isPreviewing && (
                  <div className="absolute inset-x-0 bottom-12 flex items-center justify-center gap-8 z-20">
                    <button 
                      onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                      disabled={previewPage === 0}
                      className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all disabled:opacity-20"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <span className="small-caps text-xs text-white/40">Page {previewPage + 1} of {selectedStory.pages.length}</span>
                    <button 
                      onClick={() => setPreviewPage(p => Math.min(selectedStory.pages.length - 1, p + 1))}
                      disabled={previewPage === selectedStory.pages.length - 1}
                      className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all disabled:opacity-20"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-12 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-5xl font-serif font-bold mb-2 leading-tight">{selectedStory.title}</h2>
                    <p className="text-gold small-caps tracking-widest text-sm">By {selectedStory.authorName}</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedStory(null); setIsPreviewing(false); setPreviewPage(0); }}
                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6 mb-12 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="flex items-center gap-6 text-white/40 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} />
                      <span>{selectedStory.pages.length} Pages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-gold fill-current" />
                      <span>4.9 (128 reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-red-500 fill-current" />
                      <span>{selectedStory.likes || 0} Likes</span>
                    </div>
                  </div>

                  <p className="text-xl text-white/60 leading-relaxed italic font-light">
                    "{selectedStory.pages[isPreviewing ? previewPage : 0].text}"
                  </p>

                  <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-6">Masterpiece Details</h4>
                    <div className="grid grid-cols-2 gap-8 text-sm">
                      <div>
                        <span className="text-white/20 block mb-1">Art Style</span>
                        <span className="capitalize font-medium">{selectedStory.style}</span>
                      </div>
                      <div>
                        <span className="text-white/20 block mb-1">Crafted On</span>
                        <span className="font-medium">{new Date(selectedStory.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsPreviewing(!isPreviewing)}
                    className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen size={20} />
                    {isPreviewing ? 'Close Preview' : 'Preview Sample'}
                  </button>
                  <button 
                    onClick={() => handleBuy(selectedStory)}
                    className="flex-[2] py-5 bg-gold text-night rounded-2xl font-bold text-xl hover:bg-gold/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gold/20"
                  >
                    {userProfile?.subscriptionTier === 'ultimate' ? (
                      <>
                        <Sparkles size={20} />
                        <span>Get for Free</span>
                      </>
                    ) : (
                      <>
                        <DollarSign size={20} />
                        <span>Buy for ${selectedStory.price?.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
