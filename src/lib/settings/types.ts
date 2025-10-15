import { z } from 'zod';

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export const accountSettingsSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const emailPreferencesSchema = z.object({
  emailsPerPage: z.number().int().min(10).max(100),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  readingPanePosition: z.enum(['right', 'bottom', 'off']),
  markAsReadDelay: z.number().int().min(0).max(10),
  defaultSendBehavior: z.enum(['send', 'send_and_archive', 'schedule']),
  defaultFontFamily: z.string(),
  defaultFontSize: z.number().int().min(10).max(24),
});

export const aiPreferencesSchema = z.object({
  enableAiSummaries: z.boolean(),
  enableQuickReplies: z.boolean(),
  enableSmartActions: z.boolean(),
  aiTone: z.enum(['professional', 'casual', 'friendly', 'formal']),
  autoClassifyAfterDays: z.number().int().min(1).max(90),
  bulkEmailDetection: z.boolean(),
  emailMode: z.enum(['traditional', 'hey', 'hybrid']),
});

export const notificationPreferencesSchema = z.object({
  desktopNotifications: z.boolean(),
  soundEnabled: z.boolean(),
  notifyOnImportantOnly: z.boolean(),
  notifyOnImbox: z.boolean().default(true),
  notifyOnFeed: z.boolean().default(false),
  notifyOnPaperTrail: z.boolean().default(false),
});

export const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  accentColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .default('#FF4C5A'),
  sidebarCollapsed: z.boolean().default(false),
});

export const privacySettingsSchema = z.object({
  blockTrackers: z.boolean(),
  blockExternalImages: z.boolean(),
  stripUtmParameters: z.boolean(),
  enableReadReceipts: z.boolean().default(false),
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessionTimeout: z.number().int().min(15).max(1440), // 15 min to 24 hours
});

// Infer TypeScript types from schemas
export type AccountSettings = z.infer<typeof accountSettingsSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
export type EmailPreferences = z.infer<typeof emailPreferencesSchema>;
export type AIPreferences = z.infer<typeof aiPreferencesSchema>;
export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;

// Combined settings type
export type UserSettings = {
  account: AccountSettings;
  emailPreferences: EmailPreferences;
  aiPreferences: AIPreferences;
  notifications: NotificationPreferences;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
};

// Server action response types
export type SettingsResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> };


