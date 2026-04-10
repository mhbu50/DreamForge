import React from 'react';
import { motion } from 'motion/react';
import { Layout, Edit3, BookOpen, Globe, Save, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Preset {
  id: string;
  name: string;
  icon: React.ReactNode;
  widgets: string[];
}

interface WorkspacePresetsProps {
  currentWidgets: string[];
  onApply: (widgets: string[]) => void;
  onSave: (name: string, widgets: string[]) => void;
}

export default function WorkspacePresets({ currentWidgets, onApply, onSave }: WorkspacePresetsProps) {
  const defaultPresets: Preset[] = [
    { id: 'drafting', name: 'Drafting', icon: <Edit3 size={18} />, widgets: ['word-count', 'creative-chat', 'progress'] },
    { id: 'editing', name: 'Editing', icon: <BookOpen size={18} />, widgets: ['word-count', 'progress', 'lore'] },
    { id: 'world-building', name: 'World Building', icon: <Globe size={18} />, widgets: ['creative-chat', 'image-preview', 'lore'] },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {defaultPresets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onApply(preset.widgets)}
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all group",
            JSON.stringify(currentWidgets) === JSON.stringify(preset.widgets)
              ? "bg-gold border-gold text-night shadow-lg shadow-gold/20"
              : "bg-white border-black/5 text-black/60 hover:border-gold/40 hover:text-black"
          )}
        >
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            JSON.stringify(currentWidgets) === JSON.stringify(preset.widgets)
              ? "bg-night/10"
              : "bg-black/5 group-hover:bg-gold/10"
          )}>
            {preset.icon}
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">{preset.name}</span>
        </button>
      ))}
      
      <button
        onClick={() => {
          const name = prompt('Enter preset name:');
          if (name) onSave(name, currentWidgets);
        }}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-dashed border-black/20 text-black/40 hover:border-gold hover:text-gold transition-all"
      >
        <Save size={18} />
        <span className="text-xs font-bold uppercase tracking-widest">Save Current</span>
      </button>
    </div>
  );
}
