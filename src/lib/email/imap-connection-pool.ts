// src/lib/email/imap-connection-pool.ts
import { ImapService } from './imap-service';

interface PooledConnection {
  service: ImapService;
  lastUsed: Date;
  inUse: boolean;
  loginCount: number; // Track login count per connection
}

interface ConnectionQueueItem {
  resolve: (service: ImapService) => void;
  reject: (error: Error) => void;
}

/**
 * Connection pool for IMAP services
 * Reuses connections instead of creating new ones for each operation
 * Implements rate limiting to prevent "too many logins" errors
 */
class ImapConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private maxIdleTime: number = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Rate limiting to prevent FastMail "500 logins per 10 minutes" error
  private maxConnectionsPerAccount: number = 3; // Max 3 connections per account
  private connectionQueue: Map<string, ConnectionQueueItem[]> = new Map();
  private loginTimestamps: Map<string, number[]> = new Map(); // Track login times
  private maxLoginsPerTenMinutes: number = 450; // Conservative limit (FastMail = 500)

  constructor() {
    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Get a connection key from account credentials
   */
  private getConnectionKey(
    host: string,
    port: number,
    username: string
  ): string {
    return `${host}:${port}:${username}`;
  }

  /**
   * Check if we can create a new connection (rate limit check)
   */
  private canCreateNewConnection(username: string): boolean {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    // Get login timestamps for this user
    let timestamps = this.loginTimestamps.get(username) || [];
    
    // Remove timestamps older than 10 minutes
    timestamps = timestamps.filter(ts => ts > tenMinutesAgo);
    this.loginTimestamps.set(username, timestamps);

    // Check if we're under the limit
    return timestamps.length < this.maxLoginsPerTenMinutes;
  }

  /**
   * Record a login attempt
   */
  private recordLogin(username: string): void {
    const now = Date.now();
    const timestamps = this.loginTimestamps.get(username) || [];
    timestamps.push(now);
    this.loginTimestamps.set(username, timestamps);
  }

  /**
   * Count active connections for an account
   */
  private countActiveConnections(key: string): number {
    let count = 0;
    for (const [connKey, conn] of this.connections.entries()) {
      if (connKey.startsWith(key.split(':')[0]) && conn.inUse) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get or create a connection for an account
   */
  async getConnection(
    host: string,
    port: number,
    username: string,
    password: string,
    useTls: boolean = true
  ): Promise<ImapService> {
    const key = this.getConnectionKey(host, port, username);

    // Check if we have an existing idle connection
    const existingConnection = this.connections.get(key);

    if (existingConnection && !existingConnection.inUse) {
      // Reuse existing connection
      console.log(`♻️  Reusing IMAP connection for ${username}@${host}`);
      existingConnection.inUse = true;
      existingConnection.lastUsed = new Date();
      existingConnection.loginCount++;
      return existingConnection.service;
    }

    // Check active connections limit
    const activeConnections = this.countActiveConnections(key);
    if (activeConnections >= this.maxConnectionsPerAccount) {
      console.log(`⏳ Max connections reached for ${username}@${host}, queuing...`);
      
      // Queue this request
      return new Promise((resolve, reject) => {
        const queue = this.connectionQueue.get(key) || [];
        queue.push({ resolve, reject });
        this.connectionQueue.set(key, queue);

        // Set timeout to prevent infinite waiting
        setTimeout(() => {
          reject(new Error('Connection request timed out after 60 seconds'));
        }, 60000);
      });
    }

    // Check rate limit before creating new connection
    if (!this.canCreateNewConnection(username)) {
      const waitTime = Math.ceil((this.getOldestLoginAge(username) - 10 * 60 * 1000) / -1000);
      console.warn(
        `⚠️  Rate limit approaching for ${username}@${host}. Wait ${waitTime}s before next login.`
      );
      
      // Wait for rate limit window to pass
      await new Promise(resolve => setTimeout(resolve, Math.max(waitTime * 1000, 1000)));
    }

    // Create new connection
    console.log(`🔌 Creating new IMAP connection for ${username}@${host}`);
    
    try {
      const service = new ImapService({
        host,
        port,
        username,
        password,
        useTls,
      });

      // Record the login
      this.recordLogin(username);

      this.connections.set(key, {
        service,
        lastUsed: new Date(),
        inUse: true,
        loginCount: 1,
      });

      return service;
    } catch (error) {
      console.error(`Failed to create IMAP connection for ${username}@${host}:`, error);
      throw error;
    }
  }

  /**
   * Get age of oldest login timestamp
   */
  private getOldestLoginAge(username: string): number {
    const timestamps = this.loginTimestamps.get(username) || [];
    if (timestamps.length === 0) return Infinity;
    
    const oldest = Math.min(...timestamps);
    return Date.now() - oldest;
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(
    host: string,
    port: number,
    username: string
  ): void {
    const key = this.getConnectionKey(host, port, username);
    const connection = this.connections.get(key);

    if (connection) {
      connection.inUse = false;
      connection.lastUsed = new Date();
      console.log(`✅ Released IMAP connection for ${username}@${host}`);

      // Process queue if there are waiting requests
      const queue = this.connectionQueue.get(key);
      if (queue && queue.length > 0) {
        const nextRequest = queue.shift();
        if (nextRequest) {
          console.log(`📤 Processing queued connection request for ${username}@${host}`);
          connection.inUse = true;
          connection.loginCount++;
          nextRequest.resolve(connection.service);
          
          // Update queue
          if (queue.length === 0) {
            this.connectionQueue.delete(key);
          } else {
            this.connectionQueue.set(key, queue);
          }
        }
      }
    }
  }

  /**
   * Close and remove a connection from the pool
   */
  async closeConnection(
    host: string,
    port: number,
    username: string
  ): Promise<void> {
    const key = this.getConnectionKey(host, port, username);
    const connection = this.connections.get(key);

    if (connection) {
      try {
        await connection.service.disconnect();
        console.log(`🔌 Closed IMAP connection for ${username}@${host}`);
      } catch (error) {
        console.error(
          `Error closing IMAP connection for ${username}@${host}:`,
          error
        );
      }

      this.connections.delete(key);
    }
  }

  /**
   * Clean up idle connections
   */
  private async cleanupIdleConnections(): Promise<void> {
    const now = new Date();

    for (const [key, connection] of this.connections.entries()) {
      const idleTime = now.getTime() - connection.lastUsed.getTime();

      // Close connections that have been idle too long and are not in use
      if (!connection.inUse && idleTime > this.maxIdleTime) {
        console.log(
          `🧹 Cleaning up idle IMAP connection: ${key} (idle for ${Math.round(idleTime / 1000)}s)`
        );

        try {
          await connection.service.disconnect();
        } catch (error) {
          console.error(`Error cleaning up connection ${key}:`, error);
        }

        this.connections.delete(key);
      }
    }
  }

  /**
   * Start periodic cleanup of idle connections
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60 * 1000);
  }

  /**
   * Stop cleanup timer (for testing or shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Close all connections and clear the pool
   */
  async closeAll(): Promise<void> {
    this.stopCleanup();

    const closePromises = Array.from(this.connections.entries()).map(
      async ([key, connection]) => {
        try {
          await connection.service.disconnect();
          console.log(`🔌 Closed IMAP connection: ${key}`);
        } catch (error) {
          console.error(`Error closing connection ${key}:`, error);
        }
      }
    );

    await Promise.all(closePromises);
    this.connections.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    inUse: number;
    idle: number;
    queuedRequests: number;
  } {
    let inUse = 0;
    let idle = 0;

    for (const connection of this.connections.values()) {
      if (connection.inUse) {
        inUse++;
      } else {
        idle++;
      }
    }

    let queuedRequests = 0;
    for (const queue of this.connectionQueue.values()) {
      queuedRequests += queue.length;
    }

    return {
      total: this.connections.size,
      inUse,
      idle,
      queuedRequests,
    };
  }

  /**
   * Get rate limit statistics for a user
   */
  getRateLimitStats(username: string): {
    loginsInLast10Min: number;
    remainingLogins: number;
    oldestLoginAge: number;
    isNearLimit: boolean;
  } {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    let timestamps = this.loginTimestamps.get(username) || [];
    timestamps = timestamps.filter(ts => ts > tenMinutesAgo);

    const loginsInLast10Min = timestamps.length;
    const remainingLogins = Math.max(0, this.maxLoginsPerTenMinutes - loginsInLast10Min);
    const oldestLoginAge = timestamps.length > 0 ? now - Math.min(...timestamps) : 0;
    const isNearLimit = loginsInLast10Min > this.maxLoginsPerTenMinutes * 0.8; // 80% threshold

    return {
      loginsInLast10Min,
      remainingLogins,
      oldestLoginAge,
      isNearLimit,
    };
  }
}

// Export singleton instance
export const imapConnectionPool = new ImapConnectionPool();

