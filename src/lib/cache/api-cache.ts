'use client';

import { cacheManager, CacheUtils } from './cache-manager';

export interface CacheableRequest {
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  cacheKey?: string;
  ttl?: number;
}

export interface CacheableResponse<T = any> {
  data: T;
  cached: boolean;
  cacheKey: string;
  timestamp: number;
}

export class APICache {
  private static instance: APICache;

  private constructor() {}

  public static getInstance(): APICache {
    if (!APICache.instance) {
      APICache.instance = new APICache();
    }
    return APICache.instance;
  }

  public async fetch<T>(
    request: CacheableRequest,
    options: {
      cache?: boolean;
      ttl?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<CacheableResponse<T>> {
    const {
      cache = true,
      ttl = 5 * 60 * 1000, // 5 minutes default
      forceRefresh = false,
    } = options;

    // Generate cache key
    const cacheKey = request.cacheKey || this.generateCacheKey(request);

    // Check cache first (unless force refresh)
    if (cache && !forceRefresh) {
      const cachedData = cacheManager.get<CacheableResponse<T>>(cacheKey);
      if (cachedData) {
        return {
          ...cachedData,
          cached: true,
        };
      }
    }

    // Make actual API call
    const response = await this.makeRequest<T>(request);

    // Cache the response
    if (cache) {
      const cacheableResponse: CacheableResponse<T> = {
        data: response,
        cached: false,
        cacheKey,
        timestamp: Date.now(),
      };

      cacheManager.set(cacheKey, cacheableResponse, ttl);
    }

    return {
      data: response,
      cached: false,
      cacheKey,
      timestamp: Date.now(),
    };
  }

  private async makeRequest<T>(request: CacheableRequest): Promise<T> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private generateCacheKey(request: CacheableRequest): string {
    const { url, method, body, headers } = request;

    // Create a hash of the request parameters
    const keyData = {
      url,
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: headers ? JSON.stringify(headers) : undefined,
    };

    // Simple hash function (in production, use a proper hash library)
    const keyString = JSON.stringify(keyData);
    return `api:${this.simpleHash(keyString)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Email-specific cache methods
  public async getEmails(
    userId: string,
    folderId?: string,
    page: number = 1,
    options: { cache?: boolean; ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<CacheableResponse<any[]>> {
    const cacheKey = CacheUtils.emailList(userId, folderId, page);

    return this.fetch(
      {
        url: '/api/emails',
        method: 'GET',
        cacheKey,
      },
      {
        ttl: 2 * 60 * 1000, // 2 minutes for email lists
        ...options,
      }
    );
  }

  public async getEmailDetails(
    emailId: string,
    options: { cache?: boolean; ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<CacheableResponse<any>> {
    const cacheKey = CacheUtils.emailDetails(emailId);

    return this.fetch(
      {
        url: `/api/emails/${emailId}`,
        method: 'GET',
        cacheKey,
      },
      {
        ttl: 10 * 60 * 1000, // 10 minutes for email details
        ...options,
      }
    );
  }

  public async getAISummary(
    emailId: string,
    options: { cache?: boolean; ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<CacheableResponse<any>> {
    const cacheKey = CacheUtils.aiSummary(emailId);

    return this.fetch(
      {
        url: '/api/ai/summary',
        method: 'POST',
        body: { emailId },
        cacheKey,
      },
      {
        ttl: 30 * 60 * 1000, // 30 minutes for AI summaries
        ...options,
      }
    );
  }

  public async getAIQuickReplies(
    emailId: string,
    options: { cache?: boolean; ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<CacheableResponse<any[]>> {
    const cacheKey = CacheUtils.aiQuickReplies(emailId);

    return this.fetch(
      {
        url: '/api/ai/quick-replies',
        method: 'POST',
        body: { emailId },
        cacheKey,
      },
      {
        ttl: 30 * 60 * 1000, // 30 minutes for AI quick replies
        ...options,
      }
    );
  }

  public async getSidebarData(
    userId: string,
    options: { cache?: boolean; ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<CacheableResponse<any>> {
    const cacheKey = CacheUtils.sidebarData(userId);

    return this.fetch(
      {
        url: '/api/sidebar',
        method: 'GET',
        cacheKey,
      },
      {
        ttl: 5 * 60 * 1000, // 5 minutes for sidebar data
        ...options,
      }
    );
  }

  // Cache invalidation methods
  public invalidateEmailCache(emailId: string): void {
    cacheManager.delete(CacheUtils.emailDetails(emailId));
    cacheManager.delete(CacheUtils.aiSummary(emailId));
    cacheManager.delete(CacheUtils.aiQuickReplies(emailId));
    cacheManager.delete(CacheUtils.aiScreening(emailId));
  }

  public invalidateUserCache(userId: string): void {
    // Invalidate all user-related cache entries
    const keys = cacheManager.keys();
    keys.forEach((key) => {
      if (key.includes(userId)) {
        cacheManager.delete(key);
      }
    });
  }

  public invalidateFolderCache(userId: string, folderId?: string): void {
    const keys = cacheManager.keys();
    keys.forEach((key) => {
      if (
        key.includes(`emails:${userId}`) &&
        (!folderId || key.includes(folderId))
      ) {
        cacheManager.delete(key);
      }
    });
  }

  // Cache warming methods
  public async warmEmailCache(
    userId: string,
    folderIds: string[]
  ): Promise<void> {
    const promises = folderIds.map((folderId) =>
      this.getEmails(userId, folderId, 1, { forceRefresh: true })
    );

    await Promise.all(promises);
  }

  public async warmUserCache(userId: string): Promise<void> {
    const promises = [
      this.getSidebarData(userId, { forceRefresh: true }),
      this.getEmails(userId, undefined, 1, { forceRefresh: true }),
    ];

    await Promise.all(promises);
  }

  // Cache statistics
  public getCacheStats(): any {
    return cacheManager.getStats();
  }

  public clearCache(): void {
    cacheManager.clear();
  }

  public cleanupCache(): void {
    cacheManager.cleanup();
  }
}

// Export singleton instance
export const apiCache = APICache.getInstance();

// Hook for using API cache in React components
export function useAPICache() {
  return {
    fetch: <T>(request: CacheableRequest, options?: any) =>
      apiCache.fetch<T>(request, options),
    getEmails: (
      userId: string,
      folderId?: string,
      page?: number,
      options?: any
    ) => apiCache.getEmails(userId, folderId, page, options),
    getEmailDetails: (emailId: string, options?: any) =>
      apiCache.getEmailDetails(emailId, options),
    getAISummary: (emailId: string, options?: any) =>
      apiCache.getAISummary(emailId, options),
    getAIQuickReplies: (emailId: string, options?: any) =>
      apiCache.getAIQuickReplies(emailId, options),
    getSidebarData: (userId: string, options?: any) =>
      apiCache.getSidebarData(userId, options),
    invalidateEmailCache: (emailId: string) =>
      apiCache.invalidateEmailCache(emailId),
    invalidateUserCache: (userId: string) =>
      apiCache.invalidateUserCache(userId),
    invalidateFolderCache: (userId: string, folderId?: string) =>
      apiCache.invalidateFolderCache(userId, folderId),
    warmEmailCache: (userId: string, folderIds: string[]) =>
      apiCache.warmEmailCache(userId, folderIds),
    warmUserCache: (userId: string) => apiCache.warmUserCache(userId),
    getCacheStats: () => apiCache.getCacheStats(),
    clearCache: () => apiCache.clearCache(),
    cleanupCache: () => apiCache.cleanupCache(),
  };
}
