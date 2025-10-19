-- Create webhook_subscriptions table for Microsoft Graph push notifications
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

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "webhook_subscriptions_account_id_idx" ON "webhook_subscriptions" USING btree ("account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_subscriptions_subscription_id_idx" ON "webhook_subscriptions" USING btree ("subscription_id");
CREATE INDEX IF NOT EXISTS "webhook_subscriptions_expiration_idx" ON "webhook_subscriptions" USING btree ("expiration_date_time");

