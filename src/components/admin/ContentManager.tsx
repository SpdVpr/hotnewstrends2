'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { automationService } from '@/lib/services/automation';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: {
    name: string;
    slug: string;
  };
  author: string;
  publishedAt: Date;
  updatedAt?: Date;
  status: 'draft' | 'published' | 'archived';
  views: number;
  readTime: string;
  tags: string[];
}

interface ContentStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  archivedArticles: number;
  totalViews: number;
  avgReadTime: string;
  topCategories: Array<{ name: string; count: number }>;
  recentActivity: Array<{ action: string; article: string; timestamp: Date }>;
}

export const ContentManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Get articles from automation service
      const completedArticles = automationService.getCompletedArticles();
      
      // Mock additional article data
      const mockArticles: Article[] = completedArticles.map((article, index) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        category: article.category,
        author: article.author || 'TrendyBlogger AI',
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        status: 'published' as const,
        views: Math.floor(Math.random() * 5000) + 100,
        readTime: article.readTime,
        tags: article.tags
      }));

      // Add some draft articles
      const draftArticles: Article[] = [
        {
          id: 'draft-1',
          title: 'Upcoming Tech Trends for 2025',
          slug: 'upcoming-tech-trends-2025',
          excerpt: 'A comprehensive look at the technology trends that will shape the coming year.',
          category: { name: 'Technology', slug: 'technology' },
          author: 'TrendyBlogger AI',
          publishedAt: new Date(),
          status: 'draft',
          views: 0,
          readTime: '8 min read',
          tags: ['technology', 'trends', '2025']
        },
        {
          id: 'draft-2',
          title: 'Climate Change Solutions in Development',
          slug: 'climate-change-solutions-development',
          excerpt: 'Exploring innovative solutions being developed to combat climate change.',
          category: { name: 'Science', slug: 'science' },
          author: 'TrendyBlogger AI',
          publishedAt: new Date(),
          status: 'draft',
          views: 0,
          readTime: '12 min read',
          tags: ['climate', 'science', 'environment']
        }
      ];

      const allArticles = [...mockArticles, ...draftArticles];
      setArticles(allArticles);

      // Calculate stats
      const mockStats: ContentStats = {
        totalArticles: allArticles.length,
        publishedArticles: allArticles.filter(a => a.status === 'published').length,
        draftArticles: allArticles.filter(a => a.status === 'draft').length,
        archivedArticles: allArticles.filter(a => a.status === 'archived').length,
        totalViews: allArticles.reduce((sum, a) => sum + a.views, 0),
        avgReadTime: '6 min read',
        topCategories: [
          { name: 'Technology', count: 5 },
          { name: 'News', count: 3 },
          { name: 'Business', count: 2 },
          { name: 'Science', count: 2 }
        ],
        recentActivity: [
          { action: 'Published', article: 'AI Revolution in Marketing', timestamp: new Date(Date.now() - 3600000) },
          { action: 'Updated', article: 'Climate Summit Agreement', timestamp: new Date(Date.now() - 7200000) },
          { action: 'Created Draft', article: 'Tech Trends 2025', timestamp: new Date(Date.now() - 10800000) }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || article.category.slug === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedArticles.length === 0) return;

    try {
      // Mock bulk action - in production, implement actual API calls
      console.log(`Performing ${action} on articles:`, selectedArticles);
      
      // Update local state
      setArticles(prev => prev.map(article => {
        if (selectedArticles.includes(article.id)) {
          switch (action) {
            case 'publish':
              return { ...article, status: 'published' as const };
            case 'archive':
              return { ...article, status: 'archived' as const };
            case 'delete':
              return article; // In real implementation, remove from array
            default:
              return article;
          }
        }
        return article;
      }));

      setSelectedArticles([]);
      await fetchContent(); // Refresh stats
    } catch (error) {
      console.error(`Failed to ${action} articles:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Manager</h2>
          <p className="text-gray-600">Manage articles, drafts, and content workflow</p>
        </div>
        <Button onClick={() => window.open('/admin', '_blank')}>
          Create New Article
        </Button>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{stats?.totalArticles || 0}</div>
            <div className="text-sm text-gray-500">Total Articles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats?.publishedArticles || 0}</div>
            <div className="text-sm text-gray-500">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats?.draftArticles || 0}</div>
            <div className="text-sm text-gray-500">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalViews.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-500">Total Views</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="technology">Technology</option>
              <option value="news">News</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="health">Health</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedArticles.length} article(s) selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleBulkAction('publish')}>
                  Publish
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleBulkAction('archive')}>
                  Archive
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Articles ({filteredArticles.length})</CardTitle>
          <CardDescription>Manage your content library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <div key={article.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedArticles.includes(article.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedArticles(prev => [...prev, article.id]);
                    } else {
                      setSelectedArticles(prev => prev.filter(id => id !== article.id));
                    }
                  }}
                  className="rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">{article.title}</h3>
                    <Badge className={getStatusColor(article.status)}>
                      {article.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{article.excerpt}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{article.category.name}</span>
                    <span>{article.readTime}</span>
                    <span>{article.views.toLocaleString()} views</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
