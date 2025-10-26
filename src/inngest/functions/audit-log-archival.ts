/**
 * Audit Log Archival Background Job
 * Archives old audit logs based on retention policy
 */

import { inngest } from '../client';
import { archiveOldAuditLogs } from '@/lib/audit/logger';

export const auditLogArchival = inngest.createFunction(
  {
    id: 'audit-log-archival',
    name: 'Archive Old Audit Logs',
  },
  { cron: '0 2 * * *' }, // Run daily at 2 AM
  async ({ step }) => {
    const result = await step.run('archive-logs', async () => {
      // Archive logs older than 2555 days (7 years for HIPAA compliance)
      const archived = await archiveOldAuditLogs(2555);
      return { archived };
    });

    return {
      success: true,
      ...result,
    };
  }
);
