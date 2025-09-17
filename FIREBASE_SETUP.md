# Firebase Setup Guide for HotNewsTrends.com

## 🔥 Overview

This guide will help you set up Firebase for HotNewsTrends.com, including Firestore Database and Storage.

## 📋 Prerequisites

- Node.js installed
- Firebase CLI installed (automatically installed by setup script)
- Google account for Firebase Console access

## 🚀 Quick Setup

### 1. Run the Setup Script

```bash
node scripts/init-firebase.js
```

This script will:
- ✅ Check and install Firebase CLI if needed
- ✅ Create `firebase.json` configuration
- ✅ Generate Firestore security rules
- ✅ Create Firestore indexes for optimal performance
- ✅ Set up Storage security rules
- ✅ Create sample data scripts

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `hotnewstrends-com` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Choose or create Analytics account
6. Click "Create project"

### 3. Enable Required Services

#### Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll deploy security rules later)
4. Select your preferred location (closest to your users)
5. Click "Done"

#### Storage
1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select same location as Firestore
5. Click "Done"

### 4. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app (</>) 
4. Enter app nickname: "TrendyBlogger Web"
5. Check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the configuration object

### 5. Update Environment Variables

Add your Firebase config to `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 6. Connect Local Project to Firebase

```bash
# Add your Firebase project
firebase use --add your_project_id

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 📊 Database Structure

### Collections

#### `articles`
```typescript
{
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
  readTime: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date;
  updatedAt: Date;
  createdAt: Date;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  featured: boolean;
  trending: boolean;
  sources: string[];
  confidence: number;
}
```

#### `categories`
```typescript
{
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
```



## 🔒 Security Rules

### Firestore Rules
- **Articles**: Public read for published articles, admin write
- **Categories**: Public read, admin write
- **Analytics**: Admin only
- **Automation Jobs**: Admin only
- **Trends**: Admin only
- **Settings**: Admin only

### Storage Rules
- **Images**: Public read, admin write

## 📈 Indexes

Optimized indexes are created for:
- Article queries by status and publish date
- Category-based article filtering
- Featured article queries
- Trending article queries
- Tag-based article searches

## 🛠️ Usage Examples

### Creating an Article
```typescript
import { firebaseArticlesService } from '@/lib/services/firebase-articles';

const article = await firebaseArticlesService.createArticle({
  title: 'My Article',
  slug: 'my-article',
  excerpt: 'Article excerpt',
  content: 'Article content...',
  author: 'John Doe',
  category: {
    id: 'tech-001',
    name: 'Technology',
    slug: 'technology'
  },
  tags: ['tech', 'ai'],
  seoTitle: 'My Article | TrendyBlogger',
  seoDescription: 'Article description',
  seoKeywords: ['tech', 'ai'],
  readTime: '5 min read',
  status: 'published',
  publishedAt: new Date(),
  featured: false,
  trending: false,
  sources: [],
  confidence: 0.9
});
```

### Querying Articles
```typescript
// Get featured articles
const featured = await firebaseArticlesService.getFeaturedArticles(5);

// Search articles with filters
const results = await firebaseArticlesService.searchArticles({
  filters: {
    category: 'technology',
    status: 'published'
  },
  sortBy: 'publishedAt',
  sortOrder: 'desc',
  limit: 20
});

// Get article by slug
const article = await firebaseArticlesService.getArticleBySlug('my-article');
```

## 🔧 Development vs Production

### Development
- Use Firebase Emulator Suite for local development
- Test mode security rules
- Local data for testing

### Production
- Strict security rules
- Production Firebase project
- Real user authentication
- Analytics and monitoring enabled

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

## 🆘 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check Firestore security rules
   - Verify user authentication
   - Ensure proper admin claims

2. **Index Errors**
   - Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
   - Check Firebase Console for index status

3. **Configuration Errors**
   - Verify environment variables
   - Check Firebase project settings
   - Ensure services are enabled

4. **Network Errors**
   - Check internet connection
   - Verify Firebase project is active
   - Check quota limits

### Getting Help

- Firebase Support: https://firebase.google.com/support
- Stack Overflow: Tag questions with `firebase` and `firestore`
- Firebase Community: https://firebase.google.com/community
