import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Palette, Mic, ArrowRight } from 'lucide-react';

interface Props { appName: string; logoUrl: string; }

export default function Landing({ appName, logoUrl }: Props) {
  const navigate = useNavigate();

  const Logo = () => logoUrl
    ? <img src={logoUrl} alt={appName} className="w-8 h-8 rounded-lg object-cover" />
    : <Sparkles size={20} className="text-gold" />;

  return (
    <div className="min-h-screen bg-night text-white">
      <nav className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-bold text-lg">{appName}</span>
        </div>
        <button onClick={() => navigate('/login')} className="btn-gold !py-2.5 !px-5 !text-xs">Get Started</button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/15 bg-gold/5 mb-8">
          <Sparkles size={12} className="text-gold" />
          <span className="text-gold/80 text-xs font-semibold uppercase tracking-wider">AI-Powered Story Studio</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-[0.9] tracking-tight">
          Stories That<br /><span className="text-gold">Come Alive</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto mb-10 font-serif leading-relaxed">
          Create illustrated children's books, comics, and anime with AI-powered writing, 25+ art styles, and voice narration.
        </p>
        <button onClick={() => navigate('/login')} className="btn-gold flex items-center gap-2 mx-auto">
          Start Creating <ArrowRight size={16} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, title: 'AI Stories', desc: 'Generate rich multi-page stories with a single prompt.' },
            { icon: Palette, title: '25+ Styles', desc: 'Watercolor, Neon Noir, Celestial Map, and more.' },
            { icon: Mic, title: 'Narration', desc: 'Bring your stories to life with AI voice narration.' },
          ].map(f => (
            <div key={f.title} className="glass-card p-6">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4"><f.icon size={20} className="text-gold" /></div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-white/20 text-xs">&copy; 2025 {appName}</p>
      </footer>
    </div>
  );
}
