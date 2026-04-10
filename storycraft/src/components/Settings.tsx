import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Zap, 
  Volume2, 
  Eye, 
  Lock, 
  Save, 
  RefreshCw,
  Monitor,
  Shield,
  Clock,
  Layout,
  Type,
  CheckCircle2,
  AlertCircle,
  Info,
  Cloud,
  Brain,
  Thermometer,
  Sword,
  Heart,
  Rocket,
  Sparkles,
  Palette,
  Trash2,
  Accessibility,
  Ticket
} from 'lucide-react';
import { ConfigService } from '../services/ConfigService';
import { AppConfig, UserProfile } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface SettingsProps {
  onRedeem?: () => void;
}

export default function Settings({ onRedeem }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig>(ConfigService.getConfig());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
        if (snap.exists()) setUserProfile(snap.data() as UserProfile);
      });
    }
  }, []);

  const handleResetTheme = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        activeThemeId: null
      });
      setUserProfile(prev => prev ? { ...prev, activeThemeId: undefined } : null);
      toast.success("Theme reset to default");
    } catch (error) {
      toast.error("Failed to reset theme");
    }
  };

  const handleUpdate = (updates: Partial<AppConfig>) => {
    const updated = ConfigService.updateConfig(updates);
    setConfig(updated);
    toast.success("Settings updated");
  };

  const handleNestedUpdate = (section: keyof AppConfig, updates: any) => {
    const updatedSection = { ...(config[section] as any), ...updates };
    handleUpdate({ [section]: updatedSection });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pb-32">
      <header className="mb-12">
        <h1 className="text-6xl font-serif font-light mb-4">Forge <span className="italic text-gold">Settings</span></h1>
        <p className="text-black/40 small-caps tracking-[0.3em] text-xs">Optimize your creative engine</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Writing Environment */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
              <Zap size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Writing Flow</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div>
                <p className="text-sm font-bold">Distraction-Free Mode</p>
                <p className="text-xs text-black/40">Hide all UI elements while typing</p>
              </div>
              <button 
                onClick={() => handleNestedUpdate('writing', { distractionFree: !config.writing.distractionFree })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  config.writing.distractionFree ? "bg-gold" : "bg-black/10"
                )}
              >
                <motion.div 
                  animate={{ x: config.writing.distractionFree ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div>
                <p className="text-sm font-bold">Typewriter Scrolling</p>
                <p className="text-xs text-black/40">Keep the active line centered</p>
              </div>
              <button 
                onClick={() => handleNestedUpdate('writing', { typewriterMode: !config.writing.typewriterMode })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  config.writing.typewriterMode ? "bg-gold" : "bg-black/10"
                )}
              >
                <motion.div 
                  animate={{ x: config.writing.typewriterMode ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Ambient Soundscape</label>
              <select 
                value={config.writing.ambientSound}
                onChange={(e) => handleNestedUpdate('writing', { ambientSound: e.target.value })}
                className="w-full p-4 bg-black/5 rounded-2xl outline-none text-sm"
              >
                <option value="none">None</option>
                <option value="rain">Rainy Cafe</option>
                <option value="forest">Ancient Forest</option>
                <option value="space">Deep Space Hub</option>
                <option value="library">Grand Library</option>
              </select>
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Security</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div>
                <p className="text-sm font-bold">App Lock</p>
                <p className="text-xs text-black/40">Require password to open StoryCraft</p>
              </div>
              <button 
                onClick={() => handleNestedUpdate('security', { appLockEnabled: !config.security.appLockEnabled })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  config.security.appLockEnabled ? "bg-gold" : "bg-black/10"
                )}
              >
                <motion.div 
                  animate={{ x: config.security.appLockEnabled ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div>
                <p className="text-sm font-bold">Stealth Mode</p>
                <p className="text-xs text-black/40">Instantly hide app with a hotkey</p>
              </div>
              <button 
                onClick={() => handleNestedUpdate('security', { stealthMode: !config.security.stealthMode })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  config.security.stealthMode ? "bg-gold" : "bg-black/10"
                )}
              >
                <motion.div 
                  animate={{ x: config.security.stealthMode ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>
          </div>
        </section>

        {/* UI Customization */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <Layout size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Interface</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {['modern', 'classic', 'brutalist'].map(theme => (
                  <button
                    key={theme}
                    onClick={() => handleNestedUpdate('ui', { theme })}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                      config.ui.theme === theme ? "bg-black text-white border-black" : "bg-white border-black/5 hover:border-black/20"
                    )}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-black/40">
                <span>Font Size</span>
                <span>{config.ui.fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="12" max="24" 
                value={config.ui.fontSize}
                onChange={(e) => handleNestedUpdate('ui', { fontSize: parseInt(e.target.value) })}
                className="w-full accent-gold"
              />
            </div>

            {userProfile?.activeThemeId && (
              <div className="p-6 bg-gold/5 border border-gold/20 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <Palette size={20} className="text-gold" />
                  <h4 className="text-sm font-bold">Active Custom Theme</h4>
                </div>
                <p className="text-xs text-black/40">You are currently using a custom theme from the marketplace. This may override some interface settings.</p>
                <button 
                  onClick={handleResetTheme}
                  className="w-full py-3 bg-white border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  <span>Reset to Default Theme</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Accessibility */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-green-50 text-green-500 rounded-2xl">
              <Accessibility size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Accessibility</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div>
                <p className="text-sm font-bold">High Contrast</p>
                <p className="text-xs text-black/40">Enhance visibility with sharper colors</p>
              </div>
              <button 
                onClick={() => handleNestedUpdate('accessibility', { highContrast: !config.accessibility?.highContrast })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  config.accessibility?.highContrast ? "bg-gold" : "bg-black/10"
                )}
              >
                <motion.div 
                  animate={{ x: config.accessibility?.highContrast ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
              <div>
                <p className="text-sm font-bold">Dyslexic Font</p>
                <p className="text-xs text-black/40">Use OpenDyslexic for better readability</p>
              </div>
              <button 
                onClick={() => handleNestedUpdate('accessibility', { dyslexicFont: !config.accessibility?.dyslexicFont })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  config.accessibility?.dyslexicFont ? "bg-gold" : "bg-black/10"
                )}
              >
                <motion.div 
                  animate={{ x: config.accessibility?.dyslexicFont ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>
          </div>
        </section>

        {/* Subscription Management */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gold/10 text-gold rounded-2xl">
              <Ticket size={24} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Subscription & Access</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-black/5 rounded-[2rem] border border-black/5">
            <div className="flex-1">
              <h3 className="text-xl font-serif font-bold mb-2">Redeem Access Code</h3>
              <p className="text-sm text-black/40 font-medium">Have a 12-character subscription code? Enter it here to upgrade your account instantly.</p>
            </div>
            <button 
              onClick={() => {
                if (onRedeem) {
                  onRedeem();
                } else {
                  toast.info("Please use the 'REDEEM' button in the sidebar or your profile to enter your code.");
                }
              }}
              className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all flex items-center gap-2 shadow-xl shadow-black/10"
            >
              <Zap size={18} />
              Redeem Code
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
