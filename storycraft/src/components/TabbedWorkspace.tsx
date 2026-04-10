import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, FileText, User, Map, BookOpen, ChevronLeft, ChevronRight, Sparkles, Wand2, Type, MessageSquare, Languages, ListChecks, Ghost, GitBranch } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToolbarButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: string;
}

interface Tab {
  id: string;
  title: string;
  type: 'chapter' | 'character' | 'lore' | 'map';
  content: React.ReactNode;
}

export default function TabbedWorkspace() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Chapter 1: The Awakening', type: 'chapter', content: <div className="p-12 max-w-2xl mx-auto font-serif text-xl leading-relaxed text-gray-800"><p>The dawn broke over the jagged peaks of Aethelgard, casting long, crimson shadows across the valley. Kaelen stood at the precipice, his breath hitching in the cold morning air...</p></div> },
    { id: '2', title: 'Kaelen Shadowstep', type: 'character', content: <div className="p-12 grid grid-cols-2 gap-12"><div className="aspect-[3/4] bg-black/5 rounded-3xl overflow-hidden"><img src="https://picsum.photos/seed/kaelen/600/800" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div><div className="space-y-6"><h2 className="text-4xl font-serif font-bold">Kaelen Shadowstep</h2><p className="text-gray-500 italic">"The shadows are not my enemy; they are my sanctuary."</p><div className="space-y-4 pt-6"><div className="flex justify-between border-b border-black/5 pb-2"><span className="text-xs small-caps font-bold text-black/40">Age</span><span className="text-sm font-bold">24</span></div><div className="flex justify-between border-b border-black/5 pb-2"><span className="text-xs small-caps font-bold text-black/40">Origin</span><span className="text-sm font-bold">The Void Lands</span></div></div></div></div> },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [isEditable, setIsEditable] = useState(true);
  const [toolbarButtons, setToolbarButtons] = useState<string[]>(['texture']);
  const [isCustomizingToolbar, setIsCustomizingToolbar] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, text: string } | null>(null);
  const [paperTexture, setPaperTexture] = useState<'none' | 'parchment' | 'recycled' | 'digital'>('none');

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection()?.toString();
    if (selection) {
      setContextMenu({ x: e.clientX, y: e.clientY, text: selection });
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const allButtons: ToolbarButton[] = [
    { id: 'texture', icon: <BookOpen size={14} />, label: 'Paper Texture', action: 'texture' },
  ];

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleAction = (action: string) => {
    if (action === 'texture') {
      const textures: ('none' | 'parchment' | 'recycled' | 'digital')[] = ['none', 'parchment', 'recycled', 'digital'];
      const nextIndex = (textures.indexOf(paperTexture) + 1) % textures.length;
      setPaperTexture(textures[nextIndex]);
    }
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const getIcon = (type: Tab['type']) => {
    switch (type) {
      case 'chapter': return <FileText size={14} />;
      case 'character': return <User size={14} />;
      case 'lore': return <BookOpen size={14} />;
      case 'map': return <Map size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-black/5 shadow-2xl overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-50/50 border-b border-black/5 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveTabId(tab.id);
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                "flex items-center gap-3 px-6 py-4 border-r border-black/5 transition-all relative group min-w-[180px] cursor-pointer outline-none",
                activeTabId === tab.id ? "bg-white text-black" : "text-black/40 hover:bg-black/5 hover:text-black/60"
              )}
            >
              <span className={cn(
                "p-1.5 rounded-md transition-colors",
                activeTabId === tab.id ? "bg-gold/20 text-gold" : "bg-black/5"
              )}>
                {getIcon(tab.type)}
              </span>
              <span className="text-xs font-bold truncate max-w-[100px]">{tab.title}</span>
              {isEditable && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="ml-auto p-1 hover:bg-red-50 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
              {activeTabId === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </div>
          ))}
          <button className="p-4 text-black/20 hover:text-gold transition-colors">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-black/5 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {toolbarButtons.map(btnId => {
            const btn = allButtons.find(b => b.id === btnId);
            if (!btn) return null;
            return (
              <button
                key={btn.id}
                onClick={() => handleAction(btn.action)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 rounded-lg transition-all text-black/60 hover:text-black"
              >
                {btn.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{btn.label}</span>
              </button>
            );
          })}
          <button 
            onClick={() => setIsCustomizingToolbar(!isCustomizingToolbar)}
            className="p-1.5 text-black/20 hover:text-gold transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-[10px] small-caps font-bold text-black/30">
          <span>{activeTab?.type === 'chapter' ? '1,240 words' : ''}</span>
          <span>Auto-saved 2m ago</span>
        </div>
      </div>

      {/* Toolbar Customizer */}
      <AnimatePresence>
        {isCustomizingToolbar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 border-b border-black/5 overflow-hidden"
          >
            <div className="p-6 flex flex-wrap gap-3">
              {allButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => {
                    if (toolbarButtons.includes(btn.id)) {
                      setToolbarButtons(toolbarButtons.filter(id => id !== btn.id));
                    } else {
                      setToolbarButtons([...toolbarButtons, btn.id]);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                    toolbarButtons.includes(btn.id)
                      ? "bg-gold border-gold text-night"
                      : "bg-white border-black/5 text-black/40 hover:border-gold/40"
                  )}
                >
                  {btn.icon}
                  <span className="text-xs font-bold">{btn.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar relative",
          paperTexture === 'none' ? "bg-white" : 
          paperTexture === 'parchment' ? "bg-[#f4e4bc]" :
          paperTexture === 'recycled' ? "bg-[#e0e0e0]" : "bg-gray-50"
        )}
        onContextMenu={handleContextMenu}
      >
        {paperTexture !== 'none' && (
          <div className={cn(
            "absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply",
            paperTexture === 'parchment' ? "bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" :
            paperTexture === 'recycled' ? "bg-[url('https://www.transparenttextures.com/patterns/recycled-paper.png')]" :
            "bg-[url('https://www.transparenttextures.com/patterns/white-paper.png')]"
          )} />
        )}
        <AnimatePresence mode="wait">
          {activeTab ? (
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {activeTab.content}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20">
              <BookOpen size={64} className="mb-6" />
              <h3 className="text-2xl font-serif font-bold">No Active Tabs</h3>
              <p className="text-sm">Select a chapter or character to begin crafting.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

    <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed z-[500] bg-night text-gold rounded-2xl shadow-2xl border border-gold/20 overflow-hidden min-w-[200px]"
          >
            <div className="p-3 border-b border-gold/10 bg-gold/5">
              <div className="text-[8px] small-caps tracking-widest font-bold opacity-40">Editor Tools</div>
            </div>
            <div className="p-2 space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gold/10 rounded-xl transition-all text-sm">
                <FileText size={14} />
                <span>Copy to Clipboard</span>
              </button>
              <div className="h-px bg-gold/10 my-1" />
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/20 text-red-400 rounded-xl transition-all text-sm">
                <X size={14} />
                <span>Clear Selection</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
