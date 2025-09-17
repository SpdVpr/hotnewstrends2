'use client';

import { useEffect } from 'react';
import { startupService } from '@/lib/startup';

/**
 * Client-side startup initializer
 * Runs startup services when the app loads
 */
export function StartupInitializer() {
  useEffect(() => {
    console.log('🚀 StartupInitializer: Initializing services...');

    // Initialize startup services
    startupService.initialize()
      .then(() => {
        console.log('✅ StartupInitializer: Services initialized successfully');
      })
      .catch(error => {
        console.error('❌ StartupInitializer: Initialization failed:', error);
      });
  }, []);

  // This component doesn't render anything
  return null;
}
