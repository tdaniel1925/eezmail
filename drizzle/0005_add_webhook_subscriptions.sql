CREATE TYPE "public"."contact_event_type" AS ENUM('email_sent', 'email_received', 'voice_message_sent', 'voice_message_received', 'note_added', 'call_made', 'meeting_scheduled', 'document_shared', 'contact_created', 'contact_updated');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "contact_event_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"subscription_id" varchar(255) NOT NULL,
	"resource" text NOT NULL,
	"change_type" varchar(100) NOT NULL,
	"notification_url" text NOT NULL,
	"client_state" varchar(255) NOT NULL,
	"expiration_date_time" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_renewed_at" timestamp,
	CONSTRAINT "webhook_subscriptions_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "voice_message_url" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "voice_message_duration" integer;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "has_voice_message" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "voice_message_format" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "voice_message_size" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "voice_settings" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_timeline" ADD CONSTRAINT "contact_timeline_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_timeline" ADD CONSTRAINT "contact_timeline_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_timeline_contact_id_idx" ON "contact_timeline" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_timeline_user_id_idx" ON "contact_timeline" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_timeline_event_type_idx" ON "contact_timeline" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_timeline_created_at_idx" ON "contact_timeline" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_subscriptions_account_id_idx" ON "webhook_subscriptions" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_subscriptions_subscription_id_idx" ON "webhook_subscriptions" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_subscriptions_expiration_idx" ON "webhook_subscriptions" USING btree ("expiration_date_time");