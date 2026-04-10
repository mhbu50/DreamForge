import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, MessageSquare, Image as ImageIcon, TrendingUp, BookOpen, UserPlus, Sparkles } from 'lucide-react';

export const WordCountWidget = () => (
  <div className="flex flex-col items-center justify-center py-6">
    <div className="text-5xl font-serif font-bold text-night mb-2">12,450</div>
    <div className="text-[10px] small-caps tracking-widest text-black/40 font-bold">Total Words Forged</div>
    <div className="mt-6 flex items-center gap-2 text-green-500 font-bold text-xs">
      <TrendingUp size={14} />
      <span>+1,200 today</span>
    </div>
  </div>
);

export const ImagePreviewWidget = () => (
  <div className="grid grid-cols-2 gap-3">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="aspect-square bg-black/5 rounded-2xl overflow-hidden group relative cursor-pointer">
        <img 
          src={`https://picsum.photos/seed/dreamforge-${i}/400/400`} 
          alt="Reference" 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ImageIcon className="text-white" size={20} />
        </div>
      </div>
    ))}
  </div>
);

export const ProgressWidget = () => (
  <div className="space-y-6">
    <div>
      <div className="flex justify-between text-[10px] small-caps tracking-widest text-black/40 font-bold mb-2">
        <span>Chapter 1: The Awakening</span>
        <span>85%</span>
      </div>
      <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-gold" />
      </div>
    </div>
    <div>
      <div className="flex justify-between text-[10px] small-caps tracking-widest text-black/40 font-bold mb-2">
        <span>World Building</span>
        <span>42%</span>
      </div>
      <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-purple-500" />
      </div>
    </div>
    <div className="pt-4 border-t border-black/5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold text-black/60">
        <TrendingUp size={14} className="text-green-500" />
        <span>On track for daily goal</span>
      </div>
      <Sparkles size={16} className="text-gold animate-pulse" />
    </div>
  </div>
);

export const LoreWidget = () => (
  <div className="space-y-3">
    {['Aethelgard', 'The Void Crystal', 'Kaelen Shadowstep', 'Order of the Sun'].map(item => (
      <button key={item} className="w-full flex items-center justify-between p-3 bg-black/5 hover:bg-gold/10 rounded-xl transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black/40 group-hover:text-gold transition-colors">
            <BookOpen size={16} />
          </div>
          <span className="text-sm font-medium text-black/70 group-hover:text-black transition-colors">{item}</span>
        </div>
        <UserPlus size={14} className="text-black/20 group-hover:text-gold transition-colors" />
      </button>
    ))}
  </div>
);
