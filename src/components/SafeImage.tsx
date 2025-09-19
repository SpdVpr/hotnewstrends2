'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fallbackContent?: React.ReactNode;
}

/**
 * SafeImage component that falls back to regular img tag if Next.js Image optimization fails
 * This prevents 502 BAD_GATEWAY errors from Vercel image optimization
 */
export function SafeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  sizes,
  fallbackContent
}: SafeImageProps) {
  const [useNextImage, setUseNextImage] = useState(true);
  const [imgError, setImgError] = useState(false);

  // If Next.js Image failed, use regular img tag
  if (!useNextImage) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        onError={() => setImgError(true)}
        style={fill ? { 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        } : { 
          width: width ? `${width}px` : undefined, 
          height: height ? `${height}px` : undefined 
        }}
      />
    );
  }

  // If both Next.js Image and regular img failed, show fallback
  if (imgError) {
    return (
      <div className={className}>
        {fallbackContent || (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-orange/20 flex items-center justify-center">
            <span className="text-text-secondary text-sm">Image unavailable</span>
          </div>
        )}
      </div>
    );
  }

  // Try Next.js Image first
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      priority={priority}
      quality={quality}
      sizes={sizes}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      onError={() => {
        console.warn(`Next.js Image optimization failed for: ${src}`);
        setUseNextImage(false);
      }}
    />
  );
}
