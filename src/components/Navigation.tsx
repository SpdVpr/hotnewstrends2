'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

export interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { name: 'Technology', href: '/category/technology', current: false },
    { name: 'News', href: '/category/news', current: false },
    { name: 'Business', href: '/category/business', current: false },
    { name: 'Entertainment', href: '/category/entertainment', current: false },
    { name: 'Sports', href: '/category/sports', current: false },
    { name: 'Health', href: '/category/health', current: false },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
    console.log('Searching for:', query);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={cn('sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-surface', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/hnt-logo.png"
                alt="HotNewsTrends"
                width={200}
                height={44}
                className="h-10 w-auto hover:opacity-90 transition-opacity"
                priority
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 flex-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  item.current 
                    ? 'text-primary' 
                    : 'text-text-secondary'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchInput
              placeholder="Search trending topics..."
              onSearch={handleSearch}
              className="w-full"
            />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <ThemeToggle size="sm" />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text hover:bg-surface transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-surface bg-background">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <SearchInput
              placeholder="Search trending topics..."
              onSearch={handleSearch}
              className="w-full"
            />
            
            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-base font-medium transition-colors',
                    item.current
                      ? 'text-primary bg-primary/10'
                      : 'text-text-secondary hover:text-text hover:bg-surface'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            
            {/* Mobile Actions */}
            <div className="pt-4 border-t border-surface">
              <div className="flex items-center justify-center">
                <ThemeToggle size="md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Logo Component
export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const sizes = {
    sm: { width: 140, height: 31 },
    md: { width: 200, height: 44 },
    lg: { width: 280, height: 62 },
  };

  const heightClasses = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
  };

  return (
    <Link href="/" className={cn('flex items-center hover:opacity-90 transition-opacity', className)}>
      <Image
        src="/hnt-logo.png"
        alt="HotNewsTrends"
        width={sizes[size].width}
        height={sizes[size].height}
        className={cn('w-auto', heightClasses[size])}
        priority
      />
    </Link>
  );
};

export { Navigation, Logo };
