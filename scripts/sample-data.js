// Sample data for Firebase initialization
import { firebaseArticlesService } from '../src/lib/services/firebase-articles';

const sampleCategories = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Latest tech trends and innovations',
    color: '#007AFF',
    icon: '💻',
    order: 1,
    articleCount: 0,
    featured: true
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business news and market insights',
    color: '#FF6B35',
    icon: '📊',
    order: 2,
    articleCount: 0,
    featured: true
  },
  {
    name: 'Science',
    slug: 'science',
    description: 'Scientific discoveries and research',
    color: '#34C759',
    icon: '🔬',
    order: 3,
    articleCount: 0,
    featured: true
  }
];

const sampleArticles = [
  {
    title: 'AI Revolution Transforms Digital Marketing',
    slug: 'ai-revolution-transforms-digital-marketing',
    excerpt: 'Artificial intelligence is reshaping how businesses approach digital marketing.',
    content: '# AI Revolution Transforms Digital Marketing\n\nArtificial intelligence is fundamentally changing...',
    author: 'Sarah Chen',
    category: {
      id: 'tech-001',
      name: 'Technology',
      slug: 'technology'
    },
    tags: ['AI', 'Marketing', 'Technology', 'Business'],
    seoTitle: 'AI Revolution in Digital Marketing | TrendyBlogger',
    seoDescription: 'Discover how AI is transforming digital marketing strategies.',
    seoKeywords: ['AI marketing', 'digital transformation', 'artificial intelligence'],
    readTime: '5 min read',
    status: 'published',
    publishedAt: new Date(),
    featured: true,
    trending: true,
    sources: ['https://example.com/source1'],
    confidence: 0.9
  }
];

export { sampleCategories, sampleArticles };