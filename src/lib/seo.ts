// Advanced SEO utilities and schema markup generation

import { Article, Category } from '@/types';

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage?: string;
  ogType: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

class SEOManager {
  private baseUrl: string;
  private siteName: string;
  private defaultImage: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnewstrends.com';
    this.siteName = 'HotNewsTrends';
    this.defaultImage = `${this.baseUrl}/og-image.jpg`;
  }

  // Generate comprehensive SEO data
  generateSEOData(data: {
    title: string;
    description: string;
    path: string;
    type?: 'website' | 'article';
    image?: string;
    article?: Article;
    keywords?: string[];
  }): SEOData {
    const fullTitle = data.title.includes(this.siteName) 
      ? data.title 
      : `${data.title} | ${this.siteName}`;

    return {
      title: fullTitle,
      description: this.truncateDescription(data.description),
      keywords: data.keywords || this.extractKeywords(data.description),
      canonicalUrl: `${this.baseUrl}${data.path}`,
      ogImage: data.image || this.defaultImage,
      ogType: data.type || 'website',
      publishedTime: data.article?.publishedAt.toISOString(),
      modifiedTime: data.article?.updatedAt?.toISOString(),
      author: data.article?.author,
      section: data.article?.category.name,
      tags: data.article?.tags
    };
  }

  // Generate article schema markup
  generateArticleSchema(article: Article): object {
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.excerpt,
      "image": {
        "@type": "ImageObject",
        "url": article.image || this.defaultImage,
        "width": 1200,
        "height": 630
      },
      "datePublished": article.publishedAt.toISOString(),
      "dateModified": article.updatedAt?.toISOString() || article.publishedAt.toISOString(),
      "author": {
        "@type": "Person",
        "name": article.author || "TrendyBlogger Editorial Team",
        "url": `${this.baseUrl}/author/${this.slugify(article.author || 'editorial-team')}`
      },
      "publisher": {
        "@type": "Organization",
        "name": this.siteName,
        "url": this.baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${this.baseUrl}/logo.png`,
          "width": 200,
          "height": 60
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${this.baseUrl}/article/${article.slug}`
      },
      "articleSection": article.category.name,
      "keywords": article.tags.join(", "),
      "wordCount": this.estimateWordCount(article.content || ''),
      "timeRequired": article.readTime,
      "url": `${this.baseUrl}/article/${article.slug}`,
      "isAccessibleForFree": true,
      "genre": "news",
      "inLanguage": "en-US",
      "about": article.tags.map(tag => ({
        "@type": "Thing",
        "name": tag
      }))
    };
  }

  // Generate breadcrumb schema
  generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.name,
        "item": `${this.baseUrl}${item.url}`
      }))
    };
  }

  // Generate website schema
  generateWebsiteSchema(): object {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": this.siteName,
      "description": "AI-powered newsroom delivering comprehensive articles about trending topics within hours",
      "url": this.baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": this.siteName,
        "url": this.baseUrl,
        "logo": `${this.baseUrl}/logo.png`,
        "sameAs": [
          "https://twitter.com/hotnewstrends",
          "https://facebook.com/hotnewstrends",
          "https://instagram.com/hotnewstrends"
        ]
      },
      "inLanguage": "en-US"
    };
  }

  // Generate FAQ schema
  generateFAQSchema(faqs: FAQItem[]): object {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  // Generate organization schema
  generateOrganizationSchema(): object {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": this.siteName,
      "url": this.baseUrl,
      "logo": `${this.baseUrl}/logo.png`,
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
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      }
    };
  }

  // Generate category page schema
  generateCategorySchema(category: Category, articles: Article[]): object {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${category.name} Articles`,
      "description": `Latest ${category.name.toLowerCase()} articles and trending topics`,
      "url": `${this.baseUrl}/category/${category.slug}`,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": articles.length,
        "itemListElement": articles.map((article, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "NewsArticle",
            "headline": article.title,
            "url": `${this.baseUrl}/article/${article.slug}`,
            "datePublished": article.publishedAt.toISOString(),
            "author": {
              "@type": "Person",
              "name": article.author || "TrendyBlogger Editorial Team"
            }
          }
        }))
      }
    };
  }

  // Utility functions
  private truncateDescription(description: string, maxLength: number = 160): string {
    if (description.length <= maxLength) return description;
    
    const truncated = description.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private estimateWordCount(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // SEO validation
  validateSEO(seoData: SEOData): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Title validation
    if (seoData.title.length < 30) {
      issues.push('Title is too short (minimum 30 characters)');
    }
    if (seoData.title.length > 60) {
      issues.push('Title is too long (maximum 60 characters)');
    }

    // Description validation
    if (seoData.description.length < 120) {
      issues.push('Description is too short (minimum 120 characters)');
    }
    if (seoData.description.length > 160) {
      issues.push('Description is too long (maximum 160 characters)');
    }

    // Keywords validation
    if (seoData.keywords.length < 3) {
      issues.push('Not enough keywords (minimum 3)');
    }

    // URL validation
    if (!seoData.canonicalUrl.startsWith('https://')) {
      issues.push('Canonical URL should use HTTPS');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Generate meta tags for Next.js
  generateMetaTags(seoData: SEOData): Record<string, string> {
    const tags: Record<string, string> = {
      title: seoData.title,
      description: seoData.description,
      keywords: seoData.keywords.join(', '),
      'og:title': seoData.title,
      'og:description': seoData.description,
      'og:url': seoData.canonicalUrl,
      'og:type': seoData.ogType,
      'og:image': seoData.ogImage || this.defaultImage,
      'og:site_name': this.siteName,
      'twitter:card': 'summary_large_image',
      'twitter:title': seoData.title,
      'twitter:description': seoData.description,
      'twitter:image': seoData.ogImage || this.defaultImage,
      'canonical': seoData.canonicalUrl
    };

    if (seoData.publishedTime) {
      tags['article:published_time'] = seoData.publishedTime;
    }
    if (seoData.modifiedTime) {
      tags['article:modified_time'] = seoData.modifiedTime;
    }
    if (seoData.author) {
      tags['article:author'] = seoData.author;
    }
    if (seoData.section) {
      tags['article:section'] = seoData.section;
    }
    if (seoData.tags) {
      seoData.tags.forEach(tag => {
        tags[`article:tag`] = tag;
      });
    }

    return tags;
  }
}

export const seoManager = new SEOManager();
