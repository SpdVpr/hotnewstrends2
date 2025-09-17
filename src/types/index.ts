// HotNewsTrends Types
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: Category;
  readTime: string;
  trending: boolean;
  image?: string;
  imageAlt?: string;
  imageSource?: string;
  author?: string;
  publishedAt: Date;
  updatedAt?: Date;
  slug: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  views?: number;
  likes?: number;
}

export interface TrendingTopic {
  id: string;
  keyword: string;
  searchVolume: number;
  category: Category;
  region: string;
  timestamp: Date;
  processed: boolean;
  articleId?: string;
  confidence: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GenerationJob {
  id: string;
  trendId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  articleId?: string;
}

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  articlesPerPage: number;
  autoPublish: boolean;
  generationSchedule: string;
  socialMedia: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

// Component Props Types
export interface ArticleCardProps {
  article: Article;
  className?: string;
  showCategory?: boolean;
  showTrending?: boolean;
}

export interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;
}

export interface SearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

// API Endpoints Types
export interface TrendsApiResponse {
  trends: TrendingTopic[];
  timestamp: Date;
  region: string;
}

export interface ContentGenerationRequest {
  trendId: string;
  category: string;
  targetLength: number;
  includeImages: boolean;
}

export interface ContentGenerationResponse {
  articleId: string;
  title: string;
  content: string;
  excerpt: string;
  images: string[];
  estimatedReadTime: string;
}
