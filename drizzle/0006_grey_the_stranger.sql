ALTER TYPE "public"."email_category" ADD VALUE 'sent' BEFORE 'newsfeed';--> statement-breakpoint
ALTER TYPE "public"."email_category" ADD VALUE 'drafts' BEFORE 'newsfeed';--> statement-breakpoint
ALTER TABLE "email_accounts" DROP COLUMN IF EXISTS "nylas_grant_id";--> statement-breakpoint
ALTER TABLE "email_threads" DROP COLUMN IF EXISTS "nylas_thread_id";--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "nylas_message_id";