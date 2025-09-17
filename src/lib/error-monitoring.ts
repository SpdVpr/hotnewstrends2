// Error monitoring and logging system
import React from 'react';

interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  timestamp: Date;
  userAgent: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'api' | 'performance' | 'security';
  resolved: boolean;
  tags: string[];
  context: Record<string, any>;
}

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  errorRate: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: Date;
  }>;
  errorsByCategory: Record<string, number>;
  errorsByPage: Record<string, number>;
}

class ErrorMonitor {
  private errors: ErrorEvent[] = [];
  private maxErrors = 1000; // Keep only the latest 1000 errors
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        line: event.lineno,
        column: event.colno,
        severity: 'high',
        category: 'javascript',
        context: {
          type: 'global_error',
          error: event.error
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        severity: 'high',
        category: 'javascript',
        context: {
          type: 'unhandled_promise_rejection',
          reason: event.reason
        }
      });
    });

    // Network error monitoring
    this.monitorNetworkErrors();

    // Performance monitoring
    this.monitorPerformanceIssues();
  }

  private monitorNetworkErrors(): void {
    if (typeof window === 'undefined') return;

    // Override fetch to monitor network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.captureError({
            message: `Network Error: ${response.status} ${response.statusText}`,
            url: typeof args[0] === 'string' ? args[0] : (args[0] instanceof URL ? args[0].href : (args[0] as Request).url),
            severity: response.status >= 500 ? 'high' : 'medium',
            category: 'network',
            context: {
              type: 'fetch_error',
              status: response.status,
              statusText: response.statusText,
              url: response.url
            }
          });
        }
        
        return response;
      } catch (error) {
        this.captureError({
          message: `Network Error: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
          url: typeof args[0] === 'string' ? args[0] : (args[0] instanceof URL ? args[0].href : (args[0] as Request).url),
          severity: 'high',
          category: 'network',
          context: {
            type: 'fetch_exception',
            error: error
          }
        });
        throw error;
      }
    };
  }

  private monitorPerformanceIssues(): void {
    if (typeof window === 'undefined') return;

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.captureError({
                message: `Long Task Detected: ${entry.duration.toFixed(2)}ms`,
                url: window.location.href,
                severity: entry.duration > 100 ? 'medium' : 'low',
                category: 'performance',
                context: {
                  type: 'long_task',
                  duration: entry.duration,
                  startTime: entry.startTime
                }
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 90) {
          this.captureError({
            message: `High Memory Usage: ${usedPercent.toFixed(1)}%`,
            url: window.location.href,
            severity: usedPercent > 95 ? 'high' : 'medium',
            category: 'performance',
            context: {
              type: 'memory_warning',
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              usedPercent
            }
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  captureError(errorData: Partial<ErrorEvent>): void {
    const error: ErrorEvent = {
      id: this.generateErrorId(),
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      url: errorData.url || (typeof window !== 'undefined' ? window.location.href : ''),
      line: errorData.line,
      column: errorData.column,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      sessionId: this.sessionId,
      severity: errorData.severity || 'medium',
      category: errorData.category || 'javascript',
      resolved: false,
      tags: errorData.tags || [],
      context: errorData.context || {}
    };

    // Add to local storage
    this.errors.push(error);
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Send to server if critical
    if (error.severity === 'critical' || error.severity === 'high') {
      this.sendErrorToServer(error);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', error);
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendErrorToServer(error: ErrorEvent): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error)
      });
    } catch (err) {
      console.warn('Failed to send error to server:', err);
    }
  }

  getErrors(filters?: {
    severity?: string;
    category?: string;
    resolved?: boolean;
    limit?: number;
  }): ErrorEvent[] {
    let filteredErrors = [...this.errors];

    if (filters) {
      if (filters.severity) {
        filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
      }
      if (filters.category) {
        filteredErrors = filteredErrors.filter(e => e.category === filters.category);
      }
      if (filters.resolved !== undefined) {
        filteredErrors = filteredErrors.filter(e => e.resolved === filters.resolved);
      }
      if (filters.limit) {
        filteredErrors = filteredErrors.slice(-filters.limit);
      }
    }

    return filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getErrorStats(): ErrorStats {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > oneHourAgo);

    // Group errors by message
    const errorGroups = this.errors.reduce((acc, error) => {
      const key = error.message;
      if (!acc[key]) {
        acc[key] = { count: 0, lastSeen: error.timestamp };
      }
      acc[key].count++;
      if (error.timestamp > acc[key].lastSeen) {
        acc[key].lastSeen = error.timestamp;
      }
      return acc;
    }, {} as Record<string, { count: number; lastSeen: Date }>);

    const topErrors = Object.entries(errorGroups)
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by category
    const errorsByCategory = this.errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by page
    const errorsByPage = this.errors.reduce((acc, error) => {
      const url = new URL(error.url).pathname;
      acc[url] = (acc[url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errors.length,
      criticalErrors: this.errors.filter(e => e.severity === 'critical').length,
      errorRate: recentErrors.length, // Errors per hour
      topErrors,
      errorsByCategory,
      errorsByPage
    };
  }

  resolveError(errorId: string): void {
    const errorIndex = this.errors.findIndex(e => e.id === errorId);
    if (errorIndex !== -1) {
      this.errors[errorIndex].resolved = true;
    }
  }

  clearErrors(): void {
    this.errors = [];
  }

  // Manual error reporting
  reportError(message: string, context?: Record<string, any>): void {
    this.captureError({
      message,
      severity: 'medium',
      category: 'javascript',
      context: {
        type: 'manual_report',
        ...context
      }
    });
  }

  // Performance timing helper
  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      if (duration > 1000) { // Warn if operation takes more than 1 second
        this.captureError({
          message: `Slow Operation: ${name} took ${duration.toFixed(2)}ms`,
          url: typeof window !== 'undefined' ? window.location.href : '',
          severity: duration > 5000 ? 'high' : 'medium',
          category: 'performance',
          context: {
            type: 'slow_operation',
            operation: name,
            duration
          }
        });
      }
      
      return result;
    } catch (error) {
      this.captureError({
        message: `Operation Failed: ${name}`,
        stack: error instanceof Error ? error.stack : undefined,
        url: typeof window !== 'undefined' ? window.location.href : '',
        severity: 'high',
        category: 'javascript',
        context: {
          type: 'operation_error',
          operation: name,
          error
        }
      });
      throw error;
    }
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitor();

// React error boundary helper - removed due to JSX in .ts file
// Use a separate .tsx file for React components

// Export types
export type { ErrorEvent, ErrorStats };
