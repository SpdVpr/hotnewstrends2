import { Article } from '@/types';

interface StructuredDataProps {
  type: 'website' | 'article' | 'newsarticle';
  data?: Article;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getWebsiteStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HotNewsTrends",
    "description": "AI-powered newsroom delivering comprehensive articles about trending topics within hours",
    "url": "https://hotnewstrends.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://hotnewstrends.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "HotNewsTrends",
      "url": "https://hotnewstrends.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hotnewstrends.com/logo.png"
      }
    }
  });

  const getArticleStructuredData = (article: Article) => ({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.image || "https://hotnewstrends.com/default-article-image.jpg",
    "datePublished": article.publishedAt.toISOString(),
    "dateModified": article.updatedAt?.toISOString() || article.publishedAt.toISOString(),
    "author": {
      "@type": "Person",
      "name": article.author || "HotNewsTrends Editorial Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "HotNewsTrends",
      "url": "https://hotnewstrends.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hotnewstrends.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://hotnewstrends.com/article/${article.slug}`
    },
    "articleSection": article.category.name,
    "keywords": article.tags.join(", "),
    "wordCount": article.content?.split(' ').length || 0,
    "timeRequired": article.readTime,
    "url": `https://hotnewstrends.com/article/${article.slug}`,
    "isAccessibleForFree": true,
    "genre": "news",
    "inLanguage": "en-US"
  });

  const getBreadcrumbStructuredData = (article?: Article) => {
    const items = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://hotnewstrends.com"
      }
    ];

    if (article) {
      items.push({
        "@type": "ListItem",
        "position": 2,
        "name": article.category.name,
        "item": `https://hotnewstrends.com/category/${article.category.slug}`
      });

      items.push({
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": `https://hotnewstrends.com/article/${article.slug}`
      });
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items
    };
  };

  const getOrganizationStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HotNewsTrends",
    "url": "https://hotnewstrends.com",
    "logo": "https://hotnewstrends.com/logo.png",
    "description": "AI-powered newsroom delivering comprehensive articles about trending topics within hours",
    "foundingDate": "2025",
    "sameAs": [
      "https://twitter.com/hotnewstrends",
      "https://facebook.com/hotnewstrends",
      "https://instagram.com/hotnewstrends"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contact@hotnewstrends.com"
    }
  });

  let structuredData;

  switch (type) {
    case 'website':
      structuredData = [
        getWebsiteStructuredData(),
        getOrganizationStructuredData()
      ];
      break;
    case 'article':
    case 'newsarticle':
      if (!data) return null;
      structuredData = [
        getArticleStructuredData(data),
        getBreadcrumbStructuredData(data),
        getOrganizationStructuredData()
      ];
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}
