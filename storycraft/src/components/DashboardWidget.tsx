import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export default function DashboardWidget({ id, title, children, onRemove, className }: WidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden flex flex-col",
        isDragging && "shadow-2xl ring-2 ring-gold/20",
        className
      )}
    >
      <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/5 rounded transition-colors text-black/30"
          >
            <GripVertical size={16} />
          </button>
          <span className="text-[10px] small-caps tracking-widest font-bold text-black/40">{title}</span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-50 text-black/20 hover:text-red-500 rounded transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 p-5">
        {children}
      </div>
    </div>
  );
}
