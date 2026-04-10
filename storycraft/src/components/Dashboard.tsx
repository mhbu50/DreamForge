import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Plus, LogOut, ShieldAlert, BookOpen, Shield, Star, Bug, MessageSquare, Send, X, UserPlus, Crown, CreditCard, Loader2, Check, Zap, Share2, Monitor, FileText, Maximize2, Command, Eye, ChevronRight, ChevronLeft, Settings as SettingsIcon, Layout, Edit3, Image as ImageIcon, Palette, LifeBuoy, Bot, CheckCircle } from 'lucide-react';
import { Story, StoryPage, StoryStyle, UserProfile, ImageAdjustments } from '../types';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy, updateDoc, getDocs, getDoc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { Link } from 'react-router-dom';
import { getSubscriptionLimits, SUBSCRIPTION_PRICING } from '../constants';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

import StoryCreator from './StoryCreator';
import StoryViewer from './StoryViewer';
import StoryLibrary from './StoryLibrary';
import HeadAdminPanel from './HeadAdminPanel';
import Settings from './Settings';
import Support from './Support';
import ThemeMarketplace from './ThemeMarketplace';
import BookTypeSelector from './BookTypeSelector';
import WidgetGrid from './WidgetGrid';
import WorkspacePresets from './WorkspacePresets';
import FloatingWindow from './FloatingWindow';
import TabbedWorkspace from './TabbedWorkspace';
import { WordCountWidget, ImagePreviewWidget, ProgressWidget } from './Widgets';
import { Book as BookEntity, BookType } from '../types';
import { ConfigService } from '../services/ConfigService';

interface DashboardProps {
  userProfile: UserProfile | null;
}

export default function Dashboard({ userProfile }: DashboardProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [books, setBooks] = useState<BookEntity[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedBookType, setSelectedBookType] = useState<BookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeView, setActiveView] = useState<'library' | 'workspace' | 'themes' | 'forge-settings' | 'support' | 'publish'>('library');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const [widgets, setWidgets] = useState<string[]>(['word-count', 'image-preview', 'progress']);
  const [isForging, setIsForging] = useState(false);
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [detachedWidgets, setDetachedWidgets] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const [showProfile, setShowProfile] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [dynamicSubscriptionSettings, setDynamicSubscriptionSettings] = useState<any>(null);
  const [partnerModal, setPartnerModal] = useState<{ show: boolean, story: Story | null }>({ show: false, story: null });
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [config, setConfig] = useState(ConfigService.getConfig());

  const isHeadAdmin = userProfile?.email === 'alaa.abukhamseen@gmail.com';

  const currentLimits = useMemo(() => {
    const tier = userProfile?.subscriptionTier || 'free';
    const baseLimits = getSubscriptionLimits(tier);
    const settingsLimits = dynamicSubscriptionSettings?.[tier] || {};

    return {
      ...baseLimits,
      ...settingsLimits
    };
  }, [userProfile, dynamicSubscriptionSettings]);

  const getStoriesCreatedThisMonth = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return stories.filter(s => s.createdAt >= startOfMonth && s.userId === userProfile?.uid).length;
  }, [stories, userProfile]);

  const canCreateStory = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.subscriptionTier === 'premium' || userProfile.subscriptionTier === 'ultimate') return true;
    
    if (userProfile.subscriptionTier === 'free') {
      const totalStories = stories.filter(s => s.userId === userProfile.uid).length;
      return totalStories < (currentLimits.maxStoriesTotal || 1);
    }
    
    if (userProfile.subscriptionTier === 'standard') {
      const createdThisMonth = getStoriesCreatedThisMonth();
      return createdThisMonth < (currentLimits.maxStoriesPerMonth || 3);
    }
    
    return false;
  }, [userProfile, stories, currentLimits, getStoriesCreatedThisMonth]);

  useEffect(() => {
    if (!auth.currentUser || !userProfile) return;

    // Update streak and lastActive
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = userProfile.lastActive || 0;
    
    if (lastActive < today) {
      const isConsecutive = lastActive === today - 86400000;
      const path = `users/${auth.currentUser.uid}`;
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        streak: isConsecutive ? (userProfile.streak || 0) + 1 : 1,
        lastActive: today
      }).catch(error => handleFirestoreError(error, OperationType.UPDATE, path));
    }

    const q1 = query(
      collection(db, 'stories'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const q2 = query(
      collection(db, 'stories'), 
      where('collaborators', 'array-contains', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub1 = onSnapshot(q1, (snapshot) => {
      const ownedStories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Story[];
      setStories(prev => {
        const others = prev.filter(s => s.userId !== auth.currentUser?.uid);
        const combined = [...ownedStories, ...others].sort((a, b) => b.createdAt - a.createdAt);
        // Remove duplicates
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
      setIsLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const collabStories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Story[];
      setStories(prev => {
        const others = prev.filter(s => s.userId === auth.currentUser?.uid);
        const combined = [...collabStories, ...others].sort((a, b) => b.createdAt - a.createdAt);
        // Remove duplicates
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    const fetchSettings = async () => {
      const path = 'settings/subscription';
      try {
        const subDoc = await getDoc(doc(db, 'settings', 'subscription'));
        if (subDoc.exists()) {
          setDynamicSubscriptionSettings(subDoc.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };
    fetchSettings();

    // Token Refill Logic
    const refillTokens = async () => {
      if (!auth.currentUser || !userProfile) return;
      
      const now = Date.now();
      const lastRefill = userProfile.lastTokenRefill || userProfile.createdAt || now;
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      if (now - lastRefill >= thirtyDaysInMs) {
        const tier = userProfile.subscriptionTier || 'free';
        const limits = dynamicSubscriptionSettings?.[tier] || getSubscriptionLimits(tier);
        const refillAmount = limits.tokensPerMonth || 5;

        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            tokens: (userProfile.tokens || 0) + refillAmount,
            lastTokenRefill: now
          });
          toast.success(`Monthly tokens refilled! You received ${refillAmount} tokens.`);
        } catch (error) {
          console.error("Failed to refill tokens:", error);
        }
      }
    };
    refillTokens();

    return () => {
      unsub1();
      unsub2();
    };
  }, [userProfile?.uid]);

  const handleUpgrade = async (tier: 'standard' | 'premium' | 'ultimate', cycle: 'monthly' | 'yearly') => {
    if (!auth.currentUser) return;
    setIsUpgrading(true);
    const path = `users/${auth.currentUser.uid}`;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const expiresAt = Date.now() + (cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000;
      
      await updateDoc(userRef, {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionCycle: cycle,
        subscriptionExpiresAt: expiresAt
      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: tier === 'ultimate' ? ['#FFD700', '#C0C0C0', '#000000'] : (tier === 'premium' ? ['#D4AF37', '#000000', '#FFFFFF'] : ['#9333EA', '#000000', '#FFFFFF'])
      });

      toast.success(`Welcome to ${tier}! Your journey has just begun.`);
      setShowPricingModal(false);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to upgrade subscription");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleAddPartner = async () => {
    if (!partnerEmail.trim() || !partnerModal.story || !auth.currentUser) return;
    
    const limits = currentLimits;
    if (!limits.allowCollaboration) {
      toast.error("Collaboration is a Premium feature. Upgrade to forge stories with your friends!");
      return;
    }

    setIsAddingPartner(true);
    const pathUsers = 'users';
    const pathStory = `stories/${partnerModal.story.id}`;
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', partnerEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error("User not found. Make sure they have signed up!");
        return;
      }

      const partnerUser = querySnapshot.docs[0].data() as UserProfile;
      if (partnerUser.uid === auth.currentUser.uid) {
        toast.error("You are already the author!");
        return;
      }

      const storyRef = doc(db, 'stories', partnerModal.story.id);
      const currentCollaborators = partnerModal.story.collaborators || [];
      
      if (currentCollaborators.includes(partnerUser.uid)) {
        toast.error("User is already a collaborator!");
        return;
      }

      await updateDoc(storyRef, {
        collaborators: [...currentCollaborators, partnerUser.uid]
      });

      toast.success(`Added ${partnerUser.displayName} as a partner!`);
      setPartnerModal({ show: false, story: null });
      setPartnerEmail('');
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, pathStory);
      }
      toast.error("Failed to add partner");
    } finally {
      setIsAddingPartner(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!userProfile || !redeemCode) return;
    if (redeemCode.length !== 12) {
      toast.error("Code must be 12 characters");
      return;
    }

    setIsRedeeming(true);
    const path = `subscription_codes/${redeemCode}`;
    try {
      const codeRef = doc(db, 'subscription_codes', redeemCode);
      const codeDoc = await getDoc(codeRef);

      if (!codeDoc.exists()) {
        toast.error("Invalid code. Please check and try again.");
        return;
      }

      const codeData = codeDoc.data();
      if (codeData.isUsed) {
        toast.error("This code has already been redeemed.");
        return;
      }

      // Update code status
      await updateDoc(codeRef, {
        isUsed: true,
        usedBy: userProfile.uid,
        usedAt: Date.now()
      });

      // Update user subscription
      const userRef = doc(db, 'users', userProfile.uid);
      const tierLimits = getSubscriptionLimits(codeData.tier as any);
      
      await updateDoc(userRef, {
        subscriptionTier: codeData.tier,
        subscriptionStatus: 'active',
        subscriptionCycle: 'monthly',
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        tokens: increment(tierLimits.tokensPerMonth || 0),
        lastTokenRefill: Date.now()
      });

      toast.success(`Successfully redeemed ${codeData.tier} subscription!`);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowRedeemModal(false);
      setRedeemCode('');
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      toast.error("Failed to redeem code. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCreateComplete = async (title: string, pages: StoryPage[], style: StoryStyle, category: string, language: string, ageGroup: string, bookType: BookType = 'story', authorName?: string, coverImage?: string, coverImageAdjustments?: ImageAdjustments) => {
    if (!auth.currentUser || !userProfile) return;
    
    setIsForging(true);
    const tokenCost = isEditing ? 0 : (currentLimits.bookTokenCost || 1);
    const userTokens = userProfile.tokens || 0;

    if (!isEditing && userTokens < tokenCost) {
      toast.error(`Insufficient tokens! You need ${tokenCost} tokens to forge this story.`);
      setShowPricingModal(true);
      return;
    }

    const pathStory = 'stories';
    const pathUser = `users/${auth.currentUser.uid}`;
    try {
      if (isEditing && editingStory) {
        // Update existing story
        await updateDoc(doc(db, 'stories', editingStory.id), {
          title,
          pages,
          style,
          category,
          language,
          ageGroup,
          authorName: authorName || userProfile.displayName,
          coverImage: coverImage || '',
          coverImageAdjustments: coverImageAdjustments || null,
          updatedAt: Date.now()
        });

        if (editingStory.bookId) {
          await updateDoc(doc(db, 'books', editingStory.bookId), {
            title,
            coverImage: coverImage || '',
            updatedAt: Date.now(),
            metadata: {
              style,
              language,
              ageGroup,
              authorName: authorName || userProfile.displayName
            }
          });
        }
        
        toast.success("Story updated successfully!");
        setIsEditing(false);
        setEditingStory(null);
        setCurrentStory(null);
      } else {
        // Create the Book entity
        const newBookData = {
          userId: auth.currentUser.uid,
          title,
          type: bookType,
          description: `A new ${bookType} project by ${authorName || userProfile.displayName}.`,
          status: 'draft',
          coverImage: coverImage || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          metadata: {
            style,
            language,
            ageGroup,
            authorName: authorName || userProfile.displayName
          }
        };

        const bookRef = await addDoc(collection(db, 'books'), newBookData);

        // Create the initial story/pages as chapters or a main story document
        const newStoryData = {
          userId: auth.currentUser.uid,
          bookId: bookRef.id,
          authorName: authorName || userProfile?.displayName || 'Anonymous',
          coverImage: coverImage || '',
          coverImageAdjustments: coverImageAdjustments || null,
          title,
          pages,
          style,
          category: (ageGroup === 'Adult' || ageGroup === 'YA') ? 'drama' : 'adventure',
          language,
          ageGroup,
          isPublished: false,
          price: 9.99,
          likes: 0,
          createdAt: Date.now()
        };
        
        await addDoc(collection(db, 'stories'), newStoryData);
        
        // Also create a first chapter for the workspace
        await addDoc(collection(db, `books/${bookRef.id}/chapters`), {
          title: 'Chapter 1',
          content: pages.map(p => p.text || p.content).join('\n\n'),
          order: 1,
          wordCount: pages.reduce((acc, p) => acc + (p.text || p.content || '').split(/\s+/).length, 0),
          isLocked: false,
          isGhost: false,
          createdAt: Date.now()
        });
        
        const updates: any = {
          tokens: userTokens - tokenCost
        };

        // Award badge for first story
        const newBadges = [...(userProfile?.badges || [])];
        let badgeAwarded = false;

        if (stories.length === 0 && !newBadges.includes('First Tale')) {
          newBadges.push('First Tale');
          toast.success("Achievement Unlocked: First Tale!");
          badgeAwarded = true;
        }
        
        if (stories.length === 4 && !newBadges.includes('Storyteller')) {
          newBadges.push('Storyteller');
          toast.success("Achievement Unlocked: Storyteller!");
          badgeAwarded = true;
        }

        if (stories.length === 9 && !newBadges.includes('Legend')) {
          newBadges.push('Legend');
          toast.success("Achievement Unlocked: Legend!");
          badgeAwarded = true;
        }

        const hour = new Date().getHours();
        if ((hour >= 22 || hour <= 4) && !newBadges.includes('Night Owl')) {
          newBadges.push('Night Owl');
          toast.success("Achievement Unlocked: Night Owl!");
          badgeAwarded = true;
        }

        if (badgeAwarded) {
          updates.badges = newBadges;
        }

        await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
        
        setIsCreating(false);
        toast.success("Story forged successfully!");
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, 'stories');
      }
      toast.error("Failed to save story.");
    } finally {
      setIsForging(false);
    }
  };

  const handlePublish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const limits = currentLimits;
    if (!limits.allowMarketplacePublishing) {
      toast.error("Publishing to the marketplace is a Premium feature. Upgrade to share your tales with the world!");
      return;
    }

    const path = `stories/${id}`;
    try {
      await updateDoc(doc(db, 'stories', id), {
        isPublished: true,
        price: 9.99
      });
      toast.success("Story published to marketplace!");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to publish story");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const path = `stories/${id}`;
    try {
      await deleteDoc(doc(db, 'stories', id));
      if (currentStory?.id === id) setCurrentStory(null);
      toast.success("Story deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      toast.error("Failed to delete story");
    }
  };

  const handleSelectStory = (story: Story) => {
    // Particle burst effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#000000', '#FFFFFF'],
      shapes: ['circle', 'square'],
      scalar: 0.8
    });
    setCurrentStory(story);
  };

  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.style.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#0A0A0A] flex selection:bg-gold selection:text-night overflow-hidden">
      <div className="atmosphere opacity-[0.03]" />
      
      {/* Forging Overlay */}
      <AnimatePresence>
        {isForging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-night/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 overflow-hidden"
          >
            <div className="atmosphere opacity-40" />
            
            {/* Floating particles for forging */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: window.innerHeight + 100,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 5,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                  className="absolute w-1 h-1 bg-gold/40 rounded-full blur-[1px]"
                />
              ))}
            </div>

            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-40 h-40 border-[1px] border-gold/20 rounded-full flex items-center justify-center relative"
              >
                <div className="absolute inset-0 border-t-2 border-gold rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-4 border-b-2 border-gold/40 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                
                <motion.div 
                  animate={{ 
                    scale: [0.9, 1.1, 0.9],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-gold"
                >
                  <Sparkles size={48} className="drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 space-y-6 relative z-10"
            >
              <div className="space-y-2">
                <h2 className="text-5xl font-serif font-bold text-white tracking-tight">Forging Masterpiece</h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] w-8 bg-gold/20" />
                  <p className="text-gold font-bold tracking-[0.3em] uppercase text-[10px]">Transmuting Ideas</p>
                  <div className="h-[1px] w-8 bg-gold/20" />
                </div>
              </div>
              
              <div className="w-80 h-1 bg-white/5 rounded-full overflow-hidden mx-auto relative">
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold to-transparent"
                />
              </div>
              
              <p className="text-white/30 text-[10px] font-medium uppercase tracking-widest animate-pulse">
                Aligning creative frequencies...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        style={{ width: sidebarWidth }}
        className={cn(
          "fixed left-0 top-0 bottom-0 bg-white border-r border-black/5 z-[60] flex flex-col transition-transform duration-500",
          isZenMode && "-translate-x-full"
        )}
      >
        <div className="p-8 flex items-center gap-4 border-b border-black/5 group/logo cursor-pointer">
          <div className="w-12 h-12 bg-night rounded-2xl flex items-center justify-center text-gold shadow-2xl shadow-gold/20 group-hover/logo:rotate-12 transition-transform duration-500">
            <Sparkles size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-serif font-bold tracking-tight">StoryCraft</span>
            <span className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">Studio</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {([
            { view: 'library', icon: <Layout size={20} />, label: 'Library' },
            { view: 'workspace', icon: <Edit3 size={20} />, label: 'Workspace' },
            { view: 'themes', icon: <Palette size={20} />, label: 'Themes' },
            { view: 'forge-settings', icon: <SettingsIcon size={20} />, label: 'Settings' },
            { view: 'support', icon: <LifeBuoy size={20} />, label: 'Support' },
            { view: 'publish', icon: <Share2 size={20} />, label: 'Publish' },
          ] as const).map(({ view, icon, label }) => (
            <button
              key={view}
              onClick={() => { setCurrentStory(null); setIsCreating(false); setShowAdmin(false); setActiveView(view); }}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group relative overflow-hidden",
                activeView === view
                  ? "bg-black text-white shadow-xl"
                  : "text-black/40 hover:bg-black/5 hover:text-black"
              )}
            >
              {activeView === view && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full" />
              )}
              <span className={cn("transition-colors", activeView === view ? "text-gold" : "")}>
                {icon}
              </span>
              <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-black/5">
          <div 
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-4 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold border-2 border-gold/40 group-hover:scale-110 transition-transform">
              {userProfile?.displayName?.[0] || 'U'}
            </div>
            <span className="text-left">
              <span className="block text-sm font-bold truncate max-w-[120px]">{userProfile?.displayName}</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] small-caps tracking-widest text-black/30 font-bold">{userProfile?.subscriptionTier || 'Free'} Plan</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowRedeemModal(true); }}
                  className="text-[8px] font-bold text-gold hover:text-night hover:bg-gold px-1.5 py-0.5 rounded border border-gold/20 transition-all"
                >
                  REDEEM
                </button>
              </span>
            </span>
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-gold/40 transition-colors z-[70]"
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500" style={{ marginLeft: isZenMode ? 0 : sidebarWidth }}>
        {/* Header */}
        <header className={cn(
          "h-24 border-b border-black/5 bg-white/80 backdrop-blur-xl flex items-center justify-between px-12 sticky top-0 z-40 transition-all duration-500",
          isZenMode && "-translate-y-full"
        )}>
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <span className="text-lg font-serif font-bold">StoryCraft</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="group relative">
              <div className="flex items-center gap-3 px-6 py-3 bg-gold/5 rounded-2xl border border-gold/10 shadow-sm hover:shadow-md transition-all cursor-help">
                <div className="w-8 h-8 bg-gold rounded-xl flex items-center justify-center text-night shadow-lg shadow-gold/20">
                  <Zap size={18} className="fill-night" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gold leading-none">{userProfile?.tokens || 0}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gold/60">Tokens Available</span>
                </div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute top-full right-0 mt-3 w-64 bg-night text-white p-4 rounded-2xl shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none z-50 border border-white/10">
                <div className="flex items-center gap-2 mb-2 text-gold">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Forging Costs</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-60">New Story</span>
                    <span className="text-xs font-bold text-gold">1 Token</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-60">AI Generation</span>
                    <span className="text-xs font-bold text-gold">Included</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] opacity-40 leading-relaxed italic">Tokens refresh monthly based on your subscription tier.</p>
                </div>
              </div>
            </div>
            {isHeadAdmin && (
              <button 
                onClick={() => setShowAdmin(!showAdmin)}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${showAdmin ? 'bg-purple-600 text-white' : 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20'}`}
              >
                <Shield size={20} />
                <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Head Admin</span>
              </button>
            )}
            
            <button 
              onClick={() => {
                if (canCreateStory) {
                  setShowTypeSelector(true);
                } else {
                  setShowPricingModal(true);
                  toast.error(
                    userProfile?.subscriptionTier === 'free' 
                      ? "Free tier limit reached (1 story total). Upgrade to create more!"
                      : "Monthly limit reached (3 stories). Upgrade to Premium for unlimited stories!"
                  );
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gold hover:text-night transition-all font-bold shadow-xl shadow-black/10"
            >
              <Plus size={20} />
              <span>Create Project</span>
            </button>

            <button onClick={() => auth.signOut()} className="p-3 text-black/20 hover:text-black transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </header>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && userProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-gold/20 to-purple-500/20" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-4xl font-serif font-bold text-night mb-6">
                  {userProfile.displayName?.[0]}
                </div>
                <h3 className="text-3xl font-serif font-bold text-night mb-2">{userProfile.displayName}</h3>
                <p className="text-sm text-black/40 mb-8">{userProfile.email}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">🔥 {userProfile.streak || 0}</div>
                    <div className="text-[10px] small-caps tracking-widest text-orange-400 font-bold">Day Streak</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">{stories.length}</div>
                    <div className="text-[10px] small-caps tracking-widest text-purple-400 font-bold">Stories Forged</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="text-2xl font-bold text-amber-600">{userProfile.tokens || 0}</div>
                    <div className="text-[10px] small-caps tracking-widest text-amber-400 font-bold">Tokens Available</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 relative group">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-amber-600 capitalize">{userProfile.subscriptionTier}</div>
                      {userProfile.subscriptionTier === 'premium' && <Crown size={16} className="text-amber-600" />}
                    </div>
                    <div className="text-[10px] small-caps tracking-widest text-amber-400 font-bold">Subscription</div>
                    <button 
                      onClick={() => { setShowProfile(false); setShowRedeemModal(true); }}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-lg text-amber-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-600 hover:text-white shadow-sm"
                      title="Redeem Code"
                    >
                      <Zap size={14} />
                    </button>
                  </div>
                </div>

                <div className="w-full mb-8">
                </div>

                {userProfile.subscriptionTier === 'standard' && (
                  <button 
                    onClick={() => {
                      setShowProfile(false);
                      setShowPricingModal(true);
                    }}
                    className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mb-8"
                  >
                    <Crown size={20} />
                    Upgrade to Premium
                  </button>
                )}

                <div className="w-full text-left">
                  <h4 className="text-[10px] small-caps tracking-widest text-black/40 font-bold mb-4">Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.badges?.map(badge => (
                      <div key={badge} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <Star size={14} className="text-gold" />
                        <span className="text-sm font-medium">{badge}</span>
                      </div>
                    ))}
                    {(!userProfile.badges || userProfile.badges.length === 0) && (
                      <p className="text-xs text-black/20 italic italic">No badges earned yet. Start crafting!</p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setShowProfile(false)}
                  className="mt-10 w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Type Selector */}
      <AnimatePresence>
        {showTypeSelector && (
          <BookTypeSelector 
            onSelect={(type) => {
              setSelectedBookType(type);
              setShowTypeSelector(false);
              setIsCreating(true);
            }}
            onCancel={() => setShowTypeSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* Detached Floating Windows */}
      <AnimatePresence>
      </AnimatePresence>

      {/* Floating Support Button */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {showSupportMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="flex flex-col gap-2 mb-2"
            >
              <button
                onClick={() => { setShowSupportMenu(false); setActiveView('support'); }}
                className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl shadow-2xl border border-black/5 hover:bg-red-50 hover:text-red-600 transition-all group"
              >
                <Bug size={18} className="group-hover:animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-widest">Report Bug</span>
              </button>
              <button
                onClick={() => { setShowSupportMenu(false); setActiveView('support'); }}
                className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl shadow-2xl border border-black/5 hover:bg-blue-50 hover:text-blue-600 transition-all group"
              >
                <MessageSquare size={18} className="group-hover:animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-widest">Suggestion</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowSupportMenu(!showSupportMenu)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95",
            showSupportMenu ? "bg-black text-white" : "bg-gold text-night"
          )}
        >
          {showSupportMenu ? <X size={24} /> : <LifeBuoy size={24} />}
        </button>
      </div>

      <main className={cn(
        "flex-1 container mx-auto px-6 py-12 max-w-7xl relative z-10 transition-all duration-500",
        isZenMode && "opacity-0 pointer-events-none scale-95"
      )}>
        <AnimatePresence mode="wait">
          {isCreating || isEditing ? (
            <motion.div
              key="creator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StoryCreator 
                userId={userProfile?.uid || ''}
                onComplete={handleCreateComplete}
                onCancel={() => { setIsCreating(false); setIsEditing(false); setEditingStory(null); }}
                userDisplayName={userProfile?.displayName || 'Anonymous'}
                userSubscriptionTier={userProfile?.subscriptionTier || 'standard'}
                subscriptionLimits={currentLimits}
                userTokens={userProfile?.tokens || 0}
                bookType={selectedBookType}
                config={config}
                initialStory={editingStory}
              />
            </motion.div>
          ) : currentStory ? (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <StoryViewer 
                story={currentStory}
                onClose={() => setCurrentStory(null)}
                onEdit={(story) => {
                  setEditingStory(story);
                  setIsEditing(true);
                }}
                narrator="Kore"
              />
            </motion.div>
          ) : showAdmin && isHeadAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HeadAdminPanel />
            </motion.div>
          ) : activeView === 'library' ? (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Command Center</h1>
                  <p className="text-gray-500">Welcome back to your creative sanctuary.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsZenMode(!isZenMode)}
                    className={cn(
                      "p-3 rounded-2xl transition-all shadow-xl",
                      isZenMode ? "bg-gold text-night" : "bg-white text-black/40 hover:text-black"
                    )}
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[10px] small-caps tracking-widest text-black/40 font-bold">Total Stories</div>
                    <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-black/30 group-hover:bg-gold/10 group-hover:text-gold transition-all">
                      <BookOpen size={16} />
                    </div>
                  </div>
                  <div className="text-4xl font-serif font-bold">{stories.length}</div>
                  <div className="mt-3 h-1 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gold/40 rounded-full transition-all" style={{width: `${Math.min(stories.length * 10, 100)}%`}} />
                  </div>
                </div>
                <div className="p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[10px] small-caps tracking-widest text-black/40 font-bold">Current Streak</div>
                    <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-black/30 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all">
                      <Star size={16} />
                    </div>
                  </div>
                  <div className="text-4xl font-serif font-bold text-orange-500">{userProfile?.streak || 0} <span className="text-2xl text-black font-light">Days</span></div>
                  <div className="mt-3 h-1 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-300/50 rounded-full transition-all" style={{width: `${Math.min((userProfile?.streak || 0) * 5, 100)}%`}} />
                  </div>
                </div>
                <div className="p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[10px] small-caps tracking-widest text-black/40 font-bold">Tokens</div>
                    <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-black/30 group-hover:bg-gold/10 group-hover:text-gold transition-all">
                      <Zap size={16} />
                    </div>
                  </div>
                  <div className="text-4xl font-serif font-bold text-gold">{userProfile?.tokens || 0}</div>
                  <div className="mt-3 h-1 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gold/40 rounded-full transition-all" style={{width: `${Math.min((userProfile?.tokens || 0) * 2, 100)}%`}} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeView === 'workspace' ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-[calc(100vh-200px)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Creative Workspace</h1>
                  <p className="text-gray-500">Multi-tab editing for your forge projects.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-black/5 rounded-xl flex items-center gap-2 text-[10px] small-caps tracking-widest font-bold text-black/40">
                    <Command size={12} />
                    <span>+ P for Commands</span>
                  </div>
                  <button 
                    onClick={() => setIsZenMode(true)}
                    className="p-3 bg-white border border-black/5 rounded-2xl text-black/40 hover:text-black transition-all shadow-xl"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <TabbedWorkspace />
              </div>
            </motion.div>
          ) : activeView === 'themes' ? (
            <motion.div
              key="themes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ThemeMarketplace />
            </motion.div>
          ) : activeView === 'forge-settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Settings onRedeem={() => setShowRedeemModal(true)} />
            </motion.div>
          ) : activeView === 'support' ? (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Support />
            </motion.div>
          ) : activeView === 'publish' ? (
            <motion.div
              key="publish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-12 overflow-y-auto custom-scrollbar"
            >
              <header className="mb-12">
                <h1 className="text-6xl font-serif font-light mb-4 text-night">Forge <span className="italic text-gold">Publish</span></h1>
                <p className="text-black/40 small-caps tracking-[0.3em] text-xs">Share your creations with the world</p>
              </header>

              {isHeadAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group cursor-pointer"
                  onClick={() => setShowAdmin(true)}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-gold/20 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center text-gold">
                        <Bot size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold">App Architect</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] uppercase tracking-widest text-white/40">Active & Monitoring</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="text-[8px] uppercase tracking-widest text-white/40 mb-1">System Health</div>
                        <div className="text-lg font-bold text-gold">98%</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="text-[8px] uppercase tracking-widest text-white/40 mb-1">System Latency</div>
                        <div className="text-lg font-bold text-gold">1.2s</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Active Tools</div>
                        <div className="text-lg font-bold text-gold">8</div>
                      </div>
                    </div>
                    <button className="mt-6 w-full py-3 bg-gold text-night rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                      Open Architect Console
                    </button>
                  </div>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { id: 'flipbook', title: 'Interactive Flipbook', desc: 'Export as a web-based book with realistic 3D page-turn animations.', icon: <BookOpen size={32} /> },
                  { id: 'kdp', title: 'Amazon KDP Format', desc: 'Automatically format your manuscript for Kindle or Print-on-Demand.', icon: <ImageIcon size={32} /> },
                  { id: 'epub', title: 'Standard ePub', desc: 'Universal ebook format compatible with all major e-readers.', icon: <FileText size={32} /> },
                  { id: 'pdf', title: 'Print-Ready PDF', desc: 'High-resolution PDF with bleed and crop marks for professional printing.', icon: <FileText size={32} /> },
                  { id: 'web', title: 'Web Serial', desc: 'Publish as a series of blog posts or a dedicated web portal.', icon: <Monitor size={32} /> },
                ].map(option => (
                  <button
                    key={option.id}
                    className="group p-8 bg-white border border-black/5 rounded-[2.5rem] text-left hover:border-gold transition-all hover:shadow-2xl hover:shadow-gold/10"
                  >
                    <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <h3 className="text-xl font-serif font-bold mb-2">{option.title}</h3>
                    <p className="text-xs text-black/40 leading-relaxed">{option.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Header */}
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">My Library</h1>
                  <p className="text-gray-500">Welcome back, {userProfile?.displayName?.split(' ')[0]}</p>
                  
                  {userProfile && (
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                        <span className="text-orange-600 font-bold text-sm">🔥 {userProfile.streak || 0} Day Streak</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {userProfile.badges?.map(badge => (
                          <span key={badge} className="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-full border border-purple-100 font-medium">
                            🏆 {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    if (canCreateStory) {
                      setIsCreating(true);
                    } else {
                      setShowPricingModal(true);
                      toast.error(
                        userProfile?.subscriptionTier === 'free' 
                          ? "Free tier limit reached (1 story total). Upgrade to create more!"
                          : "Monthly limit reached (3 stories). Upgrade to Premium for unlimited stories!"
                      );
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  Forge New Story
                </button>
              </header>

              <StoryLibrary 
                stories={filteredStories}
                isLoading={isLoading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onSelect={handleSelectStory}
                onPublish={handlePublish}
                onDelete={handleDelete}
                onAddPartner={(story) => setPartnerModal({ show: true, story })}
                onCreate={() => setIsCreating(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>

      {/* Zen Mode Overlay */}
      <AnimatePresence>
        {isZenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-night flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="atmosphere opacity-20" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 space-y-8"
            >
              <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center text-gold mx-auto animate-pulse">
                <Eye size={48} />
              </div>
              <div>
                <h2 className="text-5xl font-serif font-bold text-gold mb-4">Zen Mode Active</h2>
                <p className="text-gold/40 max-w-md mx-auto leading-relaxed">The world has faded away. There is only you and your creation. Focus on the forge.</p>
              </div>
              <button 
                onClick={() => setIsZenMode(false)}
                className="px-12 py-4 bg-gold text-night rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-gold/20"
              >
                Return to Reality
              </button>
              <div className="pt-12 flex items-center justify-center gap-8 text-[10px] small-caps tracking-widest text-gold/20 font-bold">
                <span className="flex items-center gap-2"><Command size={12} /> + P for Commands</span>
                <span className="flex items-center gap-2"><Zap size={12} /> Auto-Save Enabled</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-16 border-t border-black/5 text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <span className="font-serif font-bold text-xl">StoryCraft</span>
        </div>
        <p className="text-[10px] small-caps tracking-[0.5em] text-black/20">&copy; 2026 Immersive Story Studio</p>
      </footer>

      {/* Add Partner Modal */}
      <AnimatePresence>
        {partnerModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPartnerModal({ show: false, story: null })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold">Add Partner</h3>
                    <p className="text-xs text-black/40 uppercase tracking-widest font-bold">Collaborate on your story</p>
                  </div>
                </div>
                <button onClick={() => setPartnerModal({ show: false, story: null })} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <p className="text-sm text-black/60">Enter your partner's email address to grant them access to edit this story.</p>
                <input 
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full bg-black/5 rounded-2xl p-4 outline-none border border-black/5 focus:border-gold/40 focus:bg-gold/5 transition-all font-medium placeholder:text-black/25"
                />
              </div>

              <button 
                onClick={handleAddPartner}
                disabled={isAddingPartner || !partnerEmail.trim()}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingPartner ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Add Partner</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricingModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPricingModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Left Side: Benefits */}
              <div className="lg:w-1/3 bg-black p-12 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-night">
                      <Sparkles size={20} />
                    </div>
                    <span className="small-caps text-gold">StoryCraft Premium</span>
                  </div>
                  
                  <h3 className="text-4xl font-serif font-bold mb-8 leading-tight">Unlock the Full <br />Power of the Forge.</h3>
                  
                  <div className="space-y-6">
                      {[
                        "Unlimited Stories Per Month",
                        "Up to 100 Pages Per Story",
                        "Unlimited Magic Enhancements",
                        "All 50+ Artistic Styles",
                        "Full Audio Narration Suite",
                        "Collaborative Storytelling",
                        "FREE Marketplace Books",
                        "Priority Generation"
                      ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                          <Check size={12} />
                        </div>
                        <span className="text-sm text-white/70 font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Current Plan</p>
                  <p className="text-sm font-bold text-gold capitalize">{userProfile?.subscriptionTier} Tier</p>
                </div>
              </div>

              {/* Right Side: Pricing Options */}
              <div className="flex-1 p-12 bg-white flex flex-col">
                <div className="flex justify-between items-center mb-12">
                  <h4 className="text-2xl font-serif font-bold">Choose Your Plan</h4>
                  <button onClick={() => setShowPricingModal(false)} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                    <X size={20} />
                  </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex p-1 bg-black/5 rounded-2xl mb-10">
                  <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", billingCycle === 'monthly' ? "bg-white shadow-sm text-black" : "text-black/40")}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all relative", billingCycle === 'yearly' ? "bg-white shadow-sm text-black" : "text-black/40")}
                  >
                    Yearly
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] px-2 py-1 rounded-full animate-pulse">Save 20%</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                  {/* Standard Plan */}
                  <div className="p-8 rounded-[2rem] border-2 border-black/5 flex flex-col justify-between hover:border-purple-500/20 transition-all group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-black/40">Standard</span>
                        <Star className="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-serif font-bold">${billingCycle === 'monthly' ? SUBSCRIPTION_PRICING.standard.monthly : (SUBSCRIPTION_PRICING.standard.yearly / 12).toFixed(2)}</span>
                        <span className="text-black/40 text-xs font-bold uppercase">/mo</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        <li className="text-xs text-black/60 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-purple-500" />
                          3 Stories Per Month
                        </li>
                        <li className="text-xs text-black/60 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-purple-500" />
                          15 Pages Per Story
                        </li>
                        <li className="text-xs text-black/60 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-purple-500" />
                          Collaboration Access
                        </li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => handleUpgrade('standard', billingCycle)}
                      disabled={userProfile?.subscriptionTier === 'standard' || isUpgrading}
                      className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition-all disabled:opacity-50"
                    >
                      {userProfile?.subscriptionTier === 'standard' ? 'Current Plan' : 'Select Standard'}
                    </button>
                  </div>

                  {/* Premium Plan */}
                  <div className="p-8 rounded-[2rem] border-2 border-purple-500 bg-purple-50/30 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <Crown className="w-12 h-12 text-purple-500/10 -rotate-12" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Premium</span>
                        <Crown className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-serif font-bold text-purple-600">${billingCycle === 'monthly' ? SUBSCRIPTION_PRICING.premium.monthly : (SUBSCRIPTION_PRICING.premium.yearly / 12).toFixed(2)}</span>
                        <span className="text-purple-600/40 text-xs font-bold uppercase">/mo</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        <li className="text-xs text-purple-600 flex items-center gap-2 font-bold">
                          <Sparkles className="w-3 h-3" />
                          Unlimited Stories
                        </li>
                        <li className="text-xs text-purple-600/60 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-purple-600" />
                          50 Pages Per Story
                        </li>
                        <li className="text-xs text-purple-600/60 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-purple-600" />
                          All Artistic Styles
                        </li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => handleUpgrade('premium', billingCycle)}
                      disabled={userProfile?.subscriptionTier === 'premium' || isUpgrading}
                      className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                    >
                      {userProfile?.subscriptionTier === 'premium' ? 'Current Plan' : 'Go Premium'}
                    </button>
                  </div>

                  {/* Ultimate Plan */}
                  <div className="p-8 rounded-[2rem] border-2 border-gold bg-gold/5 flex flex-col justify-between relative overflow-hidden md:col-span-2">
                    <div className="absolute top-0 right-0 p-4">
                      <Zap className="w-16 h-16 text-gold/10 -rotate-12" />
                    </div>
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-gold">Ultimate</span>
                            <span className="bg-gold text-night text-[8px] px-2 py-0.5 rounded-full font-bold">BEST VALUE</span>
                          </div>
                          <Zap className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-5xl font-serif font-bold text-night">${billingCycle === 'monthly' ? SUBSCRIPTION_PRICING.ultimate.monthly : (SUBSCRIPTION_PRICING.ultimate.yearly / 12).toFixed(2)}</span>
                          <span className="text-night/40 text-xs font-bold uppercase">/mo</span>
                        </div>
                        <p className="text-sm text-night/60 mb-6 font-medium">The definitive StoryCraft experience. No limits, no boundaries.</p>
                      </div>
                      <div className="flex-1">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-8">
                          {[
                            "Unlimited Stories",
                            "100 Pages Per Story",
                            "FREE Marketplace Books",
                            "Priority Generation",
                            "All 50+ Artistic Styles",
                            "Early Access Features",
                            "Dedicated Support",
                            "All Premium Features"
                          ].map((feat, i) => (
                            <li key={i} className="text-xs text-night/70 flex items-center gap-2">
                              <Check size={12} className="text-gold" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <button 
                          onClick={() => handleUpgrade('ultimate', billingCycle)}
                          disabled={userProfile?.subscriptionTier === 'ultimate' || isUpgrading}
                          className="w-full py-5 bg-night text-gold rounded-2xl font-bold text-lg hover:bg-gold hover:text-night transition-all shadow-2xl shadow-gold/20 disabled:opacity-50"
                        >
                          {userProfile?.subscriptionTier === 'ultimate' ? 'Current Plan' : 'Become Ultimate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Donation Section */}
                <div className="mt-12 p-8 bg-black/5 rounded-[2rem] border border-black/5">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1">
                      <h5 className="text-xl font-serif font-bold mb-2">Support the Forge</h5>
                      <p className="text-sm text-black/40 font-medium">Your contributions help us keep the magic alive and forge new features.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {[5, 10, 50].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => toast.success(`Thank you for your $${amount} donation! (Demo)`)}
                          className="px-6 py-3 bg-white border border-black/10 rounded-xl font-bold text-sm hover:bg-black hover:text-white transition-all"
                        >
                          ${amount}
                        </button>
                      ))}
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 font-bold">$</span>
                        <input 
                          type="number" 
                          placeholder="Custom"
                          className="w-32 pl-8 pr-4 py-3 bg-white border border-black/10 rounded-xl font-bold text-sm outline-none focus:border-black transition-all"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value;
                              if (val) toast.success(`Thank you for your $${val} donation! (Demo)`);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-[10px] text-center text-black/20 mt-8 uppercase tracking-widest font-bold">Secure Payment Powered by Stripe</p>
                
                <div className="mt-8 pt-8 border-t border-black/5 flex flex-col items-center gap-4">
                  <p className="text-sm text-black/40 font-medium">Have a subscription code?</p>
                  <button 
                    onClick={() => {
                      setShowPricingModal(false);
                      setShowRedeemModal(true);
                    }}
                    className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-black/5 rounded-2xl font-bold text-sm hover:border-black transition-all"
                  >
                    <Zap size={16} className="text-gold" />
                    Redeem 12-Character Code
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Redeem Code Modal */}
      <AnimatePresence>
        {showRedeemModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRedeemModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold">Redeem Code</h3>
                    <p className="text-xs text-black/40 uppercase tracking-widest font-bold">Unlock your potential</p>
                  </div>
                </div>
                <button onClick={() => setShowRedeemModal(false)} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <p className="text-sm text-black/60">Enter your 12-character subscription code to upgrade your account instantly.</p>
                <div className="relative">
                  <input 
                    type="text"
                    maxLength={12}
                    value={redeemCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      setRedeemCode(val);
                    }}
                    placeholder="ABC123XYZ789"
                    className="w-full bg-black/5 rounded-2xl p-6 outline-none border border-black/5 font-mono text-2xl text-center tracking-[0.2em] focus:border-gold/50 transition-all"
                  />
                  {redeemCode.length === 12 && (
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                    >
                      <CheckCircle size={24} />
                    </motion.div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleRedeemCode}
                disabled={redeemCode.length !== 12 || isRedeeming}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gold hover:text-night transition-all shadow-2xl shadow-gold/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Redeeming...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Redeem Now
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
