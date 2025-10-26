/**
 * Audit Logging Types
 * HIPAA-compliant audit trail types
 */

export type ActorType =
  | 'user'
  | 'admin'
  | 'system'
  | 'api'
  | 'impersonated_user';

export type AuditAction =
  // User actions
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_change'
  | 'password_reset'
  | 'mfa_enable'
  | 'mfa_disable'
  // CRUD operations
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'bulk_delete'
  // Email operations
  | 'email_read'
  | 'email_send'
  | 'email_delete'
  | 'email_sync'
  | 'attachment_download'
  // Admin operations
  | 'user_impersonate_start'
  | 'user_impersonate_end'
  | 'user_suspend'
  | 'user_activate'
  | 'role_change'
  | 'permission_grant'
  | 'permission_revoke'
  // Payment operations
  | 'payment_processed'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'refund_issued'
  // Settings
  | 'settings_update'
  | 'integration_connect'
  | 'integration_disconnect'
  // System events
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'alert_triggered'
  | 'backup_created';

export type ResourceType =
  | 'user'
  | 'email'
  | 'email_account'
  | 'contact'
  | 'folder'
  | 'thread'
  | 'attachment'
  | 'payment'
  | 'subscription'
  | 'settings'
  | 'organization'
  | 'api_key'
  | 'webhook'
  | 'integration'
  | 'product'
  | 'order'
  | 'ticket'
  | 'kb_article'
  | 'alert_rule'
  | 'system';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  id?: string;
  actorId?: string;
  actorType: ActorType;
  actorEmail?: string;
  impersonatorId?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
  metadata?: Record<string, unknown>;
  riskLevel?: RiskLevel;
  createdAt?: Date;
}

export interface AuditLogFilter {
  actorId?: string;
  actorType?: ActorType;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  organizationId?: string;
  riskLevel?: RiskLevel;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogExport {
  format: 'csv' | 'json' | 'pdf';
  filters: AuditLogFilter;
  includeMetadata: boolean;
}

export interface AuditStatistics {
  totalActions: number;
  actionsByType: Record<AuditAction, number>;
  actionsByRisk: Record<RiskLevel, number>;
  topActors: Array<{ actorId: string; actorEmail: string; count: number }>;
  recentHighRiskActions: AuditLogEntry[];
}
