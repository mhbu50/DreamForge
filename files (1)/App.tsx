import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  // Live-listen to global settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await new Promise(r => setTimeout(r, 500));
        try {
          const snap = await getDoc(doc(db, 'users', authUser.uid));
          if (snap.exists()) setProfile(snap.data() as UserProfile);
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Apply custom primary color from settings
  useEffect(() => {
    if (settings?.uiSettings?.primaryColor) {
      document.documentElement.style.setProperty('--color-gold', settings.uiSettings.primaryColor);
    }
  }, [settings]);

  const isHeadAdmin = profile?.role === 'headadmin' || user?.email === 'alaa.abukhamseen@gmail.com';
  const appName = settings?.uiSettings?.appName || 'DreamForge';
  const logoUrl = settings?.uiSettings?.logoUrl || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold/60 text-xs uppercase tracking-[0.3em] font-semibold">Loading</p>
        </div>
      </div>
    );
  }

  // Maintenance mode — only headadmins can access
  if (settings?.maintenanceMode && !isHeadAdmin) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">Under Maintenance</h1>
          <p className="text-white/40 text-sm">We're making improvements. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors theme="dark" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
        <Route path="/" element={user ? <Dashboard user={user} profile={profile} appName={appName} logoUrl={logoUrl} /> : <Landing appName={appName} logoUrl={logoUrl} />} />
        <Route path="/admin" element={user && isHeadAdmin ? <Admin user={user} profile={profile} /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
