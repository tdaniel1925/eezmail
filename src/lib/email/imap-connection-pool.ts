// src/lib/email/imap-connection-pool.ts
import { ImapService } from './imap-service';

interface PooledConnection {
  service: ImapService;
  lastUsed: Date;
  inUse: boolean;
}

/**
 * Connection pool for IMAP services
 * Reuses connections instead of creating new ones for each operation
 */
class ImapConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private maxIdleTime: number = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

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

    // Check if we have an existing connection
    const existingConnection = this.connections.get(key);

    if (existingConnection && !existingConnection.inUse) {
      // Reuse existing connection
      console.log(`♻️  Reusing IMAP connection for ${username}@${host}`);
      existingConnection.inUse = true;
      existingConnection.lastUsed = new Date();
      return existingConnection.service;
    }

    // Create new connection
    console.log(`🔌 Creating new IMAP connection for ${username}@${host}`);
    const service = new ImapService({
      host,
      port,
      username,
      password,
      useTls,
    });

    this.connections.set(key, {
      service,
      lastUsed: new Date(),
      inUse: true,
    });

    return service;
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

    return {
      total: this.connections.size,
      inUse,
      idle,
    };
  }
}

// Export singleton instance
export const imapConnectionPool = new ImapConnectionPool();

