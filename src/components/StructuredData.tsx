import { Article } from '@/types';

interface StructuredDataProps {
  type: 'website' | 'article' | 'newsarticle' | 'category';
  data?: Article;
  category?: string;
}

export function StructuredData({ type, data, category }: StructuredDataProps) {
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
    "image": {
      "@type": "ImageObject",
      "url": article.image || "https://hotnewstrends.com/default-article-image.jpg",
      "width": 1200,
      "height": 630,
      "caption": article.title
    },
    "datePublished": article.publishedAt.toISOString(),
    "dateModified": article.updatedAt?.toISOString() || article.publishedAt.toISOString(),
    "author": {
      "@type": "Person",
      "name": article.author || "HotNewsTrends Editorial Team",
      "url": "https://hotnewstrends.com/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "HotNewsTrends",
      "url": "https://hotnewstrends.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hotnewstrends.com/logo.png",
        "width": 200,
        "height": 60
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
    "inLanguage": "en-US",
    // AI-specific enhancements
    "about": article.tags.map(tag => ({
      "@type": "Thing",
      "name": tag
    })),
    "mentions": article.tags.slice(0, 3).map(tag => ({
      "@type": "Thing",
      "name": tag,
      "sameAs": `https://hotnewstrends.com/search?q=${encodeURIComponent(tag)}`
    })),
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".article-excerpt", ".article-content p:first-of-type"]
    },
    "citation": article.sources?.slice(0, 3).map(source => ({
      "@type": "WebPage",
      "url": source
    })) || []
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
    "alternateName": "Hot News Trends",
    "url": "https://hotnewstrends.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://hotnewstrends.com/logo.png",
      "width": 200,
      "height": 60
    },
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
      "email": "contact@hotnewstrends.com",
      "availableLanguage": "English"
    },
    "knowsAbout": [
      "Technology News",
      "Entertainment News",
      "Business News",
      "Science News",
      "Trending Topics",
      "AI Journalism"
    ],
    "publishingPrinciples": "https://hotnewstrends.com/editorial-guidelines"
  });

  const getFAQStructuredData = (category?: string) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is HotNewsTrends?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "HotNewsTrends is an AI-powered newsroom that delivers comprehensive articles about trending topics within hours. We cover technology, entertainment, business, science, and more."
        }
      },
      {
        "@type": "Question",
        "name": "How often is content updated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our content is updated continuously throughout the day. We use AI to identify trending topics and generate high-quality articles within hours of topics becoming popular."
        }
      },
      {
        "@type": "Question",
        "name": category ? `What ${category.toLowerCase()} topics do you cover?` : "What topics do you cover?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": category
            ? `We cover all major ${category.toLowerCase()} news including breaking stories, analysis, and trending topics in the ${category.toLowerCase()} space.`
            : "We cover technology, entertainment, business, science, health, sports, and general news topics that are trending worldwide."
        }
      }
    ]
  });

  let structuredData;

  switch (type) {
    case 'website':
      structuredData = [
        getWebsiteStructuredData(),
        getOrganizationStructuredData(),
        getFAQStructuredData()
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
    case 'category':
      structuredData = [
        getOrganizationStructuredData(),
        getFAQStructuredData(category)
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
