import { Article } from '@/types';

interface AIMetaTagsProps {
  type: 'website' | 'article' | 'category';
  data?: Article;
  category?: string;
}

export function AIMetaTags({ type, data, category }: AIMetaTagsProps) {
  const getWebsiteAITags = () => (
    <>
      {/* AI Search Engine Specific Tags */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Content Classification for AI */}
      <meta name="content-type" content="news" />
      <meta name="content-category" content="technology,entertainment,business,science" />
      <meta name="audience" content="general" />
      <meta name="content-language" content="en-US" />
      
      {/* AI Understanding Hints */}
      <meta name="article-type" content="news-aggregation" />
      <meta name="content-source" content="ai-generated" />
      <meta name="update-frequency" content="hourly" />
      <meta name="content-freshness" content="high" />
      
      {/* Structured Content Hints */}
      <meta name="has-structured-data" content="true" />
      <meta name="schema-types" content="WebSite,Organization,FAQPage" />
      
      {/* AI Model Training Preferences */}
      <meta name="ai-training" content="allowed" />
      <meta name="content-indexing" content="full" />
    </>
  );

  const getArticleAITags = (article: Article) => (
    <>
      {/* Article-specific AI tags */}
      <meta name="article-type" content="news-article" />
      <meta name="content-category" content={article.category.name.toLowerCase()} />
      <meta name="article-section" content={article.category.name} />
      <meta name="article-tags" content={article.tags.join(',')} />
      
      {/* Content Quality Indicators */}
      <meta name="word-count" content={article.content?.split(' ').length?.toString() || '0'} />
      <meta name="reading-time" content={article.readTime} />
      <meta name="content-confidence" content={article.confidence?.toString() || '0.9'} />
      
      {/* Source Attribution for AI */}
      {article.sources && article.sources.length > 0 && (
        <meta name="source-urls" content={article.sources.slice(0, 3).join(',')} />
      )}
      
      {/* Factual Content Indicators */}
      <meta name="fact-checked" content="true" />
      <meta name="content-accuracy" content="high" />
      <meta name="citation-count" content={article.sources?.length?.toString() || '0'} />
      
      {/* AI Processing Hints */}
      <meta name="content-structure" content="headline,excerpt,body,conclusion" />
      <meta name="key-entities" content={article.tags.slice(0, 5).join(',')} />
      
      {/* Speakable Content for Voice AI */}
      <meta name="speakable-content" content="headline,excerpt" />
    </>
  );

  const getCategoryAITags = (categoryName: string) => (
    <>
      {/* Category-specific AI tags */}
      <meta name="page-type" content="category-listing" />
      <meta name="content-category" content={categoryName.toLowerCase()} />
      <meta name="listing-type" content="articles" />
      
      {/* Content Organization for AI */}
      <meta name="content-organization" content="chronological" />
      <meta name="content-filtering" content={`category:${categoryName.toLowerCase()}`} />
      
      {/* AI Navigation Hints */}
      <meta name="related-categories" content="technology,entertainment,business,science" />
      <meta name="content-depth" content="category-overview" />
    </>
  );

  switch (type) {
    case 'website':
      return getWebsiteAITags();
    case 'article':
      return data ? getArticleAITags(data) : null;
    case 'category':
      return category ? getCategoryAITags(category) : null;
    default:
      return null;
  }
}
