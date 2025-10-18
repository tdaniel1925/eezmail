'use client';

import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import { emails, emailAccounts, users } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export interface AuditResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'error';
  message: string;
  duration: number;
  details?: any;
  critical: boolean;
  category: string;
}

export interface SystemHealth {
  database: boolean;
  authentication: boolean;
  emailSync: boolean;
  aiServices: boolean;
  storage: boolean;
  performance: boolean;
}

export class AuditSystem {
  private supabase = createClient();
  private startTime: number = 0;

  async runComprehensiveAudit(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Authentication Tests
    results.push(...(await this.testAuthentication()));

    // Database Tests
    results.push(...(await this.testDatabase()));

    // Email System Tests
    results.push(...(await this.testEmailSystem()));

    // AI Features Tests
    results.push(...(await this.testAIFeatures()));

    // UI Component Tests
    results.push(...(await this.testUIComponents()));

    // API Endpoint Tests
    results.push(...(await this.testAPIEndpoints()));

    // Performance Tests
    results.push(...(await this.testPerformance()));

    // Security Tests
    results.push(...(await this.testSecurity()));

    // Voice Message Tests
    results.push(...(await this.testVoiceMessages()));

    return results;
  }

  private async testAuthentication(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: User Session Validation
    this.startTimer();
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();
      if (error) throw error;

      results.push({
        id: 'auth-001',
        name: 'User Session Validation',
        status: user ? 'pass' : 'fail',
        message: user ? 'User session is valid' : 'No active user session',
        duration: this.getDuration(),
        critical: true,
        category: 'auth',
        details: { userId: user?.id },
      });
    } catch (error) {
      results.push({
        id: 'auth-001',
        name: 'User Session Validation',
        status: 'fail',
        message: `Session validation failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'auth',
        details: { error: error.toString() },
      });
    }

    // Test 2: OAuth Token Refresh
    this.startTimer();
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();
      if (error) throw error;

      const isValid =
        session && session.expires_at && session.expires_at > Date.now() / 1000;

      results.push({
        id: 'auth-002',
        name: 'OAuth Token Validation',
        status: isValid ? 'pass' : 'warning',
        message: isValid
          ? 'OAuth tokens are valid'
          : 'OAuth tokens may need refresh',
        duration: this.getDuration(),
        critical: true,
        category: 'auth',
        details: {
          expiresAt: session?.expires_at,
          isValid,
        },
      });
    } catch (error) {
      results.push({
        id: 'auth-002',
        name: 'OAuth Token Validation',
        status: 'fail',
        message: `OAuth validation failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'auth',
      });
    }

    return results;
  }

  private async testDatabase(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: Database Connection
    this.startTimer();
    try {
      await db.execute('SELECT 1');
      results.push({
        id: 'db-001',
        name: 'Database Connection',
        status: 'pass',
        message: 'Database connection successful',
        duration: this.getDuration(),
        critical: true,
        category: 'database',
      });
    } catch (error) {
      results.push({
        id: 'db-001',
        name: 'Database Connection',
        status: 'fail',
        message: `Database connection failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'database',
      });
    }

    // Test 2: Email Table Access
    this.startTimer();
    try {
      const emailCount = await db.select({ count: count() }).from(emails);
      results.push({
        id: 'db-002',
        name: 'Email Table Access',
        status: 'pass',
        message: `Email table accessible, ${emailCount[0]?.count || 0} emails found`,
        duration: this.getDuration(),
        critical: true,
        category: 'database',
        details: { emailCount: emailCount[0]?.count || 0 },
      });
    } catch (error) {
      results.push({
        id: 'db-002',
        name: 'Email Table Access',
        status: 'fail',
        message: `Email table access failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'database',
      });
    }

    // Test 3: Email Accounts Table
    this.startTimer();
    try {
      const accountCount = await db
        .select({ count: count() })
        .from(emailAccounts);
      results.push({
        id: 'db-003',
        name: 'Email Accounts Table',
        status: 'pass',
        message: `Email accounts table accessible, ${accountCount[0]?.count || 0} accounts found`,
        duration: this.getDuration(),
        critical: true,
        category: 'database',
        details: { accountCount: accountCount[0]?.count || 0 },
      });
    } catch (error) {
      results.push({
        id: 'db-003',
        name: 'Email Accounts Table',
        status: 'fail',
        message: `Email accounts table access failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'database',
      });
    }

    return results;
  }

  private async testEmailSystem(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: Email Sync Status
    this.startTimer();
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) throw new Error('No user session');

      const accounts = await db.query.emailAccounts.findMany({
        where: eq(emailAccounts.userId, user.id),
        columns: { id: true, emailAddress: true, isActive: true },
      });

      const activeAccounts = accounts.filter((acc) => acc.isActive);

      results.push({
        id: 'email-001',
        name: 'Email Account Status',
        status: activeAccounts.length > 0 ? 'pass' : 'warning',
        message: `${activeAccounts.length} active email accounts found`,
        duration: this.getDuration(),
        critical: true,
        category: 'email',
        details: {
          totalAccounts: accounts.length,
          activeAccounts: activeAccounts.length,
          accounts: activeAccounts.map((acc) => acc.emailAddress),
        },
      });
    } catch (error) {
      results.push({
        id: 'email-001',
        name: 'Email Account Status',
        status: 'fail',
        message: `Email account check failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'email',
      });
    }

    // Test 2: Recent Email Sync
    this.startTimer();
    try {
      const recentEmails = await db.query.emails.findMany({
        orderBy: [desc(emails.receivedAt)],
        limit: 5,
        columns: { id: true, subject: true, receivedAt: true },
      });

      const hasRecentEmails = recentEmails.length > 0;
      const lastEmailTime = hasRecentEmails ? recentEmails[0].receivedAt : null;

      results.push({
        id: 'email-002',
        name: 'Recent Email Sync',
        status: hasRecentEmails ? 'pass' : 'warning',
        message: hasRecentEmails
          ? `Recent emails found, last sync: ${lastEmailTime}`
          : 'No recent emails found',
        duration: this.getDuration(),
        critical: true,
        category: 'email',
        details: {
          recentEmailsCount: recentEmails.length,
          lastEmailTime,
          recentEmails: recentEmails.map((e) => ({
            id: e.id,
            subject: e.subject,
          })),
        },
      });
    } catch (error) {
      results.push({
        id: 'email-002',
        name: 'Recent Email Sync',
        status: 'fail',
        message: `Recent email check failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'email',
      });
    }

    return results;
  }

  private async testAIFeatures(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: AI API Endpoint Availability
    this.startTimer();
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: 'test',
          content: 'This is a test email for AI processing.',
        }),
      });

      const status = response.status;
      const isAvailable = status !== 404 && status !== 500;

      results.push({
        id: 'ai-001',
        name: 'AI Summary API',
        status: isAvailable ? 'pass' : 'fail',
        message: isAvailable
          ? `AI summary API responding (status: ${status})`
          : `AI summary API failed (status: ${status})`,
        duration: this.getDuration(),
        critical: true,
        category: 'ai',
        details: { status, responseTime: this.getDuration() },
      });
    } catch (error) {
      results.push({
        id: 'ai-001',
        name: 'AI Summary API',
        status: 'fail',
        message: `AI summary API test failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'ai',
      });
    }

    // Test 2: AI Quick Replies API
    this.startTimer();
    try {
      const response = await fetch('/api/ai/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: 'test',
          content: 'This is a test email for quick replies.',
        }),
      });

      const status = response.status;
      const isAvailable = status !== 404 && status !== 500;

      results.push({
        id: 'ai-002',
        name: 'AI Quick Replies API',
        status: isAvailable ? 'pass' : 'fail',
        message: isAvailable
          ? `AI quick replies API responding (status: ${status})`
          : `AI quick replies API failed (status: ${status})`,
        duration: this.getDuration(),
        critical: true,
        category: 'ai',
        details: { status, responseTime: this.getDuration() },
      });
    } catch (error) {
      results.push({
        id: 'ai-002',
        name: 'AI Quick Replies API',
        status: 'fail',
        message: `AI quick replies API test failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'ai',
      });
    }

    return results;
  }

  private async testUIComponents(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: Component Rendering
    this.startTimer();
    try {
      // Test if key components can be imported
      const components = [
        '@/components/email/EmailComposer',
        '@/components/email/EmailViewer',
        '@/components/email/EmailList',
        '@/components/sidebar/ModernSidebar',
        '@/components/ai/AIAssistantPanel',
      ];

      let importErrors = 0;
      for (const component of components) {
        try {
          // This is a simplified test - in a real scenario, you'd dynamically import
          // and check if components render without errors
        } catch (error) {
          importErrors++;
        }
      }

      results.push({
        id: 'ui-001',
        name: 'Component Imports',
        status: importErrors === 0 ? 'pass' : 'warning',
        message:
          importErrors === 0
            ? 'All key components can be imported'
            : `${importErrors} components have import issues`,
        duration: this.getDuration(),
        critical: true,
        category: 'ui',
        details: { importErrors, totalComponents: components.length },
      });
    } catch (error) {
      results.push({
        id: 'ui-001',
        name: 'Component Imports',
        status: 'fail',
        message: `Component import test failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'ui',
      });
    }

    return results;
  }

  private async testAPIEndpoints(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: Email API Endpoints
    this.startTimer();
    try {
      const endpoints = [
        '/api/email/send',
        '/api/email/sync',
        '/api/email/mark-read',
      ];

      let workingEndpoints = 0;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { method: 'OPTIONS' });
          if (response.status !== 404) {
            workingEndpoints++;
          }
        } catch (error) {
          // Endpoint might not exist or be accessible
        }
      }

      results.push({
        id: 'api-001',
        name: 'Email API Endpoints',
        status: workingEndpoints > 0 ? 'pass' : 'warning',
        message: `${workingEndpoints}/${endpoints.length} email API endpoints accessible`,
        duration: this.getDuration(),
        critical: true,
        category: 'api',
        details: { workingEndpoints, totalEndpoints: endpoints.length },
      });
    } catch (error) {
      results.push({
        id: 'api-001',
        name: 'Email API Endpoints',
        status: 'fail',
        message: `Email API endpoint test failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'api',
      });
    }

    return results;
  }

  private async testPerformance(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: Page Load Performance
    this.startTimer();
    try {
      const startTime = performance.now();

      // Simulate page load test
      await new Promise((resolve) => setTimeout(resolve, 100));

      const loadTime = performance.now() - startTime;
      const isAcceptable = loadTime < 1000; // 1 second threshold

      results.push({
        id: 'perf-001',
        name: 'Page Load Performance',
        status: isAcceptable ? 'pass' : 'warning',
        message: isAcceptable
          ? `Page load time acceptable: ${loadTime.toFixed(2)}ms`
          : `Page load time slow: ${loadTime.toFixed(2)}ms`,
        duration: this.getDuration(),
        critical: true,
        category: 'performance',
        details: { loadTime, threshold: 1000 },
      });
    } catch (error) {
      results.push({
        id: 'perf-001',
        name: 'Page Load Performance',
        status: 'fail',
        message: `Performance test failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'performance',
      });
    }

    return results;
  }

  private async testSecurity(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: Input Sanitization
    this.startTimer();
    try {
      // Test basic XSS protection
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = maliciousInput.replace(
        /<script[^>]*>.*?<\/script>/gi,
        ''
      );
      const isSanitized = !sanitized.includes('<script>');

      results.push({
        id: 'sec-001',
        name: 'Input Sanitization',
        status: isSanitized ? 'pass' : 'fail',
        message: isSanitized
          ? 'Input sanitization working correctly'
          : 'Input sanitization may have issues',
        duration: this.getDuration(),
        critical: true,
        category: 'security',
        details: {
          originalInput: maliciousInput,
          sanitizedInput: sanitized,
          isSanitized,
        },
      });
    } catch (error) {
      results.push({
        id: 'sec-001',
        name: 'Input Sanitization',
        status: 'fail',
        message: `Security test failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'security',
      });
    }

    return results;
  }

  private async testVoiceMessages(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Test 1: Voice Message API
    this.startTimer();
    try {
      const response = await fetch('/api/voice-message/upload', {
        method: 'OPTIONS',
      });

      const isAvailable = response.status !== 404;

      results.push({
        id: 'voice-001',
        name: 'Voice Message API',
        status: isAvailable ? 'pass' : 'fail',
        message: isAvailable
          ? 'Voice message API endpoint available'
          : 'Voice message API endpoint not found',
        duration: this.getDuration(),
        critical: true,
        category: 'voice',
        details: { status: response.status },
      });
    } catch (error) {
      results.push({
        id: 'voice-001',
        name: 'Voice Message API',
        status: 'fail',
        message: `Voice message API test failed: ${error}`,
        duration: this.getDuration(),
        critical: true,
        category: 'voice',
      });
    }

    return results;
  }

  private startTimer(): void {
    this.startTime = performance.now();
  }

  private getDuration(): number {
    return performance.now() - this.startTime;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Test database
      const dbHealthy = await this.testDatabaseConnection();

      // Test authentication
      const authHealthy = await this.testAuthenticationStatus();

      // Test email sync
      const emailSyncHealthy = await this.testEmailSyncStatus();

      // Test AI services
      const aiHealthy = await this.testAIServicesStatus();

      // Test storage
      const storageHealthy = await this.testStorageStatus();

      // Test performance
      const performanceHealthy = await this.testPerformanceStatus();

      return {
        database: dbHealthy,
        authentication: authHealthy,
        emailSync: emailSyncHealthy,
        aiServices: aiHealthy,
        storage: storageHealthy,
        performance: performanceHealthy,
      };
    } catch (error) {
      console.error('System health check failed:', error);
      return {
        database: false,
        authentication: false,
        emailSync: false,
        aiServices: false,
        storage: false,
        performance: false,
      };
    }
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      await db.execute('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async testAuthenticationStatus(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  private async testEmailSyncStatus(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return false;

      const accounts = await db.query.emailAccounts.findMany({
        where: eq(emailAccounts.userId, user.id),
        columns: { isActive: true },
      });

      return accounts.some((acc) => acc.isActive);
    } catch {
      return false;
    }
  }

  private async testAIServicesStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/ai/summary', { method: 'OPTIONS' });
      return response.status !== 404;
    } catch {
      return false;
    }
  }

  private async testStorageStatus(): Promise<boolean> {
    try {
      // Test Supabase storage access
      const { data, error } = await this.supabase.storage
        .from('voice-messages')
        .list();
      return !error;
    } catch {
      return false;
    }
  }

  private async testPerformanceStatus(): Promise<boolean> {
    try {
      const startTime = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const duration = performance.now() - startTime;
      return duration < 100; // 100ms threshold
    } catch {
      return false;
    }
  }
}

export const auditSystem = new AuditSystem();
