import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, User, Star, Trash2, Search, Filter, CheckCircle, XCircle, Settings, BookOpen, Zap, AlertTriangle, Bug, MessageSquare, Clock, Crown, Send, Sparkles, Code, Terminal, Bot, Activity, Database, Cpu, ShieldCheck, RefreshCw, Wand2, Plus, FileText } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, setDoc, getDoc, orderBy, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { UserProfile, Story, Feedback, SubscriptionCode } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICING } from '../constants';

export default function HeadAdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [subscriptionCodes, setSubscriptionCodes] = useState<SubscriptionCode[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'settings' | 'feedback' | 'subscription' | 'codes' | 'legal'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    free: {
      maxStoriesTotal: 1,
      maxPagesPerStory: 5,
      tokensPerMonth: 5,
      bookTokenCost: 1,
    },
    standard: {
      monthlyPrice: 7.00,
      yearlyPrice: 67.20,
      maxStoriesPerMonth: 3,
      maxPagesPerStory: 15,
      tokensPerMonth: 20,
      bookTokenCost: 1,
    },
    premium: {
      monthlyPrice: 19.99,
      yearlyPrice: 191.90,
      maxPagesPerStory: 50,
      tokensPerMonth: 100,
      bookTokenCost: 1,
    },
    ultimate: {
      monthlyPrice: 20.00,
      yearlyPrice: 200.00,
      maxPagesPerStory: 100,
      tokensPerMonth: 500,
      bookTokenCost: 1,
    }
  });

  const [globalSettings, setGlobalSettings] = useState({
    maintenanceMode: false,
    featuredStoryId: '',
    termsOfConditions: 'Default Terms of Conditions...',
    privacyPolicy: 'Default Privacy Policy...',
    uiSettings: {
      showParticles: true,
      showGrain: true,
      showVignette: true,
      primaryColor: '#d4af37',
      secondaryColor: '#0a0a0a',
      fontFamily: 'serif',
      animationsEnabled: true
    }
  });

  const defaultUISettings = {
    showParticles: true,
    showGrain: true,
    showVignette: true,
    primaryColor: '#d4af37',
    secondaryColor: '#0a0a0a',
    fontFamily: 'serif',
    animationsEnabled: true
  };

  const awardBadge = async (user: UserProfile, badge: string) => {
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentBadges = user.badges || [];
      if (currentBadges.includes(badge)) return toast.error("User already has this badge!");
      await updateDoc(userRef, {
        badges: [...currentBadges, badge]
      });
      toast.success(`Awarded ${badge} to ${user.displayName}`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to award badge");
    }
  };

  const toggleAdmin = async (user: UserProfile) => {
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateDoc(userRef, {
        role: newRole
      });
      toast.success(`Updated ${user.displayName} to ${newRole}`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to update role");
    }
  };

  const toggleSubscription = async (user: UserProfile, tier: 'free' | 'standard' | 'premium' | 'ultimate' = 'premium', cycle: 'monthly' | 'yearly' = 'monthly') => {
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newCycle = tier === 'free' ? 'none' : cycle;
      
      // Set expiration to 30 days for monthly, 365 for yearly
      const expiresAt = tier === 'free' ? null : Date.now() + (cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000;

      await updateDoc(userRef, {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionCycle: newCycle,
        subscriptionExpiresAt: expiresAt
      });
      toast.success(`Updated ${user.displayName} to ${tier} tier (${newCycle})`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to update subscription");
    }
  };

  const generateSubscriptionCode = async (tier: 'standard' | 'premium' | 'ultimate') => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const path = `subscription_codes/${code}`;
    try {
      await setDoc(doc(db, 'subscription_codes', code), {
        code,
        tier,
        isUsed: false,
        createdAt: Date.now(),
        createdBy: auth.currentUser?.uid
      });
      toast.success(`Generated 12-digit code for ${tier}: ${code}`);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, path);
      toast.error("Failed to generate code");
    }
  };

  const deleteSubscriptionCode = async (codeId: string) => {
    const path = `subscription_codes/${codeId}`;
    try {
      await deleteDoc(doc(db, 'subscription_codes', codeId));
      toast.success("Code deleted");
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.DELETE, path);
      toast.error("Failed to delete code");
    }
  };

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setUsers(fetchedUsers);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const qStories = query(collection(db, 'stories'));
    const unsubStories = onSnapshot(qStories, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Story[];
      setStories(fetchedStories);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    const qFeedback = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubFeedback = onSnapshot(qFeedback, (snapshot) => {
      const fetchedFeedback = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Feedback[];
      setFeedback(fetchedFeedback);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'feedback'));

    const qCodes = query(collection(db, 'subscription_codes'), orderBy('createdAt', 'desc'));
    const unsubCodes = onSnapshot(qCodes, (snapshot) => {
      const fetchedCodes = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as SubscriptionCode[];
      setSubscriptionCodes(fetchedCodes);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'subscription_codes'));

    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setGlobalSettings(prev => ({ ...prev, ...settingsDoc.data() }));
        } else if (auth.currentUser?.email === 'alaa.abukhamseen@gmail.com') {
          // Bootstrap global settings
          await setDoc(doc(db, 'settings', 'global'), globalSettings);
        }
        const subDoc = await getDoc(doc(db, 'settings', 'subscription'));
        if (subDoc.exists()) {
          setSubscriptionSettings(subDoc.data() as any);
        } else if (auth.currentUser?.email === 'alaa.abukhamseen@gmail.com') {
          // Bootstrap subscription settings
          await setDoc(doc(db, 'settings', 'subscription'), subscriptionSettings);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings');
      }
    };
    fetchSettings();

    return () => {
      unsubUsers();
      unsubStories();
      unsubFeedback();
      unsubCodes();
    };
  }, []);

  const updateSubscriptionSettings = async (updates: any) => {
    const path = 'settings/subscription';
    try {
      await setDoc(doc(db, 'settings', 'subscription'), updates);
      setSubscriptionSettings(updates);
      toast.success("Subscription settings updated!");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      toast.error("Failed to update subscription settings");
    }
  };

  const updateGlobalSettings = async (updates: Partial<typeof globalSettings>) => {
    const path = 'settings/global';
    try {
      const newSettings = { ...globalSettings, ...updates };
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      setGlobalSettings(newSettings);
      toast.success("Settings updated!");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      toast.error("Failed to update settings");
    }
  };

  const updateFeedbackStatus = async (id: string, status: Feedback['status']) => {
    const path = `feedback/${id}`;
    try {
      await updateDoc(doc(db, 'feedback', id), { status });
      toast.success(`Feedback marked as ${status}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to update feedback status");
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    const path = `feedback/${id}`;
    try {
      await deleteDoc(doc(db, 'feedback', id));
      toast.success("Feedback deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      toast.error("Failed to delete feedback");
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    const path = `stories/${storyId}`;
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      toast.success("Story deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      toast.error("Failed to delete story");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gray-900">Head Admin Control</h2>
          <p className="text-gray-500">Manage administrators, stories, and global settings</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'users' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('stories')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'stories' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Stories
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'feedback' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Feedback
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'settings' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Settings
          </button>
          <button 
            onClick={() => setActiveTab('subscription')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'subscription' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Subscription
          </button>
          <button 
            onClick={() => setActiveTab('codes')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'codes' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Codes
          </button>
          <button 
            onClick={() => setActiveTab('legal')}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'legal' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black")}
          >
            Legal
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all w-full"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">User</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Role / Tier</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Level / XP / Tokens</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Badges</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                          {user.displayName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{user.displayName}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit ${
                          user.role === 'headadmin' ? 'bg-purple-100 text-purple-600' :
                          user.role === 'admin' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit flex items-center gap-1 ${
                          user.subscriptionTier === 'premium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {user.subscriptionTier}
                          {user.subscriptionTier === 'premium' && <Crown size={10} />}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400 uppercase">Tokens</span>
                          <input 
                            type="number" 
                            value={user.tokens || 0} 
                            onChange={(e) => updateDoc(doc(db, 'users', user.uid), { tokens: parseInt(e.target.value) })}
                            className="w-20 bg-gray-50 border-none rounded-lg px-2 py-1 text-sm font-bold"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.badges?.map(badge => (
                          <span key={badge} className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded-full border border-purple-100">
                            {badge}
                          </span>
                        ))}
                        <button 
                          onClick={() => awardBadge(user, 'Elite Author')}
                          className="text-[10px] text-purple-400 hover:text-purple-600 font-bold"
                        >
                          + Award
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button
                            onClick={() => toggleSubscription(user, 'free')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'free' ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-blue-600")}
                            title="Set to Free"
                          >
                            <span className="text-[10px] font-bold">F</span>
                          </button>
                          <button
                            onClick={() => toggleSubscription(user, 'standard')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'standard' ? "bg-white shadow-sm text-purple-600" : "text-gray-400 hover:text-purple-600")}
                            title="Set to Standard"
                          >
                            <span className="text-[10px] font-bold">S</span>
                          </button>
                          <button
                            onClick={() => toggleSubscription(user, 'premium')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'premium' ? "bg-white shadow-sm text-amber-600" : "text-gray-400 hover:text-amber-600")}
                            title="Set to Premium"
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleSubscription(user, 'ultimate')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'ultimate' ? "bg-white shadow-sm text-red-600" : "text-gray-400 hover:text-red-600")}
                            title="Set to Ultimate"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        </div>
                        {user.email !== 'alaa.abukhamseen@gmail.com' && (
                          <button
                            onClick={() => toggleAdmin(user)}
                            className={`p-2 rounded-lg transition-all ${
                              user.role === 'admin' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                            }`}
                            title={user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stories' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Story</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Author</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Pages</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{story.title}</div>
                    <div className="text-xs text-gray-500">{story.style}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{story.authorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{story.pages.length}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      story.isPublished ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {story.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteStory(story.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {feedback.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'bug' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {item.type === 'bug' ? <Bug size={24} /> : <MessageSquare size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-widest">{item.type}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'resolved' ? 'bg-green-100 text-green-600' : 
                          item.status === 'reviewed' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{item.userEmail} • {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateFeedbackStatus(item.id!, 'reviewed')}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                      title="Mark as Reviewed"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => updateFeedbackStatus(item.id!, 'resolved')}
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                      title="Mark as Resolved"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => deleteFeedback(item.id!)}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-lg font-medium text-gray-800 leading-relaxed">{item.content}</p>
              </div>
            ))}
            {feedback.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <MessageSquare className="mx-auto mb-4 text-gray-200" size={48} />
                <p className="text-gray-400 font-serif italic text-xl">No feedback received yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <Star className="text-blue-400" />
                <h3 className="text-xl font-bold">Free Tier Limits</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Stories (Total)</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.free?.maxStoriesTotal || 1}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      free: { ...subscriptionSettings.free, maxStoriesTotal: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.free?.maxPagesPerStory || 5}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      free: { ...subscriptionSettings.free, maxPagesPerStory: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tokens/Month</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.free?.tokensPerMonth || 5}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        free: { ...subscriptionSettings.free, tokensPerMonth: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Token Cost/Book</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.free?.bookTokenCost || 1}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        free: { ...subscriptionSettings.free, bookTokenCost: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Tier */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <Star className="text-purple-400" />
                <h3 className="text-xl font-bold">Standard Tier Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Monthly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.standard.monthlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, monthlyPrice: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Yearly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.standard.yearlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, yearlyPrice: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Stories Per Month</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.standard.maxStoriesPerMonth || 3}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      standard: { ...subscriptionSettings.standard, maxStoriesPerMonth: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.standard.maxPagesPerStory}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      standard: { ...subscriptionSettings.standard, maxPagesPerStory: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tokens/Month</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.standard.tokensPerMonth || 20}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, tokensPerMonth: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Token Cost/Book</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.standard.bookTokenCost || 1}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, bookTokenCost: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <Crown className="text-gold" />
                <h3 className="text-xl font-bold">Premium Tier Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Monthly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.premium.monthlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, monthlyPrice: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Yearly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.premium.yearlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, yearlyPrice: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.premium.maxPagesPerStory}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      premium: { ...subscriptionSettings.premium, maxPagesPerStory: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tokens/Month</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.premium.tokensPerMonth || 100}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, tokensPerMonth: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Token Cost/Book</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.premium.bookTokenCost || 1}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, bookTokenCost: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ultimate Tier */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <Zap className="text-red-500" />
                <h3 className="text-xl font-bold">Ultimate Tier Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Monthly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.ultimate?.monthlyPrice || 20.00}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, monthlyPrice: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Yearly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.ultimate?.yearlyPrice || 200.00}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, yearlyPrice: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.ultimate?.maxPagesPerStory || 100}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      ultimate: { ...subscriptionSettings.ultimate, maxPagesPerStory: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tokens/Month</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.ultimate?.tokensPerMonth || 500}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, tokensPerMonth: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Token Cost/Book</label>
                    <input 
                      type="number" 
                      value={subscriptionSettings.ultimate?.bookTokenCost || 1}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, bookTokenCost: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="text-purple-600" />
              <h3 className="text-xl font-bold">Global Configuration</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-500" />
                <div>
                  <div className="font-bold">Maintenance Mode</div>
                  <div className="text-xs text-gray-500">Restrict access to the app</div>
                </div>
              </div>
              <button 
                onClick={() => updateGlobalSettings({ maintenanceMode: !globalSettings.maintenanceMode })}
                className={cn("w-12 h-6 rounded-full transition-all relative", globalSettings.maintenanceMode ? "bg-red-500" : "bg-gray-200")}
              >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", globalSettings.maintenanceMode ? "right-1" : "left-1")} />
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Terms and Conditions</label>
              <textarea 
                value={globalSettings.termsOfConditions}
                onChange={(e) => updateGlobalSettings({ termsOfConditions: e.target.value })}
                className="w-full h-64 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-serif text-sm resize-none"
                placeholder="Enter the long terms and conditions here..."
              />
              <p className="text-[10px] text-gray-400 italic">This text will be displayed on the login page.</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-gold" />
              <h3 className="text-xl font-bold">UI & Visuals</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <div className="font-bold text-sm">Ambient Particles</div>
                  <div className="text-[10px] text-gray-500">Floating dust & magic</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), showParticles: !(globalSettings.uiSettings?.showParticles ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.showParticles ?? true) ? "bg-gold" : "bg-gray-200")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.showParticles ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <div className="font-bold text-sm">Film Grain</div>
                  <div className="text-[10px] text-gray-500">Subtle texture overlay</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), showGrain: !(globalSettings.uiSettings?.showGrain ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.showGrain ?? true) ? "bg-gold" : "bg-gray-200")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.showGrain ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <div className="font-bold text-sm">Vignette</div>
                  <div className="text-[10px] text-gray-500">Soft dark edges</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), showVignette: !(globalSettings.uiSettings?.showVignette ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.showVignette ?? true) ? "bg-gold" : "bg-gray-200")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.showVignette ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <div className="font-bold text-sm">Animations</div>
                  <div className="text-[10px] text-gray-500">Global micro-interactions</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), animationsEnabled: !(globalSettings.uiSettings?.animationsEnabled ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.animationsEnabled ?? true) ? "bg-gold" : "bg-gray-200")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.animationsEnabled ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Primary Color (Gold)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={globalSettings.uiSettings?.primaryColor || '#d4af37'}
                    onChange={(e) => updateGlobalSettings({ 
                      uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), primaryColor: e.target.value } 
                    })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                  />
                  <input 
                    type="text"
                    value={globalSettings.uiSettings?.primaryColor || '#d4af37'}
                    onChange={(e) => updateGlobalSettings({ 
                      uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), primaryColor: e.target.value } 
                    })}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Main Font Family</label>
                <select 
                  value={globalSettings.uiSettings?.fontFamily || 'serif'}
                  onChange={(e) => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), fontFamily: e.target.value } 
                  })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm"
                >
                  <option value="serif">Classic Serif (Cormorant)</option>
                  <option value="sans">Modern Sans (Inter)</option>
                  <option value="playfair">Elegant Serif (Playfair)</option>
                  <option value="mono">Technical (JetBrains)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-gold" />
              <h3 className="text-xl font-bold">Platform Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Total Users</div>
                <div className="text-3xl font-serif font-bold text-purple-600">{users.length}</div>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Stories Forged</div>
                <div className="text-3xl font-serif font-bold text-blue-600">{stories.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-serif font-bold">Subscription Codes</h3>
                <p className="text-sm text-gray-500">Generate 12-digit codes for manual subscription redemption</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => generateSubscriptionCode('standard')}
                  className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
                >
                  + Standard Code
                </button>
                <button 
                  onClick={() => generateSubscriptionCode('premium')}
                  className="px-6 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs hover:bg-purple-100 transition-all"
                >
                  + Premium Code
                </button>
                <button 
                  onClick={() => generateSubscriptionCode('ultimate')}
                  className="px-6 py-2 bg-gold/20 text-gold rounded-xl font-bold text-xs hover:bg-gold/30 transition-all"
                >
                  + Ultimate Code
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">
                    <th className="pb-4 px-4">Code</th>
                    <th className="pb-4 px-4">Tier</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4">Redeemed By</th>
                    <th className="pb-4 px-4">Created At</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscriptionCodes.map((code) => (
                    <tr key={code.id} className="group hover:bg-gray-50/50 transition-all">
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-lg tracking-wider">{code.code}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          code.tier === 'ultimate' ? "bg-gold/20 text-gold" :
                          code.tier === 'premium' ? "bg-purple-100 text-purple-600" :
                          "bg-blue-100 text-blue-600"
                        )}>
                          {code.tier}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {code.isUsed ? (
                          <span className="flex items-center gap-2 text-green-600 text-xs font-bold">
                            <CheckCircle size={14} />
                            Redeemed
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-amber-600 text-xs font-bold">
                            <Clock size={14} />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {code.isUsed ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{users.find(u => u.uid === code.usedBy)?.displayName || 'Unknown User'}</span>
                            <span>{new Date(code.usedAt!).toLocaleDateString()}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => deleteSubscriptionCode(code.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Terms of Conditions */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold">Terms of Conditions</h3>
                  <p className="text-sm text-gray-500">Manage legal terms of use</p>
                </div>
              </div>
              <textarea 
                value={globalSettings.termsOfConditions}
                onChange={(e) => setGlobalSettings({ ...globalSettings, termsOfConditions: e.target.value })}
                className="w-full h-[500px] bg-gray-50 rounded-2xl p-6 text-sm font-light leading-relaxed outline-none focus:ring-2 focus:ring-gold/20 resize-none custom-scrollbar"
                placeholder="Enter terms of conditions..."
              />
            </div>

            {/* Privacy Policy */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold">Privacy Policy</h3>
                  <p className="text-sm text-gray-500">Manage data privacy policy</p>
                </div>
              </div>
              <textarea 
                value={globalSettings.privacyPolicy}
                onChange={(e) => setGlobalSettings({ ...globalSettings, privacyPolicy: e.target.value })}
                className="w-full h-[500px] bg-gray-50 rounded-2xl p-6 text-sm font-light leading-relaxed outline-none focus:ring-2 focus:ring-gold/20 resize-none custom-scrollbar"
                placeholder="Enter privacy policy..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={() => updateGlobalSettings(globalSettings)}
              className="px-10 py-5 bg-gold text-night rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-gold/20 flex items-center gap-3"
            >
              <RefreshCw size={20} />
              Save Legal Documents
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
