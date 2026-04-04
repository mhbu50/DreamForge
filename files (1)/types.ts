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
