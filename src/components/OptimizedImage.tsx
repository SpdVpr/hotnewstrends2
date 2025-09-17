import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px', // Start loading 200px before the image enters viewport for better UX
        threshold: 0.01 // Trigger earlier
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  // Generate blur placeholder
  const generateBlurDataURL = (w: number = 10, h: number = 10): string => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a gradient placeholder
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    
    return canvas.toDataURL();
  };

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  // Generate responsive sizes if not provided - optimized for article cards
  const responsiveSizes = sizes || (
    fill
      ? '100vw'
      : '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 378px'
  );

  // Error fallback component
  const ErrorFallback = () => (
    <div 
      className={cn(
        'flex items-center justify-center bg-gray-100 text-gray-400',
        className
      )}
      style={{ 
        width: fill ? '100%' : width, 
        height: fill ? '100%' : height,
        minHeight: height || 200
      }}
    >
      <svg 
        className="w-12 h-12" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
    </div>
  );

  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div 
      className={cn(
        'animate-pulse bg-gray-200',
        className
      )}
      style={{ 
        width: fill ? '100%' : width, 
        height: fill ? '100%' : height,
        minHeight: height || 200
      }}
    />
  );

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <div 
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={fill ? { width: '100%', height: '100%' } : undefined}
    >
      {/* Loading placeholder */}
      {isLoading && <LoadingPlaceholder />}
      
      {/* Actual image */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? generateBlurDataURL() : undefined}
          sizes={responsiveSizes}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            fill && `object-${objectFit}`,
            className
          )}
          style={fill ? { objectPosition } : undefined}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
};

// Specialized components for common use cases
export const ArticleImage: React.FC<{
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}> = ({ src, alt, priority = false, className }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={1200}
    height={630}
    priority={priority}
    quality={85}
    className={cn('rounded-lg', className)}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
  />
);

export const ThumbnailImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={400}
    height={300}
    quality={75}
    className={cn('rounded-md', className)}
    sizes="(max-width: 768px) 50vw, 400px"
  />
);

export const HeroImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    fill
    priority
    quality={90}
    className={className}
    objectFit="cover"
    sizes="100vw"
  />
);

export const AvatarImage: React.FC<{
  src: string;
  alt: string;
  size?: number;
  className?: string;
}> = ({ src, alt, size = 40, className }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={size}
    height={size}
    quality={80}
    className={cn('rounded-full', className)}
    sizes={`${size}px`}
  />
);

// Image optimization utilities
export const imageOptimization = {
  // Generate srcSet for responsive images
  generateSrcSet: (src: string, widths: number[] = [400, 800, 1200, 1600]) => {
    return widths
      .map(width => `${src}?w=${width}&q=80 ${width}w`)
      .join(', ');
  },

  // Generate blur data URL
  generateBlurDataURL: (color: string = '#f3f4f6') => {
    const svg = `
      <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
        <rect width="10" height="10" fill="${color}"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  },

  // Calculate aspect ratio
  calculateAspectRatio: (width: number, height: number) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}/${height / divisor}`;
  },

  // Optimize image URL (for external services like Cloudinary)
  optimizeUrl: (src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  } = {}) => {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    // This is a mock implementation - in production, integrate with your image CDN
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', format);
    
    return `${src}?${params.toString()}`;
  }
};
