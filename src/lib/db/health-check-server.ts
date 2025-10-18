import { createClient } from '@/lib/supabase/server';
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
  timestamp: string;
}

export class DatabaseHealthCheckerServer {
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
      const totalIssues =
        issues.length +
        missingColumns.length +
        missingIndexes.length +
        enumIssues.length;
      const score = Math.max(0, 100 - totalIssues * 10);

      const isHealthy = score >= 80 && connectivityCheck;

      if (score < 80) {
        recommendations.push('Run database migration to fix schema issues');
      }

      return {
        isHealthy,
        score,
        issues,
        recommendations,
        missingColumns,
        missingIndexes,
        enumIssues,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        isHealthy: false,
        score: 0,
        issues: [`Health check failed: ${String(error)}`],
        recommendations: ['Check database connection and configuration'],
        missingColumns: [],
        missingIndexes: [],
        enumIssues: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkMissingColumns(): Promise<string[]> {
    const missingColumns: string[] = [];

    try {
      // Check for common missing columns
      const columnChecks = [
        { table: 'emails', column: 'voice_message_url' },
        { table: 'emails', column: 'voice_settings' },
        { table: 'emails', column: 'is_read' },
        { table: 'emails', column: 'is_trashed' },
        { table: 'emails', column: 'category' },
        { table: 'emails', column: 'folder' },
        { table: 'emails', column: 'is_archived' },
        { table: 'emails', column: 'attachments' },
        { table: 'emails', column: 'size' },
        { table: 'emails', column: 'body' },
        { table: 'emails', column: 'from' },
        { table: 'emails', column: 'user_id' },
        { table: 'email_accounts', column: 'sync_status' },
        { table: 'email_accounts', column: 'sync_progress' },
        { table: 'email_accounts', column: 'last_sync_at' },
        { table: 'email_accounts', column: 'status' },
        { table: 'email_accounts', column: 'is_active' },
        { table: 'labels', column: 'icon' },
        { table: 'labels', column: 'user_id' },
        { table: 'labels', column: 'updated_at' },
        { table: 'labels', column: 'sort_order' },
        { table: 'contacts', column: 'first_name' },
        { table: 'contacts', column: 'user_id' },
        { table: 'sender_trust', column: 'trust_level' },
        { table: 'sender_trust', column: 'user_id' },
        { table: 'email_routing', column: 'screening_status' },
        { table: 'email_routing', column: 'user_id' },
        { table: 'custom_folders', column: 'account_id' },
        { table: 'email_settings', column: 'user_id' },
        { table: 'signatures', column: 'text_content' },
        { table: 'signatures', column: 'user_id' },
        { table: 'rules', column: 'account_id' },
        { table: 'rules', column: 'user_id' },
        { table: 'tasks', column: 'description' },
        { table: 'tasks', column: 'user_id' },
        { table: 'tasks', column: 'completed' },
      ];

      for (const check of columnChecks) {
        try {
          await db.execute(sql`
            SELECT ${sql.identifier(check.column)} 
            FROM ${sql.identifier(check.table)} 
            LIMIT 1
          `);
        } catch (error) {
          if (String(error).includes('does not exist')) {
            missingColumns.push(`${check.table}.${check.column}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking missing columns:', error);
    }

    return missingColumns;
  }

  private async checkMissingIndexes(): Promise<string[]> {
    const missingIndexes: string[] = [];

    try {
      // Check for important indexes
      const indexChecks = [
        { table: 'emails', column: 'user_id' },
        { table: 'emails', column: 'account_id' },
        { table: 'emails', column: 'category' },
        { table: 'emails', column: 'is_read' },
        { table: 'emails', column: 'received_at' },
        { table: 'email_accounts', column: 'user_id' },
        { table: 'email_accounts', column: 'email_address' },
        { table: 'labels', column: 'user_id' },
        { table: 'contacts', column: 'user_id' },
      ];

      for (const check of indexChecks) {
        try {
          const result = await db.execute(sql`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = ${check.table} 
            AND indexdef LIKE ${`%${check.column}%`}
          `);

          if (!result || result.length === 0) {
            missingIndexes.push(`${check.table}.${check.column}`);
          }
        } catch (error) {
          console.error(
            `Error checking index for ${check.table}.${check.column}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('Error checking missing indexes:', error);
    }

    return missingIndexes;
  }

  private async checkEnumValues(): Promise<string[]> {
    const enumIssues: string[] = [];

    try {
      // Check for enum type issues
      const enumChecks = [
        {
          type: 'ai_reply_status',
          values: ['none', 'pending', 'generated', 'sent'],
        },
        { type: 'email_priority', values: ['low', 'normal', 'high', 'urgent'] },
        { type: 'email_importance', values: ['low', 'normal', 'high'] },
        {
          type: 'email_sensitivity',
          values: ['normal', 'personal', 'private', 'confidential'],
        },
      ];

      for (const check of enumChecks) {
        try {
          await db.execute(
            sql`SELECT unnest(enum_range(NULL::${sql.identifier(check.type)}))`
          );
        } catch (error) {
          if (String(error).includes('does not exist')) {
            enumIssues.push(`Missing enum type: ${check.type}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking enum values:', error);
    }

    return enumIssues;
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connectivity check failed:', error);
      return false;
    }
  }

  async attemptAutoRepair(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔧 Attempting database auto-repair...');

      // Apply the comprehensive schema fix
      const migrationSQL = `
        -- Add missing columns to emails table
        DO $$ 
        BEGIN
          -- Add voice_message_url if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'voice_message_url') THEN
            ALTER TABLE emails ADD COLUMN voice_message_url TEXT;
          END IF;
          
          -- Add voice_settings if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'voice_settings') THEN
            ALTER TABLE emails ADD COLUMN voice_settings JSONB;
          END IF;
          
          -- Add is_read if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'is_read') THEN
            ALTER TABLE emails ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
          END IF;
          
          -- Add is_trashed if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'is_trashed') THEN
            ALTER TABLE emails ADD COLUMN is_trashed BOOLEAN DEFAULT FALSE;
          END IF;
          
          -- Add category if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'category') THEN
            ALTER TABLE emails ADD COLUMN category TEXT DEFAULT 'inbox';
          END IF;
          
          -- Add folder if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'folder') THEN
            ALTER TABLE emails ADD COLUMN folder TEXT;
          END IF;
          
          -- Add is_archived if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'is_archived') THEN
            ALTER TABLE emails ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
          END IF;
          
          -- Add attachments if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'attachments') THEN
            ALTER TABLE emails ADD COLUMN attachments JSONB DEFAULT '[]';
          END IF;
          
          -- Add size if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'size') THEN
            ALTER TABLE emails ADD COLUMN size INTEGER DEFAULT 0;
          END IF;
          
          -- Add body if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'body') THEN
            ALTER TABLE emails ADD COLUMN body TEXT;
          END IF;
          
          -- Add from if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'from') THEN
            ALTER TABLE emails ADD COLUMN "from" TEXT;
          END IF;
          
          -- Add user_id if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'user_id') THEN
            ALTER TABLE emails ADD COLUMN user_id UUID;
          END IF;
        END $$;
      `;

      await db.execute(sql.raw(migrationSQL));

      return {
        success: true,
        message: 'Database schema auto-repair completed successfully',
      };
    } catch (error) {
      console.error('Database auto-repair failed:', error);
      return {
        success: false,
        message: `Auto-repair failed: ${String(error)}`,
      };
    }
  }
}

export const dbHealthCheckerServer = new DatabaseHealthCheckerServer();
