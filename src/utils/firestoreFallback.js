/**
 * Firestore Fallback Utility
 * Provides localStorage-based fallback when Firestore is blocked
 */

class FirestoreFallback {
  constructor() {
    this.prefix = 'csi_fallback_';
    this.isBlocked = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Check if Firestore is blocked
   */
  isFirestoreBlocked() {
    return window.__FIRESTORE_UNAVAILABLE__ || this.isBlocked;
  }

  /**
   * Check if network is available
   */
  isNetworkAvailable() {
    return window.__NETWORK_ONLINE__ !== false && navigator.onLine;
  }

  /**
   * Detect if error is due to blocking
   */
  isBlockingError(error) {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorString = error?.toString()?.toLowerCase() || '';
    
    return (
      errorMessage.includes('blocked') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('err_blocked_by_client') ||
      errorString.includes('blocked') ||
      errorString.includes('err_blocked_by_client') ||
      error?.code === 'unavailable' ||
      error?.code === 'permission-denied'
    );
  }

  /**
   * Store data in localStorage as fallback
   */
  setFallbackData(collection, docId, data) {
    try {
      const key = `${this.prefix}${collection}_${docId}`;
      const storageData = {
        ...data,
        _fallback: true,
        _timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(storageData));
      console.log(`📦 Data stored in localStorage fallback: ${key}`);
      return true;
    } catch (e) {
      console.error('Failed to store in localStorage:', e);
      return false;
    }
  }

  /**
   * Get data from localStorage fallback
   */
  getFallbackData(collection, docId) {
    try {
      const key = `${this.prefix}${collection}_${docId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`📦 Data retrieved from localStorage fallback: ${key}`);
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Failed to retrieve from localStorage:', e);
      return null;
    }
  }

  /**
   * Update data in localStorage fallback
   */
  updateFallbackData(collection, docId, updates) {
    try {
      const existing = this.getFallbackData(collection, docId);
      if (existing) {
        const updated = {
          ...existing,
          ...updates,
          _lastUpdated: Date.now()
        };
        return this.setFallbackData(collection, docId, updated);
      }
      return false;
    } catch (e) {
      console.error('Failed to update localStorage:', e);
      return false;
    }
  }

  /**
   * Clear fallback data
   */
  clearFallbackData(collection, docId) {
    try {
      const key = `${this.prefix}${collection}_${docId}`;
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared localStorage fallback: ${key}`);
      return true;
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
      return false;
    }
  }

  /**
   * Retry a Firestore operation with fallback
   */
  async retryWithFallback(operation, fallbackOperation, attempts = this.retryAttempts) {
    let lastError = null;
    
    // Check if we should skip Firestore entirely
    if (this.isFirestoreBlocked() || !this.isNetworkAvailable()) {
      console.warn('⚠️ Firestore blocked or network unavailable, using fallback immediately');
      if (fallbackOperation) {
        return await fallbackOperation();
      }
      throw new Error('Firestore is blocked and no fallback available');
    }
    
    // Try the Firestore operation with retries
    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`🔄 Attempt ${i + 1}/${attempts} for Firestore operation`);
        const result = await operation();
        console.log('✅ Firestore operation successful');
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Firestore operation failed (attempt ${i + 1}):`, error.message);
        
        // Check if this is a blocking error
        if (this.isBlockingError(error)) {
          this.isBlocked = true;
          console.warn('🚫 Detected blocking error, switching to fallback');
          break;
        }
        
        // Wait before retrying (except on last attempt)
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
        }
      }
    }
    
    // All retries failed, try fallback
    if (fallbackOperation) {
      console.log('📦 Using localStorage fallback after Firestore failures');
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        console.error('❌ Fallback operation also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    // No fallback available, throw the last error
    throw lastError || new Error('Firestore operation failed');
  }

  /**
   * Check if browser has blocking extensions
   */
  async detectBlockingExtensions() {
    const testUrls = [
      'https://firestore.googleapis.com/test',
      'https://firebaseapp.com/test',
      'https://firebase.googleapis.com/test'
    ];
    
    const results = {
      hasBlocker: false,
      blockedUrls: [],
      suggestions: []
    };
    
    for (const url of testUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
      } catch (error) {
        if (error.name === 'AbortError' || this.isBlockingError(error)) {
          results.hasBlocker = true;
          results.blockedUrls.push(url);
        }
      }
    }
    
    if (results.hasBlocker) {
      // Mark Firestore as blocked so future operations immediately use fallback
      this.isBlocked = true;
      window.__FIRESTORE_UNAVAILABLE__ = true;
      results.suggestions = [
        'Disable ad blockers for this site',
        'Add this site to your ad blocker\'s whitelist',
        'Check browser extensions that might block network requests',
        'Try using a different browser or incognito mode',
        'Check firewall or antivirus settings'
      ];
    }
    
    return results;
  }

  /**
   * Sync fallback data to Firestore when connection is restored
   */
  async syncFallbackToFirestore(syncFunction) {
    if (!this.isNetworkAvailable() || this.isFirestoreBlocked()) {
      console.log('⏸️ Sync skipped: Network unavailable or Firestore blocked');
      return false;
    }
    
    try {
      // Get all fallback keys
      const fallbackKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));
      
      if (fallbackKeys.length === 0) {
        console.log('✅ No fallback data to sync');
        return true;
      }
      
      console.log(`🔄 Syncing ${fallbackKeys.length} fallback items to Firestore`);
      
      for (const key of fallbackKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const [, collection, docId] = key.replace(this.prefix, '').split('_');
          
          if (data && collection && docId) {
            await syncFunction(collection, docId, data);
            localStorage.removeItem(key);
            console.log(`✅ Synced and removed: ${key}`);
          }
        } catch (e) {
          console.error(`Failed to sync ${key}:`, e);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new FirestoreFallback();
