-- Simple migration to add sent and drafts to email_category enum
ALTER TYPE "public"."email_category" ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE "public"."email_category" ADD VALUE IF NOT EXISTS 'drafts';



