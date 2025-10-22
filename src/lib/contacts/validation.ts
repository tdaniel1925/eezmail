import { z } from 'zod';

// ============================================================================
// EMAIL AND PHONE VALIDATION
// ============================================================================

export const EmailSchema = z.string().email('Invalid email address');

export const PhoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^[\d\s\-\+\(\)]+$/,
    'Phone number can only contain numbers, spaces, and +-() characters'
  );

// ============================================================================
// CONTACT EMAIL SCHEMA
// ============================================================================

export const ContactEmailSchema = z.object({
  email: EmailSchema,
  type: z.enum(['work', 'personal', 'other']).default('other'),
  isPrimary: z.boolean().default(false),
});

export type ContactEmailInput = z.infer<typeof ContactEmailSchema>;

// ============================================================================
// CONTACT PHONE SCHEMA
// ============================================================================

export const ContactPhoneSchema = z.object({
  phone: PhoneSchema,
  type: z.enum(['mobile', 'work', 'home', 'other']).default('other'),
  isPrimary: z.boolean().default(false),
});

export type ContactPhoneInput = z.infer<typeof ContactPhoneSchema>;

// ============================================================================
// CONTACT ADDRESS SCHEMA
// ============================================================================

export const ContactAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(['work', 'home', 'other']).default('other'),
  isPrimary: z.boolean().default(false),
});

export type ContactAddressInput = z.infer<typeof ContactAddressSchema>;

// ============================================================================
// CONTACT SOCIAL LINK SCHEMA
// ============================================================================

export const ContactSocialLinkSchema = z.object({
  platform: z.enum([
    'linkedin',
    'twitter',
    'facebook',
    'instagram',
    'github',
    'other',
  ]),
  url: z.string().url('Invalid URL'),
});

export type ContactSocialLinkInput = z.infer<typeof ContactSocialLinkSchema>;

// ============================================================================
// CREATE CONTACT SCHEMA
// ============================================================================

export const CreateContactSchema = z
  .object({
    // Basic info - at least one name field required
    firstName: z.string().min(1).max(100).optional().or(z.literal('')),
    lastName: z.string().min(1).max(100).optional().or(z.literal('')),
    displayName: z.string().min(1).max(200).optional().or(z.literal('')),
    nickname: z.string().max(100).optional().or(z.literal('')),

    // Work info
    company: z.string().max(200).optional().or(z.literal('')),
    jobTitle: z.string().max(200).optional().or(z.literal('')),
    department: z.string().max(100).optional().or(z.literal('')),

    // Personal info
    birthday: z.string().datetime().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),

    // Avatar
    avatarUrl: z.string().url().optional().or(z.literal('')),
    avatarProvider: z.string().max(50).optional().or(z.literal('')),

    // Status
    isFavorite: z.boolean().default(false),

    // Related data
    emails: z.array(ContactEmailSchema).default([]),
    phones: z.array(ContactPhoneSchema).default([]),
    addresses: z.array(ContactAddressSchema).default([]),
    socialLinks: z.array(ContactSocialLinkSchema).default([]),
    tags: z.array(z.string().uuid()).default([]), // Array of tag IDs
  })
  .transform((data) => {
    // Convert empty strings to undefined
    return {
      ...data,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      displayName: data.displayName || undefined,
      nickname: data.nickname || undefined,
      company: data.company || undefined,
      jobTitle: data.jobTitle || undefined,
      department: data.department || undefined,
      birthday: data.birthday || undefined,
      notes: data.notes || undefined,
      avatarUrl: data.avatarUrl || undefined,
      avatarProvider: data.avatarProvider || undefined,
    };
  })
  .refine(
    (data) => {
      // At least one name field or one email must be provided
      return (
        data.firstName ||
        data.lastName ||
        data.displayName ||
        data.emails.length > 0
      );
    },
    {
      message: 'At least one name field or email address is required',
    }
  );

export type CreateContactInput = z.infer<typeof CreateContactSchema>;

// ============================================================================
// UPDATE CONTACT SCHEMA
// ============================================================================

export const UpdateContactSchema = z
  .object({
    // Basic info
    firstName: z.string().min(1).max(100).optional().or(z.literal('')),
    lastName: z.string().min(1).max(100).optional().or(z.literal('')),
    displayName: z.string().min(1).max(200).optional().or(z.literal('')),
    nickname: z.string().max(100).optional().or(z.literal('')),

    // Work info
    company: z.string().max(200).optional().or(z.literal('')),
    jobTitle: z.string().max(200).optional().or(z.literal('')),
    department: z.string().max(100).optional().or(z.literal('')),

    // Personal info
    birthday: z.string().datetime().optional().or(z.literal('')).nullable(),
    notes: z.string().optional().or(z.literal('')),

    // Avatar
    avatarUrl: z.string().url().optional().or(z.literal('')).nullable(),
    avatarProvider: z.string().max(50).optional().or(z.literal('')),

    // Status
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),

    // Related data - these will be handled separately
    // emails, phones, addresses, socialLinks, tags
  })
  .transform((data) => {
    // Convert empty strings to undefined or null
    return {
      ...data,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      displayName: data.displayName || undefined,
      nickname: data.nickname || undefined,
      company: data.company || undefined,
      jobTitle: data.jobTitle || undefined,
      department: data.department || undefined,
      birthday: data.birthday || null,
      notes: data.notes || undefined,
      avatarUrl: data.avatarUrl || null,
      avatarProvider: data.avatarProvider || undefined,
    };
  });

export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;

// ============================================================================
// CUSTOM FIELD SCHEMA
// ============================================================================

export const CustomFieldSchema = z.object({
  fieldName: z.string().min(1).max(100),
  fieldValue: z.string().optional(),
  fieldType: z.enum(['text', 'number', 'date', 'url']).default('text'),
});

export type CustomFieldInput = z.infer<typeof CustomFieldSchema>;

// ============================================================================
// TAG SCHEMA
// ============================================================================

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .max(20)
    .regex(/^[a-z]+$/, 'Color must be lowercase letters only')
    .default('blue'),
});

export type CreateTagInput = z.infer<typeof CreateTagSchema>;

export const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .max(20)
    .regex(/^[a-z]+$/, 'Color must be lowercase letters only')
    .optional(),
});

export type UpdateTagInput = z.infer<typeof UpdateTagSchema>;

// ============================================================================
// IMPORT CSV SCHEMA
// ============================================================================

export const ImportCSVSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  notes: z.string().optional(),
});

export type ImportCSVRow = z.infer<typeof ImportCSVSchema>;

// ============================================================================
// LIST CONTACTS FILTERS SCHEMA
// ============================================================================

export const ListContactsFiltersSchema = z.object({
  search: z.string().optional(),
  favorites: z.boolean().optional(),
  archived: z.boolean().optional(),
  tags: z.array(z.string().uuid()).optional(),
  noTags: z.boolean().optional(),
  hasAvatar: z.boolean().optional(),
  hasEmailHistory: z.boolean().optional(),
  sortBy: z
    .enum([
      'name_asc',
      'name_desc',
      'company_asc',
      'last_contacted_desc',
      'recently_added',
    ])
    .default('name_asc'),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(50),
});

export type ListContactsFilters = z.infer<typeof ListContactsFiltersSchema>;
