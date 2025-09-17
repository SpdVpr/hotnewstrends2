import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge, TrendingBadge, CategoryBadge } from '@/components/ui/Badge';
import { cn, formatRelativeTime, getImagePlaceholder } from '@/lib/utils';
import { Article } from '@/types';

export interface ArticleCardProps {
  article: Article;
  className?: string;
  showCategory?: boolean;
  showTrending?: boolean;
  priority?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  className,
  showCategory = true,
  showTrending = true,
  priority = false,
}) => {
  const {
    id,
    title,
    excerpt,
    category,
    readTime,
    trending,
    image,
    imageAlt,
    publishedAt,
    slug,
    views,
    tags,
  } = article;

  return (
    <Link href={`/article/${slug}`} className="block">
      <Card 
        hover 
        padding="none" 
        className={cn('overflow-hidden', className)}
      >
        {/* Article Image */}
        <div className="aspect-video bg-surface relative overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={imageAlt || title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 378px"
              priority={priority}
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange/20 flex items-center justify-center">
              <span className="text-text-secondary text-sm">
                {title.slice(0, 20)}...
              </span>
            </div>
          )}
          
          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex gap-2">
              {showTrending && trending && (
                <TrendingBadge size="sm" />
              )}
            </div>
            
            {showCategory && (
              <CategoryBadge 
                category={category.name} 
                size="sm"
              />
            )}
          </div>

          {/* Views Counter */}
          {views && views > 0 && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" size="sm" className="bg-black/50 text-white">
                {views > 1000 ? `${Math.round(views / 1000)}k` : views} views
              </Badge>
            </div>
          )}
        </div>

        {/* Article Content */}
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-text mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {title}
          </h3>
          
          <p className="text-text-secondary mb-4 line-clamp-3 leading-relaxed">
            {excerpt}
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {tags
                  .filter(tag =>
                    !['trending', 'news', 'analysis', 'seo', 'optimization'].includes(tag.toLowerCase()) &&
                    tag.length > 2
                  )
                  .slice(0, 4)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs hover:bg-primary/10 cursor-pointer capitalize"
                    >
                      #{tag.replace(/[-_]/g, ' ')}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          <CardFooter className="p-0 pt-4 border-t border-gray-light/50">
            <div className="flex items-center justify-between w-full text-sm text-text-secondary">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readTime}
                </span>
                
                {trending && (
                  <span className="flex items-center gap-1 text-orange">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10H2l3.5 4 3.5-4H8.025c.26-3.292 3.006-5.906 6.475-5.906 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 2.428C8.817 20.932 10.949 22 13.5 22c5.523 0 10-4.477 10-10S19.023 2 13.5 2z"/>
                    </svg>
                    Trending
                  </span>
                )}
              </div>
              
              <span className="text-xs">
                {formatRelativeTime(publishedAt)}
              </span>
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </Link>
  );
};

// Compact Article Card for sidebar or lists
export interface CompactArticleCardProps {
  article: Article;
  className?: string;
  showImage?: boolean;
}

const CompactArticleCard: React.FC<CompactArticleCardProps> = ({
  article,
  className,
  showImage = true,
}) => {
  const { title, category, readTime, publishedAt, slug, trending, image, imageAlt, tags } = article;

  return (
    <Link href={`/article/${slug}`} className="block">
      <Card hover padding="sm" className={cn('', className)}>
        <div className="flex gap-3">
          {showImage && (
            <div className="flex-shrink-0 w-16 h-16 bg-surface rounded-lg overflow-hidden relative">
              {image ? (
                <Image
                  src={image}
                  alt={imageAlt || title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange/20" />
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <CategoryBadge category={category.name} size="sm" />
              {trending && <TrendingBadge size="sm" />}
            </div>
            
            <h4 className="font-semibold text-text text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {title}
            </h4>

            {/* Tags for compact card */}
            {tags && tags.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {tags
                    .filter(tag =>
                      !['trending', 'news', 'analysis', 'seo', 'optimization'].includes(tag.toLowerCase()) &&
                      tag.length > 2
                    )
                    .slice(0, 2)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs hover:bg-primary/10 cursor-pointer capitalize"
                      >
                        #{tag.replace(/[-_]/g, ' ')}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>{readTime}</span>
              <span>{formatRelativeTime(publishedAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export { ArticleCard, CompactArticleCard };
