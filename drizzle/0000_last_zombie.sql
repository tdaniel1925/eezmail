-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."contact_address_type" AS ENUM('work', 'home', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_email_type" AS ENUM('work', 'personal', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_field_type" AS ENUM('text', 'number', 'date', 'url');--> statement-breakpoint
CREATE TYPE "public"."contact_phone_type" AS ENUM('mobile', 'work', 'home', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_social_platform" AS ENUM('linkedin', 'twitter', 'facebook', 'instagram', 'github', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_source_type" AS ENUM('manual', 'synced');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('unknown', 'approved', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."draft_source" AS ENUM('user', 'ai_suggestion', 'ai_autonomous');--> statement-breakpoint
CREATE TYPE "public"."email_account_status" AS ENUM('active', 'inactive', 'error', 'syncing');--> statement-breakpoint
CREATE TYPE "public"."email_auth_type" AS ENUM('oauth', 'password');--> statement-breakpoint
CREATE TYPE "public"."email_category" AS ENUM('unscreened', 'inbox', 'newsfeed', 'receipts', 'spam', 'archived');--> statement-breakpoint
CREATE TYPE "public"."email_mode" AS ENUM('traditional', 'hey', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."email_provider" AS ENUM('gmail', 'microsoft', 'yahoo', 'imap', 'custom');--> statement-breakpoint
CREATE TYPE "public"."email_sync_status" AS ENUM('idle', 'syncing', 'paused', 'error', 'success');--> statement-breakpoint
CREATE TYPE "public"."hey_view" AS ENUM('imbox', 'feed', 'paper_trail');--> statement-breakpoint
CREATE TYPE "public"."payment_processor" AS ENUM('stripe', 'square');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."rule_action_type" AS ENUM('move_to_folder', 'add_label', 'star', 'mark_as_read', 'mark_as_important', 'delete', 'archive', 'forward_to', 'mark_as_spam');--> statement-breakpoint
CREATE TYPE "public"."rule_condition_field" AS ENUM('from', 'to', 'cc', 'subject', 'body', 'has_attachment', 'is_starred', 'is_important');--> statement-breakpoint
CREATE TYPE "public"."rule_condition_operator" AS ENUM('contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with', 'matches_regex', 'is_true', 'is_false');--> statement-breakpoint
CREATE TYPE "public"."screening_status" AS ENUM('pending', 'screened', 'auto_classified');--> statement-breakpoint
CREATE TYPE "public"."sender_trust_level" AS ENUM('trusted', 'unknown', 'spam');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'team', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."sync_job_type" AS ENUM('full', 'incremental', 'selective', 'webhook_triggered');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_type" AS ENUM('full', 'incremental', 'webhook', 'manual');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"account_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"stop_processing" boolean DEFAULT false NOT NULL,
	"times_triggered" integer DEFAULT 0 NOT NULL,
	"last_triggered" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"message_id" text NOT NULL,
	"nylas_message_id" text,
	"provider_message_id" text,
	"thread_id" text,
	"subject" text NOT NULL,
	"snippet" text,
	"from_address" jsonb NOT NULL,
	"to_addresses" jsonb NOT NULL,
	"cc_addresses" jsonb,
	"bcc_addresses" jsonb,
	"reply_to" jsonb,
	"body_text" text,
	"body_html" text,
	"received_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_important" boolean DEFAULT false,
	"is_draft" boolean DEFAULT false NOT NULL,
	"has_drafts" boolean DEFAULT false NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"folder_name" text,
	"label_ids" text[],
	"screening_status" "screening_status" DEFAULT 'pending',
	"hey_view" "hey_view",
	"contact_status" "contact_status" DEFAULT 'unknown',
	"reply_later_until" timestamp,
	"reply_later_note" text,
	"set_aside_at" timestamp,
	"custom_folder_id" uuid,
	"trackers_blocked" integer DEFAULT 0,
	"ai_summary" text,
	"ai_quick_replies" jsonb,
	"ai_smart_actions" jsonb,
	"ai_generated_at" timestamp,
	"ai_category" text,
	"ai_priority" "priority",
	"ai_sentiment" "sentiment",
	"search_vector" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"has_inline_images" boolean DEFAULT false,
	"email_category" "email_category" DEFAULT 'unscreened',
	"screened_at" timestamp,
	"screened_by" text,
	"needs_reply" boolean DEFAULT false,
	"is_set_aside" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sender_trust" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sender_email" text NOT NULL,
	"trust_level" "sender_trust_level" DEFAULT 'unknown',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_custom_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"field_value" text,
	"field_type" "contact_field_type" DEFAULT 'text',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"type" "contact_email_type" DEFAULT 'other',
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"street" text,
	"city" varchar(100),
	"state" varchar(100),
	"zip_code" varchar(20),
	"country" varchar(100),
	"type" "contact_address_type" DEFAULT 'other',
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_tag_assignments" (
	"contact_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"display_name" varchar(200),
	"nickname" varchar(100),
	"company" varchar(200),
	"job_title" varchar(200),
	"department" varchar(100),
	"birthday" timestamp,
	"notes" text,
	"avatar_url" text,
	"avatar_provider" varchar(50),
	"source_type" "contact_source_type" DEFAULT 'manual',
	"source_provider" varchar(50),
	"source_id" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_contacted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" text DEFAULT '📁',
	"color" varchar(20) DEFAULT 'gray',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_phones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"phone" varchar(50) NOT NULL,
	"type" "contact_phone_type" DEFAULT 'other',
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"platform" "contact_social_platform" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(20) DEFAULT 'blue',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"display_name" text,
	"screening_status" "screening_status" DEFAULT 'pending',
	"screening_decision" "hey_view",
	"screened_at" timestamp,
	"contact_status" "contact_status" DEFAULT 'unknown',
	"hey_view" "hey_view",
	"assigned_folder" uuid,
	"email_count" integer DEFAULT 0 NOT NULL,
	"last_email_at" timestamp,
	"first_email_at" timestamp,
	"avg_response_time_hours" integer,
	"sent_to_count" integer DEFAULT 0 NOT NULL,
	"received_from_count" integer DEFAULT 0 NOT NULL,
	"ai_contact_type" text,
	"ai_importance_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"parent_label_id" uuid,
	"provider_label_id" text,
	"email_count" integer DEFAULT 0 NOT NULL,
	"is_system_label" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"emails_per_page" integer DEFAULT 50 NOT NULL,
	"theme" text DEFAULT 'light',
	"density" text DEFAULT 'comfortable',
	"email_mode" "email_mode" DEFAULT 'hey',
	"desktop_notifications" boolean DEFAULT true NOT NULL,
	"sound_enabled" boolean DEFAULT false NOT NULL,
	"notify_on_important_only" boolean DEFAULT false NOT NULL,
	"reading_pane_position" text DEFAULT 'right',
	"mark_as_read_delay" integer DEFAULT 0 NOT NULL,
	"default_font_family" text DEFAULT 'sans-serif',
	"default_font_size" integer DEFAULT 14,
	"default_send_behavior" text DEFAULT 'send',
	"block_trackers" boolean DEFAULT true NOT NULL,
	"block_external_images" boolean DEFAULT false NOT NULL,
	"strip_utm_parameters" boolean DEFAULT true NOT NULL,
	"enable_ai_summaries" boolean DEFAULT true NOT NULL,
	"enable_quick_replies" boolean DEFAULT true NOT NULL,
	"enable_smart_actions" boolean DEFAULT true NOT NULL,
	"ai_tone" text DEFAULT 'professional',
	"auto_classify_after_days" integer DEFAULT 14 NOT NULL,
	"bulk_email_detection" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_settings_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"thread_id" text NOT NULL,
	"nylas_thread_id" text,
	"subject" text NOT NULL,
	"snippet" text,
	"participants" jsonb NOT NULL,
	"message_count" integer DEFAULT 1 NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"first_message_at" timestamp NOT NULL,
	"last_message_at" timestamp NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"has_drafts" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"ai_thread_summary" text,
	"ai_key_points" jsonb,
	"ai_action_items" jsonb,
	"ai_generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"provider_attachment_id" text,
	"content_id" text,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"storage_url" text,
	"storage_key" text,
	"is_inline" boolean DEFAULT false NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"last_downloaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "subscription_tier" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"processor" "payment_processor" NOT NULL,
	"processor_subscription_id" text NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_status" "subscription_status",
	"payment_processor" "payment_processor",
	"stripe_customer_id" text,
	"square_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "email_provider" NOT NULL,
	"auth_type" "email_auth_type" NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"display_name" text,
	"nylas_grant_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"imap_host" varchar(255),
	"imap_port" integer,
	"imap_username" varchar(255),
	"imap_password" text,
	"imap_use_ssl" boolean DEFAULT true,
	"smtp_host" varchar(255),
	"smtp_port" integer,
	"smtp_username" varchar(255),
	"smtp_password" text,
	"smtp_use_ssl" boolean DEFAULT true,
	"status" "email_account_status" DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_error" text,
	"sync_cursor" text,
	"signature" text,
	"reply_to_email" varchar(255),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sync_status" "email_sync_status" DEFAULT 'idle',
	"sync_progress" integer DEFAULT 0,
	"sync_total" integer DEFAULT 0,
	"last_successful_sync_at" timestamp,
	"next_scheduled_sync_at" timestamp,
	"error_count" integer DEFAULT 0,
	"consecutive_errors" integer DEFAULT 0,
	"sync_priority" integer DEFAULT 2
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"job_type" "sync_job_type" DEFAULT 'incremental' NOT NULL,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 2 NOT NULL,
	"progress" integer DEFAULT 0,
	"total" integer DEFAULT 0,
	"scheduled_for" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 5,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"external_id" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"unread_count" integer DEFAULT 0,
	CONSTRAINT "email_folders_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_signatures" ADD CONSTRAINT "email_signatures_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_signatures" ADD CONSTRAINT "email_signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_rules" ADD CONSTRAINT "email_rules_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_rules" ADD CONSTRAINT "email_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_custom_folder_id_custom_folders_id_fk" FOREIGN KEY ("custom_folder_id") REFERENCES "public"."custom_folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sender_trust" ADD CONSTRAINT "sender_trust_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_custom_fields" ADD CONSTRAINT "contact_custom_fields_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_emails" ADD CONSTRAINT "contact_emails_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_addresses" ADD CONSTRAINT "contact_addresses_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_tag_assignments" ADD CONSTRAINT "contact_tag_assignments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_tag_assignments" ADD CONSTRAINT "contact_tag_assignments_tag_id_contact_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."contact_tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_folders" ADD CONSTRAINT "custom_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_phones" ADD CONSTRAINT "contact_phones_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_social_links" ADD CONSTRAINT "contact_social_links_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_contacts" ADD CONSTRAINT "email_contacts_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_contacts" ADD CONSTRAINT "email_contacts_assigned_folder_custom_folders_id_fk" FOREIGN KEY ("assigned_folder") REFERENCES "public"."custom_folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_contacts" ADD CONSTRAINT "email_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_labels" ADD CONSTRAINT "email_labels_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_folders" ADD CONSTRAINT "email_folders_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_folders" ADD CONSTRAINT "email_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_signatures_account_id_idx" ON "email_signatures" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_signatures_user_id_idx" ON "email_signatures" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_account_id_idx" ON "email_rules" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_is_enabled_idx" ON "email_rules" USING btree ("is_enabled" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_priority_idx" ON "email_rules" USING btree ("priority" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_user_id_idx" ON "email_rules" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_account_id_idx" ON "emails" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_email_category_idx" ON "emails" USING btree ("email_category" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_hey_view_idx" ON "emails" USING btree ("hey_view" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_is_important_idx" ON "emails" USING btree ("is_important" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_is_read_idx" ON "emails" USING btree ("is_read" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_is_set_aside_idx" ON "emails" USING btree ("is_set_aside" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_message_id_idx" ON "emails" USING btree ("message_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_needs_reply_idx" ON "emails" USING btree ("needs_reply" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_received_at_idx" ON "emails" USING btree ("received_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_screening_status_idx" ON "emails" USING btree ("screening_status" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_thread_id_idx" ON "emails" USING btree ("thread_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sender_trust_sender_email_idx" ON "sender_trust" USING btree ("sender_email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sender_trust_trust_level_idx" ON "sender_trust" USING btree ("trust_level" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sender_trust_user_id_idx" ON "sender_trust" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_custom_fields_contact_id_idx" ON "contact_custom_fields" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_emails_contact_id_idx" ON "contact_emails" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_emails_email_idx" ON "contact_emails" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_emails_is_primary_idx" ON "contact_emails" USING btree ("is_primary" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_addresses_contact_id_idx" ON "contact_addresses" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tag_assignments_contact_id_idx" ON "contact_tag_assignments" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tag_assignments_tag_id_idx" ON "contact_tag_assignments" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_notes_contact_id_idx" ON "contact_notes" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_notes_created_at_idx" ON "contact_notes" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_notes_user_id_idx" ON "contact_notes" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_company_idx" ON "contacts" USING btree ("company" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_first_name_idx" ON "contacts" USING btree ("first_name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_is_archived_idx" ON "contacts" USING btree ("is_archived" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_is_favorite_idx" ON "contacts" USING btree ("is_favorite" bool_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_last_contacted_at_idx" ON "contacts" USING btree ("last_contacted_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_last_name_idx" ON "contacts" USING btree ("last_name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_user_id_idx" ON "contacts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_folders_user_id_idx" ON "custom_folders" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_folders_user_name_idx" ON "custom_folders" USING btree ("user_id" text_ops,"name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_phones_contact_id_idx" ON "contact_phones" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_phones_phone_idx" ON "contact_phones" USING btree ("phone" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_social_links_contact_id_idx" ON "contact_social_links" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tags_name_idx" ON "contact_tags" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tags_user_id_idx" ON "contact_tags" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_account_id_idx" ON "email_contacts" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_email_address_idx" ON "email_contacts" USING btree ("email_address" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_screening_status_idx" ON "email_contacts" USING btree ("screening_status" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_user_id_idx" ON "email_contacts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_labels_account_id_idx" ON "email_labels" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_labels_name_idx" ON "email_labels" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_threads_account_id_idx" ON "email_threads" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_threads_last_message_at_idx" ON "email_threads" USING btree ("last_message_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_threads_thread_id_idx" ON "email_threads" USING btree ("thread_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_attachments_email_id_idx" ON "email_attachments" USING btree ("email_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_accounts_email_address_idx" ON "email_accounts" USING btree ("email_address" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_accounts_status_idx" ON "email_accounts" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_accounts_user_id_idx" ON "email_accounts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_account_id_idx" ON "sync_jobs" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_priority_idx" ON "sync_jobs" USING btree ("priority" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_scheduled_for_idx" ON "sync_jobs" USING btree ("scheduled_for" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_status_idx" ON "sync_jobs" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_user_id_idx" ON "sync_jobs" USING btree ("user_id" uuid_ops);
*/