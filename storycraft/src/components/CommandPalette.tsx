import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, Zap, Book, User, Settings, Image as ImageIcon, MessageSquare, Terminal, Eye, Edit3, Save, Share2, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string[];
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { id: 'new-book', title: 'Create New Book', description: 'Start a new story, comic, or anime project', icon: <Book size={18} />, action: () => console.log('New Book'), category: 'General' },
    { id: 'zen-mode', title: 'Toggle Zen Mode', description: 'Hide UI for focused writing', icon: <Eye size={18} />, action: () => console.log('Zen Mode'), category: 'Workspace' },
    { id: 'save-draft', title: 'Save Draft', description: 'Manually save current progress', icon: <Save size={18} />, action: () => console.log('Save Draft'), category: 'General' },
    { id: 'open-settings', title: 'Open Settings', description: 'Customize your StoryCraft experience', icon: <Settings size={18} />, action: () => console.log('Settings'), category: 'General' },
    { id: 'terminal', title: 'Toggle Terminal', description: 'Run Linux commands', icon: <Terminal size={18} />, action: () => console.log('Technical' ), category: 'Technical' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCommands.length === 0) return;
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCommands.length === 0) return;
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-night/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-night-light border border-gold/20 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-gold/10">
              <Search className="text-gold/50 mr-3" size={20} />
              <input
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-gold placeholder:text-gold/30 text-lg"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex items-center gap-1 px-2 py-1 bg-gold/10 rounded border border-gold/20">
                <Command size={12} className="text-gold/70" />
                <span className="text-[10px] font-mono text-gold/70">P</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, index) => (
                    <button
                      key={cmd.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                        index === selectedIndex ? "bg-gold/20 text-gold" : "text-gold/60 hover:bg-gold/5 hover:text-gold/80"
                      )}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={cn(
                        "p-2 rounded-md",
                        index === selectedIndex ? "bg-gold/20" : "bg-gold/5"
                      )}>
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cmd.title}</div>
                        {cmd.description && (
                          <div className="text-xs opacity-60 truncate">{cmd.description}</div>
                        )}
                      </div>
                      <div className="text-[10px] font-mono opacity-40 uppercase tracking-wider">
                        {cmd.category}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Zap className="mx-auto text-gold/20 mb-3" size={48} />
                  <p className="text-gold/40">No commands found for "{query}"</p>
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-night border-t border-gold/10 flex items-center justify-between text-[10px] text-gold/40 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><span className="px-1 py-0.5 bg-gold/10 rounded border border-gold/20">↑↓</span> Navigate</span>
                <span className="flex items-center gap-1"><span className="px-1 py-0.5 bg-gold/10 rounded border border-gold/20">Enter</span> Select</span>
              </div>
              <span className="flex items-center gap-1"><span className="px-1 py-0.5 bg-gold/10 rounded border border-gold/20">Esc</span> Close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
