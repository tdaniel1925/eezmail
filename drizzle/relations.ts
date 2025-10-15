import { relations } from "drizzle-orm/relations";
import { emailAccounts, emailSignatures, users, emailRules, emails, customFolders, senderTrust, contacts, contactCustomFields, contactEmails, contactAddresses, contactTagAssignments, contactTags, contactNotes, contactPhones, contactSocialLinks, emailContacts, emailLabels, emailSettings, emailThreads, emailAttachments, subscriptions, syncJobs, emailFolders } from "./schema";

export const emailSignaturesRelations = relations(emailSignatures, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emailSignatures.accountId],
		references: [emailAccounts.id]
	}),
	user: one(users, {
		fields: [emailSignatures.userId],
		references: [users.id]
	}),
}));

export const emailAccountsRelations = relations(emailAccounts, ({one, many}) => ({
	emailSignatures: many(emailSignatures),
	emailRules: many(emailRules),
	emails: many(emails),
	emailContacts: many(emailContacts),
	emailLabels: many(emailLabels),
	emailSettings: many(emailSettings),
	emailThreads: many(emailThreads),
	user: one(users, {
		fields: [emailAccounts.userId],
		references: [users.id]
	}),
	syncJobs: many(syncJobs),
	emailFolders: many(emailFolders),
}));

export const usersRelations = relations(users, ({many}) => ({
	emailSignatures: many(emailSignatures),
	emailRules: many(emailRules),
	senderTrusts: many(senderTrust),
	contactNotes: many(contactNotes),
	contacts: many(contacts),
	customFolders: many(customFolders),
	contactTags: many(contactTags),
	emailContacts: many(emailContacts),
	subscriptions: many(subscriptions),
	emailAccounts: many(emailAccounts),
	syncJobs: many(syncJobs),
	emailFolders: many(emailFolders),
}));

export const emailRulesRelations = relations(emailRules, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emailRules.accountId],
		references: [emailAccounts.id]
	}),
	user: one(users, {
		fields: [emailRules.userId],
		references: [users.id]
	}),
}));

export const emailsRelations = relations(emails, ({one, many}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emails.accountId],
		references: [emailAccounts.id]
	}),
	customFolder: one(customFolders, {
		fields: [emails.customFolderId],
		references: [customFolders.id]
	}),
	emailAttachments: many(emailAttachments),
}));

export const customFoldersRelations = relations(customFolders, ({one, many}) => ({
	emails: many(emails),
	user: one(users, {
		fields: [customFolders.userId],
		references: [users.id]
	}),
	emailContacts: many(emailContacts),
}));

export const senderTrustRelations = relations(senderTrust, ({one}) => ({
	user: one(users, {
		fields: [senderTrust.userId],
		references: [users.id]
	}),
}));

export const contactCustomFieldsRelations = relations(contactCustomFields, ({one}) => ({
	contact: one(contacts, {
		fields: [contactCustomFields.contactId],
		references: [contacts.id]
	}),
}));

export const contactsRelations = relations(contacts, ({one, many}) => ({
	contactCustomFields: many(contactCustomFields),
	contactEmails: many(contactEmails),
	contactAddresses: many(contactAddresses),
	contactTagAssignments: many(contactTagAssignments),
	contactNotes: many(contactNotes),
	user: one(users, {
		fields: [contacts.userId],
		references: [users.id]
	}),
	contactPhones: many(contactPhones),
	contactSocialLinks: many(contactSocialLinks),
}));

export const contactEmailsRelations = relations(contactEmails, ({one}) => ({
	contact: one(contacts, {
		fields: [contactEmails.contactId],
		references: [contacts.id]
	}),
}));

export const contactAddressesRelations = relations(contactAddresses, ({one}) => ({
	contact: one(contacts, {
		fields: [contactAddresses.contactId],
		references: [contacts.id]
	}),
}));

export const contactTagAssignmentsRelations = relations(contactTagAssignments, ({one}) => ({
	contact: one(contacts, {
		fields: [contactTagAssignments.contactId],
		references: [contacts.id]
	}),
	contactTag: one(contactTags, {
		fields: [contactTagAssignments.tagId],
		references: [contactTags.id]
	}),
}));

export const contactTagsRelations = relations(contactTags, ({one, many}) => ({
	contactTagAssignments: many(contactTagAssignments),
	user: one(users, {
		fields: [contactTags.userId],
		references: [users.id]
	}),
}));

export const contactNotesRelations = relations(contactNotes, ({one}) => ({
	contact: one(contacts, {
		fields: [contactNotes.contactId],
		references: [contacts.id]
	}),
	user: one(users, {
		fields: [contactNotes.userId],
		references: [users.id]
	}),
}));

export const contactPhonesRelations = relations(contactPhones, ({one}) => ({
	contact: one(contacts, {
		fields: [contactPhones.contactId],
		references: [contacts.id]
	}),
}));

export const contactSocialLinksRelations = relations(contactSocialLinks, ({one}) => ({
	contact: one(contacts, {
		fields: [contactSocialLinks.contactId],
		references: [contacts.id]
	}),
}));

export const emailContactsRelations = relations(emailContacts, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emailContacts.accountId],
		references: [emailAccounts.id]
	}),
	customFolder: one(customFolders, {
		fields: [emailContacts.assignedFolder],
		references: [customFolders.id]
	}),
	user: one(users, {
		fields: [emailContacts.userId],
		references: [users.id]
	}),
}));

export const emailLabelsRelations = relations(emailLabels, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emailLabels.accountId],
		references: [emailAccounts.id]
	}),
}));

export const emailSettingsRelations = relations(emailSettings, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emailSettings.accountId],
		references: [emailAccounts.id]
	}),
}));

export const emailThreadsRelations = relations(emailThreads, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emailThreads.accountId],
		references: [emailAccounts.id]
	}),
}));

export const emailAttachmentsRelations = relations(emailAttachments, ({one}) => ({
	email: one(emails, {
		fields: [emailAttachments.emailId],
		references: [emails.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const syncJobsRelations = relations(syncJobs, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [syncJobs.accountId],
		references: [emailAccounts.id]
	}),
	user: one(users, {
		fields: [syncJobs.userId],
		references: [users.id]
	}),
}));

export const emailFoldersRelations = relations(emailFolders, ({one}) => ({
	emailAccount: one(emailAccounts, {
		fields: [emailFolders.accountId],
		references: [emailAccounts.id]
	}),
	user: one(users, {
		fields: [emailFolders.userId],
		references: [users.id]
	}),
}));