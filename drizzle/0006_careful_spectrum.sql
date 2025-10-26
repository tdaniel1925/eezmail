CREATE TYPE "public"."account_type" AS ENUM('individual', 'business');--> statement-breakpoint
CREATE TYPE "public"."attendee_response_status" AS ENUM('pending', 'accepted', 'declined', 'tentative');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_status" AS ENUM('confirmed', 'tentative', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_type" AS ENUM('meeting', 'task', 'personal', 'reminder', 'all_day');--> statement-breakpoint
CREATE TYPE "public"."communication_plan_type" AS ENUM('personal', 'professional', 'enterprise', 'custom');--> statement-breakpoint
CREATE TYPE "public"."communication_status" AS ENUM('sent', 'failed', 'rate_limited');--> statement-breakpoint
CREATE TYPE "public"."communication_type" AS ENUM('sms', 'voice_call');--> statement-breakpoint
CREATE TYPE "public"."core_folder_type" AS ENUM('inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'starred', 'important', 'all_mail', 'outbox', 'custom');--> statement-breakpoint
CREATE TYPE "public"."embedding_queue_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."external_calendar_provider" AS ENUM('google', 'microsoft', 'apple', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('email', 'sync', 'calendar', 'contact', 'task', 'system', 'account', 'settings');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('success', 'error', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."proactive_alert_type" AS ENUM('vip_email', 'overdue_response', 'meeting_prep', 'urgent_keyword', 'follow_up_needed', 'deadline_approaching');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('subscription', 'one_time', 'usage_based');--> statement-breakpoint
CREATE TYPE "public"."reminder_method" AS ENUM('email', 'push', 'sms');--> statement-breakpoint
CREATE TYPE "public"."sandbox_company_status" AS ENUM('active', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sync_direction" AS ENUM('pull', 'push', 'bidirectional');--> statement-breakpoint
CREATE TYPE "public"."timeline_queue_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'sandbox_user', 'admin', 'super_admin');--> statement-breakpoint
ALTER TYPE "public"."contact_event_type" ADD VALUE 'sms_sent';--> statement-breakpoint
ALTER TYPE "public"."contact_event_type" ADD VALUE 'sms_received';--> statement-breakpoint
ALTER TYPE "public"."contact_event_type" ADD VALUE 'voice_call_made';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_pricing_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"rate_per_1k_tokens" numeric(8, 6) NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_until" timestamp,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"operation_type" varchar(50) NOT NULL,
	"model" varchar(100),
	"prompt_tokens" integer NOT NULL,
	"completion_tokens" integer NOT NULL,
	"total_tokens" integer NOT NULL,
	"cost" numeric(8, 6) NOT NULL,
	"billed_to" varchar(20),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_trial_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"credit_amount" numeric(10, 2) NOT NULL,
	"tokens_included" integer,
	"duration_days" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"remaining_balance" numeric(10, 2),
	"tokens_used" integer DEFAULT 0,
	"granted_by" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_type" varchar(50) NOT NULL,
	"actor_email" varchar(255),
	"impersonator_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar(255),
	"organization_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_id" varchar(100),
	"session_id" varchar(100),
	"changes" jsonb,
	"metadata" jsonb,
	"risk_level" varchar(20) DEFAULT 'low',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"response_status" "attendee_response_status" DEFAULT 'pending',
	"is_organizer" boolean DEFAULT false,
	"is_optional" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"is_virtual" boolean DEFAULT false,
	"meeting_url" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" text DEFAULT 'UTC',
	"is_all_day" boolean DEFAULT false,
	"type" "calendar_event_type" DEFAULT 'meeting' NOT NULL,
	"status" "calendar_event_status" DEFAULT 'confirmed',
	"color" text DEFAULT 'blue',
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"recurrence_end_date" timestamp,
	"parent_event_id" uuid,
	"email_thread_id" text,
	"email_id" uuid,
	"external_event_id" text,
	"external_calendar_id" text,
	"external_provider" "external_calendar_provider",
	"created_by" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"minutes_before" integer NOT NULL,
	"method" "reminder_method" NOT NULL,
	"sent" boolean DEFAULT false,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) DEFAULT '0',
	"discount_code" varchar(50),
	"status" text DEFAULT 'active',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communication_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_type" "communication_plan_type" DEFAULT 'personal' NOT NULL,
	"sms_per_minute" integer DEFAULT 1 NOT NULL,
	"sms_per_hour" integer DEFAULT 10 NOT NULL,
	"sms_per_day" integer DEFAULT 100 NOT NULL,
	"voice_per_minute" integer DEFAULT 1 NOT NULL,
	"voice_per_hour" integer DEFAULT 5 NOT NULL,
	"voice_per_day" integer DEFAULT 20 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"override_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "communication_limits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"type" varchar(50) NOT NULL,
	"direction" varchar(20),
	"from" varchar(255),
	"to" varchar(255),
	"subject" text,
	"message" text,
	"status" varchar(50),
	"provider" varchar(50),
	"provider_id" varchar(255),
	"billed_to" varchar(20),
	"cost" numeric(6, 4),
	"billing_status" varchar(20) DEFAULT 'pending',
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communication_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"twilio_account_sid" text,
	"twilio_auth_token" text,
	"twilio_phone_number" text,
	"use_custom_twilio" boolean DEFAULT false NOT NULL,
	"billing_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "communication_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communication_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "communication_type" NOT NULL,
	"recipient_phone" text NOT NULL,
	"contact_id" uuid,
	"status" "communication_status" NOT NULL,
	"cost" varchar(20),
	"used_custom_twilio" boolean DEFAULT false NOT NULL,
	"message_preview" text,
	"error_message" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_timeline_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"sender_email" text NOT NULL,
	"subject" text NOT NULL,
	"status" timeline_queue_status DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"plan_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"sms_used_current_period" integer DEFAULT 0,
	"sms_included_in_plan" integer DEFAULT 0,
	"stripe_subscription_id" varchar(255),
	"square_subscription_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"applies_to" text DEFAULT 'all' NOT NULL,
	"applies_to_tier_id" uuid,
	"max_redemptions" integer,
	"current_redemptions" integer DEFAULT 0,
	"max_redemptions_per_user" integer DEFAULT 1,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"stripe_coupon_id" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"redeemed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "embedding_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "embedding_queue_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "external_calendar_provider" NOT NULL,
	"calendar_id" text NOT NULL,
	"calendar_name" text,
	"calendar_color" text,
	"sync_enabled" boolean DEFAULT true,
	"sync_direction" "sync_direction" DEFAULT 'bidirectional',
	"last_sync_at" timestamp,
	"sync_token" text,
	"next_sync_token" text,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "folder_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"provider_folder_name" text NOT NULL,
	"provider_folder_id" text NOT NULL,
	"mapped_to_type" "core_folder_type" NOT NULL,
	"ai_recommendation" "core_folder_type",
	"ai_confidence" numeric(3, 2),
	"mapping_source" varchar(20) DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "impersonation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"read_only" boolean DEFAULT false NOT NULL,
	"actions_performed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "impersonation_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"invoice_number" varchar(100) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) NOT NULL,
	"type" varchar(50) NOT NULL,
	"stripe_invoice_id" varchar(255),
	"square_invoice_id" varchar(255),
	"pdf_url" text,
	"items" jsonb NOT NULL,
	"billing_details" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"category" "notification_category" NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"action_url" text,
	"action_label" text,
	"secondary_action_url" text,
	"secondary_action_label" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" text NOT NULL,
	"achievement_name" text NOT NULL,
	"achievement_description" text,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_connected" boolean DEFAULT false NOT NULL,
	"signature_configured" boolean DEFAULT false NOT NULL,
	"profile_completed" boolean DEFAULT false NOT NULL,
	"ai_reply_tried" boolean DEFAULT false NOT NULL,
	"smart_inbox_viewed" boolean DEFAULT false NOT NULL,
	"keyboard_shortcuts_learned" boolean DEFAULT false NOT NULL,
	"contacts_explored" boolean DEFAULT false NOT NULL,
	"automation_created" boolean DEFAULT false NOT NULL,
	"voice_feature_tried" boolean DEFAULT false NOT NULL,
	"chatbot_used" boolean DEFAULT false NOT NULL,
	"current_phase" integer DEFAULT 1 NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"last_viewed_step" text,
	"dismissed_onboarding" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_tutorials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tutorial_id" text NOT NULL,
	"started" boolean DEFAULT false NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"time_spent_seconds" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"product_type" varchar(20) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"subscription_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"status" varchar(20) DEFAULT 'pending',
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"payment_processor" text,
	"stripe_payment_intent_id" text,
	"square_payment_id" text,
	"paid_at" timestamp,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member',
	"permissions" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"pricing_tier" varchar(50) DEFAULT 'standard',
	"sms_balance" numeric(10, 2) DEFAULT '0.00',
	"ai_balance" numeric(10, 2) DEFAULT '0.00',
	"is_trial" boolean DEFAULT false,
	"trial_credits_used" numeric(10, 2) DEFAULT '0.00',
	"trial_expires_at" timestamp,
	"sms_sent_count" integer DEFAULT 0,
	"ai_tokens_used" integer DEFAULT 0,
	"settings" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'admin',
	"permissions" jsonb DEFAULT '{"view_all":true,"manage_pricing":true,"manage_organizations":true}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_admins_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"sms_rate" numeric(6, 4) NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_until" timestamp,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"interval" text DEFAULT 'month' NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_highlighted" boolean DEFAULT false,
	"is_custom" boolean DEFAULT false,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pricing_tiers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proactive_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "proactive_alert_type" NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"email_id" uuid,
	"contact_id" uuid,
	"calendar_event_id" uuid,
	"action_url" text,
	"action_label" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_at" timestamp,
	"acted_upon" boolean DEFAULT false NOT NULL,
	"acted_upon_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"product_type" varchar(20) NOT NULL,
	"price" numeric(10, 2),
	"billing_interval" text,
	"trial_period_days" integer DEFAULT 0,
	"usage_unit" text,
	"usage_rate" numeric(10, 6),
	"status" varchar(20) DEFAULT 'active',
	"stripe_product_id" text,
	"stripe_price_id" text,
	"category" text,
	"features" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_stripe_product_id_unique" UNIQUE("stripe_product_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sandbox_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "sandbox_company_status" DEFAULT 'active' NOT NULL,
	"twilio_account_sid" text,
	"twilio_auth_token" text,
	"twilio_phone_number" text,
	"openai_api_key" text,
	"openai_organization_id" text,
	"unlimited_sms" boolean DEFAULT true NOT NULL,
	"unlimited_ai" boolean DEFAULT true NOT NULL,
	"unlimited_storage" boolean DEFAULT true NOT NULL,
	"total_sms_used" integer DEFAULT 0,
	"total_ai_tokens_used" integer DEFAULT 0,
	"total_storage_used" integer DEFAULT 0,
	"contact_email" text,
	"contact_name" text,
	"contact_phone" text,
	"notes" text,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"plan_type" varchar(50) NOT NULL,
	"monthly_price" numeric(10, 2) NOT NULL,
	"sms_included" integer DEFAULT 0,
	"ai_tokens_included" integer DEFAULT 0,
	"overage_rate" numeric(6, 4),
	"features" jsonb DEFAULT '[]'::jsonb,
	"max_users" integer,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tier_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"feature_name" text NOT NULL,
	"feature_value" integer NOT NULL,
	"feature_type" text DEFAULT 'limit',
	"is_visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trial_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"credit_amount" numeric(10, 2) NOT NULL,
	"duration_days" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"remaining_balance" numeric(10, 2),
	"granted_by" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unmapped_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"folder_id" uuid NOT NULL,
	"folder_name" text NOT NULL,
	"folder_display_name" text,
	"message_count" integer DEFAULT 0,
	"recommendations" jsonb,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_ai_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"writing_style" jsonb,
	"common_phrases" text[] DEFAULT '{}',
	"vocabulary_level" text DEFAULT 'moderate',
	"avg_email_length" integer DEFAULT 200,
	"greeting_style" text DEFAULT 'Hi',
	"closing_style" text DEFAULT 'Best',
	"response_time_avg" integer DEFAULT 60,
	"active_hours" jsonb,
	"preferred_tone" text DEFAULT 'professional',
	"emoji_usage" boolean DEFAULT false,
	"frequent_contacts" text[] DEFAULT '{}',
	"common_topics" text[] DEFAULT '{}',
	"meeting_frequency" jsonb,
	"learned_preferences" jsonb,
	"last_analyzed_at" timestamp DEFAULT now(),
	"total_emails_analyzed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_ai_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tag_assignments_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tag_assignments_tag_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tags_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tags_name_idx";--> statement-breakpoint
ALTER TABLE "contact_tags" ALTER COLUMN "color" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "contact_tags" ALTER COLUMN "color" SET DEFAULT '#10B981';--> statement-breakpoint
ALTER TABLE "contact_tags" ALTER COLUMN "color" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_tag_assignments" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_tag_assignments" ADD COLUMN "assigned_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "nylas_grant_id" text;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "last_sync_cursor" text;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "sent_sync_cursor" text;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "imap_config" jsonb;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "initial_sync_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD COLUMN "gmail_history_id" text;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD COLUMN "ai_description" text;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD COLUMN "ai_description_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "provider_id" text;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "folder_type" "core_folder_type" DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "is_system_folder" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "icon" text DEFAULT 'folder';--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "color" varchar(7);--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "sort_order" integer DEFAULT 999;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "provider_path" text;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "delimiter" varchar(10) DEFAULT '/';--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "message_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "total_size_bytes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "sync_cursor" text;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "last_sync_cursor" text;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "last_sync_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "sync_status" text DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "sync_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "sync_frequency_minutes" integer DEFAULT 15;--> statement-breakpoint
ALTER TABLE "email_folders" ADD COLUMN "sync_days_back" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "download_attachments_at_sync" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "max_auto_download_size_mb" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "auto_download_days_back" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "download_all_attachments" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "email_threads" ADD COLUMN "nylas_thread_id" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "nylas_message_id" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "provider_id" text;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "embedding" text;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "sync_type" text DEFAULT 'incremental';--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "emails_processed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "emails_failed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_type" "account_type" DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sandbox_company_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_balance" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_balance" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_trial" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_sent_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ai_tokens_used" integer DEFAULT 0;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_pricing_overrides" ADD CONSTRAINT "ai_pricing_overrides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_pricing_overrides" ADD CONSTRAINT "ai_pricing_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_pricing_overrides" ADD CONSTRAINT "ai_pricing_overrides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_transactions" ADD CONSTRAINT "ai_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_transactions" ADD CONSTRAINT "ai_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_trial_credits" ADD CONSTRAINT "ai_trial_credits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_trial_credits" ADD CONSTRAINT "ai_trial_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_trial_credits" ADD CONSTRAINT "ai_trial_credits_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_impersonator_id_users_id_fk" FOREIGN KEY ("impersonator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_attendees" ADD CONSTRAINT "calendar_attendees_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_reminders" ADD CONSTRAINT "calendar_reminders_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communication_limits" ADD CONSTRAINT "communication_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communication_limits" ADD CONSTRAINT "communication_limits_override_by_users_id_fk" FOREIGN KEY ("override_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communication_settings" ADD CONSTRAINT "communication_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communication_usage" ADD CONSTRAINT "communication_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communication_usage" ADD CONSTRAINT "communication_usage_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_group_id_contact_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."contact_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_timeline_queue" ADD CONSTRAINT "contact_timeline_queue_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_timeline_queue" ADD CONSTRAINT "contact_timeline_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_applies_to_tier_id_pricing_tiers_id_fk" FOREIGN KEY ("applies_to_tier_id") REFERENCES "public"."pricing_tiers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "embedding_queue" ADD CONSTRAINT "embedding_queue_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "embedding_queue" ADD CONSTRAINT "embedding_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_calendars" ADD CONSTRAINT "external_calendars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folder_mappings" ADD CONSTRAINT "folder_mappings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folder_mappings" ADD CONSTRAINT "folder_mappings_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_achievements" ADD CONSTRAINT "onboarding_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_tutorials" ADD CONSTRAINT "onboarding_tutorials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pricing_overrides" ADD CONSTRAINT "pricing_overrides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pricing_overrides" ADD CONSTRAINT "pricing_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pricing_overrides" ADD CONSTRAINT "pricing_overrides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proactive_alerts" ADD CONSTRAINT "proactive_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proactive_alerts" ADD CONSTRAINT "proactive_alerts_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proactive_alerts" ADD CONSTRAINT "proactive_alerts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proactive_alerts" ADD CONSTRAINT "proactive_alerts_calendar_event_id_calendar_events_id_fk" FOREIGN KEY ("calendar_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sandbox_companies" ADD CONSTRAINT "sandbox_companies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tier_features" ADD CONSTRAINT "tier_features_tier_id_pricing_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."pricing_tiers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trial_credits" ADD CONSTRAINT "trial_credits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trial_credits" ADD CONSTRAINT "trial_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trial_credits" ADD CONSTRAINT "trial_credits_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unmapped_folders" ADD CONSTRAINT "unmapped_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unmapped_folders" ADD CONSTRAINT "unmapped_folders_account_id_email_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."email_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unmapped_folders" ADD CONSTRAINT "unmapped_folders_folder_id_email_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."email_folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ai_profiles" ADD CONSTRAINT "user_ai_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_pricing_overrides_org_idx" ON "ai_pricing_overrides" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_pricing_overrides_user_idx" ON "ai_pricing_overrides" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_transactions_user_idx" ON "ai_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_transactions_org_idx" ON "ai_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_transactions_type_idx" ON "ai_transactions" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_transactions_created_at_idx" ON "ai_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_trial_credits_org_idx" ON "ai_trial_credits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_trial_credits_user_idx" ON "ai_trial_credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_trial_credits_status_idx" ON "ai_trial_credits" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_org_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_risk_idx" ON "audit_logs" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_session_idx" ON "audit_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_attendees_event_id_idx" ON "calendar_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_attendees_email_idx" ON "calendar_attendees" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_user_id_idx" ON "calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_start_time_idx" ON "calendar_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_end_time_idx" ON "calendar_events" USING btree ("end_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_email_thread_idx" ON "calendar_events" USING btree ("email_thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_email_id_idx" ON "calendar_events" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_external_id_idx" ON "calendar_events" USING btree ("external_event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_type_idx" ON "calendar_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_status_idx" ON "calendar_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_reminders_event_id_idx" ON "calendar_reminders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_reminders_sent_idx" ON "calendar_reminders" USING btree ("sent");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_items_product_idx" ON "cart_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_cart_product" ON "cart_items" USING btree ("cart_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_session_idx" ON "carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_status_idx" ON "carts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_logs_user_idx" ON "communication_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_logs_org_idx" ON "communication_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_logs_type_idx" ON "communication_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_logs_timestamp_idx" ON "communication_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_logs_billing_status_idx" ON "communication_logs" USING btree ("billing_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_usage_user_time_idx" ON "communication_usage" USING btree ("user_id","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_usage_user_type_idx" ON "communication_usage" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_usage_status_idx" ON "communication_usage" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comm_usage_contact_idx" ON "communication_usage" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_group_members_group_id" ON "contact_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_group_members_contact_id" ON "contact_group_members" USING btree ("contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_contact_group_members_unique" ON "contact_group_members" USING btree ("group_id","contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_groups_user_id" ON "contact_groups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_groups_name" ON "contact_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_groups_is_favorite" ON "contact_groups" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timeline_queue_status_idx" ON "contact_timeline_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timeline_queue_created_at_idx" ON "contact_timeline_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timeline_queue_user_id_idx" ON "contact_timeline_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_subs_org_idx" ON "customer_subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_subs_user_idx" ON "customer_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_subs_status_idx" ON "customer_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "discount_redemption_unique_idx" ON "discount_redemptions" USING btree ("discount_code_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embedding_queue_status_idx" ON "embedding_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embedding_queue_priority_idx" ON "embedding_queue" USING btree ("priority","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embedding_queue_user_id_idx" ON "embedding_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_calendars_user_id_idx" ON "external_calendars" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_calendars_provider_idx" ON "external_calendars" USING btree ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_calendars_sync_enabled_idx" ON "external_calendars" USING btree ("sync_enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "folder_mappings_user_idx" ON "folder_mappings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "folder_mappings_account_idx" ON "folder_mappings" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "folder_mappings_provider_folder_idx" ON "folder_mappings" USING btree ("provider_folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "folder_mappings_mapped_type_idx" ON "folder_mappings" USING btree ("mapped_to_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_folder_mapping" ON "folder_mappings" USING btree ("account_id","provider_folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impersonation_admin_idx" ON "impersonation_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impersonation_target_idx" ON "impersonation_sessions" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "impersonation_token_idx" ON "impersonation_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_org_idx" ON "orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_unique_idx" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_members_org_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_trial_idx" ON "organizations" USING btree ("is_trial");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_admins_user_idx" ON "platform_admins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_overrides_org_idx" ON "pricing_overrides" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_overrides_user_idx" ON "pricing_overrides" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proactive_alerts_user_id_idx" ON "proactive_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proactive_alerts_type_idx" ON "proactive_alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proactive_alerts_priority_idx" ON "proactive_alerts" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proactive_alerts_dismissed_idx" ON "proactive_alerts" USING btree ("dismissed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proactive_alerts_created_at_idx" ON "proactive_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_stripe_product_idx" ON "products" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tier_feature_unique_idx" ON "tier_features" USING btree ("tier_id","feature_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_credits_org_idx" ON "trial_credits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_credits_user_idx" ON "trial_credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trial_credits_status_idx" ON "trial_credits" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unmapped_folders_user_idx" ON "unmapped_folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unmapped_folders_account_idx" ON "unmapped_folders" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unmapped_folders_folder_idx" ON "unmapped_folders" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unmapped_folders_status_idx" ON "unmapped_folders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_unmapped_folder" ON "unmapped_folders" USING btree ("folder_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_folder_id_email_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."email_folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_tag_assignments_contact_id" ON "contact_tag_assignments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_tag_assignments_tag_id" ON "contact_tag_assignments" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_contact_tag_assignments_unique" ON "contact_tag_assignments" USING btree ("contact_id","tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_tags_user_id" ON "contact_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_tags_name" ON "contact_tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_folders_last_sync_at_idx" ON "email_folders" USING btree ("last_sync_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_folders_folder_type" ON "email_folders" USING btree ("folder_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_folders_sync_enabled" ON "email_folders" USING btree ("account_id","sync_enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_folders_sort_order" ON "email_folders" USING btree ("account_id","sort_order");--> statement-breakpoint
ALTER TABLE "contact_tag_assignments" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "public"."emails" ALTER COLUMN "email_category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."email_category";--> statement-breakpoint
CREATE TYPE "public"."email_category" AS ENUM('unscreened', 'inbox', 'newsfeed', 'receipts', 'spam', 'archived', 'newsletter');--> statement-breakpoint
ALTER TABLE "public"."emails" ALTER COLUMN "email_category" SET DATA TYPE "public"."email_category" USING "email_category"::"public"."email_category";