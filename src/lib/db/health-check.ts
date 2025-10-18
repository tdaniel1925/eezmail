'use client';

import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface DatabaseHealthReport {
  isHealthy: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  missingColumns: string[];
  missingIndexes: string[];
  enumIssues: string[];
}

export class DatabaseHealthChecker {
  private supabase = createClient();

  async runHealthCheck(): Promise<DatabaseHealthReport> {
    console.log('🔍 Running database health check...');

    const issues: string[] = [];
    const recommendations: string[] = [];
    const missingColumns: string[] = [];
    const missingIndexes: string[] = [];
    const enumIssues: string[] = [];

    try {
      // Check for missing columns
      const columnChecks = await this.checkMissingColumns();
      missingColumns.push(...columnChecks);

      // Check for missing indexes
      const indexChecks = await this.checkMissingIndexes();
      missingIndexes.push(...indexChecks);

      // Check enum values
      const enumChecks = await this.checkEnumValues();
      enumIssues.push(...enumChecks);

      // Check database connectivity
      const connectivityCheck = await this.checkConnectivity();
      if (!connectivityCheck) {
        issues.push('Database connection failed');
        recommendations.push(
          'Check database credentials and network connection'
        );
      }

      // Calculate health score
      const totalChecks = 4; // columns, indexes, enums, connectivity
      const passedChecks =
        totalChecks -
        (missingColumns.length > 0 ? 1 : 0) -
        (missingIndexes.length > 0 ? 1 : 0) -
        (enumIssues.length > 0 ? 1 : 0) -
        (connectivityCheck ? 0 : 1);

      const score = Math.round((passedChecks / totalChecks) * 100);
      const isHealthy = score >= 80;

      if (missingColumns.length > 0) {
        issues.push(`Missing ${missingColumns.length} database columns`);
        recommendations.push(
          'Run database migration: migrations/comprehensive_schema_fix.sql'
        );
      }

      if (missingIndexes.length > 0) {
        issues.push(`Missing ${missingIndexes.length} database indexes`);
        recommendations.push(
          'Run database migration to add performance indexes'
        );
      }

      if (enumIssues.length > 0) {
        issues.push(`Enum value issues: ${enumIssues.join(', ')}`);
        recommendations.push('Update enum types to include missing values');
      }

      console.log(`📊 Database health score: ${score}/100`);
      if (!isHealthy) {
        console.warn('⚠️ Database health issues detected:', issues);
      } else {
        console.log('✅ Database is healthy');
      }

      return {
        isHealthy,
        score,
        issues,
        recommendations,
        missingColumns,
        missingIndexes,
        enumIssues,
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        isHealthy: false,
        score: 0,
        issues: ['Health check failed', String(error)],
        recommendations: ['Check database connection and permissions'],
        missingColumns: [],
        missingIndexes: [],
        enumIssues: [],
      };
    }
  }

  private async checkMissingColumns(): Promise<string[]> {
    const missingColumns: string[] = [];

    try {
      // Check for critical columns in emails table
      const requiredColumns = [
        'is_read',
        'is_starred',
        'is_trashed',
        'voice_message_url',
        'voice_message_duration',
        'has_voice_message',
      ];

      for (const column of requiredColumns) {
        try {
          await db.execute(sql`SELECT ${sql.raw(column)} FROM emails LIMIT 1`);
        } catch (error) {
          if (String(error).includes('does not exist')) {
            missingColumns.push(`emails.${column}`);
          }
        }
      }

      // Check for user settings columns
      const userColumns = [
        'voice_settings',
        'ai_preferences',
        'notification_settings',
      ];
      for (const column of userColumns) {
        try {
          await db.execute(sql`SELECT ${sql.raw(column)} FROM users LIMIT 1`);
        } catch (error) {
          if (String(error).includes('does not exist')) {
            missingColumns.push(`users.${column}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking columns:', error);
    }

    return missingColumns;
  }

  private async checkMissingIndexes(): Promise<string[]> {
    const missingIndexes: string[] = [];

    try {
      // Check for critical indexes
      const requiredIndexes = [
        'idx_emails_is_read',
        'idx_emails_is_starred',
        'idx_emails_is_trashed',
        'idx_emails_has_voice_message',
      ];

      for (const indexName of requiredIndexes) {
        try {
          await db.execute(
            sql`SELECT 1 FROM pg_indexes WHERE indexname = ${indexName}`
          );
        } catch (error) {
          missingIndexes.push(indexName);
        }
      }
    } catch (error) {
      console.error('Error checking indexes:', error);
    }

    return missingIndexes;
  }

  private async checkEnumValues(): Promise<string[]> {
    const enumIssues: string[] = [];

    try {
      // Check if newsletter value exists in email_category_enum
      const result = await db.execute(sql`
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'newsletter' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'email_category_enum')
      `);

      if (result.length === 0) {
        enumIssues.push('newsletter value missing from email_category_enum');
      }
    } catch (error) {
      console.error('Error checking enum values:', error);
      enumIssues.push('Failed to check enum values');
    }

    return enumIssues;
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      return !!user;
    } catch (error) {
      console.error('Database connectivity check failed:', error);
      return false;
    }
  }

  // Auto-repair function
  async attemptAutoRepair(): Promise<{ success: boolean; message: string }> {
    console.log('🔧 Attempting database auto-repair...');

    try {
      // This would run the migration SQL automatically
      // For now, we'll just log what needs to be done
      const healthReport = await this.runHealthCheck();

      if (
        healthReport.missingColumns.length > 0 ||
        healthReport.missingIndexes.length > 0
      ) {
        return {
          success: false,
          message: `Database needs manual migration. Run: migrations/comprehensive_schema_fix.sql\nMissing: ${healthReport.missingColumns.join(', ')}`,
        };
      }

      return {
        success: true,
        message: 'Database is healthy, no repairs needed',
      };
    } catch (error) {
      return {
        success: false,
        message: `Auto-repair failed: ${String(error)}`,
      };
    }
  }
}

// Export singleton instance
export const dbHealthChecker = new DatabaseHealthChecker();
