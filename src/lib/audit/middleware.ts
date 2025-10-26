/**
 * Audit Middleware
 * Automatically logs admin actions for HIPAA compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAuditAction } from './logger';
import type { ActorType, AuditAction, ResourceType } from './types';

interface AuditContext {
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  sessionId?: string;
  isImpersonating?: boolean;
  impersonatorId?: string;
}

/**
 * Extract audit context from request headers
 */
function extractAuditContext(request: NextRequest): AuditContext {
  return {
    userId: request.headers.get('x-user-id') || undefined,
    userEmail: request.headers.get('x-user-email') || undefined,
    organizationId: request.headers.get('x-org-id') || undefined,
    sessionId: request.headers.get('x-session-id') || undefined,
    isImpersonating: request.headers.get('x-impersonating') === 'true',
    impersonatorId: request.headers.get('x-impersonator-id') || undefined,
  };
}

/**
 * Determine action from request method and path
 */
function determineAction(method: string, path: string): AuditAction {
  const methodLower = method.toLowerCase();

  if (path.includes('/login')) return 'login';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/signup')) return 'signup';

  switch (methodLower) {
    case 'post':
      if (path.includes('/impersonate')) return 'user_impersonate_start';
      return 'create';
    case 'put':
    case 'patch':
      if (path.includes('/settings')) return 'settings_update';
      return 'update';
    case 'delete':
      return 'delete';
    case 'get':
      if (path.includes('/email')) return 'email_read';
      return 'read';
    default:
      return 'read';
  }
}

/**
 * Determine resource type from request path
 */
function determineResourceType(path: string): ResourceType {
  if (path.includes('/user')) return 'user';
  if (path.includes('/email')) return 'email';
  if (path.includes('/payment') || path.includes('/subscription'))
    return 'payment';
  if (path.includes('/settings')) return 'settings';
  if (path.includes('/organization')) return 'organization';
  if (path.includes('/product')) return 'product';
  if (path.includes('/order')) return 'order';
  if (path.includes('/ticket')) return 'ticket';
  if (path.includes('/article') || path.includes('/kb')) return 'kb_article';
  if (path.includes('/alert')) return 'alert_rule';
  return 'system';
}

/**
 * Determine actor type from request context
 */
function determineActorType(context: AuditContext, path: string): ActorType {
  if (path.includes('/api/') && !context.userId) return 'api';
  if (context.isImpersonating) return 'impersonated_user';
  if (path.includes('/admin') || path.includes('/platform-admin'))
    return 'admin';
  if (context.userId) return 'user';
  return 'system';
}

/**
 * Extract resource ID from request path
 */
function extractResourceId(path: string): string | undefined {
  // Match UUID patterns in path
  const uuidPattern =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = path.match(uuidPattern);
  return match ? match[0] : undefined;
}

/**
 * Check if request should be audited
 */
function shouldAudit(path: string, method: string): boolean {
  // Don't audit health checks and static assets
  if (
    path.includes('/health') ||
    path.includes('/_next/') ||
    path.includes('/static/') ||
    path.includes('/favicon') ||
    path.includes('/api/inngest')
  ) {
    return false;
  }

  // Only audit write operations and sensitive reads
  if (method === 'GET') {
    return (
      path.includes('/admin') ||
      path.includes('/payment') ||
      path.includes('/email') ||
      path.includes('/user')
    );
  }

  return true;
}

/**
 * Audit middleware wrapper for API routes
 */
export function withAudit(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Execute the handler
    const response = await handler(req);

    // Only audit if appropriate
    if (shouldAudit(path, method)) {
      const context = extractAuditContext(req);
      const action = determineAction(method, path);
      const resourceType = determineResourceType(path);
      const actorType = determineActorType(context, path);
      const resourceId = extractResourceId(path);

      // Get IP address
      const ipAddress =
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        undefined;

      // Log asynchronously (don't await to not block response)
      logAuditAction({
        actorId: context.userId,
        actorType,
        actorEmail: context.userEmail,
        impersonatorId: context.impersonatorId,
        action,
        resourceType,
        resourceId,
        organizationId: context.organizationId,
        ipAddress,
        userAgent: req.headers.get('user-agent') || undefined,
        requestId: req.headers.get('x-request-id') || undefined,
        sessionId: context.sessionId,
        metadata: {
          path,
          method,
          statusCode: response.status,
          duration: Date.now() - startTime,
        },
      }).catch((error) => {
        console.error('[Audit Middleware] Failed to log action:', error);
      });
    }

    return response;
  };
}

/**
 * Create audit log entry for server actions
 */
export async function auditServerAction(
  action: AuditAction,
  resourceType: ResourceType,
  context: {
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    resourceId?: string;
    changes?: { before?: unknown; after?: unknown };
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await logAuditAction({
    actorId: context.userId,
    actorType: 'user',
    actorEmail: context.userEmail,
    action,
    resourceType,
    resourceId: context.resourceId,
    organizationId: context.organizationId,
    changes: context.changes,
    metadata: context.metadata,
  });
}
