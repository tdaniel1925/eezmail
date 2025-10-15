DROP INDEX IF EXISTS "email_signatures_account_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_signatures_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_rules_account_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_rules_is_enabled_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_rules_priority_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_rules_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_account_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_email_category_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_hey_view_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_is_important_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_is_read_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_is_set_aside_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_message_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_needs_reply_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_received_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_screening_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "emails_thread_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sender_trust_sender_email_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sender_trust_trust_level_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sender_trust_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_custom_fields_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_emails_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_emails_email_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_emails_is_primary_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_addresses_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tag_assignments_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tag_assignments_tag_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_notes_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_notes_created_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_notes_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_company_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_first_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_is_archived_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_is_favorite_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_last_contacted_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_last_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "custom_folders_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "custom_folders_user_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_phones_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_phones_phone_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_social_links_contact_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tags_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contact_tags_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_contacts_account_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_contacts_email_address_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_contacts_screening_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_contacts_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_labels_account_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_labels_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_threads_account_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_threads_last_message_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_threads_thread_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_attachments_email_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_accounts_email_address_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_accounts_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "email_accounts_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sync_jobs_account_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sync_jobs_priority_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sync_jobs_scheduled_for_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sync_jobs_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sync_jobs_user_id_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_signatures_account_id_idx" ON "email_signatures" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_signatures_user_id_idx" ON "email_signatures" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_account_id_idx" ON "email_rules" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_is_enabled_idx" ON "email_rules" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_priority_idx" ON "email_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_rules_user_id_idx" ON "email_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_account_id_idx" ON "emails" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_email_category_idx" ON "emails" USING btree ("email_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_hey_view_idx" ON "emails" USING btree ("hey_view");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_is_important_idx" ON "emails" USING btree ("is_important");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_is_read_idx" ON "emails" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_is_set_aside_idx" ON "emails" USING btree ("is_set_aside");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_message_id_idx" ON "emails" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_needs_reply_idx" ON "emails" USING btree ("needs_reply");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_received_at_idx" ON "emails" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_screening_status_idx" ON "emails" USING btree ("screening_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emails_thread_id_idx" ON "emails" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sender_trust_sender_email_idx" ON "sender_trust" USING btree ("sender_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sender_trust_trust_level_idx" ON "sender_trust" USING btree ("trust_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sender_trust_user_id_idx" ON "sender_trust" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_custom_fields_contact_id_idx" ON "contact_custom_fields" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_emails_contact_id_idx" ON "contact_emails" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_emails_email_idx" ON "contact_emails" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_emails_is_primary_idx" ON "contact_emails" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_addresses_contact_id_idx" ON "contact_addresses" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tag_assignments_contact_id_idx" ON "contact_tag_assignments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tag_assignments_tag_id_idx" ON "contact_tag_assignments" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_notes_contact_id_idx" ON "contact_notes" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_notes_created_at_idx" ON "contact_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_notes_user_id_idx" ON "contact_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_company_idx" ON "contacts" USING btree ("company");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_first_name_idx" ON "contacts" USING btree ("first_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_is_archived_idx" ON "contacts" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_is_favorite_idx" ON "contacts" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_last_contacted_at_idx" ON "contacts" USING btree ("last_contacted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_last_name_idx" ON "contacts" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_user_id_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_folders_user_id_idx" ON "custom_folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_folders_user_name_idx" ON "custom_folders" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_phones_contact_id_idx" ON "contact_phones" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_phones_phone_idx" ON "contact_phones" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_social_links_contact_id_idx" ON "contact_social_links" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tags_name_idx" ON "contact_tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_tags_user_id_idx" ON "contact_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_account_id_idx" ON "email_contacts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_email_address_idx" ON "email_contacts" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_screening_status_idx" ON "email_contacts" USING btree ("screening_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_contacts_user_id_idx" ON "email_contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_labels_account_id_idx" ON "email_labels" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_labels_name_idx" ON "email_labels" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_threads_account_id_idx" ON "email_threads" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_threads_last_message_at_idx" ON "email_threads" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_threads_thread_id_idx" ON "email_threads" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_attachments_email_id_idx" ON "email_attachments" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_accounts_email_address_idx" ON "email_accounts" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_accounts_status_idx" ON "email_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_accounts_user_id_idx" ON "email_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_account_id_idx" ON "sync_jobs" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_priority_idx" ON "sync_jobs" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_scheduled_for_idx" ON "sync_jobs" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_status_idx" ON "sync_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_jobs_user_id_idx" ON "sync_jobs" USING btree ("user_id");