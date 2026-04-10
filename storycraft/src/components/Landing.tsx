import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, Wand2, ShoppingBag, ChevronRight, Star, Heart, ShieldCheck, FileText, Image as ImageIcon, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-gold selection:text-night overflow-x-hidden">
      <div className="atmosphere" />
      
      {/* Navigation */}
      <nav className="px-8 py-6 flex items-center justify-between sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-night group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          <span className="font-serif text-2xl tracking-tight">StoryCraft</span>
        </div>
        
        <div className="hidden md:flex items-center gap-12">
          <a href="#features" className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 hover:text-gold transition-colors">Features</a>
          <Link to="/marketplace" className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 hover:text-gold transition-colors">Marketplace</Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-[0.3em] hover:bg-white/10 transition-all">Sign In</Link>
            <Link to="/login" className="px-8 py-3 bg-gold text-night rounded-xl text-xs font-bold uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl shadow-gold/20">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-48 px-6 overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-4 mb-8"
            >
              <span className="w-12 h-[1px] bg-gold/50" />
              <span className="text-xs font-bold uppercase tracking-[0.5em] text-gold">The Ultimate Manual Book Studio</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[12vw] md:text-[9vw] font-serif font-light leading-[0.85] mb-12 tracking-tighter"
            >
              Craft Your <br />
              <span className="italic text-gold">Masterpiece</span> <br />
              Page by <span className="font-bold">Page.</span>
            </motion.h1>

            <div className="flex flex-col md:flex-row items-end gap-16">
              <motion.p 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-white/40 font-light leading-relaxed max-w-2xl"
              >
                The world's first immersive manual story studio. Hand-craft your narratives, upload your own illustrations, and design your books with cinematic precision.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-6 w-full md:w-auto"
              >
                <Link to="/login" className="px-12 py-6 bg-gold text-night rounded-2xl font-bold text-xl hover:scale-105 transition-all shadow-2xl shadow-gold/20 flex items-center justify-center gap-3 whitespace-nowrap">
                  <Wand2 size={24} />
                  <span>Start Crafting</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[60%] h-full pointer-events-none hidden lg:block">
          <motion.div 
            initial={{ opacity: 0, x: 200, rotate: 20 }}
            animate={{ opacity: 1, x: 0, rotate: -10 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="w-full aspect-[4/3] bg-gradient-to-br from-gold/20 to-transparent rounded-[5rem] border border-white/10 p-6 shadow-2xl backdrop-blur-3xl"
          >
            <div className="w-full h-full rounded-[4rem] overflow-hidden relative group">
              <img 
                src="https://picsum.photos/seed/dream/1600/1200" 
                alt="Story Preview" 
                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12">
                <span className="text-gold text-xs font-bold uppercase tracking-[0.5em] mb-4 block">Featured Tale</span>
                <h3 className="text-4xl font-serif font-bold">The Obsidian Citadel</h3>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-48 bg-white/5 relative z-10">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-32 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-7xl font-serif font-light mb-8 leading-tight">Crafted for <span className="italic text-gold">Storytellers</span></h2>
              <p className="text-white/40 small-caps tracking-[0.4em] text-xs">A suite of tools to bring your imagination to life</p>
            </div>
            <div className="h-[1px] flex-1 bg-white/10 hidden md:block mb-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <FileText className="text-gold" size={32} />,
                title: "Manual Editing",
                desc: "Full control over every word. Use our rich text editor to style your manuscript exactly how you envision it."
              },
              {
                icon: <ImageIcon className="text-gold" size={32} />,
                title: "Personal Photos",
                desc: "Upload your own illustrations or photos to every page. Create a truly personal and unique book experience."
              },
              {
                icon: <BookOpen className="text-gold" size={32} />,
                title: "Book-like Experience",
                desc: "Read and create in a beautiful two-page spread layout that mimics the feel of a physical book."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-12 bg-black/40 rounded-[3rem] border border-white/5 hover:border-gold/20 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="text-8xl font-serif font-bold">0{i+1}</span>
                </div>
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-gold group-hover:text-night transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-serif font-bold mb-4">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-48 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { val: "10k+", label: "Books Crafted" },
              { val: "50+", label: "Custom Styles" },
              { val: "4.9", label: "User Rating" },
              { val: "24/7", label: "Availability" }
            ].map((stat, i) => (
              <div key={i} className="space-y-4">
                <span className="text-7xl font-serif font-bold text-gold block">{stat.val}</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gold opacity-5" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-8xl font-serif font-light mb-12 leading-tight tracking-tighter">Ready to <span className="italic text-gold">Craft Your Tale?</span></h2>
            <p className="text-2xl text-white/40 mb-16 font-light italic max-w-2xl mx-auto">"The only limit is your imagination. Every crafted story is a universe waiting to be born."</p>
            <Link to="/login" className="px-16 py-8 bg-gold text-night rounded-[2rem] font-bold text-2xl hover:scale-105 transition-all shadow-2xl shadow-gold/40 inline-flex items-center gap-4 group">
              <span>Get Started for Free</span>
              <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 text-center px-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-night">
            <Sparkles size={20} />
          </div>
          <span className="font-serif font-bold text-2xl">StoryCraft</span>
        </div>
        <div className="flex justify-center gap-12 mb-12">
          {['Twitter', 'Discord', 'Instagram'].map(social => (
            <a key={social} href="#" className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-gold transition-colors">{social}</a>
          ))}
        </div>
        <p className="text-[10px] small-caps tracking-[0.5em] text-white/10">&copy; 2026 Immersive Story Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}

