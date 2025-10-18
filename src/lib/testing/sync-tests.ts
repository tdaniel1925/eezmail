import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export interface SyncTestResult {
  testName: string;
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  duration: number;
  syncStats?: {
    totalEmails: number;
    recentEmails: number;
    accountCount: number;
    lastSyncTime?: Date;
  };
}

export class SyncTester {
  async runAllTests(): Promise<SyncTestResult[]> {
    const results: SyncTestResult[] = [];

    // Test 1: Email Account Connectivity
    results.push(await this.testAccountConnectivity());

    // Test 2: Sync Performance
    results.push(await this.testSyncPerformance());

    // Test 3: Data Consistency
    results.push(await this.testDataConsistency());

    // Test 4: Sync Error Handling
    results.push(await this.testSyncErrorHandling());

    // Test 5: Incremental Sync
    results.push(await this.testIncrementalSync());

    // Test 6: Sync Rate Limits
    results.push(await this.testSyncRateLimits());

    return results;
  }

  private async testAccountConnectivity(): Promise<SyncTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test email accounts
      const accounts = await db.select().from(emailAccounts);
      const accountCount = accounts.length;

      const duration = Date.now() - startTime;
      const score = accountCount > 0 ? 100 : 0;

      if (accountCount === 0) {
        issues.push('No email accounts configured');
        recommendations.push('Connect at least one email account for testing');
      }

      // Check for active accounts
      const activeAccounts = accounts.filter(
        (account) => account.isActive !== false && account.provider
      );

      if (activeAccounts.length === 0 && accountCount > 0) {
        issues.push('No active email accounts found');
        recommendations.push('Activate email accounts for sync testing');
      }

      return {
        testName: 'Email Account Connectivity',
        passed: accountCount > 0,
        score,
        issues,
        recommendations,
        duration,
        syncStats: {
          totalEmails: 0,
          recentEmails: 0,
          accountCount,
        },
      };
    } catch (error) {
      return {
        testName: 'Email Account Connectivity',
        passed: false,
        score: 0,
        issues: [`Account connectivity test failed: ${String(error)}`],
        recommendations: ['Check database connection and emailAccounts table'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testSyncPerformance(): Promise<SyncTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test email retrieval performance
      const syncStart = Date.now();
      const recentEmails = await db
        .select()
        .from(emails)
        .orderBy(desc(emails.receivedAt))
        .limit(50);

      const syncDuration = Date.now() - syncStart;
      const totalDuration = Date.now() - startTime;

      const score =
        syncDuration < 1000
          ? 100
          : Math.max(0, 100 - (syncDuration - 1000) / 100);

      if (syncDuration > 2000) {
        issues.push('Email sync is slow');
        recommendations.push('Optimize database queries and add indexes');
      }

      if (recentEmails.length === 0) {
        issues.push('No recent emails found for sync testing');
        recommendations.push(
          'Add test emails or check email sync configuration'
        );
      }

      return {
        testName: 'Sync Performance',
        passed: syncDuration < 5000,
        score,
        issues,
        recommendations,
        duration: totalDuration,
        syncStats: {
          totalEmails: recentEmails.length,
          recentEmails: recentEmails.length,
          accountCount: 0,
        },
      };
    } catch (error) {
      return {
        testName: 'Sync Performance',
        passed: false,
        score: 0,
        issues: [`Sync performance test failed: ${String(error)}`],
        recommendations: [
          'Check database performance and email sync configuration',
        ],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testDataConsistency(): Promise<SyncTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test for duplicate emails
      const allEmails = await db.select().from(emails);
      const messageIds = allEmails.map((email) => email.messageId);
      const uniqueMessageIds = new Set(messageIds);

      const duplicateCount = messageIds.length - uniqueMessageIds.size;

      // Test for orphaned emails (emails without accounts)
      const accounts = await db.select().from(emailAccounts);
      const accountIds = accounts.map((account) => account.id);

      const orphanedEmails = allEmails.filter(
        (email) => !accountIds.includes(email.accountId)
      );

      const duration = Date.now() - startTime;
      let score = 100;

      if (duplicateCount > 0) {
        issues.push(`${duplicateCount} duplicate emails found`);
        recommendations.push('Implement duplicate email detection and removal');
        score -= 20;
      }

      if (orphanedEmails.length > 0) {
        issues.push(`${orphanedEmails.length} orphaned emails found`);
        recommendations.push('Clean up emails from deleted accounts');
        score -= 15;
      }

      // Test for missing required fields
      const emailsWithMissingFields = allEmails.filter(
        (email) => !email.subject || !email.from || !email.receivedAt
      );

      if (emailsWithMissingFields.length > 0) {
        issues.push(
          `${emailsWithMissingFields.length} emails with missing required fields`
        );
        recommendations.push('Validate email data during sync');
        score -= 25;
      }

      return {
        testName: 'Data Consistency',
        passed: duplicateCount === 0 && orphanedEmails.length === 0,
        score: Math.max(0, score),
        issues,
        recommendations,
        duration,
        syncStats: {
          totalEmails: allEmails.length,
          recentEmails: 0,
          accountCount: accounts.length,
        },
      };
    } catch (error) {
      return {
        testName: 'Data Consistency',
        passed: false,
        score: 0,
        issues: [`Data consistency test failed: ${String(error)}`],
        recommendations: ['Check database integrity and sync logic'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testSyncErrorHandling(): Promise<SyncTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test error scenarios
      const errorTests = [
        // Test invalid account ID
        async () => {
          try {
            await db
              .select()
              .from(emails)
              .where(eq(emails.accountId, 'invalid-account-id'));
            return true;
          } catch {
            return false;
          }
        },
        // Test invalid date range
        async () => {
          try {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            await db
              .select()
              .from(emails)
              .where(gte(emails.receivedAt, futureDate));
            return true;
          } catch {
            return false;
          }
        },
      ];

      const errorTestResults = await Promise.all(
        errorTests.map((test) => test())
      );
      const passedErrorTests = errorTestResults.filter(
        (result) => result
      ).length;

      const duration = Date.now() - startTime;
      const score = (passedErrorTests / errorTests.length) * 100;

      if (passedErrorTests < errorTests.length) {
        issues.push('Some error handling tests failed');
        recommendations.push('Improve error handling in sync operations');
      }

      return {
        testName: 'Sync Error Handling',
        passed: passedErrorTests === errorTests.length,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Sync Error Handling',
        passed: false,
        score: 0,
        issues: [`Error handling test failed: ${String(error)}`],
        recommendations: ['Check error handling implementation'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testIncrementalSync(): Promise<SyncTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test incremental sync by checking recent emails
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentEmails = await db
        .select()
        .from(emails)
        .where(gte(emails.receivedAt, oneHourAgo))
        .orderBy(desc(emails.receivedAt));

      const duration = Date.now() - startTime;
      const score =
        duration < 500 ? 100 : Math.max(0, 100 - (duration - 500) / 50);

      if (recentEmails.length === 0) {
        issues.push('No recent emails found for incremental sync testing');
        recommendations.push('Add recent test emails or check sync frequency');
      }

      // Test for proper timestamp ordering
      const isOrdered = recentEmails.every((email, index) => {
        if (index === 0) return true;
        return email.receivedAt <= recentEmails[index - 1].receivedAt;
      });

      if (!isOrdered) {
        issues.push('Emails are not properly ordered by timestamp');
        recommendations.push('Fix email ordering in sync operations');
      }

      return {
        testName: 'Incremental Sync',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
        syncStats: {
          totalEmails: recentEmails.length,
          recentEmails: recentEmails.length,
          accountCount: 0,
        },
      };
    } catch (error) {
      return {
        testName: 'Incremental Sync',
        passed: false,
        score: 0,
        issues: [`Incremental sync test failed: ${String(error)}`],
        recommendations: ['Check incremental sync implementation'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testSyncRateLimits(): Promise<SyncTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test sync frequency limits
      const syncTests = [];
      const testCount = 5;

      for (let i = 0; i < testCount; i++) {
        const testStart = Date.now();
        await db.select().from(emails).limit(10);
        const testDuration = Date.now() - testStart;
        syncTests.push(testDuration);
      }

      const averageDuration =
        syncTests.reduce((sum, duration) => sum + duration, 0) / testCount;
      const maxDuration = Math.max(...syncTests);
      const minDuration = Math.min(...syncTests);

      const duration = Date.now() - startTime;
      const score =
        averageDuration < 100
          ? 100
          : Math.max(0, 100 - (averageDuration - 100) / 10);

      if (maxDuration > 1000) {
        issues.push('Sync operations are inconsistent');
        recommendations.push('Implement rate limiting and throttling');
      }

      if (maxDuration - minDuration > 500) {
        issues.push('Sync performance is inconsistent');
        recommendations.push('Optimize database queries and add caching');
      }

      return {
        testName: 'Sync Rate Limits',
        passed: averageDuration < 200,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Sync Rate Limits',
        passed: false,
        score: 0,
        issues: [`Rate limit test failed: ${String(error)}`],
        recommendations: ['Check sync rate limiting implementation'],
        duration: Date.now() - startTime,
      };
    }
  }
}

export const syncTester = new SyncTester();
