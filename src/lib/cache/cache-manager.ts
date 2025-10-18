'use client';

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  enableStats?: boolean; // Enable cache statistics
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats;
  private options: Required<CacheOptions>;

  private constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize ?? 1000,
      enableStats: options.enableStats ?? true,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.options.maxSize,
    };
  }

  public static getInstance(options?: CacheOptions): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(options);
    }
    return CacheManager.instance;
  }

  public set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.options.ttl);

    // Check if we need to evict entries
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    this.stats.hits++;
    this.updateHitRate();

    return entry.value as T;
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return false;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateHitRate();
      return false;
    }

    this.stats.hits++;
    this.updateHitRate();
    return true;
  }

  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  public clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  public size(): number {
    return this.cache.size;
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: this.cache.size,
      maxSize: this.options.maxSize,
    };
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Clean up expired entries
  public cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    this.stats.size = this.cache.size;
  }

  // Get cache entry metadata
  public getEntryInfo(key: string): {
    exists: boolean;
    expiresAt?: number;
    createdAt?: number;
    accessCount?: number;
    lastAccessed?: number;
    isExpired?: boolean;
  } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return { exists: false };
    }

    const now = Date.now();
    const isExpired = now > entry.expiresAt;

    return {
      exists: true,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
      isExpired,
    };
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Hook for using cache in React components
export function useCache() {
  return {
    set: <T>(key: string, value: T, ttl?: number) =>
      cacheManager.set(key, value, ttl),
    get: <T>(key: string) => cacheManager.get<T>(key),
    has: (key: string) => cacheManager.has(key),
    delete: (key: string) => cacheManager.delete(key),
    clear: () => cacheManager.clear(),
    keys: () => cacheManager.keys(),
    size: () => cacheManager.size(),
    getStats: () => cacheManager.getStats(),
    resetStats: () => cacheManager.resetStats(),
    cleanup: () => cacheManager.cleanup(),
    getEntryInfo: (key: string) => cacheManager.getEntryInfo(key),
  };
}

// Utility functions for common cache patterns
export const CacheUtils = {
  // Email cache keys
  emailList: (userId: string, folderId?: string, page?: number) =>
    `emails:${userId}:${folderId || 'all'}:${page || 1}`,

  emailDetails: (emailId: string) => `email:${emailId}`,

  emailThread: (threadId: string) => `thread:${threadId}`,

  // User cache keys
  userProfile: (userId: string) => `user:${userId}`,

  userSettings: (userId: string) => `settings:${userId}`,

  // AI cache keys
  aiSummary: (emailId: string) => `ai:summary:${emailId}`,

  aiQuickReplies: (emailId: string) => `ai:replies:${emailId}`,

  aiScreening: (emailId: string) => `ai:screening:${emailId}`,

  // Sidebar cache keys
  sidebarData: (userId: string) => `sidebar:${userId}`,

  folderCounts: (userId: string) => `folders:${userId}`,

  // Search cache keys
  searchResults: (
    userId: string,
    query: string,
    filters?: Record<string, any>
  ) => `search:${userId}:${query}:${JSON.stringify(filters || {})}`,
};
