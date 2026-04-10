import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, LogIn, UserPlus, Loader2, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState<{ show: boolean, type: 'terms' | 'privacy' }>({ show: false, type: 'terms' });
  const [legalContent, setLegalContent] = useState({ terms: '', privacy: '' });

  useEffect(() => {
    const fetchLegal = async () => {
      const path = 'settings/global';
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setLegalContent({
            terms: data.termsOfConditions || 'Terms of conditions are currently being updated.',
            privacy: data.privacyPolicy || 'Privacy policy is currently being updated.'
          });
        } else {
          setLegalContent({
            terms: 'Welcome to StoryCraft. By using our service, you agree to craft responsibly and respect the creative rights of others.',
            privacy: 'Your privacy is important to us. We protect your data with cinematic precision.'
          });
        }
      } catch (error) {
        setLegalContent({
          terms: 'Welcome to StoryCraft. By using our service, you agree to craft responsibly and respect the creative rights of others.',
          privacy: 'Your privacy is important to us.'
        });
        handleFirestoreError(error, OperationType.GET, path);
      }
    };
    fetchLegal();
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const path = `users/${user.uid}`;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Anonymous',
            role: user.email === 'alaa.abukhamseen@gmail.com' ? 'headadmin' : 'user',
            subscriptionTier: 'free',
            subscriptionStatus: 'active',
            subscriptionCycle: 'none',
            streak: 0,
            tokens: 5,
            createdAt: Date.now()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      toast.success('Welcome to StoryCraft!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    
    try {
      setLoading(true);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: email.split('@')[0],
          role: email === 'alaa.abukhamseen@gmail.com' ? 'headadmin' : 'user',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          subscriptionCycle: 'none',
          streak: 0,
          tokens: 5,
          createdAt: Date.now()
        });
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 luxury-bg overflow-hidden">
      {/* Left Pane: Branding */}
      <div className="hidden lg:flex flex-col justify-center p-20 relative border-r border-white/10">
        <div className="atmosphere" />
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-night animate-float">
              <Sparkles size={32} />
            </div>
            <span className="small-caps text-gold">StoryCraft</span>
          </div>
          
          <h1 className="title-text mb-8">
            Craft <br />
            <span className="italic font-serif text-gold">Eternal</span> <br />
            Tales.
          </h1>
          
          <p className="text-white/40 max-w-md text-lg leading-relaxed font-light">
            Step into the immersive world of storytelling. 
            Create, illustrate, and narrate your own masterpieces in seconds.
          </p>
        </motion.div>
        
        <div className="absolute bottom-20 left-20">
          <div className="flex gap-8">
            <div>
              <div className="text-3xl font-serif text-gold">10k+</div>
              <div className="small-caps text-[9px]">Stories Crafted</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-gold">50+</div>
              <div className="small-caps text-[9px]">Artistic Styles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Auth Form */}
      <div className="flex items-center justify-center p-8 bg-night relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 glass-surface p-10 rounded-[2rem] border border-white/5 border-t-gold/20"
        >
          <div className="text-center">
            <h2 className="text-4xl font-serif mb-2">{isLogin ? 'Welcome Back' : 'Join the Studio'}</h2>
            <p className="text-white/40 text-sm">{isLogin ? 'Enter your credentials to continue your journey' : 'Create an account to start crafting your tales'}</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="small-caps text-[10px] text-white/60">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/50 transition-all input-focus-underline"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="small-caps text-[10px] text-white/60">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/50 transition-all input-focus-underline"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-night font-bold py-4 rounded-xl hover:bg-gold/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-ripple shadow-lg shadow-gold/20 hover:shadow-gold/40"
            >
              {loading ? <Loader2 className="animate-spin" /> : isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-night px-2 text-white/20">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 text-white font-medium py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 btn-ripple"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span>Google Account</span>
          </button>

          <div className="text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-gold/60 hover:text-gold text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-[10px] text-white/20 uppercase tracking-widest leading-relaxed">
              By logging in you accept <br />
              <button 
                onClick={() => setShowLegal({ show: true, type: 'terms' })}
                className="text-gold/40 hover:text-gold transition-colors underline underline-offset-4"
              >
                terms of conditions
              </button>
              <span className="mx-2">and</span>
              <button 
                onClick={() => setShowLegal({ show: true, type: 'privacy' })}
                className="text-gold/40 hover:text-gold transition-colors underline underline-offset-4"
              >
                privacy policy
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Legal Modal */}
      <AnimatePresence>
        {showLegal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLegal({ ...showLegal, show: false })}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-night border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-white">
                      {showLegal.type === 'terms' ? 'Terms of Conditions' : 'Privacy Policy'}
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Please read carefully</p>
                  </div>
                </div>
                <button onClick={() => setShowLegal({ ...showLegal, show: false })} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap font-light">
                  {showLegal.type === 'terms' ? legalContent.terms : legalContent.privacy}
                </div>
              </div>

              <button 
                onClick={() => setShowLegal({ ...showLegal, show: false })}
                className="mt-8 w-full py-4 bg-gold text-night font-bold rounded-xl hover:bg-gold/90 transition-all"
              >
                I Understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
