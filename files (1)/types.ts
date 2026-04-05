export type SubscriptionTier = 'free' | 'standard' | 'premium' | 'ultimate';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'headadmin' | 'admin' | 'user';
  subscriptionTier: SubscriptionTier;
  customSettings: Record<string, any>;
  xp: number;
  level: number;
  coinsBalance: number; // -1 = unlimited
  coinsUsed: number;    // lifetime total
  createdAt: number;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  type: 'story' | 'comic' | 'anime';
  description?: string;
  status: 'draft' | 'completed' | 'published';
  createdAt: number;
  updatedAt: number;
}

export interface StoryPage {
  text: string;
  imageUrl?: string;
}

export interface Story {
  id: string;
  userId: string;
  title: string;
  pages: StoryPage[];
  style: string;
  category: string;
  language: string;
  createdAt: number;
}

export interface TextBlock {
  id: string;
  text: string;
  x: number;       // 0–100 percent from left
  y: number;       // 0–100 percent from top
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface BookPage {
  id: string;
  order: number;
  imageUrl?: string;
  textBlocks: TextBlock[];
}

export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  tier: 'standard' | 'premium' | 'ultimate' | 'any';
  isActive: boolean;
  createdAt: number;
  createdBy?: string;
}
