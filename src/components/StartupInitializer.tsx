'use client';

import { useEffect } from 'react';
import { startupService } from '@/lib/startup';

/**
 * Client-side startup initializer
 * Runs startup services when the app loads
 */
export function StartupInitializer() {
  useEffect(() => {
    // Initialize startup services
    startupService.initialize().catch(error => {
      console.error('Startup initialization failed:', error);
    });
  }, []);

  // This component doesn't render anything
  return null;
}
