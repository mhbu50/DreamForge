import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'motion/react';
import { X, Minus, Maximize2, GripHorizontal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FloatingWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  width?: number;
  height?: number;
}

export default function FloatingWindow({ 
  id, 
  title, 
  children, 
  onClose, 
  initialPosition = { x: 100, y: 100 },
  width = 400,
  height = 500
}: FloatingWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const dragControls = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={windowRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x: initialPosition.x, y: initialPosition.y, opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        height: isMinimized ? 48 : height,
        width: width
      }}
      className="fixed z-[300] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col"
    >
      {/* Header / Drag Handle */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="h-12 bg-gray-50 border-b border-black/5 flex items-center justify-between px-4 cursor-move select-none"
      >
        <div className="flex items-center gap-3">
          <GripHorizontal size={16} className="text-black/20" />
          <span className="text-[10px] small-caps tracking-widest font-bold text-black/60">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-black/5 rounded-lg text-black/40 transition-colors"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-black/40 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 overflow-hidden transition-opacity duration-200",
        isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        {children}
      </div>
    </motion.div>
  );
}
