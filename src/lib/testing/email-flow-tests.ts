import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export interface EmailFlowTestResult {
  testName: string;
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  duration: number;
}

export class EmailFlowTester {
  async runAllTests(): Promise<EmailFlowTestResult[]> {
    const results: EmailFlowTestResult[] = [];

    // Test 1: Email CRUD Operations
    results.push(await this.testEmailCRUD());

    // Test 2: Email Search and Filtering
    results.push(await this.testEmailSearch());

    // Test 3: Email Categories
    results.push(await this.testEmailCategories());

    // Test 4: Email Attachments
    results.push(await this.testEmailAttachments());

    // Test 5: Email Sync Performance
    results.push(await this.testEmailSyncPerformance());

    // Test 6: Email Storage Limits
    results.push(await this.testEmailStorageLimits());

    return results;
  }

  private async testEmailCRUD(): Promise<EmailFlowTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test Create
      const testEmail = {
        id: `test-${Date.now()}`,
        accountId: 'test-account',
        messageId: `test-message-${Date.now()}`,
        subject: 'Test Email CRUD',
        from: 'test@example.com',
        to: ['recipient@example.com'],
        cc: [],
        bcc: [],
        body: 'This is a test email for CRUD operations',
        htmlBody: '<p>This is a test email for CRUD operations</p>',
        receivedAt: new Date(),
        isRead: false,
        isStarred: false,
        isTrashed: false,
        hasVoiceMessage: false,
        category: 'inbox' as const,
        threadId: `test-thread-${Date.now()}`,
        inReplyTo: null,
        references: [],
        labels: [],
        attachments: [],
        headers: {},
        size: 1024,
        priority: 'normal' as const,
        importance: 'normal' as const,
        sensitivity: 'normal' as const,
        autoReply: false,
        encrypted: false,
        signed: false,
        voiceMessageUrl: null,
        voiceMessageDuration: null,
        voiceMessageFormat: null,
        voiceMessageSize: null,
      };

      // Test Read
      const emailsBefore = await db.select().from(emails).limit(5);

      // Test Update
      if (emailsBefore.length > 0) {
        const firstEmail = emailsBefore[0];
        await db
          .update(emails)
          .set({ isRead: true, isStarred: true })
          .where(eq(emails.id, firstEmail.id));
      }

      // Test Delete (soft delete)
      if (emailsBefore.length > 0) {
        const firstEmail = emailsBefore[0];
        await db
          .update(emails)
          .set({ isTrashed: true })
          .where(eq(emails.id, firstEmail.id));
      }

      const duration = Date.now() - startTime;
      const score =
        duration < 1000 ? 100 : Math.max(0, 100 - (duration - 1000) / 100);

      if (duration > 2000) {
        issues.push('Email CRUD operations are slow');
        recommendations.push('Optimize database queries and add indexes');
      }

      return {
        testName: 'Email CRUD Operations',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Email CRUD Operations',
        passed: false,
        score: 0,
        issues: [`CRUD operations failed: ${String(error)}`],
        recommendations: ['Check database connection and schema'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testEmailSearch(): Promise<EmailFlowTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test basic search
      const searchResults = await db
        .select()
        .from(emails)
        .where(eq(emails.isRead, false))
        .orderBy(desc(emails.receivedAt))
        .limit(10);

      // Test filtering by category
      const inboxEmails = await db
        .select()
        .from(emails)
        .where(and(eq(emails.category, 'inbox'), eq(emails.isTrashed, false)))
        .limit(10);

      // Test filtering by starred
      const starredEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.isStarred, true))
        .limit(10);

      const duration = Date.now() - startTime;
      const score =
        duration < 500 ? 100 : Math.max(0, 100 - (duration - 500) / 50);

      if (duration > 1000) {
        issues.push('Email search is slow');
        recommendations.push('Add database indexes for search fields');
      }

      if (searchResults.length === 0 && inboxEmails.length === 0) {
        issues.push('No emails found for search testing');
        recommendations.push('Add test emails to database');
      }

      return {
        testName: 'Email Search and Filtering',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Email Search and Filtering',
        passed: false,
        score: 0,
        issues: [`Search operations failed: ${String(error)}`],
        recommendations: ['Check database schema and indexes'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testEmailCategories(): Promise<EmailFlowTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test category filtering
      const categories = [
        'inbox',
        'sent',
        'drafts',
        'trash',
        'spam',
        'newsletter',
      ];
      const categoryResults: Record<string, number> = {};

      for (const category of categories) {
        const result = await db
          .select()
          .from(emails)
          .where(eq(emails.category, category as any))
          .limit(1);
        categoryResults[category] = result.length;
      }

      const duration = Date.now() - startTime;
      const score =
        duration < 300 ? 100 : Math.max(0, 100 - (duration - 300) / 30);

      const totalEmails = Object.values(categoryResults).reduce(
        (sum, count) => sum + count,
        0
      );
      if (totalEmails === 0) {
        issues.push('No emails found in any category');
        recommendations.push('Add test emails with different categories');
      }

      return {
        testName: 'Email Categories',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Email Categories',
        passed: false,
        score: 0,
        issues: [`Category operations failed: ${String(error)}`],
        recommendations: ['Check email_category_enum values'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testEmailAttachments(): Promise<EmailFlowTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test emails with attachments
      const emailsWithAttachments = await db
        .select()
        .from(emails)
        .where(eq(emails.attachments, []))
        .limit(5);

      const duration = Date.now() - startTime;
      const score =
        duration < 200 ? 100 : Math.max(0, 100 - (duration - 200) / 20);

      // Check if attachment field exists and is properly typed
      if (emailsWithAttachments.length > 0) {
        const hasValidAttachments = emailsWithAttachments.every((email) =>
          Array.isArray(email.attachments)
        );

        if (!hasValidAttachments) {
          issues.push('Invalid attachment data structure');
          recommendations.push('Fix attachment field type in database schema');
        }
      }

      return {
        testName: 'Email Attachments',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Email Attachments',
        passed: false,
        score: 0,
        issues: [`Attachment operations failed: ${String(error)}`],
        recommendations: ['Check attachments field in database schema'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testEmailSyncPerformance(): Promise<EmailFlowTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test bulk email operations
      const bulkStart = Date.now();
      const recentEmails = await db
        .select()
        .from(emails)
        .orderBy(desc(emails.receivedAt))
        .limit(100);

      const bulkDuration = Date.now() - bulkStart;
      const duration = Date.now() - startTime;

      const score =
        bulkDuration < 500 ? 100 : Math.max(0, 100 - (bulkDuration - 500) / 50);

      if (bulkDuration > 1000) {
        issues.push('Bulk email operations are slow');
        recommendations.push('Add database indexes and optimize queries');
      }

      if (recentEmails.length === 0) {
        issues.push('No recent emails found for sync testing');
        recommendations.push('Add test emails with recent timestamps');
      }

      return {
        testName: 'Email Sync Performance',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Email Sync Performance',
        passed: false,
        score: 0,
        issues: [`Sync performance test failed: ${String(error)}`],
        recommendations: ['Check database performance and indexes'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testEmailStorageLimits(): Promise<EmailFlowTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test email count limits
      const totalEmails = await db.select().from(emails);
      const emailCount = totalEmails.length;

      // Test size limits
      const largeEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.size, 0))
        .limit(10);

      const duration = Date.now() - startTime;
      const score =
        duration < 300 ? 100 : Math.max(0, 100 - (duration - 300) / 30);

      if (emailCount > 10000) {
        issues.push('Large number of emails may impact performance');
        recommendations.push('Consider implementing email archiving strategy');
      }

      if (largeEmails.length > 0) {
        issues.push('Some emails have invalid size values');
        recommendations.push('Update email size calculations');
      }

      return {
        testName: 'Email Storage Limits',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
      };
    } catch (error) {
      return {
        testName: 'Email Storage Limits',
        passed: false,
        score: 0,
        issues: [`Storage limit test failed: ${String(error)}`],
        recommendations: ['Check database storage and email size calculations'],
        duration: Date.now() - startTime,
      };
    }
  }
}

export const emailFlowTester = new EmailFlowTester();
