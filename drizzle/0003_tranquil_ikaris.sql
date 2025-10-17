CREATE TYPE "public"."ai_reply_status" AS ENUM('analyzing', 'questioning', 'drafting', 'ready', 'approved', 'sent');--> statement-breakpoint
CREATE TYPE "public"."chatbot_action_type" AS ENUM('bulk_move', 'bulk_archive', 'bulk_delete', 'bulk_mark_read', 'bulk_star', 'create_folder', 'delete_folder', 'rename_folder', 'create_rule', 'delete_rule', 'update_rule', 'create_contact', 'update_contact', 'delete_contact', 'create_calendar_event', 'update_calendar_event', 'delete_calendar_event', 'update_settings');--> statement-breakpoint
CREATE TYPE "public"."density" AS ENUM('comfortable', 'compact', 'default');--> statement-breakpoint
CREATE TYPE "public"."email_template_category" AS ENUM('meeting', 'thanks', 'intro', 'followup', 'apology', 'announcement', 'other');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_reply_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"draft_body" text DEFAULT '' NOT NULL,
	"draft_subject" text NOT NULL,
	"conversation_history" jsonb,
	"questions" jsonb,
	"user_responses" jsonb,
	"status" "ai_reply_status" DEFAULT 'analyzing' NOT NULL,
	"tone" text,
	"length" text,
	"include_context" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chatbot_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" "chatbot_action_type" NOT NULL,
	"description" text NOT NULL,
	"undo_data" jsonb NOT NULL,
	"is_undone" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) NOT NULL,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"category" "email_template_category" DEFAULT 'other',
	"variables" jsonb DEFAULT '[]'::jsonb,
	"use_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "extracted_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp,
	"priority" "priority" DEFAULT 'medium',
	"assignee" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follow_up_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"original_email_date" timestamp NOT NULL,
	"suggested_follow_up_date" timestamp NOT NULL,
	"reason" text NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"is_snoozed" boolean DEFAULT false NOT NULL,
	"snooze_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "label_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium',
	"due_date" timestamp,
	"completed_at" timestamp,
	"email_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"density" "density" DEFAULT 'default' NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"desktop_notifications" boolean DEFAULT true NOT NULL,
	"sound_effects" boolean DEFAULT true NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"sidebar_collapsed" boolean DEFAULT false NOT NULL,
	"sidebar_width" integer DEFAULT 260 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "email_accounts" ALTER COLUMN "sync_priority" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "email_accounts" ALTER COLUMN "sync_priority" SET DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "sync_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "sentiment" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "sentiment_score" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_reply_drafts" ADD CONSTRAINT "ai_reply_drafts_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_reply_drafts" ADD CONSTRAINT "ai_reply_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chatbot_actions" ADD CONSTRAINT "chatbot_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_labels" ADD CONSTRAINT "custom_labels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "extracted_actions" ADD CONSTRAINT "extracted_actions_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "extracted_actions" ADD CONSTRAINT "extracted_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow_up_reminders" ADD CONSTRAINT "follow_up_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "label_assignments" ADD CONSTRAINT "label_assignments_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "label_assignments" ADD CONSTRAINT "label_assignments_label_id_custom_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."custom_labels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_reply_drafts_email_id_idx" ON "ai_reply_drafts" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_reply_drafts_user_id_idx" ON "ai_reply_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_reply_drafts_status_idx" ON "ai_reply_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatbot_actions_user_id_idx" ON "chatbot_actions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatbot_actions_action_type_idx" ON "chatbot_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatbot_actions_expires_at_idx" ON "chatbot_actions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chatbot_actions_is_undone_idx" ON "chatbot_actions" USING btree ("is_undone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_labels_user_id_idx" ON "custom_labels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_labels_sort_order_idx" ON "custom_labels" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_templates_user_id_idx" ON "email_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_templates_category_idx" ON "email_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "extracted_actions_email_id_idx" ON "extracted_actions" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "extracted_actions_user_id_idx" ON "extracted_actions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "extracted_actions_is_completed_idx" ON "extracted_actions" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "extracted_actions_due_date_idx" ON "extracted_actions" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_up_reminders_email_id_idx" ON "follow_up_reminders" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_up_reminders_user_id_idx" ON "follow_up_reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_up_reminders_suggested_date_idx" ON "follow_up_reminders" USING btree ("suggested_follow_up_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_up_reminders_is_dismissed_idx" ON "follow_up_reminders" USING btree ("is_dismissed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_assignments_email_id_idx" ON "label_assignments" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_assignments_label_id_idx" ON "label_assignments" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "label_assignments_unique_idx" ON "label_assignments" USING btree ("email_id","label_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_user_id_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_completed_idx" ON "tasks" USING btree ("completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx" ON "tasks" USING btree ("due_date");