import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, RotateCw, FlipHorizontal, FlipVertical, Sun, Contrast, Droplets, Wind, Grid, Sliders, Check } from 'lucide-react';
import { ImageAdjustments } from '../types';
import { cn } from '../lib/utils';

interface ImageEditorProps {
  imageUrl: string;
  adjustments: ImageAdjustments;
  onSave: (adjustments: ImageAdjustments) => void;
  onClose: () => void;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  blur: 0,
  hueRotate: 0,
  rotate: 0,
  flipX: false,
  flipY: false,
};

export default function ImageEditor({ imageUrl, adjustments, onSave, onClose }: ImageEditorProps) {
  const [localAdjustments, setLocalAdjustments] = useState<ImageAdjustments>(adjustments || DEFAULT_ADJUSTMENTS);

  const handleChange = (key: keyof ImageAdjustments, value: any) => {
    setLocalAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const getFilterString = () => {
    const { brightness, contrast, saturation, sepia, grayscale, blur, hueRotate } = localAdjustments;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
  };

  const getTransformString = () => {
    const { rotate, flipX, flipY } = localAdjustments;
    return `rotate(${rotate}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-night/95 backdrop-blur-xl flex items-center justify-center p-8"
    >
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 h-full max-h-[90vh]">
        {/* Preview Area */}
        <div className="flex-[2] bg-black/40 rounded-[3rem] border border-white/10 overflow-hidden relative flex items-center justify-center luxury-bg">
          <div className="atmosphere opacity-20" />
          <div className="relative w-full h-full p-12 flex items-center justify-center">
            <div className="relative max-w-full max-h-full shadow-2xl rounded-2xl overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain transition-all duration-300"
                style={{ 
                  filter: getFilterString(),
                  transform: getTransformString()
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="absolute top-8 left-8 flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <Grid size={14} className="text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Image Lab</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Controls Area */}
        <div className="flex-1 bg-white rounded-[3rem] p-10 flex flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-night rounded-2xl flex items-center justify-center text-gold">
              <Sliders size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold">Adjustments</h2>
              <p className="text-[10px] small-caps tracking-widest text-black/40">Fine-tune your masterpiece</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar">
            {/* Basic Adjustments */}
            <div className="space-y-6">
              <AdjustmentSlider 
                label="Brightness" 
                icon={<Sun size={16} />} 
                value={localAdjustments.brightness} 
                min={0} max={200} 
                onChange={(v) => handleChange('brightness', v)} 
              />
              <AdjustmentSlider 
                label="Contrast" 
                icon={<Contrast size={16} />} 
                value={localAdjustments.contrast} 
                min={0} max={200} 
                onChange={(v) => handleChange('contrast', v)} 
              />
              <AdjustmentSlider 
                label="Saturation" 
                icon={<Droplets size={16} />} 
                value={localAdjustments.saturation} 
                min={0} max={200} 
                onChange={(v) => handleChange('saturation', v)} 
              />
              <AdjustmentSlider 
                label="Hue Rotate" 
                icon={<Wind size={16} />} 
                value={localAdjustments.hueRotate} 
                min={0} max={360} 
                onChange={(v) => handleChange('hueRotate', v)} 
              />
              <AdjustmentSlider 
                label="Blur" 
                icon={<Grid size={16} />} 
                value={localAdjustments.blur} 
                min={0} max={20} 
                onChange={(v) => handleChange('blur', v)} 
              />
              <AdjustmentSlider 
                label="Sepia" 
                icon={<Sliders size={16} />} 
                value={localAdjustments.sepia} 
                min={0} max={100} 
                onChange={(v) => handleChange('sepia', v)} 
              />
              <AdjustmentSlider 
                label="Grayscale" 
                icon={<Sliders size={16} />} 
                value={localAdjustments.grayscale} 
                min={0} max={100} 
                onChange={(v) => handleChange('grayscale', v)} 
              />
            </div>

            {/* Transformations */}
            <div className="pt-8 border-t border-black/5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-6">Transformations</h3>
              <div className="grid grid-cols-3 gap-4">
                <TransformButton 
                  icon={<RotateCw size={18} />} 
                  label="Rotate" 
                  onClick={() => handleChange('rotate', (localAdjustments.rotate + 90) % 360)} 
                />
                <TransformButton 
                  icon={<FlipHorizontal size={18} />} 
                  label="Flip X" 
                  active={localAdjustments.flipX}
                  onClick={() => handleChange('flipX', !localAdjustments.flipX)} 
                />
                <TransformButton 
                  icon={<FlipVertical size={18} />} 
                  label="Flip Y" 
                  active={localAdjustments.flipY}
                  onClick={() => handleChange('flipY', !localAdjustments.flipY)} 
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button 
              onClick={() => setLocalAdjustments(DEFAULT_ADJUSTMENTS)}
              className="flex-1 py-4 bg-black/5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black/10 transition-all"
            >
              Reset
            </button>
            <button 
              onClick={() => onSave(localAdjustments)}
              className="flex-[2] py-4 bg-night text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gold hover:text-night transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AdjustmentSlider({ label, icon, value, min, max, onChange }: { 
  label: string, 
  icon: React.ReactNode, 
  value: number, 
  min: number, 
  max: number, 
  onChange: (v: number) => void 
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-black/60">
          {icon}
          <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold text-gold">{value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer accent-gold"
      />
    </div>
  );
}

function TransformButton({ icon, label, onClick, active }: { 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void,
  active?: boolean
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
        active ? "bg-night text-gold border-night shadow-lg" : "bg-white border-black/5 text-black/40 hover:border-gold hover:text-gold"
      )}
    >
      {icon}
      <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
