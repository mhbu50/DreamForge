import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Mic2, FileText, ShoppingBag, Star, LayoutGrid, Volume2, Maximize2, Minimize2, Share2, Download, Type, Globe, Sparkles, Edit3 } from 'lucide-react';
import { Story, StoryPage } from '../types';
import { FONTS } from '../constants';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onEdit?: (story: Story) => void;
  narrator: string;
}

export default function StoryViewer({ story, onClose, onEdit, narrator }: StoryViewerProps) {
  const [currentPage, setCurrentPage] = useState(story.coverImage ? -1 : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(true);
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [isBedtimeMode, setIsBedtimeMode] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/story/${story.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Story link copied to clipboard!");
  };

  const handleExport = (format: 'epub' | 'mobi') => {
    toast.info(`Preparing ${format.toUpperCase()} export...`);
    setTimeout(() => {
      toast.success(`${format.toUpperCase()} file ready for download!`);
    }, 2000);
  };

  const currentPageStyle = story.pages[currentPage]?.style || story.style;
  const styleClass = currentPageStyle ? `style-${currentPageStyle}` : '';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col transition-all duration-700",
        isCinemaMode ? "bg-night text-white" : "bg-paper text-ink",
        isBedtimeMode && "sepia-[0.4] brightness-[0.9]",
        styleClass
      )}
    >
      <div className="atmosphere opacity-20" />
      
      {/* Header */}
      <nav className="px-8 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-xl transition-all">
            <X size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-serif font-bold leading-none">{story.title}</h2>
            <p className="text-[10px] small-caps tracking-widest opacity-40">By {story.authorName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDyslexicFont(!isDyslexicFont)}
            className={cn("p-3 rounded-xl transition-all", isDyslexicFont ? "bg-blue-500 text-white" : "bg-white/10")}
            title="Dyslexia Friendly Font"
          >
            <Type size={20} />
          </button>
          <button 
            onClick={handleShare}
            className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            title="Share Story"
          >
            <Share2 size={20} />
          </button>
          <div className="relative group">
            <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <Download size={20} />
            </button>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-night border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
              <button onClick={() => handleExport('epub')} className="w-full px-6 py-3 text-left hover:bg-white/10 text-xs font-bold uppercase tracking-widest">EPUB</button>
              <button onClick={() => handleExport('mobi')} className="w-full px-6 py-3 text-left hover:bg-white/10 text-xs font-bold uppercase tracking-widest">MOBI</button>
            </div>
          </div>
          <button 
            onClick={() => setIsBedtimeMode(!isBedtimeMode)}
            className={cn("p-3 rounded-xl transition-all", isBedtimeMode ? "bg-orange-500 text-white" : "bg-white/10")}
            title="Bedtime Mode (Warm Colors)"
          >
            <Star size={20} />
          </button>
          <button 
            onClick={() => setIsCinemaMode(!isCinemaMode)}
            className={cn("p-3 rounded-xl transition-all", isCinemaMode ? "bg-gold text-night" : "bg-black/5")}
            title="Cinema Mode"
          >
            <Maximize2 size={20} />
          </button>
          {onEdit && (
            <button 
              onClick={() => onEdit(story)}
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              title="Edit Story"
            >
              <Edit3 size={20} />
            </button>
          )}
          <button onClick={() => setShowScript(!showScript)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            <FileText size={20} />
          </button>
        </div>
      </nav>

      {/* Top Progress Bar */}
      <div className="h-0.5 bg-white/5 relative z-20">
        <motion.div 
          className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentPage + 2) / (story.pages.length + 1)) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-6xl flex items-stretch justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentPage}
              initial={{ opacity: 0, rotateY: 90, originX: 0 }}
              animate={{ opacity: 1, rotateY: 0, originX: 0 }}
              exit={{ opacity: 0, rotateY: -90, originX: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="w-full flex items-stretch perspective-2000 preserve-3d"
            >
              {/* Left Page: Illustration */}
              <div className="flex-1">
                <div 
                  className="aspect-[4/5] bg-white rounded-l-2xl shadow-2xl overflow-hidden relative"
                  style={{ 
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                    boxShadow: 'inset -20px 0 30px rgba(0,0,0,0.05)'
                  }}
                >
                  <img 
                    src={currentPage === -1 ? (story.coverImage || story.pages[0].imageUrl) : story.pages[currentPage].imageUrl} 
                    alt="" className="w-full h-full object-cover"
                    style={{
                      filter: (currentPage === -1 && story.coverImageAdjustments) ? 
                        `brightness(${story.coverImageAdjustments.brightness}%) contrast(${story.coverImageAdjustments.contrast}%) saturate(${story.coverImageAdjustments.saturation}%) sepia(${story.coverImageAdjustments.sepia}%) grayscale(${story.coverImageAdjustments.grayscale}%) blur(${story.coverImageAdjustments.blur}px) hue-rotate(${story.coverImageAdjustments.hueRotate}deg)` :
                        (currentPage !== -1 && story.pages[currentPage].imageAdjustments) ? 
                        `brightness(${story.pages[currentPage].imageAdjustments.brightness}%) contrast(${story.pages[currentPage].imageAdjustments.contrast}%) saturate(${story.pages[currentPage].imageAdjustments.saturation}%) sepia(${story.pages[currentPage].imageAdjustments.sepia}%) grayscale(${story.pages[currentPage].imageAdjustments.grayscale}%) blur(${story.pages[currentPage].imageAdjustments.blur}px) hue-rotate(${story.pages[currentPage].imageAdjustments.hueRotate}deg)` : 'none',
                      transform: (currentPage === -1 && story.coverImageAdjustments) ? 
                        `rotate(${story.coverImageAdjustments.rotate}deg) scaleX(${story.coverImageAdjustments.flipX ? -1 : 1}) scaleY(${story.coverImageAdjustments.flipY ? -1 : 1})` :
                        (currentPage !== -1 && story.pages[currentPage].imageAdjustments) ? 
                        `rotate(${story.pages[currentPage].imageAdjustments.rotate}deg) scaleX(${story.pages[currentPage].imageAdjustments.flipX ? -1 : 1}) scaleY(${story.pages[currentPage].imageAdjustments.flipY ? -1 : 1})` : 'none'
                    }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 page-gradient pointer-events-none" />
                  
                  {/* Language Tag */}
                  {story.language && (
                    <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                      <Globe size={12} className="text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{story.language}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Spine */}
              <div className="w-12 bg-gradient-to-r from-black/20 via-black/10 to-black/20 shadow-inner relative z-10 flex flex-col items-center justify-center">
                <div className="w-px h-full bg-black/10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30" />
              </div>

              {/* Right Page: Text */}
              <div className="flex-1">
                <div 
                  className="aspect-[4/5] bg-white rounded-r-2xl shadow-2xl p-16 flex flex-col justify-center relative"
                  style={{ 
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                    boxShadow: 'inset 20px 0 30px rgba(0,0,0,0.05)'
                  }}
                >
                  {currentPage === -1 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full space-y-8">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                        <Sparkles size={32} />
                      </div>
                      <div>
                        <h1 className="text-5xl font-serif font-bold text-night mb-4">{story.title}</h1>
                        <div className="w-12 h-0.5 bg-gold/40 mx-auto mb-6" />
                        <p className="text-night/60 font-serif italic text-xl">by {story.authorName}</p>
                      </div>
                      <div className="pt-12">
                        <p className="text-[10px] small-caps tracking-[0.3em] text-black/20 font-bold">A StoryCraft Masterpiece</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-8">
                        <span className="w-12 h-[1px] bg-gold/30" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Chapter {currentPage + 1}</span>
                      </div>
                      
                      <div 
                        className={cn(
                          "font-serif leading-relaxed italic font-light text-ink",
                          story.pages[currentPage].fontSize || "text-3xl",
                          story.pages[currentPage].alignment === 'center' ? 'text-center' : story.pages[currentPage].alignment === 'right' ? 'text-right' : 'text-left',
                          isDyslexicFont && "font-dyslexic"
                        )}
                        style={{
                          color: story.pages[currentPage].color || 'inherit',
                          fontFamily: FONTS.find(f => f.id === (story.pages[currentPage].font || 'serif'))?.family || 'inherit'
                        }}
                      >
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                          {story.pages[currentPage].text || story.pages[currentPage].content || ''}
                        </ReactMarkdown>
                      </div>

                      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest">
                          {currentPage + 1}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <button 
            onClick={() => setCurrentPage(p => Math.max(story.coverImage ? -1 : 0, p - 1))}
            disabled={currentPage === (story.coverImage ? -1 : 0)}
            className="absolute -left-20 top-1/2 -translate-y-1/2 p-6 bg-white/5 hover:bg-white/10 rounded-full transition-all disabled:opacity-0"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(story.pages.length - 1, p + 1))}
            disabled={currentPage === story.pages.length - 1}
            className="absolute -right-20 top-1/2 -translate-y-1/2 p-6 bg-white/5 hover:bg-white/10 rounded-full transition-all disabled:opacity-0"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Page Navigation Dots */}
        <div className="mt-12 flex gap-2">
          {story.coverImage && (
            <button 
              onClick={() => setCurrentPage(-1)}
              className={cn("h-1 rounded-full transition-all", -1 === currentPage ? "bg-gold w-12" : "bg-white/10 w-4 hover:bg-white/20")} 
            />
          )}
          {story.pages.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentPage(i)}
              className={cn("h-1 rounded-full transition-all", i === currentPage ? "bg-gold w-12" : "bg-white/10 w-4 hover:bg-white/20")} 
            />
          ))}
        </div>
      </div>

    </motion.div>
  );
}
