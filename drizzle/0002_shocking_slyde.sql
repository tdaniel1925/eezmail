ALTER TABLE "email_folders" DROP CONSTRAINT "email_folders_external_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_folders_account_external_unique" ON "email_folders" USING btree ("account_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "emails_account_message_unique" ON "emails" USING btree ("account_id","message_id");