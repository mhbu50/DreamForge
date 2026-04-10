import React from 'react';
import { motion } from 'motion/react';
import { Book, Image as ImageIcon, Play, X, Sparkles, ScrollText, PenTool, User, PlusCircle } from 'lucide-react';
import { BookType } from '../types';

interface BookTypeSelectorProps {
  onSelect: (type: BookType) => void;
  onCancel: () => void;
}

export default function BookTypeSelector({ onSelect, onCancel }: BookTypeSelectorProps) {
  const types: { id: BookType, title: string, description: string, icon: React.ReactNode, color: string }[] = [
    { 
      id: 'story', 
      title: 'Story Book', 
      description: 'Classic narrative with rich descriptions and illustrations.', 
      icon: <Book size={32} />, 
      color: 'bg-blue-500' 
    },
    { 
      id: 'comic', 
      title: 'Comic Book', 
      description: 'Visual storytelling with panels, speech bubbles, and dynamic art.', 
      icon: <ImageIcon size={32} />, 
      color: 'bg-orange-500' 
    },
    { 
      id: 'anime', 
      title: 'Anime Book', 
      description: 'Cinematic experience with motion, sound, and vibrant aesthetics.', 
      icon: <Play size={32} />, 
      color: 'bg-purple-500' 
    },
    { 
      id: 'novel', 
      title: 'Novel', 
      description: 'Deep narrative focus with extensive chapters and character development.', 
      icon: <ScrollText size={32} />, 
      color: 'bg-emerald-500' 
    },
    { 
      id: 'manga', 
      title: 'Manga', 
      description: 'Japanese-style visual storytelling with unique paneling and aesthetics.', 
      icon: <PenTool size={32} />, 
      color: 'bg-rose-500' 
    },
    { 
      id: 'biography', 
      title: 'Biography', 
      description: 'Documenting a real or fictional life story with historical precision.', 
      icon: <User size={32} />, 
      color: 'bg-amber-500' 
    },
    { 
      id: 'other', 
      title: 'Other', 
      description: 'A blank canvas for experimental formats and unconventional storytelling.', 
      icon: <PlusCircle size={32} />, 
      color: 'bg-slate-500' 
    },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-night/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-night-light border border-gold/20 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-orange-500 to-purple-500" />
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-serif font-bold text-gold mb-2">Choose Your Medium</h2>
            <p className="text-gold/40 uppercase tracking-[0.2em] text-xs font-bold">Select the type of masterpiece you want to create</p>
          </div>
          <button onClick={onCancel} className="p-3 hover:bg-gold/10 rounded-2xl transition-all text-gold/50 hover:text-gold">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {types.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(type.id)}
              className="group relative flex flex-col items-center text-center p-8 bg-night rounded-3xl border border-gold/10 hover:border-gold/40 transition-all overflow-hidden"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${type.color}`} />
              
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg ${type.color}`}>
                {type.icon}
              </div>
              
              <h3 className="text-2xl font-serif font-bold text-gold mb-3">{type.title}</h3>
              <p className="text-sm text-gold/50 leading-relaxed">{type.description}</p>
              
              <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold/30 group-hover:text-gold transition-colors">
                <span>Start Creating</span>
                <Sparkles size={14} className="animate-pulse" />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gold/10 text-center">
          <p className="text-xs text-gold/30 italic italic">
            Each medium offers unique customization tools tailored to its format.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
