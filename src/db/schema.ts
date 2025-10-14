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
} from 'drizzle-orm/pg-core';

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

    // Metadata
    receivedAt: timestamp('received_at').notNull(),
    sentAt: timestamp('sent_at'),

    // Flags
    isRead: boolean('is_read').default(false).notNull(),
    isStarred: boolean('is_starred').default(false).notNull(),
    isImportant: boolean('is_important').default(false).notNull(),
    isDraft: boolean('is_draft').default(false).notNull(),
    hasDrafts: boolean('has_drafts').default(false).notNull(),
    hasAttachments: boolean('has_attachments').default(false).notNull(),

    // Folder/Label info
    folderName: text('folder_name'),
    labelIds: text('label_ids').array(),

    // Hey-inspired features
    screeningStatus: screeningStatusEnum('screening_status').default('pending'),
    heyView: heyViewEnum('hey_view'),
    contactStatus: contactStatusEnum('contact_status').default('unknown'),
    replyLaterUntil: timestamp('reply_later_until'),
    replyLaterNote: text('reply_later_note'),
    setAsideAt: timestamp('set_aside_at'),

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

    // Search
    searchVector: text('search_vector'),

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
  })
);

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
