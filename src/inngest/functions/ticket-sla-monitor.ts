/**
 * Ticket SLA Monitor Background Job
 * Monitors tickets approaching SLA deadlines
 */

import { inngest } from '../client';
import { db } from '@/db';
import { supportTickets } from '@/db/schema';
import { and, eq, lte, isNull } from 'drizzle-orm';

export const ticketSlaMonitor = inngest.createFunction(
  {
    id: 'ticket-sla-monitor',
    name: 'Monitor Ticket SLA',
  },
  { cron: '* * * * *' }, // Run every minute
  async ({ step }) => {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    const urgentTickets = await step.run('find-urgent-tickets', async () => {
      // Find tickets approaching response SLA
      const approachingResponse = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.status, 'new'),
            lte(supportTickets.slaResponseBy, warningThreshold),
            isNull(supportTickets.firstResponseAt)
          )
        );

      // Find tickets approaching resolution SLA
      const approachingResolution = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.status, 'open'),
            lte(supportTickets.slaResolutionBy, warningThreshold),
            isNull(supportTickets.resolvedAt)
          )
        );

      return {
        approachingResponse: approachingResponse.length,
        approachingResolution: approachingResolution.length,
        tickets: [...approachingResponse, ...approachingResolution],
      };
    });

    // TODO: Send notifications to assigned admins
    // TODO: Auto-escalate if no assignment

    return {
      success: true,
      ...urgentTickets,
    };
  }
);
