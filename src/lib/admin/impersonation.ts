/**
 * Impersonation Service
 * Allows admins to impersonate users for support purposes
 */

import { db } from '@/db';
import { impersonationSessions, users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { logAuditAction } from '../audit/logger';
import type { ImpersonationSession } from '@/db/schema';

export interface StartImpersonationParams {
  adminId: string;
  targetUserId: string;
  reason: string;
  readOnly?: boolean;
}

export interface ImpersonationContext {
  session: ImpersonationSession;
  targetUser: {
    id: string;
    email: string;
    name: string | null;
  };
  admin: {
    id: string;
    email: string;
  };
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Start an impersonation session
 */
export async function startImpersonation(
  params: StartImpersonationParams
): Promise<ImpersonationContext> {
  const { adminId, targetUserId, reason, readOnly = false } = params;

  // Validate admin user
  const [admin] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, adminId))
    .limit(1);

  if (!admin) {
    throw new Error('Admin user not found');
  }

  if (admin.role !== 'super_admin' && admin.role !== 'admin') {
    throw new Error('Insufficient permissions to impersonate users');
  }

  // Validate target user
  const [targetUser] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    throw new Error('Target user not found');
  }

  // Prevent impersonating other admins
  const [targetUserRole] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (
    targetUserRole?.role === 'super_admin' ||
    targetUserRole?.role === 'admin'
  ) {
    throw new Error('Cannot impersonate admin users');
  }

  // Generate session token
  const sessionToken = generateSessionToken();

  // Create impersonation session
  const [session] = await db
    .insert(impersonationSessions)
    .values({
      adminId,
      targetUserId,
      reason,
      sessionToken,
      readOnly,
      actionsPerformed: [],
      metadata: {
        adminEmail: admin.email,
        targetEmail: targetUser.email,
        startedAt: new Date().toISOString(),
      },
    })
    .returning();

  // Log to audit
  await logAuditAction({
    actorId: adminId,
    actorType: 'admin',
    actorEmail: admin.email,
    action: 'user_impersonate_start',
    resourceType: 'user',
    resourceId: targetUserId,
    metadata: {
      reason,
      readOnly,
      sessionId: session.id,
    },
  });

  return {
    session,
    targetUser: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    },
    admin: {
      id: admin.id,
      email: admin.email,
    },
  };
}

/**
 * End an impersonation session
 */
export async function endImpersonation(sessionToken: string): Promise<void> {
  const [session] = await db
    .select()
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.sessionToken, sessionToken),
        isNull(impersonationSessions.endedAt)
      )
    )
    .limit(1);

  if (!session) {
    throw new Error('Active impersonation session not found');
  }

  // Update session to mark as ended
  await db
    .update(impersonationSessions)
    .set({ endedAt: new Date() })
    .where(eq(impersonationSessions.id, session.id));

  // Log to audit
  await logAuditAction({
    actorId: session.adminId,
    actorType: 'admin',
    action: 'user_impersonate_end',
    resourceType: 'user',
    resourceId: session.targetUserId,
    metadata: {
      sessionId: session.id,
      duration: Date.now() - new Date(session.startedAt).getTime(),
      actionsCount: Array.isArray(session.actionsPerformed)
        ? session.actionsPerformed.length
        : 0,
    },
  });
}

/**
 * Get active impersonation session by token
 */
export async function getActiveImpersonationSession(
  sessionToken: string
): Promise<ImpersonationContext | null> {
  const [session] = await db
    .select()
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.sessionToken, sessionToken),
        isNull(impersonationSessions.endedAt)
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  // Get target user details
  const [targetUser] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.targetUserId))
    .limit(1);

  // Get admin details
  const [admin] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, session.adminId))
    .limit(1);

  if (!targetUser || !admin) {
    return null;
  }

  return {
    session,
    targetUser: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
    },
    admin: {
      id: admin.id,
      email: admin.email,
    },
  };
}

/**
 * Log an action performed during impersonation
 */
export async function logImpersonationAction(
  sessionToken: string,
  action: {
    type: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const [session] = await db
    .select()
    .from(impersonationSessions)
    .where(
      and(
        eq(impersonationSessions.sessionToken, sessionToken),
        isNull(impersonationSessions.endedAt)
      )
    )
    .limit(1);

  if (!session) {
    return;
  }

  const existingActions = Array.isArray(session.actionsPerformed)
    ? (session.actionsPerformed as Array<unknown>)
    : [];

  const updatedActions = [
    ...existingActions,
    {
      ...action,
      timestamp: new Date().toISOString(),
    },
  ];

  await db
    .update(impersonationSessions)
    .set({ actionsPerformed: updatedActions })
    .where(eq(impersonationSessions.id, session.id));
}

/**
 * Get all impersonation sessions for a user
 */
export async function getImpersonationHistory(
  targetUserId: string,
  limit: number = 50
): Promise<ImpersonationSession[]> {
  const sessions = await db
    .select()
    .from(impersonationSessions)
    .where(eq(impersonationSessions.targetUserId, targetUserId))
    .orderBy(impersonationSessions.startedAt)
    .limit(limit);

  return sessions;
}
