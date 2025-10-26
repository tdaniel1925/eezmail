import { db } from '@/db';
import { supportTickets, users } from '@/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

export interface AssignmentStrategy {
  type: 'round_robin' | 'load_balance' | 'category_based' | 'expertise';
  config?: Record<string, any>;
}

export interface AssignmentResult {
  success: boolean;
  assignedTo?: string;
  reason: string;
}

/**
 * Auto-assign a ticket to an available support agent
 */
export async function autoAssignTicket(
  ticketId: string,
  strategy: AssignmentStrategy = { type: 'round_robin' }
): Promise<AssignmentResult> {
  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, ticketId),
  });

  if (!ticket) {
    return { success: false, reason: 'Ticket not found' };
  }

  if (ticket.assignedTo) {
    return { success: false, reason: 'Ticket already assigned' };
  }

  let assignedUserId: string | null = null;

  switch (strategy.type) {
    case 'round_robin':
      assignedUserId = await roundRobinAssignment();
      break;
    case 'load_balance':
      assignedUserId = await loadBalanceAssignment();
      break;
    case 'category_based':
      assignedUserId = await categoryBasedAssignment(ticket.category);
      break;
    case 'expertise':
      assignedUserId = await expertiseBasedAssignment(
        ticket.category,
        ticket.priority
      );
      break;
    default:
      assignedUserId = await roundRobinAssignment();
  }

  if (!assignedUserId) {
    return {
      success: false,
      reason: 'No available agents found',
    };
  }

  // Update ticket assignment
  await db
    .update(supportTickets)
    .set({
      assignedTo: assignedUserId,
      status: 'assigned',
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));

  return {
    success: true,
    assignedTo: assignedUserId,
    reason: `Assigned using ${strategy.type} strategy`,
  };
}

/**
 * Round-robin assignment: Assign to agent with least recent assignment
 */
async function roundRobinAssignment(): Promise<string | null> {
  // Get all support agents (assuming role 'support_agent')
  const agents = await db.query.users.findMany({
    where: eq(users.role, 'support_agent'),
  });

  if (agents.length === 0) {
    return null;
  }

  // Get last assignment time for each agent
  const agentAssignments = await Promise.all(
    agents.map(async (agent) => {
      const lastTicket = await db.query.supportTickets.findFirst({
        where: eq(supportTickets.assignedTo, agent.id),
        orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
      });

      return {
        agentId: agent.id,
        lastAssignedAt: lastTicket?.createdAt || new Date(0),
      };
    })
  );

  // Sort by last assigned time (oldest first)
  agentAssignments.sort(
    (a, b) => a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime()
  );

  return agentAssignments[0]?.agentId || null;
}

/**
 * Load balance assignment: Assign to agent with fewest open tickets
 */
async function loadBalanceAssignment(): Promise<string | null> {
  const agents = await db.query.users.findMany({
    where: eq(users.role, 'support_agent'),
  });

  if (agents.length === 0) {
    return null;
  }

  // Count open tickets for each agent
  const agentLoads = await Promise.all(
    agents.map(async (agent) => {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.assignedTo, agent.id),
            sql`${supportTickets.status} IN ('new', 'assigned', 'in_progress')`
          )
        );

      return {
        agentId: agent.id,
        openTickets: result[0]?.count || 0,
      };
    })
  );

  // Sort by open tickets (fewest first)
  agentLoads.sort((a, b) => a.openTickets - b.openTickets);

  return agentLoads[0]?.agentId || null;
}

/**
 * Category-based assignment: Assign to agents specializing in the category
 */
async function categoryBasedAssignment(
  category: string | null
): Promise<string | null> {
  if (!category) {
    return roundRobinAssignment();
  }

  // Get agents with this category specialty (stored in metadata)
  const agents = await db.query.users.findMany({
    where: and(
      eq(users.role, 'support_agent'),
      sql`${users.metadata}->>'specialties' LIKE '%${category}%'`
    ),
  });

  if (agents.length === 0) {
    // Fallback to round-robin if no specialists found
    return roundRobinAssignment();
  }

  // Among specialists, use load balancing
  const agentLoads = await Promise.all(
    agents.map(async (agent) => {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.assignedTo, agent.id),
            sql`${supportTickets.status} IN ('new', 'assigned', 'in_progress')`
          )
        );

      return {
        agentId: agent.id,
        openTickets: result[0]?.count || 0,
      };
    })
  );

  agentLoads.sort((a, b) => a.openTickets - b.openTickets);
  return agentLoads[0]?.agentId || null;
}

/**
 * Expertise-based assignment: Match agent skill level to ticket priority
 */
async function expertiseBasedAssignment(
  category: string | null,
  priority: string | null
): Promise<string | null> {
  const expertiseLevelRequired =
    priority === 'critical' || priority === 'high' ? 'senior' : 'any';

  let whereClause = eq(users.role, 'support_agent');

  if (expertiseLevelRequired === 'senior') {
    whereClause = and(
      whereClause,
      sql`${users.metadata}->>'level' = 'senior'`
    ) as any;
  }

  const agents = await db.query.users.findMany({
    where: whereClause,
  });

  if (agents.length === 0) {
    return roundRobinAssignment();
  }

  // If category is specified, prefer specialists
  if (category) {
    const specialists = agents.filter((agent) => {
      const metadata = agent.metadata as Record<string, any>;
      const specialties = metadata?.specialties as string[] | undefined;
      return specialties?.includes(category);
    });

    if (specialists.length > 0) {
      // Use load balancing among specialists
      const agentLoads = await Promise.all(
        specialists.map(async (agent) => {
          const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(supportTickets)
            .where(
              and(
                eq(supportTickets.assignedTo, agent.id),
                sql`${supportTickets.status} IN ('new', 'assigned', 'in_progress')`
              )
            );

          return {
            agentId: agent.id,
            openTickets: result[0]?.count || 0,
          };
        })
      );

      agentLoads.sort((a, b) => a.openTickets - b.openTickets);
      return agentLoads[0]?.agentId || null;
    }
  }

  // Fallback to load balancing
  const agentLoads = await Promise.all(
    agents.map(async (agent) => {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.assignedTo, agent.id),
            sql`${supportTickets.status} IN ('new', 'assigned', 'in_progress')`
          )
        );

      return {
        agentId: agent.id,
        openTickets: result[0]?.count || 0,
      };
    })
  );

  agentLoads.sort((a, b) => a.openTickets - b.openTickets);
  return agentLoads[0]?.agentId || null;
}

/**
 * Bulk auto-assign multiple tickets
 */
export async function bulkAutoAssign(
  ticketIds: string[],
  strategy: AssignmentStrategy = { type: 'load_balance' }
): Promise<{
  successful: number;
  failed: number;
  results: AssignmentResult[];
}> {
  const results = await Promise.all(
    ticketIds.map((id) => autoAssignTicket(id, strategy))
  );

  return {
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Get assignment statistics for monitoring
 */
export async function getAssignmentStats(): Promise<{
  totalAgents: number;
  avgTicketsPerAgent: number;
  agents: Array<{
    agentId: string;
    agentName: string;
    openTickets: number;
    closedToday: number;
  }>;
}> {
  const agents = await db.query.users.findMany({
    where: eq(users.role, 'support_agent'),
  });

  const agentStats = await Promise.all(
    agents.map(async (agent) => {
      const openResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.assignedTo, agent.id),
            sql`${supportTickets.status} IN ('new', 'assigned', 'in_progress')`
          )
        );

      const closedResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.assignedTo, agent.id),
            eq(supportTickets.status, 'resolved'),
            sql`${supportTickets.resolvedAt} >= CURRENT_DATE`
          )
        );

      return {
        agentId: agent.id,
        agentName: agent.name || agent.email,
        openTickets: openResult[0]?.count || 0,
        closedToday: closedResult[0]?.count || 0,
      };
    })
  );

  const totalOpen = agentStats.reduce((sum, a) => sum + a.openTickets, 0);

  return {
    totalAgents: agents.length,
    avgTicketsPerAgent: agents.length > 0 ? totalOpen / agents.length : 0,
    agents: agentStats,
  };
}
