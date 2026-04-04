import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const googleProvider = new GoogleAuthProvider();
const HEAD_ADMIN_EMAIL = 'alaa.abukhamseen@gmail.com';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createProfile(user: any) {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const isHeadAdmin = user.email?.toLowerCase() === HEAD_ADMIN_EMAIL;
      await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || name || 'Storyteller',
        role: isHeadAdmin ? 'headadmin' : 'user',
        subscriptionTier: isHeadAdmin ? 'ultimate' : 'free',
        customSettings: {},
        xp: 0,
        level: 1,
        createdAt: Date.now(),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        await createProfile(cred.user);
        toast.success('Account created!');
      }
      navigate('/');
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'Email already registered.',
        'auth/invalid-email': 'Invalid email.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      setError(msgs[err.code] || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await createProfile(cred.user);
      toast.success('Welcome!');
      navigate('/');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') setError('Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/30 text-sm mb-8 hover:text-white/50">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 mb-8">
          <Sparkles size={20} className="text-gold" />
          <span className="font-bold text-lg">DreamForge</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h1>
        <p className="text-white/40 text-sm mb-8">{isLogin ? 'Welcome back to DreamForge' : 'Start your storytelling journey'}</p>

        <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 text-white text-sm font-medium mb-6 disabled:opacity-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3 mb-6"><div className="flex-1 h-px bg-white/8" /><span className="text-white/20 text-xs">OR</span><div className="flex-1 h-px bg-white/8" /></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Display name" value={name} onChange={e => setName(e.target.value)} className="input-dark" />}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="input-dark" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input-dark" />
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"><p className="text-red-300 text-sm">{error}</p></div>}
          <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-white/40 text-sm">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-gold hover:underline">{isLogin ? 'Sign up' : 'Sign in'}</button>
        </p>
      </div>
    </div>
  );
}
