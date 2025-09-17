'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';
import ArticleEditor from './ArticleEditor';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: {
    id: string;
    slug: string;
    name: string;
    color: string;
  };
  tags: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  metadata: {
    readingTime: number;
    wordCount: number;
    seoScore: number;
    performanceScore: number;
  };
  analytics: {
    views: number;
    shares: number;
    engagement: number;
  };
  source: {
    topic: string;
    generatedBy: string;
    confidence: number;
  };
}

interface ArticlesData {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function ArticlesManager() {
  const [articlesData, setArticlesData] = useState<ArticlesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, selectedCategory, selectedStatus, searchQuery]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticlesData(data.data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    setActionLoading(articleId);
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchArticles();
      }
    } catch (error) {
      console.error('Error updating article status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    setActionLoading(articleId);
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchArticles();
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const variants = {
      draft: 'secondary',
      published: 'success',
      archived: 'warning'
    } as const;

    // Handle undefined or null status
    const safeStatus = status || 'draft';

    return (
      <Badge variant={variants[safeStatus as keyof typeof variants] || 'secondary'}>
        {safeStatus.toUpperCase()}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEditArticle = (articleId: string) => {
    setEditingArticleId(articleId);
  };

  const handleCloseEditor = () => {
    setEditingArticleId(null);
  };

  const handleSaveArticle = (updatedArticle: Article) => {
    // Update the article in the local state
    if (articlesData) {
      const updatedArticles = articlesData.articles.map(article =>
        article.id === updatedArticle.id ? updatedArticle : article
      );
      setArticlesData({
        ...articlesData,
        articles: updatedArticles
      });
    }
    setEditingArticleId(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-text">Articles Manager</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Articles Manager</h2>
          <div className="text-sm text-text-secondary">
            {articlesData?.total || 0} total articles
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-light rounded-lg bg-white text-text"
          >
            <option value="all">All Categories</option>
            <option value="technology">Technology</option>
            <option value="news">News</option>
            <option value="business">Business</option>
            <option value="science">Science</option>
            <option value="health">Health</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-light rounded-lg bg-white text-text"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          
          <Button variant="primary" onClick={fetchArticles}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {!articlesData?.articles || articlesData.articles.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No articles found</p>
          ) : (
            articlesData.articles.map((article) => (
              <div key={article.id} className="p-4 bg-surface rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-text">{article.title}</h3>
                      {getStatusBadge(article.status)}
                      {/* Safe category access */}
                      {article.category && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: (typeof article.category === 'object' ? article.category.color : '#8E8E93') + '20',
                            color: typeof article.category === 'object' ? article.category.color : '#8E8E93'
                          }}
                        >
                          {typeof article.category === 'object' ? article.category.name : article.category}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                      {article.excerpt}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-text-secondary mb-2">
                      <span>{article.metadata?.wordCount || article.content?.split(' ').length || 0} words</span>
                      <span>{article.readTime || article.metadata?.readingTime || '5 min read'}</span>
                      <span className={getScoreColor(article.metadata?.seoScore || 75)}>
                        SEO: {article.metadata?.seoScore || 75}%
                      </span>
                      <span className={getScoreColor(article.metadata?.performanceScore || 80)}>
                        Performance: {article.metadata?.performanceScore || 80}%
                      </span>
                    </div>
                    
                    {/* Analytics */}
                    <div className="flex items-center gap-4 text-xs text-text-secondary mb-2">
                      <span>👁️ {article.views || article.analytics?.views || 0} views</span>
                      <span>📤 {article.shares || article.analytics?.shares || 0} shares</span>
                      <span>💬 {article.analytics?.engagement || Math.round(((article.likes || 0) + (article.shares || 0)) / Math.max(article.views || 1, 1) * 100)}% engagement</span>
                    </div>

                    {/* Source Info */}
                    <div className="text-xs text-text-secondary">
                      {article.source === 'automated_trending' ? 'Auto-generated' : 'Manual'} •
                      {article.confidence ? `Confidence: ${Math.round(article.confidence * 100)}%` : ''} •
                      Published: {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => {
                        if (article.slug && article.slug !== 'undefined') {
                          window.open(`/article/${article.slug}`, '_blank');
                        } else {
                          alert('Article slug is missing. Cannot open article.');
                          console.error('Article slug missing:', article);
                        }
                      }}
                      disabled={!article.slug || article.slug === 'undefined'}
                    >
                      View
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditArticle(article.id)}
                      disabled={actionLoading === article.id}
                    >
                      Edit
                    </Button>

                    <select
                      value={article.status}
                      onChange={(e) => handleStatusChange(article.id, e.target.value)}
                      disabled={actionLoading === article.id}
                      className="text-xs px-2 py-1 border border-gray-light rounded bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteArticle(article.id)}
                      disabled={actionLoading === article.id}
                    >
                      {actionLoading === article.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Pagination */}
        {articlesData && articlesData.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-light">
            <div className="text-sm text-text-secondary">
              Page {articlesData.page} of {articlesData.totalPages}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="text"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <Button
                variant="text"
                size="sm"
                onClick={() => setCurrentPage(Math.min(articlesData.totalPages, currentPage + 1))}
                disabled={currentPage === articlesData.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Article Editor Modal */}
    {editingArticleId && (
      <ArticleEditor
        articleId={editingArticleId}
        onClose={handleCloseEditor}
        onSave={handleSaveArticle}
      />
    )}
  </>
  );
}
