import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  varchar,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

// Payment & Subscription Enums
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'pro',
  'team',
  'enterprise',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
]);
export const paymentProcessorEnum = pgEnum('payment_processor', [
  'stripe',
  'square',
]);

// Email Provider Enums
export const emailProviderEnum = pgEnum('email_provider', [
  'gmail',
  'microsoft',
  'yahoo',
  'imap',
  'custom',
]);

export const emailAuthTypeEnum = pgEnum('email_auth_type', [
  'oauth',
  'password',
]);

export const emailAccountStatusEnum = pgEnum('email_account_status', [
  'active',
  'inactive',
  'error',
  'syncing',
]);

// Hey Workflow Enums
export const screeningStatusEnum = pgEnum('screening_status', [
  'pending',
  'screened',
  'auto_classified',
]);

export const heyViewEnum = pgEnum('hey_view', ['imbox', 'feed', 'paper_trail']);

export const contactStatusEnum = pgEnum('contact_status', [
  'unknown',
  'approved',
  'blocked',
]);

// AI & Classification Enums
export const priorityEnum = pgEnum('priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const sentimentEnum = pgEnum('sentiment', [
  'positive',
  'neutral',
  'negative',
]);

export const draftSourceEnum = pgEnum('draft_source', [
  'user',
  'ai_suggestion',
  'ai_autonomous',
]);

export const emailModeEnum = pgEnum('email_mode', [
  'traditional',
  'hey',
  'hybrid',
]);

// Email Category Enums
export const emailCategoryEnum = pgEnum('email_category', [
  'unscreened',
  'inbox',
  'newsfeed',
  'receipts',
  'spam',
  'archived',
  'newsletter',
]);
export type EmailCategory = (typeof emailCategoryEnum.enumValues)[number];

export const senderTrustLevelEnum = pgEnum('sender_trust_level', [
  'trusted',
  'unknown',
  'spam',
]);

// Sync Enums
export const syncTypeEnum = pgEnum('sync_type', [
  'full',
  'incremental',
  'webhook',
  'manual',
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'in_progress',
  'completed',
  'failed',
]);

export const emailSyncStatusEnum = pgEnum('email_sync_status', [
  'idle',
  'syncing',
  'paused',
  'error',
  'success',
]);

export const syncJobTypeEnum = pgEnum('sync_job_type', [
  'full',
  'incremental',
  'selective',
  'webhook_triggered',
]);

// Email Rules Enums
export const ruleConditionFieldEnum = pgEnum('rule_condition_field', [
  'from',
  'to',
  'cc',
  'subject',
  'body',
  'has_attachment',
  'is_starred',
  'is_important',
]);

export const ruleConditionOperatorEnum = pgEnum('rule_condition_operator', [
  'contains',
  'not_contains',
  'equals',
  'not_equals',
  'starts_with',
  'ends_with',
  'matches_regex',
  'is_true',
  'is_false',
]);

export const ruleActionTypeEnum = pgEnum('rule_action_type', [
  'move_to_folder',
  'add_label',
  'star',
  'mark_as_read',
  'mark_as_important',
  'delete',
  'archive',
  'forward_to',
  'mark_as_spam',
]);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type EmailAddress = {
  email: string;
  name?: string;
};

export type SmartAction = {
  type: string;
  label: string;
  value?: string;
};

export type ConditionGroup = {
  logic: 'AND' | 'OR';
  rules: RuleCondition[];
};

export type RuleCondition = {
  field: string;
  operator: string;
  value: string | boolean | number;
};

export type RuleAction = {
  type: string;
  value?: string;
};

export type DraftAttachment = {
  filename: string;
  contentType: string;
  size: number;
  url: string;
};

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  subscriptionTier: subscriptionTierEnum('subscription_tier')
    .default('free')
    .notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status'),
  paymentProcessor: paymentProcessorEnum('payment_processor'),
  stripeCustomerId: text('stripe_customer_id'),
  squareCustomerId: text('square_customer_id'),
  voiceSettings: jsonb('voice_settings').$type<{
    recordingQuality: 'high' | 'medium' | 'low';
    maxDuration: number;
    autoPlay: boolean;
    defaultPlaybackSpeed: number;
    saveLocally: boolean;
    enablePause: boolean;
    enablePlayback: boolean;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  tier: subscriptionTierEnum('tier').notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  processor: paymentProcessorEnum('processor').notNull(),
  processorSubscriptionId: text('processor_subscription_id').notNull(),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// EMAIL ACCOUNTS TABLE
// ============================================================================

export const emailAccounts = pgTable(
  'email_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Provider info
    provider: emailProviderEnum('provider').notNull(),
    authType: emailAuthTypeEnum('auth_type').notNull(),
    emailAddress: varchar('email_address', { length: 255 }).notNull(),
    displayName: text('display_name'),

    // Nylas integration (unified API)
    nylasGrantId: text('nylas_grant_id'),

    // OAuth fields (encrypted)
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at'),

    // IMAP/SMTP fields (encrypted)
    imapHost: varchar('imap_host', { length: 255 }),
    imapPort: integer('imap_port'),
    imapUsername: varchar('imap_username', { length: 255 }),
    imapPassword: text('imap_password'),
    imapUseSsl: boolean('imap_use_ssl').default(true),

    smtpHost: varchar('smtp_host', { length: 255 }),
    smtpPort: integer('smtp_port'),
    smtpUsername: varchar('smtp_username', { length: 255 }),
    smtpPassword: text('smtp_password'),
    smtpUseSsl: boolean('smtp_use_ssl').default(true),

    // Sync state
    status: emailAccountStatusEnum('status').notNull().default('active'),
    lastSyncAt: timestamp('last_sync_at'),
    lastSyncError: text('last_sync_error'),
    syncCursor: text('sync_cursor'),
    sentSyncCursor: text('sent_sync_cursor'), // Separate cursor for sent folder

    // Enhanced sync tracking
    syncStatus: emailSyncStatusEnum('sync_status').default('idle'),
    syncProgress: integer('sync_progress').default(0),
    syncTotal: integer('sync_total').default(0),
    syncUpdatedAt: timestamp('sync_updated_at'),
    lastSuccessfulSyncAt: timestamp('last_successful_sync_at'),
    nextScheduledSyncAt: timestamp('next_scheduled_sync_at'),
    errorCount: integer('error_count').default(0),
    consecutiveErrors: integer('consecutive_errors').default(0),
    syncPriority: text('sync_priority').default('normal'), // high, normal, low

    // Settings
    signature: text('signature'),
    replyToEmail: varchar('reply_to_email', { length: 255 }),
    isDefault: boolean('is_default').default(false).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('email_accounts_user_id_idx').on(table.userId),
    emailAddressIdx: index('email_accounts_email_address_idx').on(
      table.emailAddress
    ),
    statusIdx: index('email_accounts_status_idx').on(table.status),
  })
);

// ============================================================================
// EMAILS TABLE
// ============================================================================

export const emails = pgTable(
  'emails',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Account association
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),

    // User association (denormalized for faster queries)
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

    // Email identifiers
    messageId: text('message_id').notNull(),
    nylasMessageId: text('nylas_message_id'),
    providerMessageId: text('provider_message_id'),
    threadId: text('thread_id'),

    // Email metadata
    subject: text('subject').notNull(),
    snippet: text('snippet'),

    // Participants (JSONB for flexibility)
    fromAddress: jsonb('from_address').$type<EmailAddress>().notNull(),
    toAddresses: jsonb('to_addresses').$type<EmailAddress[]>().notNull(),
    ccAddresses: jsonb('cc_addresses').$type<EmailAddress[]>(),
    bccAddresses: jsonb('bcc_addresses').$type<EmailAddress[]>(),
    replyTo: jsonb('reply_to').$type<EmailAddress[]>(),

    // Email content
    bodyText: text('body_text'),
    bodyHtml: text('body_html'),
    hasInlineImages: boolean('has_inline_images').default(false),

    // Metadata
    receivedAt: timestamp('received_at').notNull(),
    sentAt: timestamp('sent_at'),

    // Flags
    isRead: boolean('is_read').default(false).notNull(),
    isStarred: boolean('is_starred').default(false).notNull(),
    isTrashed: boolean('is_trashed').default(false).notNull(),
    isDraft: boolean('is_draft').default(false).notNull(),
    hasDrafts: boolean('has_drafts').default(false).notNull(),
    hasAttachments: boolean('has_attachments').default(false).notNull(),

    // Folder/Label info
    folderName: text('folder_name'),
    labelIds: text('label_ids').array(),

    // Email categorization
    emailCategory: emailCategoryEnum('email_category').default('unscreened'),
    screenedAt: timestamp('screened_at'),
    screenedBy: text('screened_by'), // 'user' or 'ai_rule'

    // Hey-inspired features
    screeningStatus: screeningStatusEnum('screening_status').default('pending'),
    heyView: heyViewEnum('hey_view'),
    contactStatus: contactStatusEnum('contact_status').default('unknown'),
    replyLaterUntil: timestamp('reply_later_until'),
    replyLaterNote: text('reply_later_note'),
    setAsideAt: timestamp('set_aside_at'),

    // Additional flags for workflow
    isImportant: boolean('is_important').default(false),
    needsReply: boolean('needs_reply').default(false),
    isSetAside: boolean('is_set_aside').default(false),

    // Custom folder assignment
    customFolderId: uuid('custom_folder_id').references(
      () => customFolders.id,
      {
        onDelete: 'set null',
      }
    ),

    // Privacy
    trackersBlocked: integer('trackers_blocked').default(0),

    // AI-generated insights (cached)
    aiSummary: text('ai_summary'),
    aiQuickReplies: jsonb('ai_quick_replies').$type<string[]>(),
    aiSmartActions: jsonb('ai_smart_actions').$type<SmartAction[]>(),
    aiGeneratedAt: timestamp('ai_generated_at'),
    aiCategory: text('ai_category'),
    aiPriority: priorityEnum('ai_priority'),
    aiSentiment: sentimentEnum('ai_sentiment'),

    // Advanced AI features
    summary: text('summary'), // Cached email summary
    sentiment: text('sentiment'), // positive, neutral, negative, urgent, anxious
    sentimentScore: integer('sentiment_score'), // -100 to +100

    // Search
    searchVector: text('search_vector'),

    // RAG/Embedding for semantic search
    embedding: text('embedding'), // Stored as JSON string or pgvector

    // Voice message support
    voiceMessageUrl: text('voice_message_url'),
    voiceMessageDuration: integer('voice_message_duration'), // seconds
    hasVoiceMessage: boolean('has_voice_message').default(false).notNull(),
    voiceMessageFormat: text('voice_message_format'), // e.g., 'audio/webm;codecs=opus'
    voiceMessageSize: integer('voice_message_size'), // bytes

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    accountIdIdx: index('emails_account_id_idx').on(table.accountId),
    threadIdIdx: index('emails_thread_id_idx').on(table.threadId),
    receivedAtIdx: index('emails_received_at_idx').on(table.receivedAt),
    isReadIdx: index('emails_is_read_idx').on(table.isRead),
    screeningStatusIdx: index('emails_screening_status_idx').on(
      table.screeningStatus
    ),
    heyViewIdx: index('emails_hey_view_idx').on(table.heyView),
    messageIdIdx: index('emails_message_id_idx').on(table.messageId),
    // Unique composite to avoid duplicates per account
    // Note: Ensure a matching migration adds this unique index
    emailCategoryIdx: index('emails_email_category_idx').on(
      table.emailCategory
    ),
    isImportantIdx: index('emails_is_important_idx').on(table.isImportant),
    needsReplyIdx: index('emails_needs_reply_idx').on(table.needsReply),
    isSetAsideIdx: index('emails_is_set_aside_idx').on(table.isSetAside),
    uniqueAccountMessage: uniqueIndex('emails_account_message_unique').on(
      table.accountId,
      table.messageId
    ),
  })
);

// ============================================================================
// EMAIL FOLDERS TABLE
// ============================================================================

export const emailFolders = pgTable(
  'email_folders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    externalId: text('external_id').notNull(),
    type: text('type').notNull(), // inbox, sent, drafts, trash, spam, archive, starred, custom
    parentId: uuid('parent_id'), // For nested folders
    unreadCount: integer('unread_count').default(0),

    // Per-folder sync tracking
    syncCursor: text('sync_cursor'), // Delta link or page token for this folder
    lastSyncAt: timestamp('last_sync_at'), // When this folder was last synced
    syncStatus: text('sync_status').default('idle'), // 'idle', 'syncing', 'error'

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    accountExternalUnique: uniqueIndex(
      'email_folders_account_external_unique'
    ).on(table.accountId, table.externalId),
    lastSyncAtIdx: index('email_folders_last_sync_at_idx').on(table.lastSyncAt),
  })
);

export type EmailFolder = typeof emailFolders.$inferSelect;
export type NewEmailFolder = typeof emailFolders.$inferInsert;

// ============================================================================
// SENDER TRUST TABLE
// ============================================================================

export const senderTrust = pgTable(
  'sender_trust',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    senderEmail: text('sender_email').notNull(),
    trustLevel: senderTrustLevelEnum('trust_level').default('unknown'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('sender_trust_user_id_idx').on(table.userId),
    senderEmailIdx: index('sender_trust_sender_email_idx').on(
      table.senderEmail
    ),
    trustLevelIdx: index('sender_trust_trust_level_idx').on(table.trustLevel),
  })
);

// (duplicates removed above)

// ============================================================================
// EMAIL THREADS TABLE
// ============================================================================

export const emailThreads = pgTable(
  'email_threads',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Account association
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),

    // Thread identifiers
    threadId: text('thread_id').notNull(),
    nylasThreadId: text('nylas_thread_id'),

    // Thread metadata
    subject: text('subject').notNull(),
    snippet: text('snippet'),
    participants: jsonb('participants').$type<EmailAddress[]>().notNull(),

    // Stats
    messageCount: integer('message_count').default(1).notNull(),
    unreadCount: integer('unread_count').default(0).notNull(),

    // Timestamps
    firstMessageAt: timestamp('first_message_at').notNull(),
    lastMessageAt: timestamp('last_message_at').notNull(),

    // Flags
    hasAttachments: boolean('has_attachments').default(false).notNull(),
    hasDrafts: boolean('has_drafts').default(false).notNull(),
    isStarred: boolean('is_starred').default(false).notNull(),

    // AI summary (for entire thread)
    aiThreadSummary: text('ai_thread_summary'),
    aiKeyPoints: jsonb('ai_key_points').$type<string[]>(),
    aiActionItems: jsonb('ai_action_items').$type<string[]>(),
    aiGeneratedAt: timestamp('ai_generated_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    accountIdIdx: index('email_threads_account_id_idx').on(table.accountId),
    threadIdIdx: index('email_threads_thread_id_idx').on(table.threadId),
    lastMessageAtIdx: index('email_threads_last_message_at_idx').on(
      table.lastMessageAt
    ),
  })
);

// ============================================================================
// EMAIL ATTACHMENTS TABLE
// ============================================================================

export const emailAttachments = pgTable(
  'email_attachments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Email association
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),

    // Attachment identifiers
    providerAttachmentId: text('provider_attachment_id'),
    contentId: text('content_id'),

    // File metadata
    filename: varchar('filename', { length: 255 }).notNull(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    size: integer('size').notNull(),

    // Storage
    storageUrl: text('storage_url'),
    storageKey: text('storage_key'),

    // Inline attachments
    isInline: boolean('is_inline').default(false).notNull(),

    // Download tracking
    downloadCount: integer('download_count').default(0).notNull(),
    lastDownloadedAt: timestamp('last_downloaded_at'),

    // AI description
    aiDescription: text('ai_description'),
    aiDescriptionGeneratedAt: timestamp('ai_description_generated_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdIdx: index('email_attachments_email_id_idx').on(table.emailId),
  })
);

// ============================================================================
// EMAIL LABELS TABLE
// ============================================================================

export const emailLabels = pgTable(
  'email_labels',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Account association
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),

    // Label info
    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 7 }),

    // Hierarchy (nested labels)
    parentLabelId: uuid('parent_label_id'),

    // Provider sync
    providerLabelId: text('provider_label_id'),

    // Metadata
    emailCount: integer('email_count').default(0).notNull(),
    isSystemLabel: boolean('is_system_label').default(false).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    accountIdIdx: index('email_labels_account_id_idx').on(table.accountId),
    nameIdx: index('email_labels_name_idx').on(table.name),
  })
);

// ============================================================================
// EMAIL CONTACTS TABLE
// ============================================================================

export const emailContacts = pgTable(
  'email_contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // User association
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),

    // Contact info
    emailAddress: varchar('email_address', { length: 255 }).notNull(),
    displayName: text('display_name'),

    // Hey screening decision
    screeningStatus: screeningStatusEnum('screening_status').default('pending'),
    screeningDecision: heyViewEnum('screening_decision'),
    screenedAt: timestamp('screened_at'),
    contactStatus: contactStatusEnum('contact_status').default('unknown'),
    heyView: heyViewEnum('hey_view'),
    assignedFolder: uuid('assigned_folder').references(() => customFolders.id, {
      onDelete: 'set null',
    }),

    // Stats
    emailCount: integer('email_count').default(0).notNull(),
    lastEmailAt: timestamp('last_email_at'),
    firstEmailAt: timestamp('first_email_at'),

    // Communication frequency
    avgResponseTimeHours: integer('avg_response_time_hours'),
    sentToCount: integer('sent_to_count').default(0).notNull(),
    receivedFromCount: integer('received_from_count').default(0).notNull(),

    // AI insights
    aiContactType: text('ai_contact_type'),
    aiImportanceScore: integer('ai_importance_score'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('email_contacts_user_id_idx').on(table.userId),
    accountIdIdx: index('email_contacts_account_id_idx').on(table.accountId),
    emailAddressIdx: index('email_contacts_email_address_idx').on(
      table.emailAddress
    ),
    screeningStatusIdx: index('email_contacts_screening_status_idx').on(
      table.screeningStatus
    ),
  })
);

// ============================================================================
// EMAIL SETTINGS TABLE
// ============================================================================

export const emailSettings = pgTable('email_settings', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Account association
  accountId: uuid('account_id')
    .notNull()
    .references(() => emailAccounts.id, { onDelete: 'cascade' })
    .unique(),

  // Display settings
  emailsPerPage: integer('emails_per_page').default(50).notNull(),
  theme: text('theme').default('light'),
  density: text('density').default('comfortable'),

  // Email mode
  emailMode: emailModeEnum('email_mode').default('hey'),

  // Notification settings
  desktopNotifications: boolean('desktop_notifications')
    .default(true)
    .notNull(),
  soundEnabled: boolean('sound_enabled').default(false).notNull(),
  notifyOnImportantOnly: boolean('notify_on_important_only')
    .default(false)
    .notNull(),

  // Reading pane
  readingPanePosition: text('reading_pane_position').default('right'),
  markAsReadDelay: integer('mark_as_read_delay').default(0).notNull(),

  // Composer settings
  defaultFontFamily: text('default_font_family').default('sans-serif'),
  defaultFontSize: integer('default_font_size').default(14),
  defaultSendBehavior: text('default_send_behavior').default('send'),

  // Privacy settings
  blockTrackers: boolean('block_trackers').default(true).notNull(),
  blockExternalImages: boolean('block_external_images')
    .default(false)
    .notNull(),
  stripUtmParameters: boolean('strip_utm_parameters').default(true).notNull(),

  // AI settings
  enableAiSummaries: boolean('enable_ai_summaries').default(true).notNull(),
  enableQuickReplies: boolean('enable_quick_replies').default(true).notNull(),
  enableSmartActions: boolean('enable_smart_actions').default(true).notNull(),
  aiTone: text('ai_tone').default('professional'),

  // Screening settings
  autoClassifyAfterDays: integer('auto_classify_after_days')
    .default(14)
    .notNull(),
  bulkEmailDetection: boolean('bulk_email_detection').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// CUSTOM FOLDERS TABLE
// ============================================================================

export const customFolders = pgTable(
  'custom_folders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    icon: text('icon').default('📁'),
    color: varchar('color', { length: 20 }).default('gray'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('custom_folders_user_id_idx').on(table.userId),
    userNameIdx: index('custom_folders_user_name_idx').on(
      table.userId,
      table.name
    ),
  })
);

// ============================================================================
// CONTACTS SYSTEM ENUMS
// ============================================================================

export const contactSourceTypeEnum = pgEnum('contact_source_type', [
  'manual',
  'synced',
]);

export const contactEmailTypeEnum = pgEnum('contact_email_type', [
  'work',
  'personal',
  'other',
]);

// Contact Timeline Events Enum
export const contactEventTypeEnum = pgEnum('contact_event_type', [
  'email_sent',
  'email_received',
  'voice_message_sent',
  'voice_message_received',
  'note_added',
  'call_made',
  'meeting_scheduled',
  'document_shared',
  'contact_created',
  'contact_updated',
  'sms_sent',
  'sms_received',
  'voice_call_made',
]);

export const contactPhoneTypeEnum = pgEnum('contact_phone_type', [
  'mobile',
  'work',
  'home',
  'other',
]);

export const contactAddressTypeEnum = pgEnum('contact_address_type', [
  'work',
  'home',
  'other',
]);

export const contactSocialPlatformEnum = pgEnum('contact_social_platform', [
  'linkedin',
  'twitter',
  'facebook',
  'instagram',
  'github',
  'other',
]);

export const contactFieldTypeEnum = pgEnum('contact_field_type', [
  'text',
  'number',
  'date',
  'url',
]);

// ============================================================================
// COMMUNICATION ENUMS
// ============================================================================

export const communicationPlanTypeEnum = pgEnum('communication_plan_type', [
  'personal',
  'professional',
  'enterprise',
  'custom',
]);

export const communicationTypeEnum = pgEnum('communication_type', [
  'sms',
  'voice_call',
]);

export const communicationStatusEnum = pgEnum('communication_status', [
  'sent',
  'failed',
  'rate_limited',
]);

// ============================================================================
// CONTACTS TABLE
// ============================================================================

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Basic info
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    displayName: varchar('display_name', { length: 200 }),
    nickname: varchar('nickname', { length: 100 }),

    // Work info
    company: varchar('company', { length: 200 }),
    jobTitle: varchar('job_title', { length: 200 }),
    department: varchar('department', { length: 100 }),

    // Personal info
    birthday: timestamp('birthday'),
    notes: text('notes'),

    // Avatar
    avatarUrl: text('avatar_url'),
    avatarProvider: varchar('avatar_provider', { length: 50 }), // google/microsoft/manual

    // Source tracking
    sourceType: contactSourceTypeEnum('source_type').default('manual'),
    sourceProvider: varchar('source_provider', { length: 50 }), // gmail/microsoft
    sourceId: text('source_id'), // provider's contact ID

    // Status
    isFavorite: boolean('is_favorite').default(false).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastContactedAt: timestamp('last_contacted_at'),
  },
  (table) => ({
    userIdIdx: index('contacts_user_id_idx').on(table.userId),
    firstNameIdx: index('contacts_first_name_idx').on(table.firstName),
    lastNameIdx: index('contacts_last_name_idx').on(table.lastName),
    companyIdx: index('contacts_company_idx').on(table.company),
    isFavoriteIdx: index('contacts_is_favorite_idx').on(table.isFavorite),
    isArchivedIdx: index('contacts_is_archived_idx').on(table.isArchived),
    lastContactedAtIdx: index('contacts_last_contacted_at_idx').on(
      table.lastContactedAt
    ),
  })
);

// ============================================================================
// CONTACT EMAILS TABLE
// ============================================================================

export const contactEmails = pgTable(
  'contact_emails',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    type: contactEmailTypeEnum('type').default('other'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('contact_emails_contact_id_idx').on(table.contactId),
    emailIdx: index('contact_emails_email_idx').on(table.email),
    isPrimaryIdx: index('contact_emails_is_primary_idx').on(table.isPrimary),
  })
);

// ============================================================================
// CONTACT PHONES TABLE
// ============================================================================

export const contactPhones = pgTable(
  'contact_phones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    phone: varchar('phone', { length: 50 }).notNull(),
    type: contactPhoneTypeEnum('type').default('other'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('contact_phones_contact_id_idx').on(table.contactId),
    phoneIdx: index('contact_phones_phone_idx').on(table.phone),
  })
);

// ============================================================================
// CONTACT GROUPS TABLE
// ============================================================================

export const contactGroups = pgTable(
  'contact_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 7 }).notNull().default('#3B82F6'),
    isFavorite: boolean('is_favorite').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_contact_groups_user_id').on(table.userId),
    nameIdx: index('idx_contact_groups_name').on(table.name),
    isFavoriteIdx: index('idx_contact_groups_is_favorite').on(table.isFavorite),
    userNameIdx: uniqueIndex('idx_contact_groups_user_name').on(
      table.userId,
      table.name
    ),
  })
);

// ============================================================================
// CONTACT GROUP MEMBERS TABLE (Many-to-Many)
// ============================================================================

export const contactGroupMembers = pgTable(
  'contact_group_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => contactGroups.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (table) => ({
    groupIdIdx: index('idx_contact_group_members_group_id').on(table.groupId),
    contactIdIdx: index('idx_contact_group_members_contact_id').on(
      table.contactId
    ),
    uniqueIdx: uniqueIndex('idx_contact_group_members_unique').on(
      table.groupId,
      table.contactId
    ),
  })
);

// ============================================================================
// CONTACT TAGS TABLE
// ============================================================================

export const contactTags = pgTable(
  'contact_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }).notNull().default('#10B981'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_contact_tags_user_id').on(table.userId),
    nameIdx: index('idx_contact_tags_name').on(table.name),
    userNameIdx: uniqueIndex('idx_contact_tags_user_name').on(
      table.userId,
      table.name
    ),
  })
);

// ============================================================================
// CONTACT TAG ASSIGNMENTS TABLE (Many-to-Many)
// ============================================================================

export const contactTagAssignments = pgTable(
  'contact_tag_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => contactTags.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('idx_contact_tag_assignments_contact_id').on(
      table.contactId
    ),
    tagIdIdx: index('idx_contact_tag_assignments_tag_id').on(table.tagId),
    uniqueIdx: uniqueIndex('idx_contact_tag_assignments_unique').on(
      table.contactId,
      table.tagId
    ),
  })
);

// ============================================================================
// CONTACT ADDRESSES TABLE
// ============================================================================

export const contactAddresses = pgTable(
  'contact_addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    street: text('street'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    zipCode: varchar('zip_code', { length: 20 }),
    country: varchar('country', { length: 100 }),
    type: contactAddressTypeEnum('type').default('other'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('contact_addresses_contact_id_idx').on(table.contactId),
  })
);

// ============================================================================
// CONTACT SOCIAL LINKS TABLE
// ============================================================================

export const contactSocialLinks = pgTable(
  'contact_social_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    platform: contactSocialPlatformEnum('platform').notNull(),
    url: text('url').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('contact_social_links_contact_id_idx').on(
      table.contactId
    ),
  })
);

// ============================================================================
// CONTACT CUSTOM FIELDS TABLE
// ============================================================================

export const contactCustomFields = pgTable(
  'contact_custom_fields',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    fieldName: varchar('field_name', { length: 100 }).notNull(),
    fieldValue: text('field_value'),
    fieldType: contactFieldTypeEnum('field_type').default('text'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('contact_custom_fields_contact_id_idx').on(
      table.contactId
    ),
  })
);

// ============================================================================
// CONTACT NOTES TABLE
// ============================================================================

export const contactNotes = pgTable(
  'contact_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('contact_notes_contact_id_idx').on(table.contactId),
    userIdIdx: index('contact_notes_user_id_idx').on(table.userId),
    createdAtIdx: index('contact_notes_created_at_idx').on(table.createdAt),
  })
);

// ============================================================================
// CONTACT TIMELINE TABLE
// ============================================================================

export const contactTimeline = pgTable(
  'contact_timeline',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: contactEventTypeEnum('event_type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    metadata: jsonb('metadata'), // Store related IDs, email subjects, etc.
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    contactIdIdx: index('contact_timeline_contact_id_idx').on(table.contactId),
    userIdIdx: index('contact_timeline_user_id_idx').on(table.userId),
    eventTypeIdx: index('contact_timeline_event_type_idx').on(table.eventType),
    createdAtIdx: index('contact_timeline_created_at_idx').on(table.createdAt),
  })
);

// ============================================================================
// SYNC JOBS TABLE
// ============================================================================

export const syncJobs = pgTable(
  'sync_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Job details
    jobType: syncJobTypeEnum('job_type').notNull().default('incremental'),
    status: syncStatusEnum('status').notNull().default('pending'),
    priority: integer('priority').default(2).notNull(), // 0=immediate, 1=high, 2=normal, 3=low, 4=background

    // Progress tracking
    progress: integer('progress').default(0),
    total: integer('total').default(0),

    // Timing
    scheduledFor: timestamp('scheduled_for'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    // Error handling
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0),
    maxRetries: integer('max_retries').default(5),

    // Metadata
    metadata: jsonb('metadata').$type<{
      folders?: string[];
      since?: string;
      limit?: number;
      cursor?: string;
    }>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    accountIdIdx: index('sync_jobs_account_id_idx').on(table.accountId),
    userIdIdx: index('sync_jobs_user_id_idx').on(table.userId),
    statusIdx: index('sync_jobs_status_idx').on(table.status),
    priorityIdx: index('sync_jobs_priority_idx').on(table.priority),
    scheduledForIdx: index('sync_jobs_scheduled_for_idx').on(
      table.scheduledFor
    ),
  })
);

// Email Signatures Table
export const emailSignatures = pgTable(
  'email_signatures',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Signature details
    name: text('name').notNull(),
    htmlContent: text('html_content').notNull(),
    textContent: text('text_content'),

    // Settings
    isDefault: boolean('is_default').default(false).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),

    // Account association (null = all accounts)
    accountId: uuid('account_id').references(() => emailAccounts.id, {
      onDelete: 'cascade',
    }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('email_signatures_user_id_idx').on(table.userId),
    accountIdIdx: index('email_signatures_account_id_idx').on(table.accountId),
  })
);

// Email Rules Table
export const emailRules = pgTable(
  'email_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id').references(() => emailAccounts.id, {
      onDelete: 'cascade',
    }),

    // Rule details
    name: text('name').notNull(),
    description: text('description'),

    // Conditions (stored as JSON)
    conditions: jsonb('conditions')
      .$type<{
        logic: 'AND' | 'OR';
        rules: Array<{
          field: string;
          operator: string;
          value: string | boolean | number;
        }>;
      }>()
      .notNull(),

    // Actions (stored as JSON)
    actions: jsonb('actions')
      .$type<
        Array<{
          type: string;
          value?: string | boolean;
        }>
      >()
      .notNull(),

    // Settings
    isEnabled: boolean('is_enabled').default(true).notNull(),
    priority: integer('priority').default(0).notNull(), // Lower number = higher priority
    stopProcessing: boolean('stop_processing').default(false).notNull(), // Stop processing rules after this one matches

    // Stats
    timesTriggered: integer('times_triggered').default(0).notNull(),
    lastTriggered: timestamp('last_triggered'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('email_rules_user_id_idx').on(table.userId),
    accountIdIdx: index('email_rules_account_id_idx').on(table.accountId),
    priorityIdx: index('email_rules_priority_idx').on(table.priority),
    isEnabledIdx: index('email_rules_is_enabled_idx').on(table.isEnabled),
  })
);

// AI Reply Drafts Status Enum
export const aiReplyStatusEnum = pgEnum('ai_reply_status', [
  'analyzing',
  'questioning',
  'drafting',
  'ready',
  'approved',
  'sent',
]);

// Chatbot Action Type Enum (for undo system)
export const chatbotActionTypeEnum = pgEnum('chatbot_action_type', [
  'bulk_move',
  'bulk_archive',
  'bulk_delete',
  'bulk_mark_read',
  'bulk_star',
  'create_folder',
  'delete_folder',
  'rename_folder',
  'create_rule',
  'delete_rule',
  'update_rule',
  'create_contact',
  'update_contact',
  'delete_contact',
  'create_calendar_event',
  'update_calendar_event',
  'delete_calendar_event',
  'update_settings',
]);

// Email Template Category Enum
export const emailTemplateCategoryEnum = pgEnum('email_template_category', [
  'meeting',
  'thanks',
  'intro',
  'followup',
  'apology',
  'announcement',
  'other',
]);
export type EmailTemplateCategory =
  (typeof emailTemplateCategoryEnum.enumValues)[number];

// AI Reply Drafts Table
export const aiReplyDrafts = pgTable(
  'ai_reply_drafts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Draft content
    draftBody: text('draft_body').notNull().default(''),
    draftSubject: text('draft_subject').notNull(),

    // AI conversation
    conversationHistory: jsonb('conversation_history').$type<
      Array<{ role: string; content: string }>
    >(),
    questions: jsonb('questions').$type<string[]>(),
    userResponses: jsonb('user_responses').$type<Record<string, string>>(),

    // Status
    status: aiReplyStatusEnum('status').default('analyzing').notNull(),

    // Metadata
    tone: text('tone'), // professional, casual, friendly, formal
    length: text('length'), // brief, moderate, detailed
    includeContext: boolean('include_context').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdIdx: index('ai_reply_drafts_email_id_idx').on(table.emailId),
    userIdIdx: index('ai_reply_drafts_user_id_idx').on(table.userId),
    statusIdx: index('ai_reply_drafts_status_idx').on(table.status),
  })
);

// ============================================================================
// CHATBOT ACTIONS TABLE (for undo system)
// ============================================================================

export const chatbotActions = pgTable(
  'chatbot_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Action details
    actionType: chatbotActionTypeEnum('action_type').notNull(),
    description: text('description').notNull(),

    // Undo data (stores what's needed to reverse the action)
    undoData: jsonb('undo_data')
      .$type<{
        emailIds?: string[];
        originalFolder?: string;
        targetFolder?: string;
        folderId?: string;
        folderName?: string;
        ruleId?: string;
        contactId?: string;
        eventId?: string;
        originalValues?: Record<string, any>;
      }>()
      .notNull(),

    // Status
    isUndone: boolean('is_undone').default(false).notNull(),

    // Expiry (actions expire after 24 hours)
    expiresAt: timestamp('expires_at').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('chatbot_actions_user_id_idx').on(table.userId),
    actionTypeIdx: index('chatbot_actions_action_type_idx').on(
      table.actionType
    ),
    expiresAtIdx: index('chatbot_actions_expires_at_idx').on(table.expiresAt),
    isUndoneIdx: index('chatbot_actions_is_undone_idx').on(table.isUndone),
  })
);

// ============================================================================
// EXTRACTED ACTIONS TABLE (action items from emails)
// ============================================================================

export const extractedActions = pgTable(
  'extracted_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Action item details
    description: text('description').notNull(),
    dueDate: timestamp('due_date'),
    priority: priorityEnum('priority').default('medium'),
    assignee: text('assignee'),

    // Status
    isCompleted: boolean('is_completed').default(false).notNull(),
    completedAt: timestamp('completed_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdIdx: index('extracted_actions_email_id_idx').on(table.emailId),
    userIdIdx: index('extracted_actions_user_id_idx').on(table.userId),
    isCompletedIdx: index('extracted_actions_is_completed_idx').on(
      table.isCompleted
    ),
    dueDateIdx: index('extracted_actions_due_date_idx').on(table.dueDate),
  })
);

// ============================================================================
// FOLLOW-UP REMINDERS TABLE
// ============================================================================

export const followUpReminders = pgTable(
  'follow_up_reminders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Reminder details
    originalEmailDate: timestamp('original_email_date').notNull(),
    suggestedFollowUpDate: timestamp('suggested_follow_up_date').notNull(),
    reason: text('reason').notNull(),

    // Status
    isDismissed: boolean('is_dismissed').default(false).notNull(),
    isSnoozed: boolean('is_snoozed').default(false).notNull(),
    snoozeUntil: timestamp('snooze_until'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdIdx: index('follow_up_reminders_email_id_idx').on(table.emailId),
    userIdIdx: index('follow_up_reminders_user_id_idx').on(table.userId),
    suggestedDateIdx: index('follow_up_reminders_suggested_date_idx').on(
      table.suggestedFollowUpDate
    ),
    isDismissedIdx: index('follow_up_reminders_is_dismissed_idx').on(
      table.isDismissed
    ),
  })
);

// ============================================================================
// EMAIL TEMPLATES TABLE
// ============================================================================

export const emailTemplates = pgTable(
  'email_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Template details
    name: varchar('name', { length: 100 }).notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),

    // Categorization
    category: emailTemplateCategoryEnum('category').default('other'),

    // Variables (array of variable names like ["name", "date", "topic"])
    variables: jsonb('variables').$type<string[]>().default([]),

    // Usage tracking
    useCount: integer('use_count').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('email_templates_user_id_idx').on(table.userId),
    categoryIdx: index('email_templates_category_idx').on(table.category),
  })
);

// ============================================================================
// EMAIL DRAFTS TABLE
// ============================================================================

export const emailDrafts = pgTable(
  'email_drafts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),

    // Email fields
    to: text('to'),
    cc: text('cc'),
    bcc: text('bcc'),
    subject: text('subject'),
    body: text('body'), // HTML content

    // Attachments (stored as JSON array)
    attachments: jsonb('attachments').$type<
      Array<{
        id: string;
        name: string;
        size: number;
        type: string;
        data: string; // Base64
      }>
    >(),

    // Draft metadata
    mode: text('mode', { enum: ['compose', 'reply', 'forward'] })
      .default('compose')
      .notNull(),
    replyToId: uuid('reply_to_id').references(() => emails.id, {
      onDelete: 'set null',
    }),

    lastSaved: timestamp('last_saved').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('email_drafts_user_id_idx').on(table.userId),
    accountIdIdx: index('email_drafts_account_id_idx').on(table.accountId),
    lastSavedIdx: index('email_drafts_last_saved_idx').on(table.lastSaved),
  })
);

// ============================================================================
// SCHEDULED EMAILS TABLE
// ============================================================================

export const scheduledEmailStatusEnum = pgEnum('scheduled_email_status', [
  'pending',
  'sent',
  'failed',
  'cancelled',
]);

export const scheduledEmails = pgTable(
  'scheduled_emails',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),

    // Email fields
    to: text('to').notNull(),
    cc: text('cc'),
    bcc: text('bcc'),
    subject: text('subject').notNull(),
    body: text('body').notNull(), // HTML content

    // Attachments (stored as JSON array)
    attachments: jsonb('attachments').$type<
      Array<{
        id: string;
        name: string;
        size: number;
        type: string;
        data: string; // Base64
      }>
    >(),

    // Scheduling
    scheduledFor: timestamp('scheduled_for').notNull(),
    timezone: text('timezone').default('UTC'),
    status: scheduledEmailStatusEnum('status').default('pending').notNull(),

    // Error tracking
    errorMessage: text('error_message'),
    attemptCount: integer('attempt_count').default(0).notNull(),

    // Metadata
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('scheduled_emails_user_id_idx').on(table.userId),
    accountIdIdx: index('scheduled_emails_account_id_idx').on(table.accountId),
    scheduledForIdx: index('scheduled_emails_scheduled_for_idx').on(
      table.scheduledFor
    ),
    statusIdx: index('scheduled_emails_status_idx').on(table.status),
  })
);

// ============================================================================
// TASKS TABLE
// ============================================================================

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
]);

export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    description: text('description'),
    completed: boolean('completed').default(false).notNull(),
    status: taskStatusEnum('status').default('pending').notNull(),
    priority: taskPriorityEnum('priority').default('medium'),

    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),

    // Optional email association
    emailId: uuid('email_id').references(() => emails.id, {
      onDelete: 'set null',
    }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('tasks_user_id_idx').on(table.userId),
    statusIdx: index('tasks_status_idx').on(table.status),
    completedIdx: index('tasks_completed_idx').on(table.completed),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
  })
);

// ============================================================================
// CALENDAR ENUMS
// ============================================================================

export const calendarEventTypeEnum = pgEnum('calendar_event_type', [
  'meeting',
  'task',
  'personal',
  'reminder',
  'all_day',
]);

export const calendarEventStatusEnum = pgEnum('calendar_event_status', [
  'confirmed',
  'tentative',
  'cancelled',
]);

export const attendeeResponseStatusEnum = pgEnum('attendee_response_status', [
  'pending',
  'accepted',
  'declined',
  'tentative',
]);

export const reminderMethodEnum = pgEnum('reminder_method', [
  'email',
  'push',
  'sms',
]);

export const externalCalendarProviderEnum = pgEnum(
  'external_calendar_provider',
  ['google', 'microsoft', 'apple', 'other']
);

export const syncDirectionEnum = pgEnum('sync_direction', [
  'pull',
  'push',
  'bidirectional',
]);

// ============================================================================
// CALENDAR EVENTS TABLE
// ============================================================================

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Basic Info
    title: text('title').notNull(),
    description: text('description'),
    location: text('location'),
    isVirtual: boolean('is_virtual').default(false),
    meetingUrl: text('meeting_url'),

    // Timing
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    timezone: text('timezone').default('UTC'),
    isAllDay: boolean('is_all_day').default(false),

    // Categorization
    type: calendarEventTypeEnum('type').notNull().default('meeting'),
    status: calendarEventStatusEnum('status').default('confirmed'),
    color: text('color').default('blue'), // blue, purple, green, orange, red, pink

    // Recurrence (for repeating events)
    isRecurring: boolean('is_recurring').default(false),
    recurrenceRule: text('recurrence_rule'), // RRULE format (RFC 5545)
    recurrenceEndDate: timestamp('recurrence_end_date'),
    parentEventId: uuid('parent_event_id'), // For recurring event instances

    // Integration with Emails
    emailThreadId: text('email_thread_id'), // Link to email thread
    emailId: uuid('email_id').references(() => emails.id, {
      onDelete: 'set null',
    }),

    // External Calendar Integration
    externalEventId: text('external_event_id'), // Google/MS calendar event ID
    externalCalendarId: text('external_calendar_id'), // Which external calendar
    externalProvider: externalCalendarProviderEnum('external_provider'),

    // Metadata
    createdBy: text('created_by').default('user'), // 'user', 'ai', 'sync'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('calendar_events_user_id_idx').on(table.userId),
    startTimeIdx: index('calendar_events_start_time_idx').on(table.startTime),
    endTimeIdx: index('calendar_events_end_time_idx').on(table.endTime),
    emailThreadIdx: index('calendar_events_email_thread_idx').on(
      table.emailThreadId
    ),
    emailIdIdx: index('calendar_events_email_id_idx').on(table.emailId),
    externalEventIdx: index('calendar_events_external_id_idx').on(
      table.externalEventId
    ),
    typeIdx: index('calendar_events_type_idx').on(table.type),
    statusIdx: index('calendar_events_status_idx').on(table.status),
  })
);

// ============================================================================
// CALENDAR ATTENDEES TABLE
// ============================================================================

export const calendarAttendees = pgTable(
  'calendar_attendees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => calendarEvents.id, { onDelete: 'cascade' }),

    email: text('email').notNull(),
    name: text('name'),
    responseStatus:
      attendeeResponseStatusEnum('response_status').default('pending'),
    isOrganizer: boolean('is_organizer').default(false),
    isOptional: boolean('is_optional').default(false),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    eventIdIdx: index('calendar_attendees_event_id_idx').on(table.eventId),
    emailIdx: index('calendar_attendees_email_idx').on(table.email),
  })
);

// ============================================================================
// CALENDAR REMINDERS TABLE
// ============================================================================

export const calendarReminders = pgTable(
  'calendar_reminders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => calendarEvents.id, { onDelete: 'cascade' }),

    minutesBefore: integer('minutes_before').notNull(), // 0, 5, 15, 30, 60, 1440 (1 day), etc.
    method: reminderMethodEnum('method').notNull(),
    sent: boolean('sent').default(false),
    sentAt: timestamp('sent_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    eventIdIdx: index('calendar_reminders_event_id_idx').on(table.eventId),
    sentIdx: index('calendar_reminders_sent_idx').on(table.sent),
  })
);

// ============================================================================
// EXTERNAL CALENDARS TABLE
// For syncing with Google Calendar, Microsoft Calendar, etc.
// ============================================================================

export const externalCalendars = pgTable(
  'external_calendars',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    provider: externalCalendarProviderEnum('provider').notNull(),
    calendarId: text('calendar_id').notNull(), // External calendar ID
    calendarName: text('calendar_name'),
    calendarColor: text('calendar_color'),

    // Sync settings
    syncEnabled: boolean('sync_enabled').default(true),
    syncDirection: syncDirectionEnum('sync_direction').default('bidirectional'),
    lastSyncAt: timestamp('last_sync_at'),
    syncToken: text('sync_token'), // For incremental sync
    nextSyncToken: text('next_sync_token'),

    // OAuth tokens (should be encrypted in production)
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('external_calendars_user_id_idx').on(table.userId),
    providerIdx: index('external_calendars_provider_idx').on(table.provider),
    syncEnabledIdx: index('external_calendars_sync_enabled_idx').on(
      table.syncEnabled
    ),
  })
);

// ============================================================================
// CUSTOM LABELS TABLE
// ============================================================================

export const customLabels = pgTable(
  'custom_labels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 20 }).notNull(), // hex color or color name
    icon: varchar('icon', { length: 50 }), // icon name from Lucide
    sortOrder: integer('sort_order').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('custom_labels_user_id_idx').on(table.userId),
    sortOrderIdx: index('custom_labels_sort_order_idx').on(table.sortOrder),
  })
);

// ============================================================================
// LABEL ASSIGNMENTS (Junction Table)
// ============================================================================

export const labelAssignments = pgTable(
  'label_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    labelId: uuid('label_id')
      .notNull()
      .references(() => customLabels.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdIdx: index('label_assignments_email_id_idx').on(table.emailId),
    labelIdIdx: index('label_assignments_label_id_idx').on(table.labelId),
    uniqueAssignment: uniqueIndex('label_assignments_unique_idx').on(
      table.emailId,
      table.labelId
    ),
  })
);

// ============================================================================
// USER PREFERENCES TABLE
// ============================================================================

export const densityEnum = pgEnum('density', [
  'comfortable',
  'compact',
  'default',
]);

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // UI Preferences
  density: densityEnum('density').default('default').notNull(),
  language: varchar('language', { length: 10 }).default('en').notNull(),

  // Notification Settings
  desktopNotifications: boolean('desktop_notifications')
    .default(true)
    .notNull(),
  soundEffects: boolean('sound_effects').default(true).notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),

  // Sidebar Preferences
  sidebarCollapsed: boolean('sidebar_collapsed').default(false).notNull(),
  sidebarWidth: integer('sidebar_width').default(260).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// USER AI PROFILES TABLE
// Stores learned writing style and communication patterns
// ============================================================================

export const userAIProfiles = pgTable('user_ai_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Writing style analysis
  writingStyle: jsonb('writing_style').$type<{
    tone?: string;
    formality?: string;
    wordChoicePatterns?: string[];
  }>(),
  commonPhrases: text('common_phrases').array().default([]),
  vocabularyLevel: text('vocabulary_level').default('moderate'),
  avgEmailLength: integer('avg_email_length').default(200),
  greetingStyle: text('greeting_style').default('Hi'),
  closingStyle: text('closing_style').default('Best'),

  // Communication patterns
  responseTimeAvg: integer('response_time_avg').default(60), // minutes
  activeHours: jsonb('active_hours').$type<{
    start?: number;
    end?: number;
  }>(),
  preferredTone: text('preferred_tone').default('professional'),
  emojiUsage: boolean('emoji_usage').default(false),

  // Behavioral patterns
  frequentContacts: text('frequent_contacts').array().default([]),
  commonTopics: text('common_topics').array().default([]),
  meetingFrequency: jsonb('meeting_frequency').$type<Record<string, any>>(),

  // AI preferences
  learnedPreferences: jsonb('learned_preferences').$type<Record<string, any>>(),

  // Analysis metadata
  lastAnalyzedAt: timestamp('last_analyzed_at').defaultNow(),
  totalEmailsAnalyzed: integer('total_emails_analyzed').default(0),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// WEBHOOK SUBSCRIPTIONS TABLE
// ============================================================================

export const webhookSubscriptions = pgTable(
  'webhook_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => emailAccounts.id, { onDelete: 'cascade' }),

    // Microsoft Graph subscription details
    subscriptionId: varchar('subscription_id', { length: 255 })
      .notNull()
      .unique(),
    resource: text('resource').notNull(), // e.g., /me/mailFolders/inbox/messages
    changeType: varchar('change_type', { length: 100 }).notNull(), // created,updated,deleted
    notificationUrl: text('notification_url').notNull(),
    clientState: varchar('client_state', { length: 255 }).notNull(),

    // Expiration management
    expirationDateTime: timestamp('expiration_date_time').notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastRenewedAt: timestamp('last_renewed_at'),
  },
  (table) => ({
    accountIdIdx: index('webhook_subscriptions_account_id_idx').on(
      table.accountId
    ),
    subscriptionIdIdx: uniqueIndex(
      'webhook_subscriptions_subscription_id_idx'
    ).on(table.subscriptionId),
    expirationIdx: index('webhook_subscriptions_expiration_idx').on(
      table.expirationDateTime
    ),
  })
);

// ============================================================================
// COMMUNICATION SETTINGS TABLE
// Stores user's Twilio configuration and billing preferences
// ============================================================================

export const communicationSettings = pgTable('communication_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  twilioAccountSid: text('twilio_account_sid'),
  twilioAuthToken: text('twilio_auth_token'),
  twilioPhoneNumber: text('twilio_phone_number'),
  useCustomTwilio: boolean('use_custom_twilio').default(false).notNull(),
  billingEnabled: boolean('billing_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// COMMUNICATION LIMITS TABLE
// Rate limiting rules per user to prevent abuse
// ============================================================================

export const communicationLimits = pgTable('communication_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  planType: communicationPlanTypeEnum('plan_type')
    .default('personal')
    .notNull(),
  smsPerMinute: integer('sms_per_minute').default(1).notNull(),
  smsPerHour: integer('sms_per_hour').default(10).notNull(),
  smsPerDay: integer('sms_per_day').default(100).notNull(),
  voicePerMinute: integer('voice_per_minute').default(1).notNull(),
  voicePerHour: integer('voice_per_hour').default(5).notNull(),
  voicePerDay: integer('voice_per_day').default(20).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  overrideBy: uuid('override_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// COMMUNICATION USAGE TABLE
// Audit log of all SMS and voice communications
// ============================================================================

export const communicationUsage = pgTable(
  'communication_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: communicationTypeEnum('type').notNull(),
    recipientPhone: text('recipient_phone').notNull(),
    contactId: uuid('contact_id').references(() => contacts.id, {
      onDelete: 'set null',
    }),
    status: communicationStatusEnum('status').notNull(),
    cost: varchar('cost', { length: 20 }),
    usedCustomTwilio: boolean('used_custom_twilio').default(false).notNull(),
    messagePreview: text('message_preview'),
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
  },
  (table) => ({
    userTimeIdx: index('comm_usage_user_time_idx').on(
      table.userId,
      table.sentAt
    ),
    userTypeIdx: index('comm_usage_user_type_idx').on(table.userId, table.type),
    statusIdx: index('comm_usage_status_idx').on(table.status),
    contactIdx: index('comm_usage_contact_idx').on(table.contactId),
  })
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type NewEmailAccount = typeof emailAccounts.$inferInsert;

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;

export type EmailThread = typeof emailThreads.$inferSelect;
export type NewEmailThread = typeof emailThreads.$inferInsert;

export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type NewEmailAttachment = typeof emailAttachments.$inferInsert;

export type EmailLabel = typeof emailLabels.$inferSelect;
export type NewEmailLabel = typeof emailLabels.$inferInsert;

export type EmailContact = typeof emailContacts.$inferSelect;
export type NewEmailContact = typeof emailContacts.$inferInsert;

export type EmailSetting = typeof emailSettings.$inferSelect;
export type NewEmailSetting = typeof emailSettings.$inferInsert;

export type CustomFolder = typeof customFolders.$inferSelect;
export type NewCustomFolder = typeof customFolders.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type ContactEmail = typeof contactEmails.$inferSelect;
export type NewContactEmail = typeof contactEmails.$inferInsert;

export type ContactPhone = typeof contactPhones.$inferSelect;
export type NewContactPhone = typeof contactPhones.$inferInsert;

export type ContactAddress = typeof contactAddresses.$inferSelect;
export type NewContactAddress = typeof contactAddresses.$inferInsert;

export type ContactSocialLink = typeof contactSocialLinks.$inferSelect;
export type NewContactSocialLink = typeof contactSocialLinks.$inferInsert;

export type ContactTag = typeof contactTags.$inferSelect;
export type NewContactTag = typeof contactTags.$inferInsert;

export type ContactTagAssignment = typeof contactTagAssignments.$inferSelect;
export type NewContactTagAssignment = typeof contactTagAssignments.$inferInsert;

export type ContactCustomField = typeof contactCustomFields.$inferSelect;
export type NewContactCustomField = typeof contactCustomFields.$inferInsert;

export type ContactNote = typeof contactNotes.$inferSelect;
export type NewContactNote = typeof contactNotes.$inferInsert;

export type SyncJob = typeof syncJobs.$inferSelect;
export type NewSyncJob = typeof syncJobs.$inferInsert;

export type EmailSignature = typeof emailSignatures.$inferSelect;
export type NewEmailSignature = typeof emailSignatures.$inferInsert;

export type EmailRule = typeof emailRules.$inferSelect;
export type NewEmailRule = typeof emailRules.$inferInsert;

export type SenderTrust = typeof senderTrust.$inferSelect;
export type NewSenderTrust = typeof senderTrust.$inferInsert;

export type AIReplyDraft = typeof aiReplyDrafts.$inferSelect;
export type NewAIReplyDraft = typeof aiReplyDrafts.$inferInsert;

export type ChatbotAction = typeof chatbotActions.$inferSelect;
export type NewChatbotAction = typeof chatbotActions.$inferInsert;

export type ExtractedAction = typeof extractedActions.$inferSelect;
export type NewExtractedAction = typeof extractedActions.$inferInsert;

export type FollowUpReminder = typeof followUpReminders.$inferSelect;
export type NewFollowUpReminder = typeof followUpReminders.$inferInsert;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;

export type EmailDraft = typeof emailDrafts.$inferSelect;
export type NewEmailDraft = typeof emailDrafts.$inferInsert;

export type ScheduledEmail = typeof scheduledEmails.$inferSelect;
export type NewScheduledEmail = typeof scheduledEmails.$inferInsert;
export type ScheduledEmailStatus =
  (typeof scheduledEmailStatusEnum.enumValues)[number];

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;

export type CalendarAttendee = typeof calendarAttendees.$inferSelect;
export type NewCalendarAttendee = typeof calendarAttendees.$inferInsert;

export type CalendarReminder = typeof calendarReminders.$inferSelect;
export type NewCalendarReminder = typeof calendarReminders.$inferInsert;

export type ExternalCalendar = typeof externalCalendars.$inferSelect;
export type NewExternalCalendar = typeof externalCalendars.$inferInsert;

export type CustomLabel = typeof customLabels.$inferSelect;
export type NewCustomLabel = typeof customLabels.$inferInsert;

export type LabelAssignment = typeof labelAssignments.$inferSelect;
export type NewLabelAssignment = typeof labelAssignments.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type UserAIProfile = typeof userAIProfiles.$inferSelect;
export type NewUserAIProfile = typeof userAIProfiles.$inferInsert;

export type WebhookSubscription = typeof webhookSubscriptions.$inferSelect;
export type NewWebhookSubscription = typeof webhookSubscriptions.$inferInsert;

export type CommunicationSettings = typeof communicationSettings.$inferSelect;
export type NewCommunicationSettings =
  typeof communicationSettings.$inferInsert;

export type CommunicationLimits = typeof communicationLimits.$inferSelect;
export type NewCommunicationLimits = typeof communicationLimits.$inferInsert;

export type CommunicationUsage = typeof communicationUsage.$inferSelect;
export type NewCommunicationUsage = typeof communicationUsage.$inferInsert;
export type CommunicationType =
  (typeof communicationTypeEnum.enumValues)[number];
export type CommunicationStatus =
  (typeof communicationStatusEnum.enumValues)[number];
export type CommunicationPlanType =
  (typeof communicationPlanTypeEnum.enumValues)[number];

// ============================================================================
// EMBEDDING QUEUE TABLE (For background RAG processing)
// ============================================================================

export const embeddingQueueStatusEnum = pgEnum('embedding_queue_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const embeddingQueue = pgTable(
  'embedding_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: embeddingQueueStatusEnum('status').default('pending').notNull(),
    priority: integer('priority').default(0).notNull(), // Higher = more important
    attempts: integer('attempts').default(0).notNull(),
    lastAttemptAt: timestamp('last_attempt_at'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (table) => ({
    statusIdx: index('embedding_queue_status_idx').on(table.status),
    priorityIdx: index('embedding_queue_priority_idx').on(
      table.priority,
      table.createdAt
    ),
    userIdIdx: index('embedding_queue_user_id_idx').on(table.userId),
  })
);

export type EmbeddingQueueItem = typeof embeddingQueue.$inferSelect;
export type NewEmbeddingQueueItem = typeof embeddingQueue.$inferInsert;

// ============================================================================
// CONTACT TIMELINE QUEUE TABLE (For background contact logging)
// ============================================================================

export const timelineQueueStatusEnum = pgEnum('timeline_queue_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const contactTimelineQueue = pgTable(
  'contact_timeline_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    senderEmail: text('sender_email').notNull(),
    subject: text('subject').notNull(),
    status: timelineQueueStatusEnum('status').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    lastAttemptAt: timestamp('last_attempt_at'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (table) => ({
    statusIdx: index('timeline_queue_status_idx').on(table.status),
    createdAtIdx: index('timeline_queue_created_at_idx').on(table.createdAt),
    userIdIdx: index('timeline_queue_user_id_idx').on(table.userId),
  })
);

export type ContactTimelineQueueItem = typeof contactTimelineQueue.$inferSelect;
export type NewContactTimelineQueueItem =
  typeof contactTimelineQueue.$inferInsert;

// ============================================================================
// TABLE RELATIONS
// Define relationships between tables for Drizzle's relational queries
// ============================================================================

// Calendar Event Relations
export const calendarEventsRelations = relations(calendarEvents, ({ many }) => ({
  attendees: many(calendarAttendees),
  reminders: many(calendarReminders),
}));

// Calendar Attendee Relations
export const calendarAttendeesRelations = relations(
  calendarAttendees,
  ({ one }) => ({
    event: one(calendarEvents, {
      fields: [calendarAttendees.eventId],
      references: [calendarEvents.id],
    }),
  })
);

// Calendar Reminder Relations
export const calendarRemindersRelations = relations(
  calendarReminders,
  ({ one }) => ({
    event: one(calendarEvents, {
      fields: [calendarReminders.eventId],
      references: [calendarEvents.id],
    }),
  })
);
