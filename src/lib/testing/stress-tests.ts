'use client';

import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import { emails, emailAccounts, users } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export interface StressTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  metrics: {
    requestsPerSecond?: number;
    memoryUsage?: number;
    responseTime?: number;
    errorRate?: number;
    throughput?: number;
  };
  issues: string[];
  recommendations: string[];
}

export class StressTester {
  private supabase = createClient();
  private startTime: number = 0;

  async runAllStressTests(): Promise<StressTestResult[]> {
    const results: StressTestResult[] = [];

    // Database stress tests
    results.push(...(await this.testDatabaseConcurrency()));
    results.push(...(await this.testDatabaseLoad()));

    // API stress tests
    results.push(...(await this.testAPIEndpoints()));
    results.push(...(await this.testEmailSyncLoad()));

    // Memory stress tests
    results.push(...(await this.testMemoryUsage()));
    results.push(...(await this.testLargeEmailHandling()));

    // UI stress tests
    results.push(...(await this.testEmailListRendering()));
    results.push(...(await this.testConcurrentUsers()));

    // AI service stress tests
    results.push(...(await this.testAIServiceLoad()));

    return results;
  }

  private async testDatabaseConcurrency(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const concurrentQueries = 50;
      const promises: Promise<any>[] = [];

      // Simulate concurrent database queries
      for (let i = 0; i < concurrentQueries; i++) {
        promises.push(db.select({ count: count() }).from(emails));
      }

      const results = await Promise.all(promises);
      const duration = this.getDuration();

      // Check if all queries succeeded
      const successRate =
        results.filter((r) => r.length > 0).length / concurrentQueries;

      if (successRate < 0.95) {
        issues.push(
          `Database concurrency issues: ${(1 - successRate) * 100}% failure rate`
        );
        recommendations.push(
          'Optimize database queries and add connection pooling'
        );
      }

      if (duration > 5000) {
        issues.push(
          `Slow database response: ${duration}ms for ${concurrentQueries} queries`
        );
        recommendations.push('Add database indexing and query optimization');
      }

      return {
        testName: 'Database Concurrency',
        status: successRate >= 0.95 && duration < 5000 ? 'passed' : 'warning',
        duration,
        metrics: {
          requestsPerSecond: concurrentQueries / (duration / 1000),
          responseTime: duration / concurrentQueries,
          errorRate: (1 - successRate) * 100,
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'Database Concurrency',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`Database concurrency test failed: ${error}`],
        recommendations: ['Fix database connection issues'],
      };
    }
  }

  private async testDatabaseLoad(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Test heavy database operations
      const operations = [
        () => db.query.emails.findMany({ limit: 1000 }),
        () =>
          db.query.emailAccounts.findMany({
            where: eq(emailAccounts.userId, user.id),
          }),
        () => db.select({ count: count() }).from(emails),
      ];

      const results = await Promise.all(operations.map((op) => op()));
      const duration = this.getDuration();

      if (duration > 2000) {
        issues.push(`Heavy database operations slow: ${duration}ms`);
        recommendations.push('Add database indexes and optimize queries');
      }

      return {
        testName: 'Database Load',
        status: duration < 2000 ? 'passed' : 'warning',
        duration,
        metrics: {
          responseTime: duration,
          throughput: results.length / (duration / 1000),
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'Database Load',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`Database load test failed: ${error}`],
        recommendations: ['Fix database performance issues'],
      };
    }
  }

  private async testAPIEndpoints(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const endpoints = [
        '/api/ai/summary',
        '/api/ai/quick-replies',
        '/api/email/sync',
        '/api/voice-message/upload',
      ];

      const concurrentRequests = 20;
      const promises: Promise<Response>[] = [];

      // Test concurrent API requests
      for (let i = 0; i < concurrentRequests; i++) {
        for (const endpoint of endpoints) {
          promises.push(
            fetch(endpoint, {
              method: 'OPTIONS',
              signal: AbortSignal.timeout(5000),
            })
          );
        }
      }

      const results = await Promise.allSettled(promises);
      const duration = this.getDuration();

      const successCount = results.filter(
        (r) => r.status === 'fulfilled'
      ).length;
      const successRate = successCount / results.length;

      if (successRate < 0.9) {
        issues.push(
          `API endpoint reliability issues: ${(1 - successRate) * 100}% failure rate`
        );
        recommendations.push('Add API rate limiting and error handling');
      }

      const requestsPerSecond = results.length / (duration / 1000);
      if (requestsPerSecond < 10) {
        issues.push(
          `Low API throughput: ${requestsPerSecond.toFixed(2)} requests/second`
        );
        recommendations.push('Optimize API endpoints and add caching');
      }

      return {
        testName: 'API Endpoints',
        status: successRate >= 0.9 ? 'passed' : 'warning',
        duration,
        metrics: {
          requestsPerSecond,
          errorRate: (1 - successRate) * 100,
          responseTime: duration / results.length,
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'API Endpoints',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`API stress test failed: ${error}`],
        recommendations: ['Fix API endpoint issues'],
      };
    }
  }

  private async testEmailSyncLoad(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Simulate email sync load
      const syncOperations = 10;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < syncOperations; i++) {
        promises.push(
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId: `test-${i}` }),
          }).catch(() => ({ status: 404 })) // Handle missing endpoint gracefully
        );
      }

      const results = await Promise.allSettled(promises);
      const duration = this.getDuration();

      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && (r.value as any).status !== 404
      ).length;

      const successRate = successCount / results.length;

      if (successRate < 0.8) {
        issues.push(
          `Email sync reliability issues: ${(1 - successRate) * 100}% failure rate`
        );
        recommendations.push('Implement robust email sync with retry logic');
      }

      return {
        testName: 'Email Sync Load',
        status: successRate >= 0.8 ? 'passed' : 'warning',
        duration,
        metrics: {
          requestsPerSecond: syncOperations / (duration / 1000),
          errorRate: (1 - successRate) * 100,
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'Email Sync Load',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`Email sync stress test failed: ${error}`],
        recommendations: ['Fix email sync performance'],
      };
    }
  }

  private async testMemoryUsage(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test memory usage with large data sets
      const largeDataSets = 5;
      const dataSize = 1000; // Simulate 1000 items per dataset

      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

      // Simulate memory-intensive operations
      const dataSets: any[] = [];
      for (let i = 0; i < largeDataSets; i++) {
        dataSets.push(
          new Array(dataSize).fill(0).map((_, j) => ({
            id: j,
            data: `test-data-${i}-${j}`,
            timestamp: Date.now(),
          }))
        );
      }

      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = memoryAfter - memoryBefore;
      const duration = this.getDuration();

      // Check memory usage
      if (memoryUsed > 50 * 1024 * 1024) {
        // 50MB threshold
        issues.push(
          `High memory usage: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`
        );
        recommendations.push(
          'Implement memory optimization and garbage collection'
        );
      }

      return {
        testName: 'Memory Usage',
        status: memoryUsed < 50 * 1024 * 1024 ? 'passed' : 'warning',
        duration,
        metrics: {
          memoryUsage: memoryUsed,
          throughput: dataSets.length / (duration / 1000),
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'Memory Usage',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`Memory usage test failed: ${error}`],
        recommendations: ['Fix memory management issues'],
      };
    }
  }

  private async testLargeEmailHandling(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test handling large email datasets
      const largeEmailCount = 1000;
      const emails = await db.query.emails.findMany({
        limit: largeEmailCount,
        columns: { id: true, subject: true, body: true },
      });

      const duration = this.getDuration();

      if (duration > 3000) {
        issues.push(
          `Slow email retrieval: ${duration}ms for ${largeEmailCount} emails`
        );
        recommendations.push('Add email pagination and lazy loading');
      }

      return {
        testName: 'Large Email Handling',
        status: duration < 3000 ? 'passed' : 'warning',
        duration,
        metrics: {
          responseTime: duration,
          throughput: emails.length / (duration / 1000),
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'Large Email Handling',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`Large email handling test failed: ${error}`],
        recommendations: ['Fix email data handling performance'],
      };
    }
  }

  private async testEmailListRendering(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Simulate email list rendering performance
      const emailCount = 500;
      const startTime = performance.now();

      // Simulate rendering operations
      for (let i = 0; i < emailCount; i++) {
        // Simulate DOM operations
        const element = document.createElement('div');
        element.textContent = `Email ${i}`;
        element.style.display = 'none'; // Hide to avoid visual impact
        document.body.appendChild(element);
        document.body.removeChild(element);
      }

      const duration = this.getDuration();

      if (duration > 1000) {
        issues.push(
          `Slow email list rendering: ${duration}ms for ${emailCount} emails`
        );
        recommendations.push('Implement virtual scrolling and lazy loading');
      }

      return {
        testName: 'Email List Rendering',
        status: duration < 1000 ? 'passed' : 'warning',
        duration,
        metrics: {
          responseTime: duration,
          throughput: emailCount / (duration / 1000),
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'Email List Rendering',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`Email list rendering test failed: ${error}`],
        recommendations: ['Fix email list performance'],
      };
    }
  }

  private async testConcurrentUsers(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Simulate concurrent user sessions
      const concurrentSessions = 50;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentSessions; i++) {
        promises.push(this.supabase.auth.getUser());
      }

      const results = await Promise.allSettled(promises);
      const duration = this.getDuration();

      const successCount = results.filter(
        (r) => r.status === 'fulfilled'
      ).length;
      const successRate = successCount / results.length;

      if (successRate < 0.95) {
        issues.push(
          `Concurrent user session issues: ${(1 - successRate) * 100}% failure rate`
        );
        recommendations.push(
          'Implement session management and connection pooling'
        );
      }

      return {
        testName: 'Concurrent Users',
        status: successRate >= 0.95 ? 'passed' : 'warning',
        duration,
        metrics: {
          requestsPerSecond: concurrentSessions / (duration / 1000),
          errorRate: (1 - successRate) * 100,
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'Concurrent Users',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`Concurrent users test failed: ${error}`],
        recommendations: ['Fix concurrent user handling'],
      };
    }
  }

  private async testAIServiceLoad(): Promise<StressTestResult> {
    this.startTimer();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test AI service load
      const aiRequests = 10;
      const promises: Promise<Response>[] = [];

      for (let i = 0; i < aiRequests; i++) {
        promises.push(
          fetch('/api/ai/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailId: `test-${i}`,
              content: `Test email content ${i} for AI processing`,
            }),
          }).catch(() => ({ status: 404 }) as Response) // Handle missing endpoint
        );
      }

      const results = await Promise.allSettled(promises);
      const duration = this.getDuration();

      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && (r.value as any).status !== 404
      ).length;

      const successRate = successCount / results.length;

      if (successRate < 0.8) {
        issues.push(
          `AI service reliability issues: ${(1 - successRate) * 100}% failure rate`
        );
        recommendations.push('Implement AI service caching and rate limiting');
      }

      if (duration > 10000) {
        issues.push(
          `Slow AI service response: ${duration}ms for ${aiRequests} requests`
        );
        recommendations.push(
          'Optimize AI service performance and add async processing'
        );
      }

      return {
        testName: 'AI Service Load',
        status: successRate >= 0.8 && duration < 10000 ? 'passed' : 'warning',
        duration,
        metrics: {
          requestsPerSecond: aiRequests / (duration / 1000),
          errorRate: (1 - successRate) * 100,
          responseTime: duration / aiRequests,
        },
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        testName: 'AI Service Load',
        status: 'failed',
        duration: this.getDuration(),
        metrics: {},
        issues: [`AI service stress test failed: ${error}`],
        recommendations: ['Fix AI service performance'],
      };
    }
  }

  private startTimer(): void {
    this.startTime = performance.now();
  }

  private getDuration(): number {
    return performance.now() - this.startTime;
  }
}

export const stressTester = new StressTester();
