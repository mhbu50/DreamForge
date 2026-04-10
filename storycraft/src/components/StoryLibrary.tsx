import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { LayoutGrid, List, Heart, Star, DollarSign, Trash2, BookOpen, Sparkles, Globe, Layers, UserPlus } from 'lucide-react';
import { Story } from '../types';
import { cn } from '../lib/utils';

interface StoryLibraryProps {
  stories: Story[];
  isLoading?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onSelect: (story: Story) => void;
  onPublish: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onAddPartner: (story: Story, e: React.MouseEvent) => void;
  onCreate: () => void;
}

export default function StoryLibrary({ 
  stories, 
  isLoading,
  searchTerm, 
  setSearchTerm, 
  viewMode, 
  setViewMode, 
  onSelect, 
  onPublish, 
  onDelete,
  onAddPartner,
  onCreate
}: StoryLibraryProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <h2 className="text-7xl font-serif font-light mb-4 tracking-tight">Your <span className="italic text-gold">Library</span></h2>
          <p className="text-black/40 small-caps tracking-[0.4em] text-xs">A collection of your crafted masterpieces</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 p-2 bg-white rounded-3xl shadow-sm border border-black/5 px-6">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <Sparkles className="text-black/20" size={18} />
            <input 
              type="text" 
              placeholder="Search your library..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-black/20"
            />
          </div>
          <div className="h-8 w-[1px] bg-black/5 hidden md:block" />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'grid' ? "bg-black text-white" : "text-black/20 hover:text-black")}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'list' ? "bg-black text-white" : "text-black/20 hover:text-black")}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className={cn(
          "grid gap-10",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-[2.5rem] h-96 animate-pulse border border-black/5 flex flex-col overflow-hidden">
              <div className="flex-1 bg-black/5" />
              <div className="p-10 space-y-4">
                <div className="h-4 bg-black/5 rounded w-1/4" />
                <div className="h-8 bg-black/5 rounded w-3/4" />
                <div className="h-4 bg-black/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-black/10">
          <BookOpen className="mx-auto mb-8 text-black/5" size={80} />
          <h3 className="text-3xl font-serif text-black/20 mb-8">Your archives are empty.</h3>
          <button 
            onClick={onCreate}
            className="px-12 py-5 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all flex flex-col items-center gap-1 group"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Forge First Tale</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100">Cost: 1 Token</span>
          </button>
        </div>
      ) : (
        <div className={cn(
          "grid gap-10",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {stories.map((story, i) => (
            <StoryCard 
              key={story.id} 
              story={story} 
              index={i} 
              viewMode={viewMode} 
              onSelect={onSelect} 
              onPublish={onPublish} 
              onDelete={onDelete} 
              onAddPartner={onAddPartner}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StoryCard({ story, index, viewMode, onSelect, onPublish, onDelete, onAddPartner }: { 
  story: Story, 
  index: number, 
  viewMode: 'grid' | 'list', 
  onSelect: (s: Story) => void, 
  onPublish: (id: string, e: React.MouseEvent) => void, 
  onDelete: (id: string, e: React.MouseEvent) => void,
  onAddPartner: (story: Story, e: React.MouseEvent) => void
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: viewMode === 'grid' ? rotateX : 0,
        rotateY: viewMode === 'grid' ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      onClick={() => onSelect(story)}
      className={cn(
        "group bg-white rounded-[2.5rem] overflow-hidden border border-black/5 cursor-pointer hover:shadow-2xl transition-all duration-500",
        viewMode === 'list' ? "flex h-64" : "flex flex-col"
      )}
    >
      <div className={cn(
        "relative overflow-hidden",
        viewMode === 'list' ? "w-64 h-full" : "aspect-[4/5]"
      )} style={{ transform: "translateZ(50px)" }}>
        {/* Progress Circle */}
        <div className="absolute top-6 right-6 z-10">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-white/10"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - (Math.min(story.pages.length, 10) * 10) }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="text-gold"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">{story.pages.length}</span>
          </div>
        </div>

        <img 
          src={story.coverImage || story.pages[0].imageUrl} 
          alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          style={{
            filter: story.coverImageAdjustments ? 
              `brightness(${story.coverImageAdjustments.brightness}%) contrast(${story.coverImageAdjustments.contrast}%) saturate(${story.coverImageAdjustments.saturation}%) sepia(${story.coverImageAdjustments.sepia}%) grayscale(${story.coverImageAdjustments.grayscale}%) blur(${story.coverImageAdjustments.blur}px) hue-rotate(${story.coverImageAdjustments.hueRotate}deg)` : 'none',
            transform: story.coverImageAdjustments ? 
              `rotate(${story.coverImageAdjustments.rotate}deg) scaleX(${story.coverImageAdjustments.flipX ? -1 : 1}) scaleY(${story.coverImageAdjustments.flipY ? -1 : 1})` : 'none'
          }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Read Now Slide-in */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
          <div className="bg-gold text-night px-8 py-3 rounded-full font-bold flex items-center gap-3 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 shadow-2xl">
            <BookOpen size={20} />
            <span className="small-caps tracking-widest">Read Now</span>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white">StoryCraft</span>
        </div>

        {/* Language & Series Badges */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          {story.language && (
            <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
              <Globe size={10} className="text-gold" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white">{story.language}</span>
            </div>
          )}
          {story.seriesId && (
            <div className="bg-purple-500/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
              <Layers size={10} className="text-white" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white">Series</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-10 flex flex-col flex-1" style={{ transform: "translateZ(30px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] font-bold uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full">{story.style}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full">{story.pages.length} Pages</span>
        </div>
        <h3 className="text-3xl font-serif font-bold mb-4 group-hover:text-gold transition-colors">{story.title}</h3>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-black/20 text-xs">
            <div className="flex items-center gap-2"><Heart size={14} /> <span>{story.likes || 0}</span></div>
            <div className="flex items-center gap-2"><Star size={14} /> <span>4.9</span></div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            <button 
              onClick={(e) => onAddPartner(story, e)}
              className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
              title="Add Partner"
            >
              <UserPlus size={18} />
            </button>
            {!story.isPublished && (
              <button 
                onClick={(e) => onPublish(story.id, e)}
                className="p-3 bg-gold text-night rounded-xl hover:scale-110 transition-all"
                title="Sell"
              >
                <DollarSign size={18} />
              </button>
            )}
            <button 
              onClick={(e) => onDelete(story.id, e)}
              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
