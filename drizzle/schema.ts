import { pgTable, index, foreignKey, uuid, text, boolean, timestamp, jsonb, integer, varchar, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const contactAddressType = pgEnum("contact_address_type", ['work', 'home', 'other'])
export const contactEmailType = pgEnum("contact_email_type", ['work', 'personal', 'other'])
export const contactFieldType = pgEnum("contact_field_type", ['text', 'number', 'date', 'url'])
export const contactPhoneType = pgEnum("contact_phone_type", ['mobile', 'work', 'home', 'other'])
export const contactSocialPlatform = pgEnum("contact_social_platform", ['linkedin', 'twitter', 'facebook', 'instagram', 'github', 'other'])
export const contactSourceType = pgEnum("contact_source_type", ['manual', 'synced'])
export const contactStatus = pgEnum("contact_status", ['unknown', 'approved', 'blocked'])
export const draftSource = pgEnum("draft_source", ['user', 'ai_suggestion', 'ai_autonomous'])
export const emailAccountStatus = pgEnum("email_account_status", ['active', 'inactive', 'error', 'syncing'])
export const emailAuthType = pgEnum("email_auth_type", ['oauth', 'password'])
export const emailCategory = pgEnum("email_category", ['unscreened', 'inbox', 'newsfeed', 'receipts', 'spam', 'archived'])
export const emailMode = pgEnum("email_mode", ['traditional', 'hey', 'hybrid'])
export const emailProvider = pgEnum("email_provider", ['gmail', 'microsoft', 'yahoo', 'imap', 'custom'])
export const emailSyncStatus = pgEnum("email_sync_status", ['idle', 'syncing', 'paused', 'error', 'success'])
export const heyView = pgEnum("hey_view", ['imbox', 'feed', 'paper_trail'])
export const paymentProcessor = pgEnum("payment_processor", ['stripe', 'square'])
export const priority = pgEnum("priority", ['low', 'medium', 'high', 'urgent'])
export const ruleActionType = pgEnum("rule_action_type", ['move_to_folder', 'add_label', 'star', 'mark_as_read', 'mark_as_important', 'delete', 'archive', 'forward_to', 'mark_as_spam'])
export const ruleConditionField = pgEnum("rule_condition_field", ['from', 'to', 'cc', 'subject', 'body', 'has_attachment', 'is_starred', 'is_important'])
export const ruleConditionOperator = pgEnum("rule_condition_operator", ['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with', 'matches_regex', 'is_true', 'is_false'])
export const screeningStatus = pgEnum("screening_status", ['pending', 'screened', 'auto_classified'])
export const senderTrustLevel = pgEnum("sender_trust_level", ['trusted', 'unknown', 'spam'])
export const sentiment = pgEnum("sentiment", ['positive', 'neutral', 'negative'])
export const subscriptionStatus = pgEnum("subscription_status", ['active', 'canceled', 'past_due', 'trialing'])
export const subscriptionTier = pgEnum("subscription_tier", ['free', 'pro', 'team', 'enterprise'])
export const syncJobType = pgEnum("sync_job_type", ['full', 'incremental', 'selective', 'webhook_triggered'])
export const syncStatus = pgEnum("sync_status", ['pending', 'in_progress', 'completed', 'failed'])
export const syncType = pgEnum("sync_type", ['full', 'incremental', 'webhook', 'manual'])


export const emailSignatures = pgTable("email_signatures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	htmlContent: text("html_content").notNull(),
	textContent: text("text_content"),
	isDefault: boolean("is_default").default(false).notNull(),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	accountId: uuid("account_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		accountIdIdx: index("email_signatures_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
		userIdIdx: index("email_signatures_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		emailSignaturesAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "email_signatures_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
		emailSignaturesUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_signatures_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const emailRules = pgTable("email_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	accountId: uuid("account_id"),
	name: text().notNull(),
	description: text(),
	conditions: jsonb().notNull(),
	actions: jsonb().notNull(),
	isEnabled: boolean("is_enabled").default(true).notNull(),
	priority: integer().default(0).notNull(),
	stopProcessing: boolean("stop_processing").default(false).notNull(),
	timesTriggered: integer("times_triggered").default(0).notNull(),
	lastTriggered: timestamp("last_triggered", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		accountIdIdx: index("email_rules_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
		isEnabledIdx: index("email_rules_is_enabled_idx").using("btree", table.isEnabled.asc().nullsLast().op("bool_ops")),
		priorityIdx: index("email_rules_priority_idx").using("btree", table.priority.asc().nullsLast().op("int4_ops")),
		userIdIdx: index("email_rules_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		emailRulesAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "email_rules_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
		emailRulesUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_rules_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const emails = pgTable("emails", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	messageId: text("message_id").notNull(),
	nylasMessageId: text("nylas_message_id"),
	providerMessageId: text("provider_message_id"),
	threadId: text("thread_id"),
	subject: text().notNull(),
	snippet: text(),
	fromAddress: jsonb("from_address").notNull(),
	toAddresses: jsonb("to_addresses").notNull(),
	ccAddresses: jsonb("cc_addresses"),
	bccAddresses: jsonb("bcc_addresses"),
	replyTo: jsonb("reply_to"),
	bodyText: text("body_text"),
	bodyHtml: text("body_html"),
	receivedAt: timestamp("received_at", { mode: 'string' }).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	isRead: boolean("is_read").default(false).notNull(),
	isStarred: boolean("is_starred").default(false).notNull(),
	isImportant: boolean("is_important").default(false),
	isDraft: boolean("is_draft").default(false).notNull(),
	hasDrafts: boolean("has_drafts").default(false).notNull(),
	hasAttachments: boolean("has_attachments").default(false).notNull(),
	folderName: text("folder_name"),
	labelIds: text("label_ids").array(),
	screeningStatus: screeningStatus("screening_status").default('pending'),
	heyView: heyView("hey_view"),
	contactStatus: contactStatus("contact_status").default('unknown'),
	replyLaterUntil: timestamp("reply_later_until", { mode: 'string' }),
	replyLaterNote: text("reply_later_note"),
	setAsideAt: timestamp("set_aside_at", { mode: 'string' }),
	customFolderId: uuid("custom_folder_id"),
	trackersBlocked: integer("trackers_blocked").default(0),
	aiSummary: text("ai_summary"),
	aiQuickReplies: jsonb("ai_quick_replies"),
	aiSmartActions: jsonb("ai_smart_actions"),
	aiGeneratedAt: timestamp("ai_generated_at", { mode: 'string' }),
	aiCategory: text("ai_category"),
	aiPriority: priority("ai_priority"),
	aiSentiment: sentiment("ai_sentiment"),
	searchVector: text("search_vector"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	hasInlineImages: boolean("has_inline_images").default(false),
	emailCategory: emailCategory("email_category").default('unscreened'),
	screenedAt: timestamp("screened_at", { mode: 'string' }),
	screenedBy: text("screened_by"),
	needsReply: boolean("needs_reply").default(false),
	isSetAside: boolean("is_set_aside").default(false),
}, (table) => {
	return {
		accountIdIdx: index("emails_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
		emailCategoryIdx: index("emails_email_category_idx").using("btree", table.emailCategory.asc().nullsLast().op("enum_ops")),
		heyViewIdx: index("emails_hey_view_idx").using("btree", table.heyView.asc().nullsLast().op("enum_ops")),
		isImportantIdx: index("emails_is_important_idx").using("btree", table.isImportant.asc().nullsLast().op("bool_ops")),
		isReadIdx: index("emails_is_read_idx").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
		isSetAsideIdx: index("emails_is_set_aside_idx").using("btree", table.isSetAside.asc().nullsLast().op("bool_ops")),
		messageIdIdx: index("emails_message_id_idx").using("btree", table.messageId.asc().nullsLast().op("text_ops")),
		needsReplyIdx: index("emails_needs_reply_idx").using("btree", table.needsReply.asc().nullsLast().op("bool_ops")),
		receivedAtIdx: index("emails_received_at_idx").using("btree", table.receivedAt.asc().nullsLast().op("timestamp_ops")),
		screeningStatusIdx: index("emails_screening_status_idx").using("btree", table.screeningStatus.asc().nullsLast().op("enum_ops")),
		threadIdIdx: index("emails_thread_id_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
		emailsAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "emails_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
		emailsCustomFolderIdCustomFoldersIdFk: foreignKey({
			columns: [table.customFolderId],
			foreignColumns: [customFolders.id],
			name: "emails_custom_folder_id_custom_folders_id_fk"
		}).onDelete("set null"),
	}
});

export const senderTrust = pgTable("sender_trust", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	senderEmail: text("sender_email").notNull(),
	trustLevel: senderTrustLevel("trust_level").default('unknown'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		senderEmailIdx: index("sender_trust_sender_email_idx").using("btree", table.senderEmail.asc().nullsLast().op("text_ops")),
		trustLevelIdx: index("sender_trust_trust_level_idx").using("btree", table.trustLevel.asc().nullsLast().op("enum_ops")),
		userIdIdx: index("sender_trust_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		senderTrustUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sender_trust_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactCustomFields = pgTable("contact_custom_fields", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	fieldName: varchar("field_name", { length: 100 }).notNull(),
	fieldValue: text("field_value"),
	fieldType: contactFieldType("field_type").default('text'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contactIdIdx: index("contact_custom_fields_contact_id_idx").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
		contactCustomFieldsContactIdContactsIdFk: foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "contact_custom_fields_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactEmails = pgTable("contact_emails", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	type: contactEmailType().default('other'),
	isPrimary: boolean("is_primary").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contactIdIdx: index("contact_emails_contact_id_idx").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
		emailIdx: index("contact_emails_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
		isPrimaryIdx: index("contact_emails_is_primary_idx").using("btree", table.isPrimary.asc().nullsLast().op("bool_ops")),
		contactEmailsContactIdContactsIdFk: foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "contact_emails_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactAddresses = pgTable("contact_addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	street: text(),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	zipCode: varchar("zip_code", { length: 20 }),
	country: varchar({ length: 100 }),
	type: contactAddressType().default('other'),
	isPrimary: boolean("is_primary").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contactIdIdx: index("contact_addresses_contact_id_idx").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
		contactAddressesContactIdContactsIdFk: foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "contact_addresses_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactTagAssignments = pgTable("contact_tag_assignments", {
	contactId: uuid("contact_id").notNull(),
	tagId: uuid("tag_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contactIdIdx: index("contact_tag_assignments_contact_id_idx").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
		tagIdIdx: index("contact_tag_assignments_tag_id_idx").using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
		contactTagAssignmentsContactIdContactsIdFk: foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "contact_tag_assignments_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
		contactTagAssignmentsTagIdContactTagsIdFk: foreignKey({
			columns: [table.tagId],
			foreignColumns: [contactTags.id],
			name: "contact_tag_assignments_tag_id_contact_tags_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactNotes = pgTable("contact_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contactIdIdx: index("contact_notes_contact_id_idx").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
		createdAtIdx: index("contact_notes_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
		userIdIdx: index("contact_notes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		contactNotesContactIdContactsIdFk: foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "contact_notes_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
		contactNotesUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "contact_notes_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const contacts = pgTable("contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	displayName: varchar("display_name", { length: 200 }),
	nickname: varchar({ length: 100 }),
	company: varchar({ length: 200 }),
	jobTitle: varchar("job_title", { length: 200 }),
	department: varchar({ length: 100 }),
	birthday: timestamp({ mode: 'string' }),
	notes: text(),
	avatarUrl: text("avatar_url"),
	avatarProvider: varchar("avatar_provider", { length: 50 }),
	sourceType: contactSourceType("source_type").default('manual'),
	sourceProvider: varchar("source_provider", { length: 50 }),
	sourceId: text("source_id"),
	isFavorite: boolean("is_favorite").default(false).notNull(),
	isArchived: boolean("is_archived").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	lastContactedAt: timestamp("last_contacted_at", { mode: 'string' }),
}, (table) => {
	return {
		companyIdx: index("contacts_company_idx").using("btree", table.company.asc().nullsLast().op("text_ops")),
		firstNameIdx: index("contacts_first_name_idx").using("btree", table.firstName.asc().nullsLast().op("text_ops")),
		isArchivedIdx: index("contacts_is_archived_idx").using("btree", table.isArchived.asc().nullsLast().op("bool_ops")),
		isFavoriteIdx: index("contacts_is_favorite_idx").using("btree", table.isFavorite.asc().nullsLast().op("bool_ops")),
		lastContactedAtIdx: index("contacts_last_contacted_at_idx").using("btree", table.lastContactedAt.asc().nullsLast().op("timestamp_ops")),
		lastNameIdx: index("contacts_last_name_idx").using("btree", table.lastName.asc().nullsLast().op("text_ops")),
		userIdIdx: index("contacts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		contactsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "contacts_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const customFolders = pgTable("custom_folders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	icon: text().default('📁'),
	color: varchar({ length: 20 }).default('gray'),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		userIdIdx: index("custom_folders_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		userNameIdx: index("custom_folders_user_name_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
		customFoldersUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "custom_folders_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactPhones = pgTable("contact_phones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	phone: varchar({ length: 50 }).notNull(),
	type: contactPhoneType().default('other'),
	isPrimary: boolean("is_primary").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contactIdIdx: index("contact_phones_contact_id_idx").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
		phoneIdx: index("contact_phones_phone_idx").using("btree", table.phone.asc().nullsLast().op("text_ops")),
		contactPhonesContactIdContactsIdFk: foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "contact_phones_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactSocialLinks = pgTable("contact_social_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	platform: contactSocialPlatform().notNull(),
	url: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		contactIdIdx: index("contact_social_links_contact_id_idx").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
		contactSocialLinksContactIdContactsIdFk: foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "contact_social_links_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
	}
});

export const contactTags = pgTable("contact_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 50 }).notNull(),
	color: varchar({ length: 20 }).default('blue'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		nameIdx: index("contact_tags_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
		userIdIdx: index("contact_tags_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		contactTagsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "contact_tags_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const emailContacts = pgTable("email_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	accountId: uuid("account_id").notNull(),
	emailAddress: varchar("email_address", { length: 255 }).notNull(),
	displayName: text("display_name"),
	screeningStatus: screeningStatus("screening_status").default('pending'),
	screeningDecision: heyView("screening_decision"),
	screenedAt: timestamp("screened_at", { mode: 'string' }),
	contactStatus: contactStatus("contact_status").default('unknown'),
	heyView: heyView("hey_view"),
	assignedFolder: uuid("assigned_folder"),
	emailCount: integer("email_count").default(0).notNull(),
	lastEmailAt: timestamp("last_email_at", { mode: 'string' }),
	firstEmailAt: timestamp("first_email_at", { mode: 'string' }),
	avgResponseTimeHours: integer("avg_response_time_hours"),
	sentToCount: integer("sent_to_count").default(0).notNull(),
	receivedFromCount: integer("received_from_count").default(0).notNull(),
	aiContactType: text("ai_contact_type"),
	aiImportanceScore: integer("ai_importance_score"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		accountIdIdx: index("email_contacts_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
		emailAddressIdx: index("email_contacts_email_address_idx").using("btree", table.emailAddress.asc().nullsLast().op("text_ops")),
		screeningStatusIdx: index("email_contacts_screening_status_idx").using("btree", table.screeningStatus.asc().nullsLast().op("enum_ops")),
		userIdIdx: index("email_contacts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		emailContactsAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "email_contacts_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
		emailContactsAssignedFolderCustomFoldersIdFk: foreignKey({
			columns: [table.assignedFolder],
			foreignColumns: [customFolders.id],
			name: "email_contacts_assigned_folder_custom_folders_id_fk"
		}).onDelete("set null"),
		emailContactsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_contacts_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const emailLabels = pgTable("email_labels", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	color: varchar({ length: 7 }),
	parentLabelId: uuid("parent_label_id"),
	providerLabelId: text("provider_label_id"),
	emailCount: integer("email_count").default(0).notNull(),
	isSystemLabel: boolean("is_system_label").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		accountIdIdx: index("email_labels_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
		nameIdx: index("email_labels_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
		emailLabelsAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "email_labels_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
	}
});

export const emailSettings = pgTable("email_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	emailsPerPage: integer("emails_per_page").default(50).notNull(),
	theme: text().default('light'),
	density: text().default('comfortable'),
	emailMode: emailMode("email_mode").default('hey'),
	desktopNotifications: boolean("desktop_notifications").default(true).notNull(),
	soundEnabled: boolean("sound_enabled").default(false).notNull(),
	notifyOnImportantOnly: boolean("notify_on_important_only").default(false).notNull(),
	readingPanePosition: text("reading_pane_position").default('right'),
	markAsReadDelay: integer("mark_as_read_delay").default(0).notNull(),
	defaultFontFamily: text("default_font_family").default('sans-serif'),
	defaultFontSize: integer("default_font_size").default(14),
	defaultSendBehavior: text("default_send_behavior").default('send'),
	blockTrackers: boolean("block_trackers").default(true).notNull(),
	blockExternalImages: boolean("block_external_images").default(false).notNull(),
	stripUtmParameters: boolean("strip_utm_parameters").default(true).notNull(),
	enableAiSummaries: boolean("enable_ai_summaries").default(true).notNull(),
	enableQuickReplies: boolean("enable_quick_replies").default(true).notNull(),
	enableSmartActions: boolean("enable_smart_actions").default(true).notNull(),
	aiTone: text("ai_tone").default('professional'),
	autoClassifyAfterDays: integer("auto_classify_after_days").default(14).notNull(),
	bulkEmailDetection: boolean("bulk_email_detection").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		emailSettingsAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "email_settings_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
		emailSettingsAccountIdUnique: unique("email_settings_account_id_unique").on(table.accountId),
	}
});

export const emailThreads = pgTable("email_threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	threadId: text("thread_id").notNull(),
	nylasThreadId: text("nylas_thread_id"),
	subject: text().notNull(),
	snippet: text(),
	participants: jsonb().notNull(),
	messageCount: integer("message_count").default(1).notNull(),
	unreadCount: integer("unread_count").default(0).notNull(),
	firstMessageAt: timestamp("first_message_at", { mode: 'string' }).notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).notNull(),
	hasAttachments: boolean("has_attachments").default(false).notNull(),
	hasDrafts: boolean("has_drafts").default(false).notNull(),
	isStarred: boolean("is_starred").default(false).notNull(),
	aiThreadSummary: text("ai_thread_summary"),
	aiKeyPoints: jsonb("ai_key_points"),
	aiActionItems: jsonb("ai_action_items"),
	aiGeneratedAt: timestamp("ai_generated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		accountIdIdx: index("email_threads_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
		lastMessageAtIdx: index("email_threads_last_message_at_idx").using("btree", table.lastMessageAt.asc().nullsLast().op("timestamp_ops")),
		threadIdIdx: index("email_threads_thread_id_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
		emailThreadsAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "email_threads_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
	}
});

export const emailAttachments = pgTable("email_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	emailId: uuid("email_id").notNull(),
	providerAttachmentId: text("provider_attachment_id"),
	contentId: text("content_id"),
	filename: varchar({ length: 255 }).notNull(),
	contentType: varchar("content_type", { length: 100 }).notNull(),
	size: integer().notNull(),
	storageUrl: text("storage_url"),
	storageKey: text("storage_key"),
	isInline: boolean("is_inline").default(false).notNull(),
	downloadCount: integer("download_count").default(0).notNull(),
	lastDownloadedAt: timestamp("last_downloaded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		emailIdIdx: index("email_attachments_email_id_idx").using("btree", table.emailId.asc().nullsLast().op("uuid_ops")),
		emailAttachmentsEmailIdEmailsIdFk: foreignKey({
			columns: [table.emailId],
			foreignColumns: [emails.id],
			name: "email_attachments_email_id_emails_id_fk"
		}).onDelete("cascade"),
	}
});

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tier: subscriptionTier().notNull(),
	status: subscriptionStatus().notNull(),
	processor: paymentProcessor().notNull(),
	processorSubscriptionId: text("processor_subscription_id").notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }).notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		subscriptionsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_users_id_fk"
		}),
	}
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	subscriptionTier: subscriptionTier("subscription_tier").default('free').notNull(),
	subscriptionStatus: subscriptionStatus("subscription_status"),
	paymentProcessor: paymentProcessor("payment_processor"),
	stripeCustomerId: text("stripe_customer_id"),
	squareCustomerId: text("square_customer_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const emailAccounts = pgTable("email_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	provider: emailProvider().notNull(),
	authType: emailAuthType("auth_type").notNull(),
	emailAddress: varchar("email_address", { length: 255 }).notNull(),
	displayName: text("display_name"),
	nylasGrantId: text("nylas_grant_id"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	imapHost: varchar("imap_host", { length: 255 }),
	imapPort: integer("imap_port"),
	imapUsername: varchar("imap_username", { length: 255 }),
	imapPassword: text("imap_password"),
	imapUseSsl: boolean("imap_use_ssl").default(true),
	smtpHost: varchar("smtp_host", { length: 255 }),
	smtpPort: integer("smtp_port"),
	smtpUsername: varchar("smtp_username", { length: 255 }),
	smtpPassword: text("smtp_password"),
	smtpUseSsl: boolean("smtp_use_ssl").default(true),
	status: emailAccountStatus().default('active').notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	lastSyncError: text("last_sync_error"),
	syncCursor: text("sync_cursor"),
	signature: text(),
	replyToEmail: varchar("reply_to_email", { length: 255 }),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	syncStatus: emailSyncStatus("sync_status").default('idle'),
	syncProgress: integer("sync_progress").default(0),
	syncTotal: integer("sync_total").default(0),
	lastSuccessfulSyncAt: timestamp("last_successful_sync_at", { mode: 'string' }),
	nextScheduledSyncAt: timestamp("next_scheduled_sync_at", { mode: 'string' }),
	errorCount: integer("error_count").default(0),
	consecutiveErrors: integer("consecutive_errors").default(0),
	syncPriority: integer("sync_priority").default(2),
}, (table) => {
	return {
		emailAddressIdx: index("email_accounts_email_address_idx").using("btree", table.emailAddress.asc().nullsLast().op("text_ops")),
		statusIdx: index("email_accounts_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
		userIdIdx: index("email_accounts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		emailAccountsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const syncJobs = pgTable("sync_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	userId: uuid("user_id").notNull(),
	jobType: syncJobType("job_type").default('incremental').notNull(),
	status: syncStatus().default('pending').notNull(),
	priority: integer().default(2).notNull(),
	progress: integer().default(0),
	total: integer().default(0),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	retryCount: integer("retry_count").default(0),
	maxRetries: integer("max_retries").default(5),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		accountIdIdx: index("sync_jobs_account_id_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
		priorityIdx: index("sync_jobs_priority_idx").using("btree", table.priority.asc().nullsLast().op("int4_ops")),
		scheduledForIdx: index("sync_jobs_scheduled_for_idx").using("btree", table.scheduledFor.asc().nullsLast().op("timestamp_ops")),
		statusIdx: index("sync_jobs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
		userIdIdx: index("sync_jobs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
		syncJobsAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "sync_jobs_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
		syncJobsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sync_jobs_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const emailFolders = pgTable("email_folders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	externalId: text("external_id").notNull(),
	type: text().notNull(),
	parentId: uuid("parent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	unreadCount: integer("unread_count").default(0),
}, (table) => {
	return {
		emailFoldersAccountIdEmailAccountsIdFk: foreignKey({
			columns: [table.accountId],
			foreignColumns: [emailAccounts.id],
			name: "email_folders_account_id_email_accounts_id_fk"
		}).onDelete("cascade"),
		emailFoldersUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_folders_user_id_users_id_fk"
		}).onDelete("cascade"),
		emailFoldersExternalIdUnique: unique("email_folders_external_id_unique").on(table.externalId),
	}
});
