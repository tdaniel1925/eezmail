-- Migration: Recent session updates (GDPR, Email Drafts, Custom Folders)
-- Created: 2025-10-27

-- GDPR Tables
CREATE TABLE IF NOT EXISTS "data_export_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"download_url" text,
	"error_message" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "data_deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"deletion_report" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Email Drafts Table
CREATE TABLE IF NOT EXISTS "email_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"to" text,
	"cc" text,
	"bcc" text,
	"subject" text,
	"body" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"mode" text DEFAULT 'traditional',
	"reply_to_id" uuid,
	"last_saved" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Custom Folders enhancements
ALTER TABLE "custom_folders" ADD COLUMN IF NOT EXISTS "icon" text DEFAULT '📁';
ALTER TABLE "custom_folders" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;

-- Foreign Keys
DO $$ BEGIN
 ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_reply_to_id_emails_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."emails"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_data_export_requests_user_id" ON "data_export_requests" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_data_export_requests_status" ON "data_export_requests" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_data_export_requests_requested_at" ON "data_export_requests" USING btree ("requested_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_data_deletion_requests_user_id" ON "data_deletion_requests" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_data_deletion_requests_status" ON "data_deletion_requests" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_data_deletion_requests_requested_at" ON "data_deletion_requests" USING btree ("requested_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_email_drafts_user_id" ON "email_drafts" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_email_drafts_account_id" ON "email_drafts" USING btree ("account_id");
CREATE INDEX IF NOT EXISTS "idx_email_drafts_last_saved" ON "email_drafts" USING btree ("last_saved" DESC);

CREATE INDEX IF NOT EXISTS "idx_custom_folders_sort_order" ON "custom_folders" USING btree ("user_id","sort_order");

