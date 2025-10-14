# AI Email Client - Data Models & Database Schema

[← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md) | [← Back to Features](AI_EMAIL_CLIENT_PRD_FEATURES.md)

---

## 📊 Database Schema

### Overview

The email client uses **PostgreSQL** with Drizzle ORM for type-safe database access. The schema supports:
- Multi-account email management
- Thread tracking and conversation history
- AI-generated insights caching
- Email rules and automation
- Hey-inspired workflow features

---

## 🗄️ Core Tables

### 1. `email_accounts`

Stores user email account connections with encrypted credentials.

```typescript
export const emailAccountsTable = pgTable("email_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
  
  // Provider info
  provider: emailProviderEnum("provider").notNull(), // gmail, microsoft, imap, etc.
  authType: emailAuthTypeEnum("auth_type").notNull(), // oauth, password
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  displayName: text("display_name"),
  
  // Nylas integration (unified API)
  nylasGrantId: text("nylas_grant_id"), // For multi-provider support
  
  // Multi-tenancy
  organizationId: text("organization_id"), // Optional organization context
  
  // OAuth fields (encrypted)
  accessToken: text("access_token"), // AES-256-GCM encrypted
  refreshToken: text("refresh_token"), // AES-256-GCM encrypted
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // IMAP/SMTP fields (encrypted)
  imapHost: varchar("imap_host", { length: 255 }),
  imapPort: integer("imap_port"),
  imapUsername: varchar("imap_username", { length: 255 }),
  imapPassword: text("imap_password"), // AES-256-GCM encrypted
  imapUseSsl: boolean("imap_use_ssl").default(true),
  
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: integer("smtp_port"),
  smtpUsername: varchar("smtp_username", { length: 255 }),
  smtpPassword: text("smtp_password"), // AES-256-GCM encrypted
  smtpUseSsl: boolean("smtp_use_ssl").default(true),
  
  // Sync state
  status: emailAccountStatusEnum("status").notNull().default("active"),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncError: text("last_sync_error"),
  lastUid: integer("last_uid"), // IMAP incremental sync
  syncCursor: text("sync_cursor"), // Cursor-based pagination
  errorMessage: text("error_message"),
  
  // Webhooks
  webhookSubscriptionId: text("webhook_subscription_id"),
  webhookExpiresAt: timestamp("webhook_expires_at"),
  
  // Settings
  signature: text("signature"),
  replyToEmail: varchar("reply_to_email", { length: 255 }),
  isDefault: boolean("is_default").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("email_accounts_user_id_idx").on(table.userId),
  emailAddressIdx: index("email_accounts_email_address_idx").on(table.emailAddress),
  statusIdx: index("email_accounts_status_idx").on(table.status),
}));
```

**Key Features:**
- **Security:** All credentials encrypted with AES-256-GCM
- **Multi-Provider:** Supports OAuth (Gmail, Microsoft) and IMAP/SMTP (Yahoo, AOL, custom)
- **Unified API:** Optional Nylas integration for simplified multi-provider support
- **Sync State:** Tracks last sync time, errors, and incremental sync cursors

---

### 2. `emails`

Primary table storing all email messages.

```typescript
export const emailsTable = pgTable("emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Account association
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" }),
  
  // Email identifiers
  messageId: text("message_id").notNull(), // RFC 2822 Message-ID
  nylasMessageId: text("nylas_message_id"), // Nylas unified ID
  providerMessageId: text("provider_message_id"), // Gmail ID, etc.
  threadId: text("thread_id"), // Thread grouping
  
  // Email metadata
  subject: text("subject").notNull(),
  snippet: text("snippet"), // First 100 chars preview
  
  // Participants (stored as JSONB for flexibility)
  fromAddress: jsonb("from_address").$type<EmailAddress>().notNull(),
  toAddresses: jsonb("to_addresses").$type<EmailAddress[]>().notNull(),
  ccAddresses: jsonb("cc_addresses").$type<EmailAddress[]>(),
  bccAddresses: jsonb("bcc_addresses").$type<EmailAddress[]>(),
  replyTo: jsonb("reply_to").$type<EmailAddress[]>(),
  
  // Email content
  bodyText: text("body_text"), // Plain text version
  bodyHtml: text("body_html"), // HTML version
  
  // Metadata
  receivedAt: timestamp("received_at").notNull(),
  sentAt: timestamp("sent_at"),
  
  // Flags
  isRead: boolean("is_read").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  isImportant: boolean("is_important").default(false).notNull(),
  isDraft: boolean("is_draft").default(false).notNull(),
  hasDrafts: boolean("has_drafts").default(false).notNull(),
  hasAttachments: boolean("has_attachments").default(false).notNull(),
  
  // Folder/Label info
  folderName: text("folder_name"), // inbox, sent, drafts, etc.
  labelIds: text("label_ids").array(), // Array of label IDs
  
  // Hey-inspired features
  screeningStatus: screeningStatusEnum("screening_status").default("pending"),
  heyView: heyViewEnum("hey_view"), // imbox, feed, paper_trail, null (blocked)
  contactStatus: contactStatusEnum("contact_status").default("unknown"),
  replyLaterUntil: timestamp("reply_later_until"), // Snoozed until
  replyLaterNote: text("reply_later_note"), // Note for later
  setAsideAt: timestamp("set_aside_at"), // When set aside
  
  // Privacy
  trackersBlocked: integer("trackers_blocked").default(0),
  
  // AI-generated insights (cached)
  aiSummary: text("ai_summary"), // Pre-generated summary
  aiQuickReplies: jsonb("ai_quick_replies").$type<string[]>(), // 3 quick replies
  aiSmartActions: jsonb("ai_smart_actions").$type<SmartAction[]>(), // Contextual actions
  aiGeneratedAt: timestamp("ai_generated_at"), // When AI was generated
  aiCategory: text("ai_category"), // AI-detected category
  aiPriority: priorityEnum("ai_priority"), // AI-detected priority
  aiSentiment: sentimentEnum("ai_sentiment"), // AI-detected sentiment
  
  // Search
  searchVector: text("search_vector"), // Full-text search (tsvector in Postgres)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("emails_account_id_idx").on(table.accountId),
  threadIdIdx: index("emails_thread_id_idx").on(table.threadId),
  receivedAtIdx: index("emails_received_at_idx").on(table.receivedAt),
  isReadIdx: index("emails_is_read_idx").on(table.isRead),
  screeningStatusIdx: index("emails_screening_status_idx").on(table.screeningStatus),
  heyViewIdx: index("emails_hey_view_idx").on(table.heyView),
  messageIdIdx: index("emails_message_id_idx").on(table.messageId),
}));
```

**Key Features:**
- **Multi-ID Support:** Tracks provider-specific IDs (Gmail, Nylas, etc.)
- **JSONB Participants:** Flexible storage for email addresses (name + email)
- **Hey Workflow:** Screening status, view routing, Reply Later, Set Aside
- **AI Caching:** Pre-generated summaries, quick replies, smart actions
- **Privacy:** Tracker blocking count
- **Search:** Full-text search vector

---

### 3. `email_threads`

Groups emails into conversation threads.

```typescript
export const emailThreadsTable = pgTable("email_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Account association
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" }),
  
  // Thread identifiers
  threadId: text("thread_id").notNull(), // Provider-specific thread ID
  nylasThreadId: text("nylas_thread_id"), // Nylas unified thread ID
  
  // Thread metadata
  subject: text("subject").notNull(),
  snippet: text("snippet"), // Latest message snippet
  participants: jsonb("participants").$type<EmailAddress[]>().notNull(),
  
  // Stats
  messageCount: integer("message_count").default(1).notNull(),
  unreadCount: integer("unread_count").default(0).notNull(),
  
  // Timestamps
  firstMessageAt: timestamp("first_message_at").notNull(),
  lastMessageAt: timestamp("last_message_at").notNull(),
  
  // Flags
  hasAttachments: boolean("has_attachments").default(false).notNull(),
  hasDrafts: boolean("has_drafts").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  
  // AI summary (for entire thread)
  aiThreadSummary: text("ai_thread_summary"),
  aiKeyPoints: jsonb("ai_key_points").$type<string[]>(),
  aiActionItems: jsonb("ai_action_items").$type<string[]>(),
  aiGeneratedAt: timestamp("ai_generated_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("email_threads_account_id_idx").on(table.accountId),
  threadIdIdx: index("email_threads_thread_id_idx").on(table.threadId),
  lastMessageAtIdx: index("email_threads_last_message_at_idx").on(table.lastMessageAt),
}));
```

**Key Features:**
- **Thread Intelligence:** Message count, unread count, participants
- **AI Thread Summary:** Summarizes entire conversation
- **Action Items:** AI-extracted to-dos from thread

---

### 4. `email_attachments`

Stores email attachment metadata.

```typescript
export const emailAttachmentsTable = pgTable("email_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Email association
  emailId: uuid("email_id")
    .notNull()
    .references(() => emailsTable.id, { onDelete: "cascade" }),
  
  // Attachment identifiers
  providerAttachmentId: text("provider_attachment_id"),
  contentId: text("content_id"), // For inline images
  
  // File metadata
  filename: varchar("filename", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  size: integer("size").notNull(), // Bytes
  
  // Storage
  storageUrl: text("storage_url"), // S3/CDN URL (encrypted files)
  storageKey: text("storage_key"), // Object storage key
  
  // Inline attachments
  isInline: boolean("is_inline").default(false).notNull(),
  
  // Download tracking
  downloadCount: integer("download_count").default(0).notNull(),
  lastDownloadedAt: timestamp("last_downloaded_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdIdx: index("email_attachments_email_id_idx").on(table.emailId),
}));
```

**Key Features:**
- **File Metadata:** Filename, type, size
- **Secure Storage:** Encrypted files in object storage (S3)
- **Inline Support:** CID references for embedded images
- **Download Tracking:** Monitor access

---

### 5. `email_labels`

Custom labels/folders for email organization.

```typescript
export const emailLabelsTable = pgTable("email_labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Account association
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" }),
  
  // Label info
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }), // Hex color code (#FF5733)
  
  // Hierarchy (nested labels)
  parentLabelId: uuid("parent_label_id"), // Self-reference for nesting
  
  // Provider sync
  providerLabelId: text("provider_label_id"), // Gmail label ID, etc.
  
  // Metadata
  emailCount: integer("email_count").default(0).notNull(),
  isSystemLabel: boolean("is_system_label").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("email_labels_account_id_idx").on(table.accountId),
  nameIdx: index("email_labels_name_idx").on(table.name),
}));
```

**Key Features:**
- **Custom Labels:** User-defined organization
- **Color Coding:** Visual distinction
- **Hierarchy:** Nested label support (Work > Clients > Acme)
- **Provider Sync:** Maps to Gmail labels, Outlook folders

---

### 6. `email_rules`

Automated email filtering and routing rules.

```typescript
export const emailRulesTable = pgTable("email_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Owner
  userId: text("user_id").notNull(), // Clerk user ID
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" }),
  
  // Rule definition
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Conditions (stored as JSONB for flexibility)
  conditions: jsonb("conditions").$type<ConditionGroup>().notNull(),
  
  // Actions (stored as JSONB)
  actions: jsonb("actions").$type<RuleAction[]>().notNull(),
  
  // Execution
  priority: integer("priority").default(0).notNull(), // Lower = higher priority
  enabled: boolean("enabled").default(true).notNull(),
  
  // Stats
  executionCount: integer("execution_count").default(0).notNull(),
  lastExecutedAt: timestamp("last_executed_at"),
  
  // AI-generated rule
  isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
  aiConfidence: integer("ai_confidence"), // 0-100
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("email_rules_user_id_idx").on(table.userId),
  accountIdIdx: index("email_rules_account_id_idx").on(table.accountId),
  priorityIdx: index("email_rules_priority_idx").on(table.priority),
}));
```

**Rule Structure:**
```typescript
interface ConditionGroup {
  logic: "AND" | "OR";
  rules: RuleCondition[];
}

interface RuleCondition {
  field: "from" | "to" | "subject" | "body" | "has_attachment" | "date" | "importance" | "label";
  operator: "contains" | "equals" | "starts_with" | "ends_with" | "regex" | "is" | "is_not";
  value: string | boolean | number;
}

interface RuleAction {
  type: "mark_read" | "mark_unread" | "star" | "unstar" | "move_to_folder" | 
        "apply_label" | "forward" | "auto_reply" | "archive" | "delete" | 
        "block_sender" | "run_ai_task";
  value?: string; // Optional value (folder name, label ID, etc.)
}
```

**Example Rule:**
```typescript
{
  name: "Urgent work emails",
  conditions: {
    logic: "AND",
    rules: [
      { field: "from", operator: "contains", value: "@acme.com" },
      { field: "subject", operator: "contains", value: "[URGENT]" }
    ]
  },
  actions: [
    { type: "mark_as_important" },
    { type: "apply_label", value: "urgent-work-label-id" },
    { type: "push_notification" }
  ]
}
```

---

### 7. `email_settings`

Per-account email client settings.

```typescript
export const emailSettingsTable = pgTable("email_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Account association
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" })
    .unique(),
  
  // Display settings
  emailsPerPage: integer("emails_per_page").default(50).notNull(),
  theme: text("theme").default("light"), // light, dark, system
  density: text("density").default("comfortable"), // comfortable, compact, spacious
  
  // Email mode
  emailMode: emailModeEnum("email_mode").default("hey"), // traditional, hey, hybrid
  
  // Notification settings
  desktopNotifications: boolean("desktop_notifications").default(true).notNull(),
  soundEnabled: boolean("sound_enabled").default(false).notNull(),
  notifyOnImportantOnly: boolean("notify_on_important_only").default(false).notNull(),
  
  // Reading pane
  readingPanePosition: text("reading_pane_position").default("right"), // right, bottom, off
  markAsReadDelay: integer("mark_as_read_delay").default(0).notNull(), // Seconds
  
  // Composer settings
  defaultFontFamily: text("default_font_family").default("sans-serif"),
  defaultFontSize: integer("default_font_size").default(14),
  defaultSendBehavior: text("default_send_behavior").default("send"), // send, send_and_archive
  
  // Privacy settings
  blockTrackers: boolean("block_trackers").default(true).notNull(),
  blockExternalImages: boolean("block_external_images").default(false).notNull(),
  stripUtmParameters: boolean("strip_utm_parameters").default(true).notNull(),
  
  // AI settings
  enableAiSummaries: boolean("enable_ai_summaries").default(true).notNull(),
  enableQuickReplies: boolean("enable_quick_replies").default(true).notNull(),
  enableSmartActions: boolean("enable_smart_actions").default(true).notNull(),
  aiTone: text("ai_tone").default("professional"), // professional, casual, formal, friendly
  
  // Screening settings
  autoClassifyAfterDays: integer("auto_classify_after_days").default(14).notNull(),
  bulkEmailDetection: boolean("bulk_email_detection").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key Features:**
- **Personalization:** Theme, density, fonts
- **Privacy Controls:** Tracker blocking, image loading, UTM stripping
- **AI Configuration:** Enable/disable AI features, tone selection
- **Email Mode:** Traditional folders vs. Hey workflow

---

### 8. `email_sync_logs`

Tracks email sync operations for debugging and monitoring.

```typescript
export const emailSyncLogsTable = pgTable("email_sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Account association
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" }),
  
  // Sync info
  syncType: syncTypeEnum("sync_type").notNull(), // full, incremental, webhook, manual
  status: syncStatusEnum("status").notNull(), // pending, in_progress, completed, failed
  
  // Stats
  emailsFound: integer("emails_found").default(0).notNull(),
  emailsNew: integer("emails_new").default(0).notNull(),
  emailsUpdated: integer("emails_updated").default(0).notNull(),
  emailsDeleted: integer("emails_deleted").default(0).notNull(),
  
  // Timing
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"), // Milliseconds
  
  // Error tracking
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  
  // Sync cursor (for incremental)
  syncCursorBefore: text("sync_cursor_before"),
  syncCursorAfter: text("sync_cursor_after"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("email_sync_logs_account_id_idx").on(table.accountId),
  startedAtIdx: index("email_sync_logs_started_at_idx").on(table.startedAt),
  statusIdx: index("email_sync_logs_status_idx").on(table.status),
}));
```

**Key Features:**
- **Sync Monitoring:** Track success/failure rates
- **Performance Metrics:** Duration, emails processed
- **Error Debugging:** Stack traces for failures
- **Cursor Tracking:** Resume interrupted syncs

---

### 9. `email_drafts`

Stores draft emails (AI-generated or user-created).

```typescript
export const emailDraftsTable = pgTable("email_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Account & parent email (if reply/forward)
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" }),
  parentEmailId: uuid("parent_email_id")
    .references(() => emailsTable.id, { onDelete: "set null" }),
  
  // Draft content
  toAddresses: jsonb("to_addresses").$type<EmailAddress[]>().notNull(),
  ccAddresses: jsonb("cc_addresses").$type<EmailAddress[]>(),
  bccAddresses: jsonb("bcc_addresses").$type<EmailAddress[]>(),
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  
  // Attachments (temporary storage)
  attachments: jsonb("attachments").$type<DraftAttachment[]>(),
  
  // Draft metadata
  draftSource: draftSourceEnum("draft_source").default("user"), // user, ai_suggestion, ai_autonomous
  aiTone: text("ai_tone"), // If AI-generated
  aiConfidence: integer("ai_confidence"), // 0-100
  
  // Scheduled send
  scheduledSendAt: timestamp("scheduled_send_at"),
  
  // Auto-save
  lastSavedAt: timestamp("last_saved_at").defaultNow().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("email_drafts_account_id_idx").on(table.accountId),
  parentEmailIdIdx: index("email_drafts_parent_email_id_idx").on(table.parentEmailId),
}));
```

**Key Features:**
- **Auto-Save:** Prevents data loss
- **AI Drafts:** Tracks AI-generated content
- **Scheduled Send:** Queue for future delivery
- **Reply Context:** Links to parent email

---

### 10. `email_contacts`

Tracks email contacts and sender relationships (for Hey screening).

```typescript
export const emailContactsTable = pgTable("email_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // User association
  userId: text("user_id").notNull(), // Clerk user ID
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccountsTable.id, { onDelete: "cascade" }),
  
  // Contact info
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  displayName: text("display_name"),
  
  // Hey screening decision
  screeningStatus: screeningStatusEnum("screening_status").default("pending"),
  screeningDecision: heyViewEnum("screening_decision"), // imbox, feed, paper_trail, null (blocked)
  screenedAt: timestamp("screened_at"),
  
  // Stats
  emailCount: integer("email_count").default(0).notNull(),
  lastEmailAt: timestamp("last_email_at"),
  firstEmailAt: timestamp("first_email_at"),
  
  // Communication frequency
  avgResponseTimeHours: integer("avg_response_time_hours"),
  sentToCount: integer("sent_to_count").default(0).notNull(),
  receivedFromCount: integer("received_from_count").default(0).notNull(),
  
  // AI insights
  aiContactType: text("ai_contact_type"), // colleague, client, vendor, friend, etc.
  aiImportanceScore: integer("ai_importance_score"), // 0-100
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("email_contacts_user_id_idx").on(table.userId),
  accountIdIdx: index("email_contacts_account_id_idx").on(table.accountId),
  emailAddressIdx: index("email_contacts_email_address_idx").on(table.emailAddress),
  screeningStatusIdx: index("email_contacts_screening_status_idx").on(table.screeningStatus),
}));
```

**Key Features:**
- **Sender Tracking:** Email frequency, last contact
- **Screening Memory:** Remembers user decisions
- **Relationship Intelligence:** AI-detected contact type
- **Communication Stats:** Response time, email counts

---

### 11. `email_reminders`

Follow-up reminders for sent emails.

```typescript
export const emailRemindersTable = pgTable("email_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Email association
  emailId: uuid("email_id")
    .notNull()
    .references(() => emailsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  
  // Reminder settings
  remindAt: timestamp("remind_at").notNull(),
  note: text("note"),
  
  // Status
  isTriggered: boolean("is_triggered").default(false).notNull(),
  triggeredAt: timestamp("triggered_at"),
  isDismissed: boolean("is_dismissed").default(false).notNull(),
  
  // Reply tracking
  hasReceivedReply: boolean("has_received_reply").default(false).notNull(),
  replyReceivedAt: timestamp("reply_received_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdIdx: index("email_reminders_email_id_idx").on(table.emailId),
  userIdIdx: index("email_reminders_user_id_idx").on(table.userId),
  remindAtIdx: index("email_reminders_remind_at_idx").on(table.remindAt),
}));
```

**Key Features:**
- **Follow-Up Tracking:** Auto-detects replies
- **Smart Reminders:** Triggers if no reply received
- **Notes:** Context for why reminder was set

---

## 🔗 Relationships

### Entity Relationship Diagram

```
users (Clerk)
  ↓
email_accounts (1:N)
  ↓
├─ emails (1:N)
│  ├─ email_attachments (1:N)
│  ├─ email_drafts (1:N) [parent_email_id]
│  └─ email_reminders (1:N)
│
├─ email_threads (1:N)
│  └─ emails (1:N) [thread_id]
│
├─ email_labels (1:N)
│  └─ emails (N:M) [label_ids array]
│
├─ email_rules (1:N)
│
├─ email_settings (1:1)
│
├─ email_contacts (1:N)
│
└─ email_sync_logs (1:N)
```

---

## 📋 Enums

### Provider Enum
```typescript
export const emailProviderEnum = pgEnum("email_provider", [
  "gmail",
  "microsoft",
  "imap",
  "yahoo",
  "aol",
  "custom",
]);
```

### Auth Type Enum
```typescript
export const emailAuthTypeEnum = pgEnum("email_auth_type", [
  "oauth",
  "password",
]);
```

### Account Status Enum
```typescript
export const emailAccountStatusEnum = pgEnum("email_account_status", [
  "active",
  "inactive",
  "error",
  "syncing",
]);
```

### Sync Status Enum
```typescript
export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);
```

### Sync Type Enum
```typescript
export const syncTypeEnum = pgEnum("sync_type", [
  "full",        // Complete sync
  "incremental", // Only new/updated emails
  "webhook",     // Push notification triggered
  "manual",      // User-initiated
]);
```

### Screening Status Enum
```typescript
export const screeningStatusEnum = pgEnum("screening_status", [
  "pending",         // Waiting for user decision
  "screened",        // User made decision
  "auto_classified", // AI auto-classified (old emails)
]);
```

### Hey View Enum
```typescript
export const heyViewEnum = pgEnum("hey_view", [
  "imbox",        // Important people
  "feed",         // Newsletters
  "paper_trail",  // Receipts
  // null = blocked
]);
```

### Contact Status Enum
```typescript
export const contactStatusEnum = pgEnum("contact_status", [
  "unknown",      // Never screened
  "approved",     // Approved for Imbox/Feed/Paper Trail
  "blocked",      // Blocked
]);
```

### Draft Source Enum
```typescript
export const draftSourceEnum = pgEnum("draft_source", [
  "user",             // User-created
  "ai_suggestion",    // AI-suggested draft
  "ai_autonomous",    // AI auto-generated
]);
```

### Priority Enum
```typescript
export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
```

### Sentiment Enum
```typescript
export const sentimentEnum = pgEnum("sentiment", [
  "positive",
  "neutral",
  "negative",
]);
```

### Email Mode Enum
```typescript
export const emailModeEnum = pgEnum("email_mode", [
  "traditional", // Standard folders (Inbox, Sent, etc.)
  "hey",         // Hey-style (Imbox, Feed, Paper Trail)
  "hybrid",      // Both systems available
]);
```

---

## 🔍 Indexes & Performance

### Critical Indexes

**Fast Email Retrieval:**
```sql
-- Most common query: Get emails for account
CREATE INDEX emails_account_id_idx ON emails(account_id);

-- Sort by received date (most recent first)
CREATE INDEX emails_received_at_idx ON emails(received_at DESC);

-- Filter by screening status
CREATE INDEX emails_screening_status_idx ON emails(screening_status);

-- Filter by Hey view
CREATE INDEX emails_hey_view_idx ON emails(hey_view);

-- Thread grouping
CREATE INDEX emails_thread_id_idx ON emails(thread_id);
```

**Fast Screening:**
```sql
-- Get unscreened emails
CREATE INDEX emails_screening_pending_idx 
  ON emails(account_id, screening_status, received_at)
  WHERE screening_status = 'pending';

-- Contact lookups
CREATE INDEX email_contacts_email_address_idx 
  ON email_contacts(email_address);
```

**Fast Search:**
```sql
-- Full-text search on emails
CREATE INDEX emails_search_vector_idx 
  ON emails USING GIN(to_tsvector('english', subject || ' ' || body_text));

-- Provider message ID lookups (avoid duplicates)
CREATE UNIQUE INDEX emails_provider_message_id_idx 
  ON emails(account_id, provider_message_id);
```

---

## 💾 Data Retention & Archival

### Retention Policies

**Email Storage:**
- Free Tier: Last 3 days of emails
- Pro Tier: Unlimited history
- Enterprise: Custom retention (compliance)

**Sync Logs:**
- Keep last 30 days
- Summarize older logs (daily stats)

**Draft Auto-Cleanup:**
- Drafts older than 90 days (unused)
- Keep if scheduled_send_at is set

**AI Cache Invalidation:**
- Email summaries: 7 days (regenerate if requested)
- Quick replies: 24 hours (content may be stale)
- Thread summaries: 14 days

---

## 🔒 Data Security

### Encryption

**At Rest:**
- All `*_password`, `access_token`, `refresh_token` fields encrypted with AES-256-GCM
- Encryption keys stored in separate secure vault (AWS KMS, HashiCorp Vault)
- Key rotation every 90 days

**In Transit:**
- TLS 1.3 for all database connections
- Encrypted backups

### Access Control

**Row-Level Security (RLS):**
```sql
-- Users can only access their own email accounts
CREATE POLICY email_accounts_user_access ON email_accounts
  FOR ALL
  USING (user_id = current_user_id());

-- Users can only access emails from their accounts
CREATE POLICY emails_user_access ON emails
  FOR ALL
  USING (account_id IN (
    SELECT id FROM email_accounts WHERE user_id = current_user_id()
  ));
```

### Audit Logging

**Sensitive Operations:**
- Account connection/disconnection
- Rule creation/modification
- Bulk operations (delete, archive)
- Export operations
- Settings changes

---

## 📊 Sample Queries

### Get Unscreened Emails for Screener

```typescript
const unscreenedEmails = await db
  .select()
  .from(emailsTable)
  .where(
    and(
      eq(emailsTable.accountId, accountId),
      eq(emailsTable.screeningStatus, "pending")
    )
  )
  .orderBy(desc(emailsTable.receivedAt))
  .limit(20);
```

### Get Imbox Emails

```typescript
const imboxEmails = await db
  .select()
  .from(emailsTable)
  .where(
    and(
      eq(emailsTable.accountId, accountId),
      eq(emailsTable.heyView, "imbox"),
      eq(emailsTable.folderName, "inbox") // Not archived
    )
  )
  .orderBy(desc(emailsTable.receivedAt));
```

### Get Thread with All Messages

```typescript
const thread = await db.query.emailThreadsTable.findFirst({
  where: eq(emailThreadsTable.id, threadId),
  with: {
    emails: {
      orderBy: [asc(emailsTable.receivedAt)],
      with: {
        attachments: true,
      },
    },
  },
});
```

### Search Emails (Full-Text)

```typescript
const searchResults = await db.execute(sql`
  SELECT * FROM emails
  WHERE account_id = ${accountId}
  AND search_vector @@ to_tsquery('english', ${searchQuery})
  ORDER BY ts_rank(search_vector, to_tsquery('english', ${searchQuery})) DESC
  LIMIT 50
`);
```

### Get AI Pre-Generated Data

```typescript
const emailWithAI = await db.query.emailsTable.findFirst({
  where: eq(emailsTable.id, emailId),
  columns: {
    id: true,
    subject: true,
    snippet: true,
    fromAddress: true,
    aiSummary: true,
    aiQuickReplies: true,
    aiSmartActions: true,
    aiGeneratedAt: true,
  },
});

// Check if AI data is fresh (< 7 days old)
const isAIFresh = emailWithAI.aiGeneratedAt &&
  (Date.now() - emailWithAI.aiGeneratedAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
```

---

## 🚀 Migrations

### Migration Strategy

**Version Control:**
- All migrations in `db/migrations/` folder
- Numbered sequentially: `0001_initial.sql`, `0002_add_hey_features.sql`
- Applied in order (tracked in `_migrations` table)

**Testing:**
- All migrations tested on staging environment
- Rollback scripts for each migration
- Data integrity checks before/after

**Zero-Downtime Migrations:**
- Additive changes first (new columns nullable)
- Backfill data in background
- Update application code
- Make columns non-nullable (if needed)

---

**Next Documents:**
- [← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md)
- [← Back to Features](AI_EMAIL_CLIENT_PRD_FEATURES.md)
- [Technical Specifications →](AI_EMAIL_CLIENT_PRD_TECHNICAL.md)
- [UI/UX Guidelines →](AI_EMAIL_CLIENT_PRD_DESIGN.md)

