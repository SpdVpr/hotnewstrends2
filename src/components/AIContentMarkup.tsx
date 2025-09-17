import { Article } from '@/types';

interface AIContentMarkupProps {
  article: Article;
  children: React.ReactNode;
}

export function AIContentMarkup({ article, children }: AIContentMarkupProps) {
  return (
    <article 
      itemScope 
      itemType="https://schema.org/NewsArticle"
      data-ai-content="true"
      data-content-type="news-article"
      data-category={article.category.name.toLowerCase()}
      data-confidence={article.confidence}
      data-word-count={article.content?.split(' ').length || 0}
    >
      {/* AI-friendly article header */}
      <header className="article-header" data-ai-section="header">
        <h1 
          itemProp="headline"
          data-ai-element="headline"
          className="article-title"
        >
          {article.title}
        </h1>
        
        <div 
          className="article-meta" 
          data-ai-section="metadata"
          itemProp="author"
          itemScope
          itemType="https://schema.org/Person"
        >
          <span itemProp="name" data-ai-element="author">
            {article.author}
          </span>
          <time 
            itemProp="datePublished" 
            dateTime={article.publishedAt.toISOString()}
            data-ai-element="publish-date"
          >
            {article.publishedAt.toLocaleDateString()}
          </time>
          <span data-ai-element="reading-time" itemProp="timeRequired">
            {article.readTime}
          </span>
        </div>

        {/* Article excerpt for AI understanding */}
        <div 
          className="article-excerpt"
          itemProp="description"
          data-ai-section="excerpt"
          data-speakable="true"
        >
          {article.excerpt}
        </div>

        {/* Category and tags for AI classification */}
        <div className="article-taxonomy" data-ai-section="classification">
          <span 
            itemProp="articleSection" 
            data-ai-element="category"
            className="category-tag"
          >
            {article.category.name}
          </span>
          
          <div className="article-tags" data-ai-element="tags">
            {article.tags.map((tag, index) => (
              <span 
                key={index}
                itemProp="keywords"
                data-ai-tag={tag}
                className="tag"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main article content with AI-friendly structure */}
      <div 
        className="article-content"
        itemProp="articleBody"
        data-ai-section="content"
        data-speakable="true"
      >
        {children}
      </div>

      {/* Article footer with sources for AI fact-checking */}
      {article.sources && article.sources.length > 0 && (
        <footer className="article-footer" data-ai-section="sources">
          <h3 data-ai-element="sources-heading">Sources</h3>
          <ul className="sources-list" data-ai-element="source-list">
            {article.sources.slice(0, 5).map((source, index) => (
              <li key={index}>
                <a 
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  itemProp="citation"
                  data-ai-element="source-link"
                >
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}

      {/* Hidden AI-specific metadata */}
      <div style={{ display: 'none' }} data-ai-metadata="true">
        <span itemProp="wordCount">{article.content?.split(' ').length || 0}</span>
        <span itemProp="inLanguage">en-US</span>
        <span itemProp="isAccessibleForFree">true</span>
        <span itemProp="genre">news</span>
        {article.confidence && (
          <span data-ai-confidence={article.confidence}></span>
        )}
      </div>
    </article>
  );
}

// AI-friendly content wrapper for better semantic understanding
export function AISemanticWrapper({ 
  children, 
  type = 'main-content',
  topic,
  category 
}: {
  children: React.ReactNode;
  type?: 'main-content' | 'sidebar' | 'navigation' | 'footer';
  topic?: string;
  category?: string;
}) {
  return (
    <div 
      data-ai-content-type={type}
      data-ai-topic={topic}
      data-ai-category={category}
      role={type === 'main-content' ? 'main' : undefined}
    >
      {children}
    </div>
  );
}
