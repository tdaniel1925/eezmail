DO $$ BEGIN
  CREATE TYPE "public"."email_delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."notification_audience" AS ENUM('all', 'sandbox', 'individual', 'team', 'enterprise', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."notification_status" AS ENUM('draft', 'active', 'paused', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."notification_template_type" AS ENUM('transactional', 'marketing', 'system', 'sandbox');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_rule_id" uuid,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"severity" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"metric_value" numeric(20, 6),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"acknowledged_by" uuid,
	"acknowledged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"metric" varchar(100) NOT NULL,
	"operator" varchar(10) NOT NULL,
	"threshold" numeric(20, 6) NOT NULL,
	"duration_minutes" integer DEFAULT 5,
	"severity" varchar(20) DEFAULT 'warning',
	"notification_channels" jsonb DEFAULT '[]'::jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_rules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"category_id" uuid,
	"tags" text[] DEFAULT '{}',
	"author_id" uuid,
	"status" varchar(20) DEFAULT 'draft',
	"visibility" varchar(20) DEFAULT 'public',
	"helpful_count" integer DEFAULT 0,
	"not_helpful_count" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[],
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"variables" jsonb DEFAULT '{}'::jsonb,
	"status" "email_delivery_status" DEFAULT 'pending' NOT NULL,
	"delivery_attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"external_id" varchar(255),
	"external_status" text,
	"error_message" text,
	"error_code" varchar(50),
	"scheduled_for" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"type" "notification_template_type" NOT NULL,
	"audience" "notification_audience" DEFAULT 'all' NOT NULL,
	"status" "notification_status" DEFAULT 'draft' NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"preheader" text,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"personalization_rules" jsonb DEFAULT '{}'::jsonb,
	"from_name" varchar(100),
	"from_email" varchar(255),
	"reply_to_email" varchar(255),
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"use_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" serial NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"subject" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100),
	"priority" varchar(20) DEFAULT 'normal',
	"status" varchar(20) DEFAULT 'new',
	"assigned_to" uuid,
	"sla_response_by" timestamp,
	"sla_resolution_by" timestamp,
	"first_response_at" timestamp,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_metrics" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"metric_value" numeric(20, 6) NOT NULL,
	"tags" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"url" text NOT NULL,
	"storage_key" text,
	"alt_text" text,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"use_count" integer DEFAULT 0 NOT NULL,
	"used_in_templates" jsonb DEFAULT '[]'::jsonb,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid,
	"author_email" varchar(255),
	"comment" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" varchar(20) DEFAULT 'light',
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'UTC',
	"notifications" jsonb DEFAULT '{}'::jsonb,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_images" ADD CONSTRAINT "template_images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_template_id_idx" ON "notification_queue" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_recipient_id_idx" ON "notification_queue" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_status_idx" ON "notification_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_scheduled_for_idx" ON "notification_queue" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_sent_at_idx" ON "notification_queue" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_settings_user_id_idx" ON "notification_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_settings_category_idx" ON "notification_settings" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notification_settings_user_category_idx" ON "notification_settings" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_templates_type_idx" ON "notification_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_templates_audience_idx" ON "notification_templates" USING btree ("audience");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_templates_status_idx" ON "notification_templates" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_templates_category_idx" ON "notification_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_images_uploaded_by_idx" ON "template_images" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_images_filename_idx" ON "template_images" USING btree ("filename");