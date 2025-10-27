ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "seats" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "price_per_seat" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "total_amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."subscriptions" ALTER COLUMN "tier" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "subscription_tier" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscription_tier";--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('individual', 'team', 'enterprise');--> statement-breakpoint
ALTER TABLE "public"."subscriptions" ALTER COLUMN "tier" SET DATA TYPE "public"."subscription_tier" USING "tier"::"public"."subscription_tier";--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "subscription_tier" SET DATA TYPE "public"."subscription_tier" USING "subscription_tier"::"public"."subscription_tier";