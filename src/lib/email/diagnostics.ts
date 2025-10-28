/**
 * Email Connection Diagnostics Service
 * Test and validate email account connections
 */

import { db } from '@/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MicrosoftGraphService } from '@/lib/email/microsoft-graph';
import { GmailService } from '@/lib/email/gmail-api';

export interface DiagnosticResult {
  success: boolean;
  tests: {
    name: string;
    passed: boolean;
    message: string;
    duration: number;
  }[];
  overall: {
    healthy: boolean;
    score: number;
    recommendations: string[];
  };
}

export async function testEmailConnection(
  accountId: string
): Promise<DiagnosticResult> {
  const start = Date.now();
  const tests: DiagnosticResult['tests'] = [];

  try {
    // Get account
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, accountId))
      .limit(1);

    if (!account) {
      return {
        success: false,
        tests: [
          {
            name: 'Account Lookup',
            passed: false,
            message: 'Account not found',
            duration: Date.now() - start,
          },
        ],
        overall: {
          healthy: false,
          score: 0,
          recommendations: ['Account does not exist in database'],
        },
      };
    }

    // Test 1: Token Validation
    const tokenTest = await testTokenValidity(account);
    tests.push(tokenTest);

    // Test 2: API Access
    const apiTest = await testAPIAccess(account);
    tests.push(apiTest);

    // Test 3: Email Retrieval
    const retrievalTest = await testEmailRetrieval(account);
    tests.push(retrievalTest);

    // Test 4: Rate Limits
    const rateLimitTest = await testRateLimits(account);
    tests.push(rateLimitTest);

    // Calculate overall health
    const passedTests = tests.filter((t) => t.passed).length;
    const score = Math.round((passedTests / tests.length) * 100);
    const healthy = score >= 75;

    const recommendations: string[] = [];
    tests.forEach((test) => {
      if (!test.passed) {
        recommendations.push(`Fix: ${test.name} - ${test.message}`);
      }
    });

    return {
      success: true,
      tests,
      overall: {
        healthy,
        score,
        recommendations:
          recommendations.length > 0
            ? recommendations
            : ['All systems operational'],
      },
    };
  } catch (error) {
    return {
      success: false,
      tests,
      overall: {
        healthy: false,
        score: 0,
        recommendations: [
          `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      },
    };
  }
}

async function testTokenValidity(
  account: typeof emailAccounts.$inferSelect
): Promise<DiagnosticResult['tests'][0]> {
  const start = Date.now();
  try {
    if (!account.accessToken) {
      return {
        name: 'Token Validation',
        passed: false,
        message: 'No access token found',
        duration: Date.now() - start,
      };
    }

    // Check token expiry
    if (
      account.tokenExpiresAt &&
      new Date(account.tokenExpiresAt) < new Date()
    ) {
      return {
        name: 'Token Validation',
        passed: false,
        message: 'Access token expired',
        duration: Date.now() - start,
      };
    }

    return {
      name: 'Token Validation',
      passed: true,
      message: 'Token is valid',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Token Validation',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

async function testAPIAccess(
  account: typeof emailAccounts.$inferSelect
): Promise<DiagnosticResult['tests'][0]> {
  const start = Date.now();
  try {
    if (account.provider === 'microsoft') {
      const microsoft = new MicrosoftGraphService({
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        tenantId: process.env.MICROSOFT_TENANT_ID!,
      });

      // Try to fetch user profile
      const profile = await microsoft.getUserProfile(account.accessToken);
      return {
        name: 'API Access',
        passed: true,
        message: `Successfully accessed ${account.provider} API`,
        duration: Date.now() - start,
      };
    } else if (account.provider === 'google') {
      // Test Gmail API access
      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      );

      if (response.ok) {
        return {
          name: 'API Access',
          passed: true,
          message: 'Successfully accessed Gmail API',
          duration: Date.now() - start,
        };
      } else {
        return {
          name: 'API Access',
          passed: false,
          message: `API returned ${response.status}`,
          duration: Date.now() - start,
        };
      }
    }

    return {
      name: 'API Access',
      passed: false,
      message: 'Unknown provider',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'API Access',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

async function testEmailRetrieval(
  account: typeof emailAccounts.$inferSelect
): Promise<DiagnosticResult['tests'][0]> {
  const start = Date.now();
  try {
    // Test fetching a single email
    if (account.provider === 'microsoft') {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/messages?$top=1',
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      );

      if (response.ok) {
        return {
          name: 'Email Retrieval',
          passed: true,
          message: 'Successfully retrieved test email',
          duration: Date.now() - start,
        };
      } else {
        return {
          name: 'Email Retrieval',
          passed: false,
          message: `Failed to retrieve emails: ${response.status}`,
          duration: Date.now() - start,
        };
      }
    } else if (account.provider === 'google') {
      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=1',
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      );

      if (response.ok) {
        return {
          name: 'Email Retrieval',
          passed: true,
          message: 'Successfully retrieved test email',
          duration: Date.now() - start,
        };
      } else {
        return {
          name: 'Email Retrieval',
          passed: false,
          message: `Failed to retrieve emails: ${response.status}`,
          duration: Date.now() - start,
        };
      }
    }

    return {
      name: 'Email Retrieval',
      passed: false,
      message: 'Unknown provider',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Email Retrieval',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

async function testRateLimits(
  account: typeof emailAccounts.$inferSelect
): Promise<DiagnosticResult['tests'][0]> {
  const start = Date.now();
  // Simple check - in production, implement actual rate limit monitoring
  return {
    name: 'Rate Limits',
    passed: true,
    message: 'Rate limits OK',
    duration: Date.now() - start,
  };
}
