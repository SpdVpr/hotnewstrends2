'use client';

import { useEffect } from 'react';

/**
 * Client-side startup initializer
 * Triggers server-side startup services via API
 */
export function StartupInitializer() {
  useEffect(() => {
    console.log('🚀 StartupInitializer: Triggering server-side initialization...');

    // Call server-side startup API
    fetch('/api/startup', {
      method: 'POST',
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('✅ StartupInitializer: Server services initialized successfully');
        } else {
          console.error('❌ StartupInitializer: Server initialization failed:', data.error);
        }
      })
      .catch(error => {
        console.error('❌ StartupInitializer: Failed to call startup API:', error);
      });
  }, []);

  // This component doesn't render anything
  return null;
}
