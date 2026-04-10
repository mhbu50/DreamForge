import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FileText, Loader2, ImageIcon, Plus, Trash2, Wand2, ChevronLeft, ChevronRight, X, Edit3, Mic, MicOff, Languages, Layout, Zap, Type, Image as ImageIconLucide, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Settings, Sliders } from 'lucide-react';
import { StoryStyle, StoryPage, SubscriptionTier, ImageAdjustments } from '../types';
import ImageEditor from './ImageEditor';
import { getSubscriptionLimits, STORY_STYLES, STORY_CATEGORIES, FONTS } from '../constants';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface StoryCreatorProps {
  onComplete: (title: string, pages: StoryPage[], style: StoryStyle, category: string, language: string, ageGroup: string, bookType: 'story' | 'comic' | 'anime' | 'novel' | 'manga' | 'biography' | 'other', authorName: string, coverImage: string, coverImageAdjustments?: ImageAdjustments) => void;
  onCancel: () => void;
  userDisplayName: string;
  userSubscriptionTier: SubscriptionTier;
  subscriptionLimits: any;
  userId: string;
  userTokens: number;
  bookType: 'story' | 'comic' | 'anime' | 'novel' | 'manga' | 'biography' | 'other';
  config?: any;
  initialStory?: any;
}

// Removed NarratorVoice type as AI narration is disabled

const TEMPLATES = [
  { id: 'birthday', name: 'Birthday Surprise', idea: 'A magical birthday party where the presents come to life.' },
  { id: 'space', name: 'Space Explorer', idea: 'A young astronaut discovers a planet made of candy.' },
  { id: 'forest', name: 'Secret Forest', idea: 'A hidden door in a tree leads to a kingdom of talking animals.' },
  { id: 'ocean', name: 'Deep Sea Quest', idea: 'A brave submarine pilot finds a lost city of gold.' }
];

const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Spanish', name: 'Español' },
  { code: 'French', name: 'Français' },
  { code: 'Arabic', name: 'العربية' },
  { code: 'Japanese', name: '日本語' },
  { code: 'German', name: 'Deutsch' }
];

const AGE_GROUPS = [
  { id: '0-3', name: '0-3 (Picture Books)' },
  { id: '3-5', name: '3-5 (Early Reader)' },
  { id: '6-8', name: '6-8 (Chapter Books)' },
  { id: '9-12', name: '9-12 (Middle Grade)' },
  { id: 'YA', name: 'Young Adult' },
  { id: 'Adult', name: 'Adult' }
];

export default function StoryCreator({ onComplete, onCancel, userDisplayName, userSubscriptionTier, subscriptionLimits, userId, userTokens, bookType, config, initialStory }: StoryCreatorProps) {
  const limits = subscriptionLimits || getSubscriptionLimits(userSubscriptionTier);
  const tokenCost = initialStory ? 0 : (limits.bookTokenCost || 1);
  const [step, setStep] = useState<'setup' | 'manual'>(initialStory ? 'manual' : 'setup');
  const [idea, setIdea] = useState('');
  const [style, setStyle] = useState<StoryStyle>(initialStory?.style || 'watercolor');
  const [category, setCategory] = useState(initialStory?.category || 'adventure');
  const [language, setLanguage] = useState(initialStory?.language || 'English');
  const [ageGroup, setAgeGroup] = useState(initialStory?.ageGroup || '3-5');
  const [pageCount, setPageCount] = useState(initialStory?.pages?.length || 4);
  
  const [draftTitle, setDraftTitle] = useState(initialStory?.title || '');
  const [authorName, setAuthorName] = useState(initialStory?.authorName || userDisplayName);
  const [coverImage, setCoverImage] = useState(initialStory?.coverImage || '');
  const [coverImageAdjustments, setCoverImageAdjustments] = useState<ImageAdjustments | undefined>(initialStory?.coverImageAdjustments);
  const [draftPages, setDraftPages] = useState<{ text: string; imageUrl?: string; imageAdjustments?: ImageAdjustments; style?: StoryStyle; font?: string; alignment?: 'left' | 'center' | 'right'; fontSize?: string; color?: string }[]>(initialStory?.pages || []);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | 'cover' | null>(null);
  const [isForgingTransition, setIsForgingTransition] = useState(false);
  const [isFinalForging, setIsFinalForging] = useState(false);

  const maxPages = limits.maxPagesPerStory;
  const minPages = 1;

  const handleManualStart = () => {
    setIsForgingTransition(true);
    
    setTimeout(() => {
      if (draftPages.length === 0) {
        const initialPages = Array.from({ length: pageCount }).map(() => ({
          text: '',
          font: 'serif',
          alignment: 'left' as const,
          fontSize: 'text-xl',
          color: '#000000'
        }));
        setDraftPages(initialPages);
      } else if (draftPages.length !== pageCount) {
        // Adjust page count if it changed in setup
        if (draftPages.length < pageCount) {
          const extra = Array.from({ length: pageCount - draftPages.length }).map(() => ({
            text: '',
            font: 'serif',
            alignment: 'left' as const,
            fontSize: 'text-xl',
            color: '#000000'
          }));
          setDraftPages([...draftPages, ...extra]);
        } else {
          setDraftPages(draftPages.slice(0, pageCount));
        }
      }
      setIsForgingTransition(false);
      setStep('manual');
    }, 2000);
  };

  const handleAddPage = () => {
    if (draftPages.length >= maxPages) {
      return toast.error(`You've reached the limit of ${maxPages} pages for this project.`);
    }
    setDraftPages([...draftPages, { text: '', font: 'serif', alignment: 'left', fontSize: 'text-xl', color: '#000000' }]);
    setCurrentPageIndex(draftPages.length);
  };

  const handleRemovePage = (index: number) => {
    if (draftPages.length <= 1) return;
    const newPages = draftPages.filter((_, i) => i !== index);
    setDraftPages(newPages);
    setCurrentPageIndex(Math.max(0, index - 1));
  };

  const handleUpdatePage = (index: number, updates: Partial<typeof draftPages[0]>) => {
    const newPages = [...draftPages];
    newPages[index] = { ...newPages[index], ...updates };
    setDraftPages(newPages);
  };

  const handleSaveImageAdjustments = (adjustments: ImageAdjustments) => {
    if (editingImageIndex === 'cover') {
      setCoverImageAdjustments(adjustments);
      setShowImageEditor(false);
      setEditingImageIndex(null);
    } else if (typeof editingImageIndex === 'number') {
      handleUpdatePage(editingImageIndex, { imageAdjustments: adjustments });
      setShowImageEditor(false);
      setEditingImageIndex(null);
    }
  };

  const handleImageUpload = (index: number | 'cover') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const url = readerEvent.target?.result as string;
          if (index === 'cover') {
            setCoverImage(url);
            toast.success("Cover image added!");
          } else {
            handleUpdatePage(index, { imageUrl: url });
            toast.success("Image added to page!");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const wrapSelection = (index: number, prefix: string, suffix: string) => {
    const textarea = document.getElementById(`page-text-${index}`) as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = draftPages[index].text;
    const selected = text.substring(start, end);
    
    if (start === end) return; // No selection
    
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    handleUpdatePage(index, { text: newText });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {isForgingTransition ? (
          <motion.div
            key="forging-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border-2 border-gold/20 rounded-full border-t-gold"
              />
              <motion.div 
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-gold"
              >
                <Sparkles size={40} />
              </motion.div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-night">Preparing the Forge</h2>
              <p className="text-black/40 small-caps tracking-widest text-[10px]">Gathering creative essence...</p>
            </div>
          </motion.div>
        ) : step === 'setup' ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="min-h-[80vh] flex flex-col items-center justify-center p-8 relative"
          >
            <div className="atmosphere opacity-[0.05]" />
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              {/* Book Cover Preview */}
              <div className="relative group perspective-1000 hidden lg:block">
                <motion.div 
                  initial={{ rotateY: -20 }}
                  animate={{ rotateY: -5 }}
                  whileHover={{ rotateY: 0 }}
                  onClick={() => handleImageUpload('cover')}
                  className="aspect-[3/4] bg-night rounded-r-[2rem] shadow-2xl relative overflow-hidden border-l-8 border-gold/40 preserve-3d transition-all duration-700 cursor-pointer group/cover"
                >
                  {coverImage ? (
                    <img 
                      src={coverImage} 
                      alt="Cover" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/cover:scale-110 transition-transform duration-1000"
                      style={{
                        filter: coverImageAdjustments ? 
                          `brightness(${coverImageAdjustments.brightness}%) contrast(${coverImageAdjustments.contrast}%) saturate(${coverImageAdjustments.saturation}%) sepia(${coverImageAdjustments.sepia}%) grayscale(${coverImageAdjustments.grayscale}%) blur(${coverImageAdjustments.blur}px) hue-rotate(${coverImageAdjustments.hueRotate}deg)` : 'none',
                        transform: coverImageAdjustments ? 
                          `rotate(${coverImageAdjustments.rotate}deg) scaleX(${coverImageAdjustments.flipX ? -1 : 1}) scaleY(${coverImageAdjustments.flipY ? -1 : 1})` : 'none'
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  
                  <div className="absolute inset-x-8 top-16 bottom-16 border-2 border-gold/20 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-black/20 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center text-gold mb-8">
                      {coverImage ? <ImageIcon size={32} /> : <Sparkles size={32} />}
                    </div>
                    
                    <h1 className="text-4xl font-serif font-bold text-gold mb-4 leading-tight">
                      {draftTitle || idea || "Untitled Masterpiece"}
                    </h1>
                    
                    <div className="w-12 h-0.5 bg-gold/40 mb-6" />
                    
                    <p className="text-white/40 small-caps tracking-widest text-xs">
                      A {category} Tale
                    </p>
                    
                    <div className="mt-auto">
                      <p className="text-gold/60 font-serif italic">by {authorName || userDisplayName}</p>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm z-20">
                    <div className="flex gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleImageUpload('cover'); }}
                        className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
                        title="Change Cover"
                      >
                        <ImageIcon size={20} />
                      </button>
                      {coverImage && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingImageIndex('cover');
                            setShowImageEditor(true);
                          }}
                          className="w-12 h-12 rounded-full bg-gold/80 backdrop-blur-md flex items-center justify-center text-night hover:bg-gold transition-all"
                          title="Edit Cover (CapCut Style)"
                        >
                          <Sliders size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spine detail */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/40 shadow-inner" />
                </motion.div>

                {/* Floating elements for "forging" feel */}
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gold/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gold/5 rounded-full blur-3xl animate-pulse delay-700" />
              </div>

              {/* Setup Form */}
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-5xl font-serif font-bold text-night">Forge Your Story</h2>
                  <p className="text-black/40">Define the essence of your next masterpiece.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Story Title</label>
                      <input 
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="Enter a title..."
                        className="w-full bg-black/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-gold/50 transition-all font-serif text-xl"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Author Name</label>
                      <input 
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Pen name..."
                        className="w-full bg-black/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-gold/50 transition-all font-serif text-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-black/5 rounded-2xl px-4 py-4 outline-none border border-black/5 font-medium appearance-none"
                      >
                        {STORY_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Age Group</label>
                      <select 
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="w-full bg-black/5 rounded-2xl px-4 py-4 outline-none border border-black/5 font-medium appearance-none"
                      >
                        {AGE_GROUPS.map(age => (
                          <option key={age.id} value={age.id}>{age.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Artistic Style</label>
                      <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value as StoryStyle)}
                        className="w-full bg-black/5 rounded-2xl px-4 py-4 outline-none border border-black/5 font-medium appearance-none"
                      >
                        {STORY_STYLES.map(s => {
                          const isAllowed = limits.allowedStyles?.includes(s.id);
                          return (
                            <option key={s.id} value={s.id} disabled={!isAllowed}>
                              {s.name} {!isAllowed ? '(Locked)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Language</label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-black/5 rounded-2xl px-4 py-4 outline-none border border-black/5 font-medium appearance-none"
                      >
                        {LANGUAGES.map(lang => {
                          const isAllowed = limits.allowedLanguages?.includes(lang.code);
                          return (
                            <option key={lang.code} value={lang.code} disabled={!isAllowed}>
                              {lang.name} {!isAllowed ? '(Locked)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Page Count</label>
                      <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Max {maxPages}</span>
                    </div>
                    <div className="flex items-center gap-4 bg-black/5 rounded-2xl p-2">
                      <button 
                        onClick={() => setPageCount(Math.max(minPages, pageCount - 1))} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-xl transition-all"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-serif text-xl italic">{pageCount}</span>
                      <button 
                        onClick={() => {
                          const next = pageCount + 1;
                          if (next > maxPages) {
                            toast.error(`Upgrade your plan to unlock more than ${maxPages} pages!`);
                            return;
                          }
                          setPageCount(next);
                        }} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-xl transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="pt-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-gold/5 rounded-2xl border border-gold/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                          <Zap size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gold">Forging Cost</p>
                          <p className="text-[10px] text-night/40">This masterpiece will consume {tokenCost} tokens.</p>
                        </div>
                      </div>
                      <div className="text-2xl font-serif font-bold text-night">
                        {tokenCost} <span className="text-xs uppercase tracking-widest text-black/20">Tokens</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={onCancel}
                        className="flex-1 py-5 bg-black/5 rounded-2xl font-bold hover:bg-black/10 transition-all text-black/60"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={() => {
                          if (userTokens < tokenCost) {
                            return toast.error(`Insufficient tokens! You need ${tokenCost} tokens to start crafting.`);
                          }
                          handleManualStart();
                        }}
                        className="flex-[2] py-5 bg-night text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all shadow-2xl flex items-center justify-center gap-3 group"
                      >
                        <Zap size={20} className="group-hover:fill-night transition-all" />
                        <span>Begin Forging</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[3rem] shadow-2xl border border-black/5 overflow-hidden flex flex-col h-[80vh]"
          >
            <div className="p-8 border-b border-black/5 flex items-center justify-between bg-silk">
              <div className="flex items-center gap-6">
                <button onClick={() => setStep('setup')} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <input 
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Untitled Masterpiece"
                  className="bg-transparent text-2xl font-serif font-bold outline-none border-b border-transparent focus:border-gold transition-all"
                />
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    showMetadataEditor ? "bg-gold text-night" : "bg-black/5 text-black/40 hover:text-black"
                  )}
                  title="Book Settings"
                >
                  <Settings size={20} />
                </button>
                <div className="text-[10px] small-caps tracking-widest text-black/30 font-bold">
                  Page {currentPageIndex + 1} of {draftPages.length}
                </div>
                <button 
                  disabled={isFinalForging}
                  onClick={() => {
                    if (!draftTitle.trim()) return toast.error("Please enter a title");
                    
                    setIsFinalForging(true);
                    
                    // Forging effect
                    confetti({
                      particleCount: 150,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#d4af37', '#ffffff', '#000000']
                    });

                    setTimeout(() => {
                      onComplete(draftTitle, draftPages.map(p => ({
                        text: p.text,
                        imageUrl: p.imageUrl || '',
                        imageAdjustments: p.imageAdjustments,
                        style: p.style || style
                      })), style, category, language, ageGroup, bookType, authorName, coverImage, coverImageAdjustments);
                      setIsFinalForging(false);
                    }, 2000);
                  }}
                  className="px-10 py-4 bg-night text-white rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-night transition-all shadow-2xl flex items-center gap-3 group relative overflow-hidden disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isFinalForging ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} className="group-hover:fill-night transition-all" />}
                  <span>{isFinalForging ? 'Forging...' : 'Forge Masterpiece'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative luxury-bg">
              <div className="atmosphere opacity-10" />
              
              {/* Metadata Editor Overlay */}
              <AnimatePresence>
                {showMetadataEditor && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute inset-y-0 right-0 w-80 bg-white border-l border-black/5 z-50 shadow-2xl p-8 overflow-y-auto custom-scrollbar"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-serif font-bold">Book Settings</h3>
                      <button onClick={() => setShowMetadataEditor(false)} className="p-2 hover:bg-black/5 rounded-xl">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Author Name</label>
                        <input 
                          type="text"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm font-serif"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Cover Image</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleImageUpload('cover')}
                            className="flex-1 py-3 bg-black/5 rounded-xl border border-black/5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                          >
                            <ImageIcon size={16} />
                            {coverImage ? 'Change' : 'Upload'}
                          </button>
                          {coverImage && (
                            <button 
                              onClick={() => {
                                setEditingImageIndex('cover');
                                setShowImageEditor(true);
                              }}
                              className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/20 hover:bg-gold hover:text-night transition-all"
                              title="Edit Image"
                            >
                              <Sliders size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Category</label>
                        <select 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {STORY_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Age Group</label>
                        <select 
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {AGE_GROUPS.map(age => (
                            <option key={age.id} value={age.id}>{age.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Artistic Style</label>
                        <select 
                          value={style}
                          onChange={(e) => setStyle(e.target.value as StoryStyle)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {STORY_STYLES.map(s => {
                            const isAllowed = subscriptionLimits.allowedStyles?.includes(s.id);
                            return (
                              <option key={s.id} value={s.id} disabled={!isAllowed}>
                                {s.name} {!isAllowed ? '(Locked)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Language</label>
                        <select 
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {LANGUAGES.map(lang => {
                            const isAllowed = subscriptionLimits.allowedLanguages?.includes(lang.code);
                            return (
                              <option key={lang.code} value={lang.code} disabled={!isAllowed}>
                                {lang.name} {!isAllowed ? '(Locked)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="mt-12 p-6 bg-gold/5 rounded-2xl border border-gold/10">
                      <p className="text-[10px] text-gold font-bold uppercase tracking-widest mb-2">Pro Tip</p>
                      <p className="text-xs text-night/60 leading-relaxed italic">Changing these settings will affect how the book is finalized and indexed in the library.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sidebar: Page List */}
              <div className="w-64 border-r border-black/5 bg-silk/50 flex flex-col">
                <div className="p-4 border-b border-black/5">
                  <button 
                    onClick={handleAddPage}
                    className="w-full py-3 bg-white border border-black/5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={16} />
                    Add Page
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {draftPages.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPageIndex(idx)}
                      className={cn(
                        "w-full p-4 rounded-2xl text-left transition-all border group relative",
                        currentPageIndex === idx ? "bg-white border-gold shadow-lg" : "bg-transparent border-transparent hover:bg-white/50"
                      )}
                    >
                      <div className="text-[10px] font-bold text-black/20 mb-1">PAGE {idx + 1}</div>
                      <div className="text-xs font-medium truncate text-black/60">
                        {page.text || <span className="italic opacity-50">Empty page...</span>}
                      </div>
                      {draftPages.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemovePage(idx); }}
                          className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Editor: Book-like Page */}
              <div className="flex-1 bg-night p-12 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
                <div className="w-full max-w-5xl flex items-stretch justify-center relative">
                  {/* Left Side: Illustration */}
                  <div className="flex-1">
                    <div 
                      onClick={() => handleImageUpload(currentPageIndex)}
                      className="aspect-[4/5] bg-white rounded-l-2xl shadow-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-silk transition-all group overflow-hidden relative"
                      style={{ 
                        backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                        boxShadow: 'inset -20px 0 30px rgba(0,0,0,0.05)'
                      }}
                    >
                      {draftPages[currentPageIndex].imageUrl ? (
                        <>
                          <img 
                            src={draftPages[currentPageIndex].imageUrl} 
                            alt="Page Illustration" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            style={{
                              filter: draftPages[currentPageIndex].imageAdjustments ? 
                                `brightness(${draftPages[currentPageIndex].imageAdjustments.brightness}%) contrast(${draftPages[currentPageIndex].imageAdjustments.contrast}%) saturate(${draftPages[currentPageIndex].imageAdjustments.saturation}%) sepia(${draftPages[currentPageIndex].imageAdjustments.sepia}%) grayscale(${draftPages[currentPageIndex].imageAdjustments.grayscale}%) blur(${draftPages[currentPageIndex].imageAdjustments.blur}px) hue-rotate(${draftPages[currentPageIndex].imageAdjustments.hueRotate}deg)` : 'none',
                              transform: draftPages[currentPageIndex].imageAdjustments ? 
                                `rotate(${draftPages[currentPageIndex].imageAdjustments.rotate}deg) scaleX(${draftPages[currentPageIndex].imageAdjustments.flipX ? -1 : 1}) scaleY(${draftPages[currentPageIndex].imageAdjustments.flipY ? -1 : 1})` : 'none'
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-4">
                            <div className="flex gap-4">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleImageUpload(currentPageIndex); }}
                                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
                                title="Change Image"
                              >
                                <ImageIconLucide size={20} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditingImageIndex(currentPageIndex);
                                  setShowImageEditor(true);
                                }}
                                className="w-12 h-12 rounded-full bg-gold/80 backdrop-blur-md flex items-center justify-center text-night hover:bg-gold transition-all"
                                title="Edit Image (CapCut Style)"
                              >
                                <Sliders size={20} />
                              </button>
                            </div>
                            <span className="text-white font-bold uppercase tracking-widest text-[10px]">Customize Illustration</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center text-black/20 group-hover:text-gold transition-colors shadow-sm">
                            <ImageIconLucide size={32} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-black/40 group-hover:text-black transition-colors">Add Illustration</p>
                            <p className="text-[10px] uppercase tracking-widest text-black/20">Click to upload image</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleImageUpload(currentPageIndex); }}
                            className="mt-4 px-6 py-2 bg-night text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-night transition-all shadow-lg"
                          >
                            Select Image
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Book Spine */}
                  <div className="w-12 bg-gradient-to-r from-black/20 via-black/10 to-black/20 shadow-inner relative z-10 flex flex-col items-center justify-center">
                    <div className="w-px h-full bg-black/10" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30" />
                  </div>

                  {/* Right Side: Text Editor */}
                  <div className="flex-1">
                    <div 
                      className="aspect-[4/5] bg-white rounded-r-2xl shadow-2xl p-12 flex flex-col gap-6 relative"
                      style={{ 
                        backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                        boxShadow: 'inset 20px 0 30px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Formatting Toolbar */}
                      <div className="flex flex-wrap items-center gap-3 p-3 bg-black/5 rounded-2xl border border-black/5 backdrop-blur-sm">
                        {/* Alignment */}
                        <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-black/5">
                          <button 
                            onClick={() => handleUpdatePage(currentPageIndex, { alignment: 'left' })}
                            className={cn("p-2 rounded-lg transition-all", draftPages[currentPageIndex].alignment === 'left' ? "bg-black text-white shadow-lg" : "text-black/40 hover:text-black hover:bg-black/5")}
                            title="Align Left"
                          >
                            <AlignLeft size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdatePage(currentPageIndex, { alignment: 'center' })}
                            className={cn("p-2 rounded-lg transition-all", draftPages[currentPageIndex].alignment === 'center' ? "bg-black text-white shadow-lg" : "text-black/40 hover:text-black hover:bg-black/5")}
                            title="Align Center"
                          >
                            <AlignCenter size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdatePage(currentPageIndex, { alignment: 'right' })}
                            className={cn("p-2 rounded-lg transition-all", draftPages[currentPageIndex].alignment === 'right' ? "bg-black text-white shadow-lg" : "text-black/40 hover:text-black hover:bg-black/5")}
                            title="Align Right"
                          >
                            <AlignRight size={16} />
                          </button>
                        </div>

                        <div className="w-px h-6 bg-black/10 mx-1" />

                        {/* Formatting */}
                        <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-black/5">
                          <button 
                            onClick={() => wrapSelection(currentPageIndex, '**', '**')}
                            className="p-2 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                            title="Bold"
                          >
                            <Bold size={16} />
                          </button>
                          <button 
                            onClick={() => wrapSelection(currentPageIndex, '_', '_')}
                            className="p-2 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                            title="Italic"
                          >
                            <Italic size={16} />
                          </button>
                          <button 
                            onClick={() => wrapSelection(currentPageIndex, '<u>', '</u>')}
                            className="p-2 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                            title="Underline"
                          >
                            <Underline size={16} />
                          </button>
                        </div>

                        <div className="w-px h-6 bg-black/10 mx-1" />

                        {/* Font & Size */}
                        <div className="flex items-center gap-3 bg-white/50 px-3 py-1 rounded-xl border border-black/5">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-black/30">Font</span>
                            <select 
                              value={draftPages[currentPageIndex].font || 'serif'}
                              onChange={(e) => handleUpdatePage(currentPageIndex, { font: e.target.value })}
                              className="bg-transparent text-[10px] font-bold outline-none cursor-pointer min-w-[80px]"
                            >
                              {FONTS.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-px h-4 bg-black/10" />
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-black/30">Size</span>
                            <select 
                              value={draftPages[currentPageIndex].fontSize || 'text-xl'}
                              onChange={(e) => handleUpdatePage(currentPageIndex, { fontSize: e.target.value })}
                              className="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
                            >
                              <option value="text-xs">Tiny</option>
                              <option value="text-sm">Small</option>
                              <option value="text-base">Normal</option>
                              <option value="text-lg">Medium</option>
                              <option value="text-xl">Large</option>
                              <option value="text-2xl">X-Large</option>
                              <option value="text-3xl">2X-Large</option>
                              <option value="text-4xl">Huge</option>
                            </select>
                          </div>
                        </div>

                        <div className="w-px h-6 bg-black/10 mx-1" />

                        {/* Color */}
                        <div className="flex items-center gap-2 bg-white/50 p-1 rounded-xl border border-black/5">
                          <div className="flex gap-1">
                            {['#000000', '#4A4A4A', '#D4AF37', '#990000', '#004d40'].map(c => (
                              <button 
                                key={c}
                                onClick={() => handleUpdatePage(currentPageIndex, { color: c })}
                                className={cn(
                                  "w-4 h-4 rounded-full border border-black/5 transition-transform hover:scale-125",
                                  draftPages[currentPageIndex].color === c && "ring-2 ring-gold ring-offset-1"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="w-px h-4 bg-black/10 mx-1" />
                          <input 
                            type="color" 
                            value={draftPages[currentPageIndex].color || '#000000'}
                            onChange={(e) => handleUpdatePage(currentPageIndex, { color: e.target.value })}
                            className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                            title="Custom Color"
                          />
                        </div>
                      </div>

                      <textarea 
                        id={`page-text-${currentPageIndex}`}
                        value={draftPages[currentPageIndex].text}
                        onChange={(e) => handleUpdatePage(currentPageIndex, { text: e.target.value })}
                        placeholder="Once upon a time..."
                        className={cn(
                          "flex-1 w-full bg-transparent outline-none resize-none placeholder:text-black/10 leading-relaxed",
                          draftPages[currentPageIndex].fontSize || 'text-xl',
                          draftPages[currentPageIndex].alignment === 'center' ? 'text-center' : draftPages[currentPageIndex].alignment === 'right' ? 'text-right' : 'text-left'
                        )}
                        style={{ 
                          fontFamily: FONTS.find(f => f.id === (draftPages[currentPageIndex].font || 'serif'))?.family || 'inherit',
                          color: draftPages[currentPageIndex].color || '#000000'
                        }}
                      />

                      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest">
                          {currentPageIndex + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageEditor && editingImageIndex !== null && (
          <ImageEditor 
            imageUrl={editingImageIndex === 'cover' ? coverImage : (draftPages[editingImageIndex as number].imageUrl || '')}
            adjustments={(editingImageIndex === 'cover' ? coverImageAdjustments : draftPages[editingImageIndex as number].imageAdjustments) || {
              brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, blur: 0, hueRotate: 0, rotate: 0, flipX: false, flipY: false
            }}
            onSave={handleSaveImageAdjustments}
            onClose={() => {
              setShowImageEditor(false);
              setEditingImageIndex(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
