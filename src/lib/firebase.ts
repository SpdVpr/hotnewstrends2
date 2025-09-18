// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
// Firebase Analytics disabled - using Google Analytics directly
// let analytics: any = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
db = getFirestore(app);
auth = getAuth(app);
storage = getStorage(app);

// Firebase Analytics disabled - using Google Analytics gtag directly
// if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
//   try {
//     const { getAnalytics } = require('firebase/analytics');
//     analytics = getAnalytics(app);
//   } catch (error) {
//     console.warn('Analytics not available:', error);
//   }
// }

export { app, db, auth, storage };

// Firebase collections
export const COLLECTIONS = {
  ARTICLES: 'articles',
  CATEGORIES: 'categories',
  ANALYTICS: 'analytics',
  AUTOMATION_JOBS: 'automation_jobs',
  TRENDS: 'trends',
  SETTINGS: 'settings'
} as const;

// Firebase utilities
export const createTimestamp = () => new Date();

export const formatFirebaseError = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'User not found';
    case 'auth/wrong-password':
      return 'Invalid password';
    case 'auth/email-already-in-use':
      return 'Email already in use';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'permission-denied':
      return 'Permission denied';
    case 'not-found':
      return 'Document not found';
    case 'already-exists':
      return 'Document already exists';
    case 'resource-exhausted':
      return 'Quota exceeded';
    case 'unauthenticated':
      return 'Authentication required';
    default:
      return error.message || 'An error occurred';
  }
};

// Type definitions for Firebase documents
export interface FirebaseArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  image?: string;
  imageSource?: string;
  imageAlt?: string;
  readTime: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date;
  updatedAt: Date;
  createdAt: Date;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagement?: number;
  featured: boolean;
  trending: boolean;
  sources: string[];
  confidence: number;
  metadata?: {
    originalTopic?: string;
    generatedBy?: string;
    confidence?: number;
    trendId?: string;
    traffic?: string;
    source?: string;
    template?: string;
    qualityScore?: any;
    [key: string]: any;
  };
}

export interface FirebaseCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  parentId?: string;
  order: number;
  articleCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}





export interface FirebaseAutomationJob {
  id: string;
  type: 'article_generation' | 'trend_analysis' | 'content_optimization';
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  data: {
    topic?: string;
    category?: string;
    targetLength?: number;
    tone?: string;
    keywords?: string[];
  };
  result?: {
    articleId?: string;
    content?: any;
    error?: string;
  };
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  estimatedDuration: number;
  actualDuration?: number;
}

export interface FirebaseTrend {
  id: string;
  keyword: string;
  category: string;
  region: string;
  searchVolume: number;
  growthRate: number;
  confidence: number;
  relatedKeywords: string[];
  sources: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  peakDate: Date;
  discoveredAt: Date;
  lastUpdated: Date;
  status: 'active' | 'declining' | 'expired';
  articleGenerated: boolean;
  articleId?: string;
}

export interface FirebaseAnalytics {
  id: string;
  type: 'pageview' | 'event' | 'conversion';
  data: {
    page?: string;
    event?: string;
    category?: string;
    label?: string;
    value?: number;
    userId?: string;
    sessionId: string;
    userAgent: string;
    referrer?: string;
    country?: string;
    device?: string;
    browser?: string;
  };
  timestamp: Date;
  processed: boolean;
}

export interface FirebaseSettings {
  id: string;
  category: 'automation' | 'seo' | 'analytics' | 'content' | 'security';
  key: string;
  value: any;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  updatedAt: Date;
  updatedBy: string;
}
