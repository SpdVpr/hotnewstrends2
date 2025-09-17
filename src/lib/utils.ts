import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | any): string {
  // Convert various date formats to Date object
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date && typeof date.toDate === 'function') {
    // Firebase Timestamp
    dateObj = date.toDate();
  } else if (date && date.seconds) {
    // Firebase Timestamp object
    dateObj = new Date(date.seconds * 1000);
  } else {
    // Fallback to current date if invalid
    console.warn('Invalid date format:', date);
    dateObj = new Date();
  }

  // Validate the date object
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date after conversion:', date, '→', dateObj);
    dateObj = new Date(); // Use current date as ultimate fallback
  }

  // Double check - if still invalid, return a string
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatRelativeTime(date: Date | string | any): string {
  const now = new Date();

  // Convert various date formats to Date object
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date && typeof date.toDate === 'function') {
    // Firebase Timestamp
    dateObj = date.toDate();
  } else if (date && date.seconds) {
    // Firebase Timestamp object
    dateObj = new Date(date.seconds * 1000);
  } else {
    // Fallback to current date if invalid
    console.warn('Invalid date format:', date);
    dateObj = new Date();
  }

  // Validate the date object
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date after conversion in formatRelativeTime:', date, '→', dateObj);
    return 'Unknown time';
  }

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return formatDate(dateObj);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export function getCategoryColor(categoryName: string): string {
  const colors: Record<string, string> = {
    'Technology': '#007AFF',
    'News': '#FF3B30',
    'Business': '#34C759',
    'Science': '#5856D6',
    'Health': '#FF9500',
    'Entertainment': '#FF2D92',
    'Sports': '#30B0C7',
    'Politics': '#8E8E93',
  };
  
  return colors[categoryName] || '#8E8E93';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getImagePlaceholder(width: number, height: number): string {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#F2F2F7"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#8E8E93" font-family="Inter, sans-serif" font-size="14">
        ${width} × ${height}
      </text>
    </svg>
  `)}`;
}

export function validateArticleData(data: any): boolean {
  return !!(
    data.title &&
    data.content &&
    data.category &&
    data.excerpt &&
    typeof data.title === 'string' &&
    typeof data.content === 'string' &&
    data.title.length > 0 &&
    data.content.length > 0
  );
}
