import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LCPOptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  isLCP?: boolean; // Mark as LCP element
}

export function LCPOptimizedImage({ 
  src, 
  alt, 
  className, 
  priority = false,
  isLCP = false 
}: LCPOptimizedImageProps) {
  return (
    <div className={cn("aspect-video bg-surface relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-200 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 378px"
        priority={priority || isLCP}
        quality={isLCP ? 90 : 85} // Higher quality for LCP images
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        fetchPriority={isLCP ? "high" : "auto"}
        // Add LCP-specific attributes
        {...(isLCP && {
          'data-lcp': 'true',
          style: { contentVisibility: 'visible' }
        })}
      />
    </div>
  );
}
