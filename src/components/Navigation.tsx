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
    { name: 'Home', href: '/', current: true },
    { name: 'Technology', href: '/category/technology', current: false },
    { name: 'News', href: '/category/news', current: false },
    { name: 'Business', href: '/category/business', current: false },
    { name: 'Entertainment', href: '/category/entertainment', current: false },
    { name: 'Science', href: '/category/science', current: false },
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/hnt-logo.png"
                alt="HotNewsTrends"
                width={180}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
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
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <SearchInput
              placeholder="Search trending topics..."
              onSearch={handleSearch}
              className="w-full"
            />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
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
    sm: { width: 120, height: 26 },
    md: { width: 180, height: 40 },
    lg: { width: 240, height: 53 },
  };

  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };

  return (
    <Link href="/" className={cn('flex items-center', className)}>
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
