CREATE TYPE "public"."scheduled_email_status" AS ENUM('pending', 'sent', 'failed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."email_category" ADD VALUE 'newsletter';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"to" text,
	"cc" text,
	"bcc" text,
	"subject" text,
	"body" text,
	"attachments" jsonb,
	"mode" text DEFAULT 'compose' NOT NULL,
	"reply_to_id" uuid,
	"last_saved" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb,
	"scheduled_for" timestamp NOT NULL,
	"timezone" text DEFAULT 'UTC',
	"status" "scheduled_email_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "is_trashed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_reply_to_id_emails_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."emails"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_drafts_user_id_idx" ON "email_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_drafts_account_id_idx" ON "email_drafts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_drafts_last_saved_idx" ON "email_drafts" USING btree ("last_saved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_emails_user_id_idx" ON "scheduled_emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_emails_account_id_idx" ON "scheduled_emails" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_emails_scheduled_for_idx" ON "scheduled_emails" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_emails_status_idx" ON "scheduled_emails" USING btree ("status");